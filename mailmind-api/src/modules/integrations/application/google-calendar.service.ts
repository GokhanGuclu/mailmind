import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CredentialCipher } from '../../../shared/infrastructure/security/credential-cipher';
import { GoogleOAuthService, GOOGLE_CALENDAR_SCOPE } from './google-oauth.service';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
/** access_token expire'ına bu kadar süre kalmışsa proaktif yenile (clock-skew tamponu). */
const REFRESH_LEEWAY_MS = 60_000;

export type GoogleEventInsertInput = {
  title: string;
  description?: string | null;
  /** ISO 8601 (with offset) */
  startAt: Date;
  /** ISO 8601 (with offset). Yoksa Google için "all-day" + start.date kullanılır veya start+30dk default. */
  endAt?: Date | null;
  isAllDay?: boolean;
  location?: string | null;
  /** Email adresleri */
  attendees?: string[];
  /** RFC 5545 RRULE — örn 'FREQ=WEEKLY;BYDAY=MO'. Google `recurrence: ['RRULE:...']` array'ini bekler. */
  rrule?: string | null;
  /** IANA timezone — örn 'Europe/Istanbul' */
  timezone?: string;
};

export type GoogleEventInsertResult = {
  externalId: string;
  htmlLink?: string;
};

/**
 * Google Calendar v3 üzerinden event yazma yardımcısı.
 *
 * Yetki akışı:
 * - userId verildiğinde, kullanıcının `IntegrationsGoogleAccount`+
 *   `IntegrationsGoogleToken` çiftini bulur.
 * - Token expire'a yaklaşmışsa refresh_token ile yeni access_token alır
 *   ve DB'ye yazar (encrypted).
 * - Calendar API'ye request atar; 403 (insufficientPermissions / scope yok)
 *   özel olarak `MissingCalendarScopeError` ile fırlatılır → worker bunu
 *   yakalayıp "kullanıcı re-consent gerekiyor" şeklinde işaretleyebilir.
 */
@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: CredentialCipher,
    private readonly oauth: GoogleOAuthService,
  ) {}

  /**
   * Mevcut kullanıcının primary Google takvimine bir event ekler.
   * userId'nin Google hesabı/token'ı yoksa NotFoundException.
   */
  async insertEvent(
    userId: string,
    input: GoogleEventInsertInput,
  ): Promise<GoogleEventInsertResult> {
    const accessToken = await this.resolveAccessToken(userId);
    const body = this.buildEventBody(input);

    const res = await fetch(
      `${CALENDAR_API_BASE}/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 403) {
        throw new MissingCalendarScopeError(
          `Google Calendar 403 — calendar.events scope yok ya da iptal edilmiş. ` +
            `Re-consent gerekir. Detay: ${text.slice(0, 200)}`,
        );
      }
      throw new InternalServerErrorException(
        `Google Calendar insert failed: ${res.status} ${text.slice(0, 300)}`,
      );
    }

    const json = (await res.json()) as { id: string; htmlLink?: string };
    return { externalId: json.id, htmlLink: json.htmlLink };
  }

  // ─── Token resolution + refresh ─────────────────────────────────────────

  private async resolveAccessToken(userId: string): Promise<string> {
    // İlk Google hesabı (kullanıcı sadece tek hesap bağlıyor şu an)
    const account = await this.prisma.integrationsGoogleAccount.findFirst({
      where: { userId },
      include: { tokens: true },
    });

    if (!account) {
      throw new NotFoundException('No Google account linked for this user');
    }
    if (!account.tokens) {
      throw new NotFoundException('Google tokens missing');
    }
    if (!account.scopes.includes(GOOGLE_CALENDAR_SCOPE)) {
      throw new MissingCalendarScopeError(
        'Stored Google account does not have calendar.events scope. Re-consent required.',
      );
    }

    const expiresIn = account.tokens.expiresAt.getTime() - Date.now();
    if (expiresIn > REFRESH_LEEWAY_MS) {
      // Hâlâ geçerli
      return this.cipher.decrypt(account.tokens.accessTokenEnc);
    }

    // Refresh
    const refreshToken = this.cipher.decrypt(account.tokens.refreshTokenEnc);
    const refreshed = await this.oauth.refreshAccessToken(refreshToken);

    const newAccessTokenEnc = this.cipher.encrypt(refreshed.access_token);
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    const newRefreshTokenEnc = refreshed.refresh_token
      ? this.cipher.encrypt(refreshed.refresh_token)
      : account.tokens.refreshTokenEnc;

    await this.prisma.integrationsGoogleToken.update({
      where: { googleAccountId: account.id },
      data: {
        accessTokenEnc: newAccessTokenEnc,
        refreshTokenEnc: newRefreshTokenEnc,
        expiresAt: newExpiresAt,
      },
    });

    this.logger.log(`Refreshed Google access token for userId=${userId}`);
    return refreshed.access_token;
  }

  // ─── Body builder ──────────────────────────────────────────────────────

  private buildEventBody(input: GoogleEventInsertInput): Record<string, any> {
    const body: Record<string, any> = {
      summary: input.title,
    };
    if (input.description) body.description = input.description;
    if (input.location) body.location = input.location;

    const tz = input.timezone ?? 'Europe/Istanbul';

    if (input.isAllDay) {
      // Google all-day: start.date / end.date (YYYY-MM-DD), end is exclusive +1 gün.
      const startStr = this.toDateOnly(input.startAt);
      const endDate = input.endAt ?? this.addDays(input.startAt, 1);
      body.start = { date: startStr };
      body.end = { date: this.toDateOnly(endDate) };
    } else {
      const endAt = input.endAt ?? new Date(input.startAt.getTime() + 30 * 60_000);
      body.start = { dateTime: input.startAt.toISOString(), timeZone: tz };
      body.end = { dateTime: endAt.toISOString(), timeZone: tz };
    }

    if (input.attendees && input.attendees.length > 0) {
      body.attendees = input.attendees.map((email) => ({ email }));
    }
    if (input.rrule) {
      const cleaned = input.rrule.replace(/^RRULE:/i, '').trim();
      body.recurrence = [`RRULE:${cleaned}`];
    }

    return body;
  }

  private toDateOnly(d: Date): string {
    // YYYY-MM-DD (UTC olarak; all-day TZ'siz)
    return d.toISOString().slice(0, 10);
  }

  private addDays(d: Date, n: number): Date {
    return new Date(d.getTime() + n * 24 * 60 * 60_000);
  }
}

/**
 * Kullanıcı calendar.events scope'una sahip değil; UI re-consent yönlendirsin.
 */
export class MissingCalendarScopeError extends ForbiddenException {
  constructor(message: string) {
    super(message);
  }
}

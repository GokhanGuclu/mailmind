import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
};

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

// Scopes:
// - openid/email/profile: get user identity
// - https://mail.google.com/: full IMAP/SMTP via XOAUTH2 (covers read/send)
// - calendar.events: AI'ın çıkardığı/kullanıcının onayladığı CalendarEvent
//   kayıtlarını Google Takvim'e push'lamak için (read/write etkinlikler).
//   Eski hesaplar bu scope'a sahip değil → re-consent gerekir; push worker
//   403 alırsa zarif şekilde retry'ı durdurur.
export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://mail.google.com/',
  GOOGLE_CALENDAR_SCOPE,
];

const STATE_TTL_SECONDS = 10 * 60; // 10 minutes

type StatePayload = { sub: string; purpose: 'google_oauth' };

@Injectable()
export class GoogleOAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly stateSecret: string;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const stateSecret = process.env.JWT_ACCESS_SECRET;

    if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not set');
    if (!clientSecret) throw new Error('GOOGLE_CLIENT_SECRET is not set');
    if (!redirectUri) throw new Error('GOOGLE_REDIRECT_URI is not set');
    if (!stateSecret) throw new Error('JWT_ACCESS_SECRET is not set');

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.stateSecret = stateSecret;
  }

  buildAuthorizeUrl(userId: string): string {
    const state = jwt.sign({ sub: userId, purpose: 'google_oauth' } satisfies StatePayload, this.stateSecret, {
      expiresIn: STATE_TTL_SECONDS,
    });

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: GOOGLE_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent', // ensures refresh_token is returned every time
      include_granted_scopes: 'true',
      state,
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  verifyState(state: string): string {
    try {
      const decoded = jwt.verify(state, this.stateSecret) as StatePayload | jwt.JwtPayload;
      if (typeof decoded === 'string') throw new Error('Invalid state');
      if ((decoded as StatePayload).purpose !== 'google_oauth') throw new Error('Invalid state purpose');
      const sub = (decoded as StatePayload).sub;
      if (!sub) throw new Error('Missing sub');
      return sub;
    } catch {
      throw new BadRequestException('Invalid or expired OAuth state');
    }
  }

  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new InternalServerErrorException(`Google token exchange failed: ${res.status} ${text}`);
    }

    return (await res.json()) as GoogleTokenResponse;
  }

  async fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new InternalServerErrorException(`Google userinfo failed: ${res.status} ${text}`);
    }

    return (await res.json()) as GoogleUserInfo;
  }

  /**
   * Refresh access token using a stored refresh_token.
   * Google response contains new access_token + expires_in (no new refresh
   * token unless rotation enabled).
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new InternalServerErrorException(
        `Google token refresh failed: ${res.status} ${text}`,
      );
    }

    return (await res.json()) as GoogleTokenResponse;
  }
}

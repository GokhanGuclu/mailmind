import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CredentialCipher } from '../../../shared/infrastructure/security/credential-cipher';
import { GoogleOAuthService, GoogleTokenResponse, GoogleUserInfo } from './google-oauth.service';

@Injectable()
export class GoogleAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: CredentialCipher,
    private readonly oauth: GoogleOAuthService,
  ) {}

  /**
   * Handles the full callback flow:
   * 1. exchange code → tokens
   * 2. fetch userinfo
   * 3. upsert IntegrationsGoogleAccount + IntegrationsGoogleToken (encrypted)
   * 4. upsert MailboxAccount (provider=GMAIL) + MailboxCredential, set ACTIVE
   * 5. emit OutboxEvent
   */
  async handleCallback(userId: string, code: string): Promise<{ email: string; mailboxAccountId: string }> {
    const tokens = await this.oauth.exchangeCodeForTokens(code);
    const userInfo = await this.oauth.fetchUserInfo(tokens.access_token);

    if (!userInfo.email) {
      throw new Error('Google userinfo did not return an email');
    }

    const email = userInfo.email.toLowerCase();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    return this.prisma.$transaction(async (tx) => {
      // 1) IntegrationsGoogleAccount upsert
      const googleAccount = await tx.integrationsGoogleAccount.upsert({
        where: { userId_googleEmail: { userId, googleEmail: email } },
        create: {
          userId,
          googleEmail: email,
          scopes: tokens.scope ?? '',
        },
        update: {
          scopes: tokens.scope ?? '',
        },
      });

      // 2) IntegrationsGoogleToken upsert (encrypted)
      // Note: refresh_token is only returned on first consent (with prompt=consent it should always come).
      // If absent, keep the previously stored one.
      const accessTokenEnc = this.cipher.encrypt(tokens.access_token);
      const existingToken = await tx.integrationsGoogleToken.findUnique({
        where: { googleAccountId: googleAccount.id },
      });

      const refreshTokenEnc = tokens.refresh_token
        ? this.cipher.encrypt(tokens.refresh_token)
        : existingToken?.refreshTokenEnc;

      if (!refreshTokenEnc) {
        throw new Error(
          'No refresh_token returned from Google and no prior token stored. Re-run consent.',
        );
      }

      await tx.integrationsGoogleToken.upsert({
        where: { googleAccountId: googleAccount.id },
        create: {
          googleAccountId: googleAccount.id,
          accessTokenEnc,
          refreshTokenEnc,
          expiresAt,
        },
        update: {
          accessTokenEnc,
          refreshTokenEnc,
          expiresAt,
        },
      });

      // 3) MailboxAccount upsert (provider=GMAIL, email=googleEmail)
      const existingMailbox = await tx.mailboxAccount.findUnique({
        where: { provider_email: { provider: 'GMAIL', email } },
      });

      let mailboxAccountId: string;

      if (existingMailbox) {
        if (existingMailbox.userId !== userId) {
          // This Gmail address belongs to another user account in our system
          throw new Error('This Gmail account is already linked to another user.');
        }
        mailboxAccountId = existingMailbox.id;
        await tx.mailboxAccount.update({
          where: { id: existingMailbox.id },
          data: {
            status: 'ACTIVE',
            displayName: userInfo.name ?? existingMailbox.displayName,
          },
        });
      } else {
        const created = await tx.mailboxAccount.create({
          data: {
            userId,
            provider: 'GMAIL',
            email,
            displayName: userInfo.name ?? null,
            status: 'ACTIVE',
          },
        });
        mailboxAccountId = created.id;
      }

      // 4) MailboxCredential upsert (mirror tokens for the mailbox sync worker)
      // Stored as plain access/refresh; sync worker reads these.
      await tx.mailboxCredential.upsert({
        where: { mailboxAccountId },
        create: {
          mailboxAccountId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? null,
          tokenExpiresAt: expiresAt,
        },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? undefined,
          tokenExpiresAt: expiresAt,
        },
      });

      // 5) Outbox event
      await tx.outboxEvent.create({
        data: {
          type: 'MAILBOX_ACCOUNT_CONNECTED',
          payload: { mailboxAccountId, userId, provider: 'GMAIL', email },
        },
      });

      return { email, mailboxAccountId };
    });
  }
}

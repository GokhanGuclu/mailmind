import { Injectable, Logger } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { MailProvider, ProviderMessage } from '../mail-provider.interface';
import { ImapCredentials } from './imap.types';

@Injectable()
export class ImapProvider implements MailProvider {
  private readonly logger = new Logger(ImapProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetchRecent(args: { mailboxAccountId: string; limit: number }): Promise<ProviderMessage[]> {
    const { mailboxAccountId, limit } = args;

    const creds = await this.loadImapCredentials(mailboxAccountId);

    const client = new ImapFlow({
      host: creds.host,
      port: creds.port,
      secure: creds.secure,
      auth: {
        user: creds.username,
        pass: creds.password,
      },
      logger: false,
    });

    await client.connect();

    try {
      // INBOX (ileride folder parametre yapılır)
      const lock = await client.getMailboxLock('INBOX');
      try {
        // Son N mailin UID’lerini al
        // mailbox.exists: INBOX toplam mail sayısı
        const mailbox = client.mailbox;

        const total =
        mailbox && typeof mailbox === 'object'
            ? mailbox.exists ?? 0
            : 0;
        if (total === 0) return [];

        // IMAP sequence: "1:*" gibi
        // Son N mail için başlangıç index’i
        const start = Math.max(1, total - limit + 1);
        const range = `${start}:${total}`;

        const messages: ProviderMessage[] = [];

        // fetch: uid, envelope, internalDate, source (raw)
        for await (const msg of client.fetch(range, {
          uid: true,
          envelope: true,
          internalDate: true,
          source: true,
        })) {
          const uid = String(msg.uid);
           const date = msg.internalDate
            ? (msg.internalDate instanceof Date ? msg.internalDate : new Date(msg.internalDate))
            : new Date();

          // Raw mail varsa snippet/subject parse edelim
          let subject = msg.envelope?.subject ?? '';
          let from = '';
          let to: string[] = [];

          if (msg.envelope?.from?.length) {
            const f = msg.envelope.from[0];
            from = f.address ? `${f.name ?? ''} <${f.address}>`.trim() : (f.name ?? '');
          }

          if (msg.envelope?.to?.length) {
            to = msg.envelope.to
              .map((t) => (t.address ? `${t.name ?? ''} <${t.address}>`.trim() : (t.name ?? '')))
              .filter(Boolean);
          }

          let snippet: string | undefined;

          if (msg.source) {
            try {
              const parsed = await simpleParser(msg.source);
              subject = parsed.subject ?? subject ?? '';
              snippet = this.makeSnippet(parsed.text ?? parsed.html ?? '');
              if (!from && parsed.from?.text) from = parsed.from.text;
              if (to.length === 0 && parsed.to?.text) to = parsed.to.text.split(',').map((s) => s.trim());
            } catch (e) {
              // parse fail olursa envelope ile devam
            }
          }

          messages.push({
            providerMessageId: `INBOX:${uid}`, // folder+uid ile unique yap
            folder: 'INBOX',
            from,
            to,
            subject,
            date,
            snippet,
          });
        }

        // En yeniler sondadır; istersen ters çevir:
        // return messages.reverse();
        return messages;
      } finally {
        lock.release();
      }
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  private makeSnippet(input: string): string {
    const text = input
      .replace(/\s+/g, ' ')
      .replace(/<\/?[^>]+(>|$)/g, '') // html tag strip (basit)
      .trim();

    return text.length > 160 ? text.slice(0, 160) : text;
  }

  private async loadImapCredentials(mailboxAccountId: string): Promise<ImapCredentials> {
    const cred = await (this.prisma as any).mailboxCredential.findFirst({
      where: {
        mailboxAccountId,
        imapPasswordEnc: { not: null }, // ✅ kritik: şifresiz kayıtları ele
      },
      orderBy: { createdAt: 'desc' },
      select: {
        imapHost: true,
        imapPort: true,
        imapUsername: true,
        imapPasswordEnc: true,
        // id: true, // istersen debug için aç
        // createdAt: true,
      },
    });

    if (!cred) {
      throw new Error(`IMAP credential not found or missing password for mailboxAccountId=${mailboxAccountId}`);
    }

    // ✅ tek seferlik debug log (sorun çözülünce kaldır)
    this.logger.log(
      `IMAP cred mailbox=${mailboxAccountId} host=${cred.imapHost} user=${cred.imapUsername} hasPass=${!!cred.imapPasswordEnc}`,
    );

    return {
      host: cred.imapHost ?? (() => { throw new Error('IMAP host missing'); })(),
      port: Number(cred.imapPort ?? 993),
      secure: true,
      username: cred.imapUsername ?? (() => { throw new Error('IMAP username missing'); })(),
      password: this.unwrapPassword(cred.imapPasswordEnc),
    };
  }

  private unwrapPassword(raw: string | null): string {
    if (!raw) throw new Error('IMAP password missing');
    if (raw.startsWith('PLAINTEXT:')) return raw.slice('PLAINTEXT:'.length);
    return raw;
  }
}
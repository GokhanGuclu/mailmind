import { Injectable, Logger } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { CredentialCipher } from '../../../../../shared/infrastructure/security/credential-cipher';
import { ProviderMessage } from '../mail-provider.interface';
import { ImapCredentials } from './imap.types';

export type FolderType = 'INBOX' | 'SENT' | 'TRASH' | 'SPAM';

export type FolderMeta = {
  path: string;   // gerçek IMAP yolu, örn: "[Gmail]/Sent Mail"
  type: FolderType;
};

export type FolderSyncResult = {
  messages: ProviderMessage[];
  maxUid: number | null;
};

@Injectable()
export class ImapProvider {
  private readonly logger = new Logger(ImapProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: CredentialCipher,
  ) {}

  /**
   * IMAP sunucusundaki klasörleri keşfeder ve INBOX/SENT/TRASH/SPAM olarak sınıflandırır.
   * Special-use flag'lere (\Sent, \Trash, \Junk) ve isim eşleşmesine dayanır.
   */
  async discoverFolders(mailboxAccountId: string): Promise<FolderMeta[]> {
    const creds = await this.loadImapCredentials(mailboxAccountId);
    const client = this.createClient(creds);
    await client.connect();

    try {
      const list = await client.list();
      return this.mapFolders(list);
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  /**
   * Belirli bir klasörü senkronize eder.
   * - sinceUid verilmişse → UID > sinceUid olan yeni mesajları çeker (incremental)
   * - sinceUid verilmemişse → son `limit` mesajı çeker (initial)
   */
  async fetchFolder(args: {
    mailboxAccountId: string;
    folder: string;
    folderType: FolderType;
    sinceUid?: number;
    limit?: number;
  }): Promise<FolderSyncResult> {
    const { mailboxAccountId, folder, folderType, sinceUid, limit = 100 } = args;

    const creds = await this.loadImapCredentials(mailboxAccountId);
    const client = this.createClient(creds);
    await client.connect();

    try {
      let lock: any;
      try {
        lock = await client.getMailboxLock(folder);
      } catch {
        // Klasör yoksa sessizce atla
        this.logger.warn(`Folder "${folder}" not accessible for mailbox=${mailboxAccountId}`);
        return { messages: [], maxUid: null };
      }

      try {
        const mailboxInfo = client.mailbox as any;
        const total: number = mailboxInfo?.exists ?? 0;

        if (total === 0) return { messages: [], maxUid: null };

        const messages: ProviderMessage[] = [];
        let maxUid: number | null = null;

        // UID-based incremental fetch ya da sequence-based initial fetch
        const useUid = sinceUid !== undefined;
        const range = useUid
          ? `${sinceUid + 1}:*`                          // yeni mesajlar
          : `${Math.max(1, total - limit + 1)}:${total}`; // son N mesaj

        for await (const msg of client.fetch(
          range,
          { uid: true, envelope: true, internalDate: true, source: true },
          { uid: useUid },
        )) {
          const uid = Number(msg.uid);
          if (useUid && uid <= sinceUid!) continue; // * bazen son UID'yi tekrar döner

          if (maxUid === null || uid > maxUid) maxUid = uid;

          const date = msg.internalDate instanceof Date
            ? msg.internalDate
            : new Date(msg.internalDate ?? Date.now());

          let subject = msg.envelope?.subject ?? '';
          let from = '';
          let to: string[] = [];

          if (msg.envelope?.from?.length) {
            const f = msg.envelope.from[0];
            from = f.address ? `${f.name ?? ''} <${f.address}>`.trim() : (f.name ?? '');
          }
          if (msg.envelope?.to?.length) {
            to = msg.envelope.to
              .map((t: any) => t.address ? `${t.name ?? ''} <${t.address}>`.trim() : (t.name ?? ''))
              .filter(Boolean);
          }

          let snippet: string | undefined;
          let bodyText: string | undefined;
          let bodyHtml: string | undefined;

          if (msg.source) {
            try {
              const parsed = await simpleParser(msg.source);
              subject = parsed.subject ?? subject;
              if (!from && parsed.from?.text) from = parsed.from.text;
              if (!to.length && parsed.to?.text) to = parsed.to.text.split(',').map((s) => s.trim());
              bodyText = parsed.text ?? undefined;
              bodyHtml = parsed.html ? String(parsed.html) : undefined;
              snippet = this.makeSnippet(parsed.text ?? parsed.html ?? '');
            } catch {
              // parse fail → envelope verisiyle devam
            }
          }

          messages.push({
            providerMessageId: `${folderType}:${uid}`,
            folder: folderType,
            from,
            to,
            subject,
            date,
            snippet,
            bodyText,
            bodyHtml,
          });
        }

        return { messages, maxUid };
      } finally {
        lock.release();
      }
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  // ---------------------------------------------------------------------------

  private createClient(creds: ImapCredentials): ImapFlow {
    return new ImapFlow({
      host: creds.host,
      port: creds.port,
      secure: creds.secure,
      auth: { user: creds.username, pass: creds.password },
      logger: false,
    });
  }

  private mapFolders(list: any[]): FolderMeta[] {
    const result: FolderMeta[] = [];
    let hasInbox = false;

    for (const item of list) {
      const flags: Set<string> = item.flags ?? new Set();
      const path: string = item.path ?? item.name ?? '';

      if (flags.has('\\Noselect') || !path) continue;

      const upperPath = path.toUpperCase();
      const upperName = (item.name ?? '').toUpperCase();

      if (upperPath === 'INBOX') {
        result.push({ path, type: 'INBOX' });
        hasInbox = true;
      } else if (flags.has('\\Sent') || upperName === 'SENT' || upperName === 'SENT ITEMS' || upperName === 'SENT MESSAGES') {
        result.push({ path, type: 'SENT' });
      } else if (flags.has('\\Trash') || upperName === 'TRASH' || upperName === 'DELETED' || upperName === 'DELETED ITEMS') {
        result.push({ path, type: 'TRASH' });
      } else if (flags.has('\\Junk') || flags.has('\\Spam') || upperName === 'SPAM' || upperName === 'JUNK' || upperName === 'JUNK EMAIL') {
        result.push({ path, type: 'SPAM' });
      }
    }

    // INBOX kesinlikle ekle
    if (!hasInbox) result.unshift({ path: 'INBOX', type: 'INBOX' });

    return result;
  }

  private makeSnippet(input: string): string {
    const text = input.replace(/<\/?[^>]+(>|$)/g, '').replace(/\s+/g, ' ').trim();
    return text.length > 160 ? text.slice(0, 160) : text;
  }

  private async loadImapCredentials(mailboxAccountId: string): Promise<ImapCredentials> {
    const cred = await this.prisma.mailboxCredential.findUnique({
      where: { mailboxAccountId },
      select: { imapHost: true, imapPort: true, imapUsername: true, imapPasswordEnc: true },
    });

    if (!cred?.imapPasswordEnc) {
      throw new Error(`IMAP credentials not found for mailboxAccountId=${mailboxAccountId}`);
    }

    return {
      host: cred.imapHost ?? (() => { throw new Error('IMAP host missing'); })(),
      port: Number(cred.imapPort ?? 993),
      secure: true,
      username: cred.imapUsername ?? (() => { throw new Error('IMAP username missing'); })(),
      password: this.cipher.decrypt(cred.imapPasswordEnc),
    };
  }
}

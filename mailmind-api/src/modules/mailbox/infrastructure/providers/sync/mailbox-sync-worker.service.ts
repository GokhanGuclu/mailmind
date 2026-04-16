import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { ImapProvider, FolderMeta } from '../imap/imap.provider';

/**
 * Cursor formatı: JSON string → { [folderPath]: maxUid }
 * Örnek: '{"INBOX":123,"SENT":45}'
 */
type SyncCursor = Record<string, number>;

@Injectable()
export class MailboxSyncWorkerService implements OnModuleInit {
  private readonly logger = new Logger(MailboxSyncWorkerService.name);
  private interval: NodeJS.Timeout | null = null;

  private readonly workersEnabled =
    (process.env.WORKERS_ENABLED ?? 'true').toLowerCase() === 'true';

  // Initial sync: her klasörden kaç mail çekilir
  private readonly INITIAL_FETCH_LIMIT = 100;

  // Stale RUNNING job eşiği: bundan eski RUNNING job'lar crashed kabul edilir
  private readonly STALE_RUNNING_MS = 5 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly imapProvider: ImapProvider,
  ) {}

  onModuleInit() {
    if (!this.workersEnabled) {
      this.logger.log('Workers disabled (WORKERS_ENABLED=false).');
      return;
    }

    const intervalMs = Number(process.env.MAILBOX_SYNC_WORKER_INTERVAL_MS ?? 1_000);
    this.interval = setInterval(() => {
      this.processOnce().catch((err) => {
        this.logger.error('Sync worker tick failed', err?.stack ?? String(err));
      });
    }, intervalMs);

    this.logger.log(`Mailbox sync worker started (interval=${intervalMs}ms).`);
  }

  /**
   * Idempotent: aynı mailbox için zaten PENDING/RUNNING job varsa yeni job açmaz.
   */
  async enqueueForMailbox(mailboxAccountId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.mailboxSyncJob.findFirst({
        where: { mailboxAccountId, status: { in: ['PENDING', 'RUNNING'] } },
      });
      if (existing) return;

      await tx.mailboxSyncJob.create({
        data: { mailboxAccountId, type: 'INITIAL', status: 'PENDING' },
      });
      this.logger.log(`Enqueued INITIAL sync for mailbox=${mailboxAccountId}`);
    });
  }

  async processOnce(): Promise<void> {
    // 1) Önce stale RUNNING job'ları kurtar (worker crash sonrası kilitli kalanlar)
    await this.recoverStaleRunningJobs();

    // 2) PENDING bir job seç
    const job = await this.prisma.mailboxSyncJob.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
    if (!job) return;

    // Atomic claim
    const claimed = await this.prisma.mailboxSyncJob.updateMany({
      where: { id: job.id, status: 'PENDING' },
      data: { status: 'RUNNING', startedAt: new Date() },
    });
    if (claimed.count !== 1) return;

    try {
      const cursor = job.cursor ? this.parseCursor(job.cursor) : null;
      const newCursor = await this.syncAllFolders(job.mailboxAccountId, cursor);

      await this.prisma.mailboxSyncJob.update({
        where: { id: job.id },
        data: { status: 'DONE', finishedAt: new Date(), cursor: JSON.stringify(newCursor) },
      });

      // Bir sonraki incremental sync'i zamanla
      await this.scheduleIncremental(job.mailboxAccountId, newCursor);
    } catch (err: any) {
      await this.prisma.mailboxSyncJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', finishedAt: new Date(), errorMessage: String(err?.message ?? err) },
      });
      this.logger.error(`Sync job failed id=${job.id}`, err?.stack ?? String(err));
    }
  }

  /**
   * STALE_RUNNING_MS'den uzun süredir RUNNING durumunda olan job'ları PENDING'e
   * geri çeker. Worker crash sonrası kilitli kalan job'lar bu sayede bir sonraki
   * tick'te tekrar işlenir.
   */
  private async recoverStaleRunningJobs(): Promise<void> {
    const threshold = new Date(Date.now() - this.STALE_RUNNING_MS);

    const stale = await this.prisma.mailboxSyncJob.updateMany({
      where: {
        status: 'RUNNING',
        startedAt: { lt: threshold },
      },
      data: { status: 'PENDING', startedAt: null },
    });

    if (stale.count > 0) {
      this.logger.warn(`Recovered ${stale.count} stale RUNNING sync job(s).`);
    }
  }

  // ---------------------------------------------------------------------------

  private async syncAllFolders(
    mailboxAccountId: string,
    cursor: SyncCursor | null,
  ): Promise<SyncCursor> {
    const isInitial = cursor === null;

    // Klasörleri keşfet (IMAP'ten)
    let folders: FolderMeta[];
    try {
      folders = await this.imapProvider.discoverFolders(mailboxAccountId);
    } catch (err: any) {
      this.logger.warn(`Folder discovery failed, defaulting to INBOX only: ${err?.message}`);
      folders = [{ path: 'INBOX', type: 'INBOX' }];
    }

    const newCursor: SyncCursor = { ...(cursor ?? {}) };
    let totalFetched = 0;

    for (const folder of folders) {
      const sinceUid = cursor?.[folder.path];

      const { messages, maxUid } = await this.imapProvider.fetchFolder({
        mailboxAccountId,
        folder: folder.path,
        folderType: folder.type,
        sinceUid,
        limit: this.INITIAL_FETCH_LIMIT,
      });

      if (messages.length > 0) {
        const savedIds = await this.upsertMessages(mailboxAccountId, messages);
        totalFetched += messages.length;

        // AI analizi tetikle: yeni mesajlar için MESSAGE_SYNCED eventi
        await this.emitMessageSyncedEvent(mailboxAccountId, savedIds);
      }

      // Cursor'u güncelle (maxUid varsa veya zaten cursor'da değer varsa koru)
      if (maxUid !== null) newCursor[folder.path] = maxUid;
    }

    this.logger.log(
      `Sync complete mailbox=${mailboxAccountId} type=${isInitial ? 'INITIAL' : 'INCREMENTAL'} fetched=${totalFetched} folders=${folders.map(f => f.type).join(',')}`,
    );

    return newCursor;
  }

  /**
   * Mesajları DB'ye upsert eder.
   * Sadece CREATE edilen (yeni) mesajların id'lerini döner.
   * Update edilen mevcut mesajlar için AI analizi tekrar tetiklenmez.
   */
  private async upsertMessages(
    mailboxAccountId: string,
    messages: any[],
  ): Promise<string[]> {
    const newMessageIds: string[] = [];

    for (const m of messages) {
      // Önce var mı kontrol et
      const existing = await this.prisma.mailboxMessage.findUnique({
        where: {
          mailboxAccountId_providerMessageId: {
            mailboxAccountId,
            providerMessageId: m.providerMessageId,
          },
        },
        select: { id: true },
      });

      if (existing) {
        // Mevcut mesaj → sadece içerik güncelle, isRead dokunma
        await this.prisma.mailboxMessage.update({
          where: { id: existing.id },
          data: {
            folder: m.folder,
            from: m.from || null,
            to: (m.to ?? []).join(', '),
            subject: m.subject || null,
            date: m.date,
            snippet: m.snippet || null,
            bodyText: m.bodyText || null,
            bodyHtml: m.bodyHtml || null,
          },
        });
      } else {
        // Yeni mesaj → oluştur ve id kaydet
        const created = await this.prisma.mailboxMessage.create({
          data: {
            mailboxAccountId,
            providerMessageId: m.providerMessageId,
            folder: m.folder,
            from: m.from || null,
            to: (m.to ?? []).join(', '),
            subject: m.subject || null,
            date: m.date,
            snippet: m.snippet || null,
            bodyText: m.bodyText || null,
            bodyHtml: m.bodyHtml || null,
          },
          select: { id: true },
        });
        newMessageIds.push(created.id);
      }
    }

    return newMessageIds;
  }

  private async emitMessageSyncedEvent(
    mailboxAccountId: string,
    messageIds: string[],
  ): Promise<void> {
    if (messageIds.length === 0) return;

    // Mailbox'ın userId'sini al
    const account = await this.prisma.mailboxAccount.findUnique({
      where: { id: mailboxAccountId },
      select: { userId: true },
    });
    if (!account) return;

    await this.prisma.outboxEvent.create({
      data: {
        type: 'MESSAGE_SYNCED',
        payload: {
          mailboxAccountId,
          userId: account.userId,
          messageIds,
        },
      },
    });
  }

  private async scheduleIncremental(
    mailboxAccountId: string,
    cursor: SyncCursor,
  ): Promise<void> {
    // Son DONE job'ın bitişinden bu yana 60 saniye geçmediyse yeni job açma
    const lastDone = await this.prisma.mailboxSyncJob.findFirst({
      where: { mailboxAccountId, status: 'DONE' },
      orderBy: { finishedAt: 'desc' },
      select: { finishedAt: true },
    });

    const COOLDOWN_MS = Number(process.env.MAILBOX_SYNC_COOLDOWN_MS ?? 60_000);
    if (lastDone?.finishedAt) {
      const elapsed = Date.now() - lastDone.finishedAt.getTime();
      if (elapsed < COOLDOWN_MS) return;
    }

    await this.prisma.mailboxSyncJob.create({
      data: {
        mailboxAccountId,
        type: 'INCREMENTAL',
        status: 'PENDING',
        cursor: JSON.stringify(cursor),
      },
    });
  }

  private parseCursor(raw: string): SyncCursor {
    try {
      return JSON.parse(raw) as SyncCursor;
    } catch {
      return {};
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.logger.log('Mailbox sync worker stopped.');
    }
  }
}

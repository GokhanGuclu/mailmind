import { Module } from '@nestjs/common';
import { MailboxController } from './presentation/mailbox.controller';
import { MailboxAccountsController } from './presentation/mailbox-accounts.controller';
import { MailboxAccountsService } from './application/mailbox-accounts.service';
import { OutboxWorkerService } from './infrastructure/outbox/outbox-worker.service';
import { MailboxSyncWorkerService } from './infrastructure/sync/mailbox-sync-worker.service';

@Module({
  controllers: [MailboxController, MailboxAccountsController],
  providers: [MailboxAccountsService, OutboxWorkerService, MailboxSyncWorkerService],
  exports: [MailboxAccountsService],
})
export class MailboxModule {}
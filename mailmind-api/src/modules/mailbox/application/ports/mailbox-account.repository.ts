import { MailProvider, MailboxAccountStatus } from '../../domain/value-objects/mail-provider.vo';

export type MailboxAccountRow = {
  id: string;
  userId: string;
  provider: MailProvider;
  email: string;
  displayName: string | null;
  status: MailboxAccountStatus;
  createdAt: Date;
  updatedAt: Date;
};

export interface MailboxAccountRepository {
  create(input: { userId: string; provider: MailProvider; email: string; displayName?: string | null }): Promise<MailboxAccountRow>;
  findById(id: string): Promise<MailboxAccountRow | null>;
  findManyByUser(userId: string): Promise<MailboxAccountRow[]>;
  updateStatus(id: string, status: MailboxAccountStatus): Promise<MailboxAccountRow>;
}
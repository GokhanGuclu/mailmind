export type ProviderMessage = {
  providerMessageId: string; // IMAP UID gibi
  folder: string;            // INBOX
  from: string;
  to: string[];
  subject: string;
  date: Date;
  snippet?: string;
};

export interface MailProvider {
  fetchRecent(args: {
    mailboxAccountId: string;
    limit: number;
  }): Promise<ProviderMessage[]>;
}
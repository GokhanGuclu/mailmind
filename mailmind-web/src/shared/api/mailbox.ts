import { apiRequest } from './client';

export type MailboxAccountStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';

export type MailboxAccount = {
  id: string;
  userId: string;
  provider: string;
  email: string;
  displayName: string | null;
  status: MailboxAccountStatus;
  createdAt: string;
  updatedAt: string;
};

export const mailboxApi = {
  listAccounts(accessToken: string) {
    return apiRequest<MailboxAccount[]>('/mailbox/accounts', {
      method: 'GET',
      token: accessToken,
    });
  },
};

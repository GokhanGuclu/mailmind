import { apiRequest } from './client';

export type MailboxAccountStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'REVOKED' | 'ERROR';

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
  pauseAccount(accessToken: string, accountId: string) {
    return apiRequest<MailboxAccount>(`/mailbox/accounts/${accountId}/pause`, {
      method: 'POST',
      token: accessToken,
    });
  },
  resumeAccount(accessToken: string, accountId: string) {
    return apiRequest<MailboxAccount>(`/mailbox/accounts/${accountId}/resume`, {
      method: 'POST',
      token: accessToken,
    });
  },
};

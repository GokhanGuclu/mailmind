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
  /** Sadece /mailbox/accounts (list) içinde dolu; pause/resume yanıtında null. */
  lastSyncStatus?: 'DONE' | 'FAILED' | null;
  lastSyncError?: string | null;
  lastSyncAt?: string | null;
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

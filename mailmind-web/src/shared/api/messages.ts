import { apiRequest } from './client';

export type ApiMessage = {
  id: string;
  mailboxAccountId: string;
  providerMessageId: string;
  folder: string; // INBOX | SENT | TRASH | SPAM
  from: string | null;
  to: string;
  subject: string | null;
  date: string;
  snippet: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  isRead: boolean;
  isStarred: boolean;
  aiSummary?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MessagesListResponse = {
  items: ApiMessage[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const messagesApi = {
  list(accessToken: string, accountId: string, opts?: { folder?: string; cursor?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (opts?.folder) params.set('folder', opts.folder);
    if (opts?.cursor) params.set('cursor', opts.cursor);
    if (opts?.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return apiRequest<MessagesListResponse>(
      `/mailbox/accounts/${accountId}/messages${qs ? `?${qs}` : ''}`,
      { method: 'GET', token: accessToken },
    );
  },

  getOne(accessToken: string, accountId: string, messageId: string) {
    return apiRequest<ApiMessage>(
      `/mailbox/accounts/${accountId}/messages/${messageId}`,
      { method: 'GET', token: accessToken },
    );
  },

  markAsRead(accessToken: string, accountId: string, messageId: string) {
    return apiRequest<ApiMessage>(
      `/mailbox/accounts/${accountId}/messages/${messageId}/read`,
      { method: 'PATCH', token: accessToken },
    );
  },

  unreadCount(accessToken: string, accountId: string, folder?: string) {
    const qs = folder ? `?folder=${folder}` : '';
    return apiRequest<{ count: number }>(
      `/mailbox/accounts/${accountId}/messages/unread-count${qs}`,
      { method: 'GET', token: accessToken },
    );
  },

  move(
    accessToken: string,
    accountId: string,
    messageId: string,
    folder: 'INBOX' | 'SENT' | 'TRASH' | 'SPAM',
  ) {
    return apiRequest<{ id: string; folder: string }>(
      `/mailbox/accounts/${accountId}/messages/${messageId}/move`,
      { method: 'PATCH', token: accessToken, body: { folder } },
    );
  },

  toggleStar(accessToken: string, accountId: string, messageId: string) {
    return apiRequest<{ id: string; isStarred: boolean }>(
      `/mailbox/accounts/${accountId}/messages/${messageId}/star`,
      { method: 'PATCH', token: accessToken },
    );
  },

  listStarred(accessToken: string, accountId: string, opts?: { cursor?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (opts?.cursor) params.set('cursor', opts.cursor);
    if (opts?.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return apiRequest<MessagesListResponse>(
      `/mailbox/accounts/${accountId}/messages/starred${qs ? `?${qs}` : ''}`,
      { method: 'GET', token: accessToken },
    );
  },

  summarize(accessToken: string, accountId: string, messageId: string) {
    return apiRequest<{ analysisId: string; summary: string }>(
      `/mailbox/accounts/${accountId}/messages/${messageId}/summarize`,
      { method: 'POST', token: accessToken },
    );
  },

  send(
    accessToken: string,
    accountId: string,
    payload: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject?: string;
      text?: string;
      html?: string;
      attachments?: Array<{ filename: string; contentBase64: string; contentType?: string }>;
    },
  ) {
    return apiRequest<{ messageId: string }>(
      `/mailbox/accounts/${accountId}/messages/send`,
      { method: 'POST', token: accessToken, body: payload },
    );
  },
};

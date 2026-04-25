import { apiRequest } from './client';

export type ApiDraftAttachment = {
  filename: string;
  contentBase64: string;
  contentType?: string;
};

export type ApiDraft = {
  id: string;
  mailboxAccountId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  attachments: ApiDraftAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type SaveDraftPayload = {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: ApiDraftAttachment[];
};

export const draftsApi = {
  list(accessToken: string, accountId: string) {
    return apiRequest<ApiDraft[]>(
      `/mailbox/accounts/${accountId}/drafts`,
      { method: 'GET', token: accessToken },
    );
  },

  getOne(accessToken: string, accountId: string, draftId: string) {
    return apiRequest<ApiDraft>(
      `/mailbox/accounts/${accountId}/drafts/${draftId}`,
      { method: 'GET', token: accessToken },
    );
  },

  create(accessToken: string, accountId: string, payload: SaveDraftPayload) {
    return apiRequest<ApiDraft>(
      `/mailbox/accounts/${accountId}/drafts`,
      { method: 'POST', token: accessToken, body: payload },
    );
  },

  update(
    accessToken: string,
    accountId: string,
    draftId: string,
    payload: SaveDraftPayload,
  ) {
    return apiRequest<ApiDraft>(
      `/mailbox/accounts/${accountId}/drafts/${draftId}`,
      { method: 'PATCH', token: accessToken, body: payload },
    );
  },

  remove(accessToken: string, accountId: string, draftId: string) {
    return apiRequest<{ id: string }>(
      `/mailbox/accounts/${accountId}/drafts/${draftId}`,
      { method: 'DELETE', token: accessToken },
    );
  },
};

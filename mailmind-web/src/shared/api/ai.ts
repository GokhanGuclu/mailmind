import { apiRequest } from './client';

export type ComposeEmailPayload = {
  prompt: string;
  language?: 'tr' | 'en';
  tone?: 'formal' | 'friendly' | 'neutral';
  length?: 'short' | 'normal' | 'long';
};

export type ComposedEmail = {
  subject: string;
  bodyText: string;
  bodyHtml: string;
};

export const aiApi = {
  compose(accessToken: string, payload: ComposeEmailPayload) {
    return apiRequest<ComposedEmail>('/ai/compose', {
      method: 'POST',
      token: accessToken,
      body: payload,
    });
  },
};

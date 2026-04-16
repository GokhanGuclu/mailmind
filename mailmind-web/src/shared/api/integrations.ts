import { apiRequest } from './client';

export const integrationsApi = {
  startGoogleConnect(accessToken: string) {
    return apiRequest<{ authorizeUrl: string }>('/integrations/google/start', {
      method: 'POST',
      token: accessToken,
    });
  },
};

import { apiRequest } from './client';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
};

export const authApi = {
  register(email: string, password: string) {
    return apiRequest<AuthTokens>('/auth/register', {
      method: 'POST',
      body: { email, password },
    });
  },

  login(email: string, password: string) {
    return apiRequest<AuthTokens>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  refresh(refreshToken: string) {
    return apiRequest<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
  },

  logout(refreshToken: string) {
    return apiRequest<{ ok: true }>('/auth/logout', {
      method: 'POST',
      body: { refreshToken },
    });
  },

  me(accessToken: string) {
    return apiRequest<AuthUser>('/auth/me', {
      method: 'GET',
      token: accessToken,
    });
  },
};

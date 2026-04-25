import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { ApiError } from '../api/client';
import { authApi, type AuthTokens, type AuthUser } from '../api/auth';

type AuthStatus = 'unauthenticated' | 'authenticating' | 'authenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('unauthenticated');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  const loadUser = useCallback(async (next: AuthTokens) => {
    const me = await authApi.me(next.accessToken);
    setUser(me);
    setTokens(next);
    setStatus('authenticated');
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setStatus('authenticating');
      try {
        const next = await authApi.login(email, password);
        await loadUser(next);
      } catch (err) {
        setStatus('unauthenticated');
        throw err;
      }
    },
    [loadUser],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      setStatus('authenticating');
      try {
        const next = await authApi.register(email, password);
        await loadUser(next);
      } catch (err) {
        setStatus('unauthenticated');
        throw err;
      }
    },
    [loadUser],
  );

  const logout = useCallback(async () => {
    if (tokens?.refreshToken) {
      try {
        await authApi.logout(tokens.refreshToken);
      } catch {
        /* noop: local state her hâlükârda temizlenir */
      }
    }
    setTokens(null);
    setUser(null);
    setStatus('unauthenticated');
  }, [tokens]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, tokens, login, register, logout }),
    [status, user, tokens, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };

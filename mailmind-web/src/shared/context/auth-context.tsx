import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from '../api/client';
import { authApi, type AuthTokens, type AuthUser } from '../api/auth';
import { mailboxApi, type MailboxAccount } from '../api/mailbox';

const REFRESH_TOKEN_KEY = 'mailmind_refresh_token';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  mailboxAccounts: MailboxAccount[];
  hasActiveMailbox: boolean;
  login: (email: string, password: string) => Promise<{ hasActiveMailbox: boolean }>;
  register: (email: string, password: string) => Promise<{ hasActiveMailbox: boolean }>;
  logout: () => Promise<void>;
  refreshMailboxAccounts: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// PAUSED'ı da "mailbox var" sayıyoruz: kullanıcı geçici durdurmuş olabilir,
// /mail rotalarına girmeye devam edip Resume yapabilmeli; aksi halde
// MailboxGuard onu /connect-email'e atar ve resume butonuna ulaşamaz.
const computeHasActive = (accounts: MailboxAccount[]) =>
  accounts.some((acc) => acc.status === 'ACTIVE' || acc.status === 'PAUSED');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [mailboxAccounts, setMailboxAccounts] = useState<MailboxAccount[]>([]);

  const applyTokens = useCallback((tokens: AuthTokens) => {
    accessTokenRef.current = tokens.accessToken;
    setAccessToken(tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }, []);

  const clearTokens = useCallback(() => {
    accessTokenRef.current = null;
    setAccessToken(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const fetchAccounts = useCallback(async (token: string) => {
    try {
      const accounts = await mailboxApi.listAccounts(token);
      setMailboxAccounts(accounts);
      return accounts;
    } catch {
      setMailboxAccounts([]);
      return [] as MailboxAccount[];
    }
  }, []);

  // Bootstrap: try to restore session from refresh token
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }

      try {
        const tokens = await authApi.refresh(refreshToken);
        if (cancelled) return;
        applyTokens(tokens);
        const me = await authApi.me(tokens.accessToken);
        if (cancelled) return;
        setUser(me);
        await fetchAccounts(tokens.accessToken);
        if (cancelled) return;
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        clearTokens();
        setUser(null);
        setMailboxAccounts([]);
        setStatus('unauthenticated');
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applyTokens, clearTokens, fetchAccounts]);

  const finalizeLogin = useCallback(
    async (tokens: AuthTokens) => {
      applyTokens(tokens);
      const me = await authApi.me(tokens.accessToken);
      setUser(me);
      const accounts = await fetchAccounts(tokens.accessToken);
      setStatus('authenticated');
      return { hasActiveMailbox: computeHasActive(accounts) };
    },
    [applyTokens, fetchAccounts],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login(email, password);
      return finalizeLogin(tokens);
    },
    [finalizeLogin],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.register(email, password);
      return finalizeLogin(tokens);
    },
    [finalizeLogin],
  );

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (e) {
        if (!(e instanceof ApiError)) throw e;
      }
    }
    clearTokens();
    setUser(null);
    setMailboxAccounts([]);
    setStatus('unauthenticated');
  }, [clearTokens]);

  const refreshMailboxAccounts = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!token) return;
    await fetchAccounts(token);
  }, [fetchAccounts]);

  const hasActiveMailbox = useMemo(() => computeHasActive(mailboxAccounts), [mailboxAccounts]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      accessToken,
      mailboxAccounts,
      hasActiveMailbox,
      login,
      register,
      logout,
      refreshMailboxAccounts,
    }),
    [
      status,
      user,
      accessToken,
      mailboxAccounts,
      hasActiveMailbox,
      login,
      register,
      logout,
      refreshMailboxAccounts,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

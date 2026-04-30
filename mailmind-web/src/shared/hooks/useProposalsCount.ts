import { useEffect, useState } from 'react';
import { proposalsApi, type ProposalsCount } from '../api/proposals';
import { useAuth } from '../context/auth-context';

const POLL_INTERVAL_MS = 30_000;
const EMPTY: ProposalsCount = { tasks: 0, calendarEvents: 0, reminders: 0, total: 0 };

/**
 * AI proposals count'unu sürekli sayan küçük hook.
 * Sidebar badge ve dashboard widget gibi yerlerde kullanılabilir.
 */
export function useProposalsCount(): { count: ProposalsCount; refresh: () => Promise<void> } {
  const { accessToken } = useAuth();
  const [count, setCount] = useState<ProposalsCount>(EMPTY);

  const refresh = async () => {
    if (!accessToken) {
      setCount(EMPTY);
      return;
    }
    try {
      const c = await proposalsApi.count(accessToken);
      setCount(c);
    } catch {
      // sessizce yut — sayaç kritik değil
    }
  };

  useEffect(() => {
    if (!accessToken) {
      setCount(EMPTY);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const c = await proposalsApi.count(accessToken);
        if (!cancelled) setCount(c);
      } catch {
        /* noop */
      }
    };
    tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [accessToken]);

  return { count, refresh };
}

import { useEffect, useState } from 'react';
import { proposalsApi, type ProposalsByMessage } from '../api/proposals';
import { useAuth } from '../context/auth-context';

const POLL_INTERVAL_MS = 30_000;

/**
 * Inbox / message-list rozeti için map'i fetch eder.
 * Inbox sayfasında bir kez yüklenir, dakikada bir tazelenir.
 * Map küçük (kullanıcı başı PROPOSED sayısı az) — fetch ucuz.
 */
export function useProposalsByMessage(): { byMessage: ProposalsByMessage; refresh: () => Promise<void> } {
  const { accessToken } = useAuth();
  const [byMessage, setByMessage] = useState<ProposalsByMessage>({});

  const refresh = async () => {
    if (!accessToken) {
      setByMessage({});
      return;
    }
    try {
      const map = await proposalsApi.byMessage(accessToken);
      setByMessage(map);
    } catch {
      // sessizce yut — rozet kritik değil
    }
  };

  useEffect(() => {
    if (!accessToken) {
      setByMessage({});
      return;
    }
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const map = await proposalsApi.byMessage(accessToken);
        if (!cancelled) setByMessage(map);
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

  return { byMessage, refresh };
}

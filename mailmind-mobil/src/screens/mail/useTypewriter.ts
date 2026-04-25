import { useEffect, useRef, useState } from 'react';

const DEFAULT_SPEED_MS = 18;

/**
 * `source` değiştikçe metni karakter karakter yazar.
 * `enabled = false` ise metni anında gösterir.
 */
export function useTypewriter(source: string | null, enabled: boolean, speedMs = DEFAULT_SPEED_MS) {
  const [displayed, setDisplayed] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!source) {
      setDisplayed('');
      return;
    }
    if (!enabled) {
      setDisplayed(source);
      return;
    }
    setDisplayed('');
    let i = 0;
    const tick = () => {
      i += 1;
      setDisplayed(source.slice(0, i));
      if (i < source.length) {
        timerRef.current = setTimeout(tick, speedMs);
      }
    };
    timerRef.current = setTimeout(tick, speedMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [source, enabled, speedMs]);

  return displayed;
}

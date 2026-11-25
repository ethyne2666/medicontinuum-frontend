import { useCallback, useEffect, useRef, useState } from 'react';
import { onRegistryChange } from '@/lib/registry';

/**
 * Fetches immediately, then every `interval` ms while the tab is visible, and again
 * when the tab regains focus — keeps the patient site in sync with organization registrations.
 */
export function usePolling(fetcher, { interval = 10000 } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true, updatedAt: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const seq = useRef(0); // ignore responses that arrive out of order

  const run = useCallback(async () => {
    const mine = ++seq.current;
    try {
      const data = await fetcherRef.current();
      if (mine === seq.current) setState({ data, error: null, loading: false, updatedAt: new Date() });
    } catch (error) {
      if (mine === seq.current) setState((s) => ({ ...s, error, loading: false }));
    }
  }, []);

  useEffect(() => {
    run();
    const tick = () => { if (!document.hidden) run(); };
    const id = setInterval(tick, interval);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    const offRegistry = onRegistryChange(run);
    return () => {
      offRegistry();
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [run, interval]);

  return { ...state, refresh: run };
}

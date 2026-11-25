import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fetches immediately, then every `interval` ms while the tab is visible, and again
 * whenever the tab regains focus. `key` re-fetches when filters change.
 * This is what keeps the portal and the patient site in sync with the backend.
 */
export function usePolling(fetcher, { interval = 10000, key = '' } = {}) {
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
    setState((s) => ({ ...s, loading: s.data === null }));
    run();
    const tick = () => { if (!document.hidden) run(); };
    const id = setInterval(tick, interval);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [run, interval, key]);

  return { ...state, refresh: run };
}

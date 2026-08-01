import { useCallback, useEffect, useState } from 'react';

export function useAsyncData(loader, initialValue = [], deps = [], options = {}) {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const { pollIntervalMs = 0 } = options;

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError('');

    loader()
      .then((nextData) => {
        if (!mounted) return;
        setData(nextData ?? initialValue);
      })
      .catch((requestError) => {
        if (!mounted) return;
        setData(initialValue);
        setError(requestError?.response?.data?.message || requestError?.message || 'Unable to load data.');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [...deps, reloadKey]);

  useEffect(() => {
    if (!pollIntervalMs || typeof window === 'undefined') {
      return undefined;
    }

    const interval = window.setInterval(reload, pollIntervalMs);
    return () => window.clearInterval(interval);
  }, [pollIntervalMs, reload]);

  return { data, loading, error, reload, setData };
}

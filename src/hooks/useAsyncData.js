import { useCallback, useEffect, useState } from 'react';

export function useAsyncData(loader, initialValue = [], deps = []) {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

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

  return { data, loading, error, reload, setData };
}

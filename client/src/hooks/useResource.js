import { useEffect, useState } from 'react';
import { api } from '../lib/api';
export function useResource(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    api(path, { signal: controller.signal }).then(setData).catch(error => {
      if (error.name !== 'AbortError') setError(error.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, version]);
  return { data, error, loading, reload: () => setVersion(value => value + 1) };
}

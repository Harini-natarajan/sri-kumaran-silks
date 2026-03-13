import { useEffect, useState } from 'react';

export default function useAdminData(loader, defaultValue) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const run = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    setError('');
    try {
      const result = await loader();
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, [loader]);

  const refresh = () => run(true);

  return { data, setData, loading, error, refresh };
}

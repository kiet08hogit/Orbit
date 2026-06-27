import { useEffect, useState } from 'react';
import { listingsApi } from '@/lib/api';
import { mockListings } from '@/data/mock';
import type { Listing } from '@/lib/types';

export function useListings() {
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await listingsApi.list();
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          // Fall back to mock so the screen still feels alive when backend is offline
          setData(mockListings);
          setError(e instanceof Error ? e.message : 'Could not reach Orbit');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

export function useListing(id: string) {
  const [data, setData] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await listingsApi.get(id);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setData(mockListings.find((l) => l.id === id) ?? null);
          setError(e instanceof Error ? e.message : 'Could not reach Orbit');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { data, loading, error };
}

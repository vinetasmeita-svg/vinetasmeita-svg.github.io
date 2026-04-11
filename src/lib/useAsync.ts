'use client';

import { useEffect, useState } from 'react';

/**
 * Minimal async-state hook. Unlike `Promise.then(setState).catch(console.error)`,
 * this surfaces errors to the UI so users see "kļūda: X" instead of a page
 * hanging on "ielādē..." forever when a query fails (missing index, rules,
 * network, etc.).
 *
 * Usage:
 *   const { data, error, loading } = useAsync(() => listTracks(), []);
 *
 * The deps array works like useEffect deps — re-run when any change.
 * The factory is intentionally not in the deps array: pass a stable
 * reference or rely on deps to control re-execution.
 */
export function useAsync<T>(
  factory: () => Promise<T>,
  deps: React.DependencyList,
): { data: T | null; error: string | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    factory()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : String(err ?? 'Nezināma kļūda');
          console.error('useAsync error:', err);
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}

'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { lv } from '@/lib/i18n/lv';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/ienākt');
    }
  }, [loading, user, router]);

  if (loading) return <p>{lv.common.loading}</p>;
  if (!user) return null;
  return <>{children}</>;
}

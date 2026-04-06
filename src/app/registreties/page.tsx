'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { lv } from '@/lib/i18n/lv';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const { signUpEmail, signInGoogle, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace('/profils');
  }, [user, router]);

  if (user) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signUpEmail(email, password, displayName);
      router.replace('/profils');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setError(
        code === 'auth/email-already-in-use'
          ? lv.auth.errorEmailInUse
          : lv.auth.errorGeneric,
      );
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInGoogle();
      router.replace('/profils');
    } catch {
      setError(lv.auth.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card stack">
      <h1>{lv.nav.register}</h1>
      <form onSubmit={onSubmit} className="stack">
        <div>
          <label htmlFor="name">{lv.auth.displayName}</label>
          <input id="name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="email">{lv.auth.email}</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">{lv.auth.password}</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
        <button type="submit" className="primary" disabled={busy}>
          {lv.auth.signUp}
        </button>
      </form>
      <p style={{ textAlign: 'center' }} className="muted">{lv.auth.or}</p>
      <button type="button" onClick={onGoogle} disabled={busy}>
        {lv.auth.signUpWithGoogle}
      </button>
      <p className="muted" style={{ textAlign: 'center' }}>
        {lv.auth.alreadyHaveAccount} <Link href="/ienakt">{lv.nav.login}</Link>
      </p>
    </div>
  );
}

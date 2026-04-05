'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { lv } from '@/lib/i18n/lv';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const { signInEmail, signInGoogle, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    router.replace('/profils');
    return null;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInEmail(email, password);
      router.replace('/profils');
    } catch {
      setError(lv.auth.errorInvalidCredentials);
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
      <h1>{lv.nav.login}</h1>
      <form onSubmit={onSubmit} className="stack">
        <div>
          <label htmlFor="email">{lv.auth.email}</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">{lv.auth.password}</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
        <button type="submit" className="primary" disabled={busy}>
          {lv.auth.signIn}
        </button>
      </form>
      <p style={{ textAlign: 'center' }} className="muted">{lv.auth.or}</p>
      <button type="button" onClick={onGoogle} disabled={busy}>
        {lv.auth.signInWithGoogle}
      </button>
      <p className="muted" style={{ textAlign: 'center' }}>
        {lv.auth.noAccount} <Link href="/registreties">{lv.nav.register}</Link>
      </p>
    </div>
  );
}

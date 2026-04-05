'use client';

import { useState, type FormEvent } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth/context';
import { submitFeedback } from '@/server/feedback';
import { lv } from '@/lib/i18n/lv';

export const dynamic = 'force-dynamic';

export default function FeedbackPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const { user, getIdToken } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token || !user?.email) throw new Error('not ready');
      await submitFeedback({ idToken: token, userEmail: user.email, message });
      setDone(true);
      setMessage('');
    } catch {
      setError(lv.auth.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <h1>{lv.feedback.title}</h1>
      <p className="muted">{lv.feedback.intro}</p>
      {done ? (
        <p className="card">{lv.feedback.thanks}</p>
      ) : (
        <form onSubmit={onSubmit} className="card stack">
          <textarea
            placeholder={lv.feedback.placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={5000}
            required
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
          <button type="submit" className="primary" disabled={busy || !message.trim()}>
            {lv.feedback.submit}
          </button>
        </form>
      )}
    </div>
  );
}

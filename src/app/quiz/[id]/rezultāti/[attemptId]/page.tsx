'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import { getAttempt, type WithId } from '@/lib/queries';
import type { AttemptDoc } from '@/lib/types';
import { lv } from '@/lib/i18n/lv';

export default function AttemptDetailPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const params = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<WithId<AttemptDoc> | null>(null);

  useEffect(() => {
    if (params.attemptId) getAttempt(params.attemptId).then(setAttempt);
  }, [params.attemptId]);

  if (!attempt) return <p>{lv.common.loading}</p>;
  const a = attempt.data;
  const pct = a.totalQuestions ? Math.round((a.totalScore / a.totalQuestions) * 100) : 0;

  return (
    <div className="stack">
      <h1>{a.quizTitleSnapshot}</h1>
      <div className="card">
        <div style={{ fontSize: 36, fontFamily: 'var(--font-playfair), serif' }}>{pct}%</div>
        <div className="muted">
          {lv.results.correctCount(a.correctCount)} · {lv.results.partialCount(a.partialCount)} · {lv.results.wrongCount(a.wrongCount + a.skippedCount)}
        </div>
        <div className="muted">{new Date(a.finishedAt).toLocaleString('lv-LV')}</div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {a.results.map((r, i) => (
          <li key={i} className="card" style={{ borderLeft: `3px solid var(--${r.verdict === 'correct' ? 'success' : r.verdict === 'partial' ? 'partial' : 'danger'})` }}>
            <div style={{ fontSize: 13 }}>{r.quizTrack.title}</div>
            <div className="muted">{lv.review.yourAnswer}: {r.userAnswer || '—'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

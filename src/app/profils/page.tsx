'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth/context';
import { listMyQuizzes, listMyAttempts, type WithId } from '@/lib/queries';
import type { QuizDoc, AttemptDoc } from '@/lib/types';
import { eraName } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const { user, userDoc } = useAuth();
  const [quizzes, setQuizzes] = useState<WithId<QuizDoc>[] | null>(null);
  const [attempts, setAttempts] = useState<WithId<AttemptDoc>[] | null>(null);

  useEffect(() => {
    if (!user) return;
    listMyQuizzes(user.uid).then(setQuizzes);
    listMyAttempts(user.uid).then(setAttempts);
  }, [user]);

  const stats = useMemo(() => {
    if (!attempts) return null;
    if (attempts.length === 0) {
      return { total: 0, avgPct: 0, topEra: null as string | null, perEra: new Map<number, { correct: number; total: number }>() };
    }
    let totalScore = 0, totalQ = 0;
    const eraCounts = new Map<number, number>();
    const perEra = new Map<number, { correct: number; total: number }>();
    for (const a of attempts) {
      totalScore += a.data.totalScore;
      totalQ += a.data.totalQuestions;
      for (const r of a.data.results) {
        const era = r.quizTrack.era;
        eraCounts.set(era, (eraCounts.get(era) ?? 0) + 1);
        const pe = perEra.get(era) ?? { correct: 0, total: 0 };
        pe.total++;
        if (r.verdict === 'correct') pe.correct++;
        else if (r.verdict === 'partial') pe.correct += 0.5;
        perEra.set(era, pe);
      }
    }
    const avgPct = totalQ ? Math.round((totalScore / totalQ) * 100) : 0;
    let topEraId: number | null = null, topCount = 0;
    for (const [era, count] of eraCounts) {
      if (count > topCount) { topCount = count; topEraId = era; }
    }
    return {
      total: attempts.length,
      avgPct,
      topEra: topEraId !== null ? eraName(topEraId) : null,
      perEra,
    };
  }, [attempts]);

  return (
    <div className="stack">
      <h1>{lv.profile.title}</h1>
      {userDoc && <p className="muted">{userDoc.displayName || userDoc.email}</p>}

      {stats && (
        <div className="card stack">
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-playfair), serif' }}>{stats.total}</div>
              <div className="muted">{lv.profile.totalAttempts}</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-playfair), serif' }}>{stats.avgPct}%</div>
              <div className="muted">{lv.profile.averageScore}</div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-playfair), serif' }}>{stats.topEra ?? '—'}</div>
              <div className="muted">{lv.profile.favouriteEra}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card stack">
        <h2>{lv.profile.myQuizzes}</h2>
        {quizzes === null && <p>{lv.common.loading}</p>}
        {quizzes && quizzes.length === 0 && <p className="muted">{lv.quiz.emptyState}</p>}
        {quizzes && quizzes.map((q) => (
          <Link key={q.id} href={`/quiz/${q.id}`} style={{ display: 'block', padding: 8, borderBottom: '1px solid var(--border)' }}>
            {q.data.title} <span className="muted">({q.data.tracks.length})</span>
          </Link>
        ))}
      </div>

      {stats && stats.perEra.size > 0 && (
        <div className="card stack">
          <h2>{lv.profile.perEraAccuracy}</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Array.from(stats.perEra.entries()).map(([era, data]) => (
              <li key={era} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span>{eraName(era)}</span>
                <span className="muted">{data.correct} / {data.total}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card stack">
        <h2>{lv.profile.attemptHistory}</h2>
        {attempts === null && <p>{lv.common.loading}</p>}
        {attempts && attempts.length === 0 && <p className="muted">{lv.profile.noAttemptsYet}</p>}
        {attempts && attempts.map((a) => {
          const pct = a.data.totalQuestions ? Math.round((a.data.totalScore / a.data.totalQuestions) * 100) : 0;
          return (
            <Link key={a.id} href={`/quiz/${a.data.quizId}/rezultati/${a.id}`} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid var(--border)' }}>
              <span>{a.data.quizTitleSnapshot}</span>
              <span className="muted">{pct}% · {new Date(a.data.finishedAt).toLocaleDateString('lv-LV')}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

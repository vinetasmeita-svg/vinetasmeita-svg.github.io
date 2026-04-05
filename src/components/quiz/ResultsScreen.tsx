'use client';

import Link from 'next/link';
import type { AttemptResult } from '@/lib/types';
import { summarizeResults } from '@/lib/scoring';
import { lv } from '@/lib/i18n/lv';

interface Props {
  results: AttemptResult[];
  onPlayAgain: () => void;
}

export default function ResultsScreen({ results, onPlayAgain }: Props) {
  const s = summarizeResults(results);
  const pct = s.totalQuestions > 0 ? Math.round((s.totalScore / s.totalQuestions) * 100) : 0;

  return (
    <div className="stack">
      <h1>{lv.results.title}</h1>
      <div className="card stack" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontFamily: 'var(--font-playfair), serif' }}>{pct}%</div>
        <div className="muted">
          {lv.results.correctCount(s.correctCount)} · {lv.results.partialCount(s.partialCount)} · {lv.results.wrongCount(s.wrongCount + s.skippedCount)}
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {results.map((r, i) => (
          <li key={i} className="card" style={{ borderLeft: `3px solid var(--${r.verdict === 'correct' ? 'success' : r.verdict === 'partial' ? 'partial' : 'danger'})` }}>
            <div style={{ fontSize: 13 }}>{r.quizTrack.title}</div>
            <div className="muted">{lv.review.yourAnswer}: {r.userAnswer || '—'}</div>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onPlayAgain} style={{ flex: 1 }}>{lv.results.playAgain}</button>
        <Link href="/profils" style={{ flex: 1 }}>
          <button type="button" style={{ width: '100%' }}>{lv.results.toProfile}</button>
        </Link>
      </div>
    </div>
  );
}

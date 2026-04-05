'use client';

import { useState } from 'react';
import type { AttemptResult, AttemptVerdict } from '@/lib/types';
import { verdictToScore } from '@/lib/grading';
import { lv } from '@/lib/i18n/lv';

interface Props {
  initial: AttemptResult[];
  onFinalize: (final: AttemptResult[]) => void;
}

export default function ReviewScreen({ initial, onFinalize }: Props) {
  const [results, setResults] = useState<AttemptResult[]>(initial);

  const setVerdict = (i: number, v: AttemptVerdict) => {
    setResults((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, verdict: v, score: verdictToScore(v) } : r)),
    );
  };

  return (
    <div className="stack">
      <h1>{lv.review.title}</h1>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map((r, i) => (
          <li key={i} className="card stack">
            <div><strong>{lv.review.correctAnswer}:</strong> {r.quizTrack.title}</div>
            <div className="muted">{lv.review.yourAnswer}: {r.userAnswer || '—'}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" className={r.verdict === 'correct' ? 'primary' : ''} onClick={() => setVerdict(i, 'correct')}>✓ {lv.review.grade}</button>
              <button type="button" className={r.verdict === 'partial' ? 'primary' : ''} onClick={() => setVerdict(i, 'partial')}>½ {lv.review.gradePartial}</button>
              <button type="button" className={r.verdict === 'wrong' ? 'primary' : ''} onClick={() => setVerdict(i, 'wrong')}>✗ {lv.review.gradeWrong}</button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="primary" onClick={() => onFinalize(results)}>
        {lv.review.finish}
      </button>
    </div>
  );
}

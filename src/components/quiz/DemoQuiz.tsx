'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { DEMO_TRACKS } from '@/lib/demo-tracks';
import { autoGrade, verdictToScore } from '@/lib/grading';
import { summarizeResults } from '@/lib/scoring';
import type { AttemptResult, AttemptVerdict } from '@/lib/types';
import { lv } from '@/lib/i18n/lv';
import styles from './DemoQuiz.module.css';

type Phase = 'intro' | 'playing' | 'done';

export default function DemoQuiz() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<AttemptResult[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const track = DEMO_TRACKS[idx];

  const start = () => {
    setPhase('playing');
    setIdx(0);
    setAnswer('');
    setResults([]);
  };

  const submit = () => {
    const verdict: AttemptVerdict = autoGrade(answer, track.correctAnswer);
    const result: AttemptResult = {
      quizTrack: track,
      userAnswer: answer,
      verdict,
      score: verdictToScore(verdict),
      elapsedMs: 0,
    };
    const nextResults = [...results, result];
    setResults(nextResults);
    setAnswer('');
    if (idx + 1 >= DEMO_TRACKS.length) {
      setPhase('done');
    } else {
      setIdx(idx + 1);
    }
  };

  if (phase === 'intro') {
    return (
      <div className="card stack">
        <h2>{lv.landing.tryFree}</h2>
        <p className="muted">{lv.landing.demoHint}</p>
        <button type="button" className="primary" onClick={start}>
          {lv.quiz.start}
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    const s = summarizeResults(results);
    return (
      <div className="card stack">
        <h2>{lv.results.title}</h2>
        <p>{lv.results.correctCount(s.correctCount)} / {s.totalQuestions}</p>
        <ul className={styles.resultList}>
          {results.map((r, i) => (
            <li key={i} className={styles[r.verdict]}>
              <div>{r.quizTrack.title}</div>
              <div className="muted">{lv.review.yourAnswer}: {r.userAnswer || '—'}</div>
            </li>
          ))}
        </ul>
        <p style={{ textAlign: 'center' }}>{lv.landing.ctaRegister}</p>
        <Link href="/registreties">
          <button type="button" className="primary" style={{ width: '100%' }}>{lv.nav.register}</button>
        </Link>
        <button type="button" onClick={start}>{lv.results.playAgain}</button>
      </div>
    );
  }

  // phase === 'playing'
  return (
    <div className="card stack">
      <p className="muted">{lv.quiz.questionOf(idx + 1, DEMO_TRACKS.length)}</p>
      <audio ref={audioRef} src={track.audioPath} controls preload="auto" />
      <div>
        <label htmlFor="demo-answer">{lv.quiz.answerPlaceholder}</label>
        <textarea
          id="demo-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={3}
        />
      </div>
      <button type="button" className="primary" onClick={submit}>
        {idx + 1 === DEMO_TRACKS.length ? lv.review.finish : lv.quiz.nextQuestion}
      </button>
    </div>
  );
}

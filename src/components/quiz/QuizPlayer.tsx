'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { getSignedAudioUrl } from '@/server/tracks';
import { autoGrade, verdictToScore } from '@/lib/grading';
import type { QuizTrack, AttemptResult, AttemptVerdict } from '@/lib/types';
import { lv } from '@/lib/i18n/lv';

interface Props {
  questions: QuizTrack[];
  onFinish: (results: AttemptResult[]) => void;
}

export default function QuizPlayer({ questions, onFinish }: Props) {
  const { getIdToken } = useAuth();
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<AttemptResult[]>([]);
  // keyed by question index so we never call setState synchronously in the effect
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({});
  const startedAtRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const track = questions[idx];
  const audioUrl = audioUrls[idx] ?? null;

  useEffect(() => {
    startedAtRef.current = Date.now();
    let cancelled = false;

    (async () => {
      if (track.source === 'library' && track.audioPath) {
        const token = await getIdToken();
        if (!token || cancelled) return;
        const { url } = await getSignedAudioUrl({ idToken: token, audioPath: track.audioPath });
        if (!cancelled) {
          setAudioUrls((prev) => ({ ...prev, [idx]: url }));
        }
      }
    })();

    return () => { cancelled = true; };
  }, [idx, track, getIdToken]);

  const commit = (verdictOverride?: AttemptVerdict) => {
    const verdict = verdictOverride ?? autoGrade(answer, track.correctAnswer);
    const result: AttemptResult = {
      quizTrack: track,
      userAnswer: answer,
      verdict,
      score: verdictToScore(verdict),
      elapsedMs: Date.now() - startedAtRef.current,
    };
    const nextResults = [...results, result];
    setResults(nextResults);
    setAnswer('');
    if (idx + 1 >= questions.length) {
      onFinish(nextResults);
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div className="card stack">
      <p className="muted">{lv.quiz.questionOf(idx + 1, questions.length)}</p>

      {track.source === 'library' && audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          autoPlay
          preload="auto"
          onLoadedMetadata={(e) => {
            // Seek to the track's start offset. The legacy exam list specifies
            // exact timestamps (e.g. 22:50 for Mocarts 40 III d. menuets) — full
            // MP3s are uploaded once and we jump to the right position per track.
            const start = track.ytStart ?? 0;
            if (start > 0) e.currentTarget.currentTime = start;
          }}
        />
      )}
      {track.source === 'library' && !audioUrl && <p>{lv.common.loading}</p>}
      {track.source === 'youtube' && track.ytId && (
        <iframe
          width="100%"
          height="200"
          src={`https://www.youtube.com/embed/${track.ytId}?start=${track.ytStart ?? 0}&autoplay=1`}
          title={track.title}
          allow="autoplay; encrypted-media"
        />
      )}

      <div>
        <label htmlFor="ans">{lv.quiz.answerPlaceholder}</label>
        <textarea id="ans" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => commit('skipped')} style={{ flex: 1 }}>{lv.quiz.skip}</button>
        <button type="button" className="primary" onClick={() => commit()} style={{ flex: 2 }}>
          {idx + 1 === questions.length ? lv.review.finish : lv.quiz.submit}
        </button>
      </div>
    </div>
  );
}

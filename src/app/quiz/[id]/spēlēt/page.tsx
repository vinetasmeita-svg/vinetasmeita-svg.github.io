'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import QuizSetup from '@/components/quiz/QuizSetup';
import QuizPlayer from '@/components/quiz/QuizPlayer';
import ReviewScreen from '@/components/quiz/ReviewScreen';
import ResultsScreen from '@/components/quiz/ResultsScreen';
import { useAuth } from '@/lib/auth/context';
import { getQuiz, type WithId } from '@/lib/queries';
import { saveAttempt } from '@/server/attempts';
import { filterByEras, pickQuestions } from '@/lib/scoring';
import type { QuizDoc, QuizTrack, AttemptResult, EraId } from '@/lib/types';
import { lv } from '@/lib/i18n/lv';

type Phase = 'setup' | 'playing' | 'review' | 'results';

export default function PlayQuizPage() {
  return (
    <RequireAuth>
      <PlayInner />
    </RequireAuth>
  );
}

function PlayInner() {
  const params = useParams<{ id: string }>();
  const { getIdToken } = useAuth();
  const [quiz, setQuiz] = useState<WithId<QuizDoc> | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<QuizTrack[]>([]);
  const [rawResults, setRawResults] = useState<AttemptResult[]>([]);
  const [finalResults, setFinalResults] = useState<AttemptResult[]>([]);
  const [startedAt, setStartedAt] = useState<number>(0);

  useEffect(() => {
    if (params.id) getQuiz(params.id).then(setQuiz);
  }, [params.id]);

  if (!quiz) return <p>{lv.common.loading}</p>;

  const startPlaying = (count: number, eras: EraId[]) => {
    const pool = filterByEras(quiz.data.tracks, eras);
    const picked = pickQuestions(pool, count);
    setQuestions(picked);
    setStartedAt(Date.now());
    setPhase('playing');
  };

  const onPlayerFinish = (results: AttemptResult[]) => {
    setRawResults(results);
    setPhase('review');
  };

  const onReviewFinalize = async (final: AttemptResult[]) => {
    setFinalResults(final);
    setPhase('results');
    const token = await getIdToken();
    if (!token) return;
    try {
      await saveAttempt({
        idToken: token,
        quizId: quiz.id,
        quizTitleSnapshot: quiz.data.title,
        startedAt,
        finishedAt: Date.now(),
        results: final,
      });
    } catch (e) {
      console.error('Failed to save attempt', e);
    }
  };

  const playAgain = () => {
    setPhase('setup');
    setQuestions([]);
    setRawResults([]);
    setFinalResults([]);
  };

  return (
    <div className="stack">
      <h1>{quiz.data.title}</h1>
      {phase === 'setup' && <QuizSetup tracks={quiz.data.tracks} onStart={startPlaying} />}
      {phase === 'playing' && <QuizPlayer questions={questions} onFinish={onPlayerFinish} />}
      {phase === 'review' && <ReviewScreen initial={rawResults} onFinalize={onReviewFinalize} />}
      {phase === 'results' && <ResultsScreen results={finalResults} onPlayAgain={playAgain} />}
    </div>
  );
}

'use server';

import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import type { AttemptDoc, AttemptResult } from '@/lib/types';

export async function saveAttempt(args: {
  idToken: string;
  quizId: string;
  quizTitleSnapshot: string;
  startedAt: number;
  finishedAt: number;
  results: AttemptResult[];
}): Promise<{ id: string }> {
  const uid = await verifyIdToken(args.idToken);

  let correct = 0, partial = 0, wrong = 0, skipped = 0, score = 0;
  for (const r of args.results) {
    score += r.score;
    if (r.verdict === 'correct') correct++;
    else if (r.verdict === 'partial') partial++;
    else if (r.verdict === 'wrong') wrong++;
    else if (r.verdict === 'skipped') skipped++;
  }

  const doc: AttemptDoc = {
    userId: uid,
    quizId: args.quizId,
    quizTitleSnapshot: args.quizTitleSnapshot,
    startedAt: args.startedAt,
    finishedAt: args.finishedAt,
    totalQuestions: args.results.length,
    correctCount: correct,
    partialCount: partial,
    wrongCount: wrong,
    skippedCount: skipped,
    totalScore: score,
    results: args.results,
  };

  const ref = await adminDb.collection('attempts').add(doc);
  return { id: ref.id };
}

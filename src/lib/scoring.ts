import type { QuizTrack, AttemptResult } from './types';

export function filterByEras(
  tracks: QuizTrack[],
  eras: number[],
): QuizTrack[] {
  if (eras.length === 0) return tracks;
  const set = new Set(eras);
  return tracks.filter((t) => set.has(t.era));
}

/**
 * Pick up to N tracks from the pool using Fisher-Yates with a supplied RNG.
 * The RNG must return a float in [0, 1). Pass Math.random in production;
 * tests pass a seeded RNG for determinism.
 */
export function pickQuestions(
  pool: QuizTrack[],
  n: number,
  rng: () => number = Math.random,
): QuizTrack[] {
  if (pool.length === 0) return [];
  const arr = pool.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}

export interface ResultsSummary {
  totalQuestions: number;
  correctCount: number;
  partialCount: number;
  wrongCount: number;
  skippedCount: number;
  totalScore: number;
}

export function summarizeResults(results: AttemptResult[]): ResultsSummary {
  const summary: ResultsSummary = {
    totalQuestions: results.length,
    correctCount: 0,
    partialCount: 0,
    wrongCount: 0,
    skippedCount: 0,
    totalScore: 0,
  };
  for (const r of results) {
    summary.totalScore += r.score;
    switch (r.verdict) {
      case 'correct': summary.correctCount++; break;
      case 'partial': summary.partialCount++; break;
      case 'wrong':   summary.wrongCount++;   break;
      case 'skipped': summary.skippedCount++; break;
    }
  }
  return summary;
}

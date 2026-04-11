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

/**
 * Per-track historical performance — built from the user's prior attempts.
 * Keyed by track title (which is the canonical answer string, and unique
 * in practice).
 */
export interface TrackStat {
  appearances: number;
  totalScore: number;
}

export function computeTrackStats(
  attempts: Array<{ results: AttemptResult[] }>,
): Map<string, TrackStat> {
  const stats = new Map<string, TrackStat>();
  for (const attempt of attempts) {
    for (const r of attempt.results) {
      const key = r.quizTrack.title;
      const existing = stats.get(key) ?? { appearances: 0, totalScore: 0 };
      existing.appearances += 1;
      existing.totalScore += r.score;
      stats.set(key, existing);
    }
  }
  return stats;
}

/**
 * Weighted random picker: tracks the user has struggled with are more likely
 * to appear. Used for the "vājākie biežāk" training mode.
 *
 * Weight calculation per track:
 *   - unseen (no prior attempts) → 0.7  (moderate priority, encourage exposure)
 *   - seen                       → max(0.1, 1.1 - accuracy)
 *     where accuracy = totalScore / appearances
 *
 * So 100% accuracy → weight 0.1 (rarely picked), 50% → 0.6, 0% → 1.1.
 * The 0.1 floor means mastered tracks still occasionally reappear.
 *
 * Sampling is without replacement: after a track is picked, it's removed
 * from the remaining pool before the next weighted draw.
 */
export function pickQuestionsWeighted(
  pool: QuizTrack[],
  n: number,
  stats: Map<string, TrackStat>,
  rng: () => number = Math.random,
): QuizTrack[] {
  if (pool.length === 0) return [];
  const remaining = pool.slice();
  const picked: QuizTrack[] = [];
  const count = Math.min(n, remaining.length);

  const weightOf = (track: QuizTrack): number => {
    const stat = stats.get(track.title);
    if (!stat || stat.appearances === 0) return 0.7;
    const accuracy = stat.totalScore / stat.appearances;
    return Math.max(0.1, 1.1 - accuracy);
  };

  for (let i = 0; i < count; i++) {
    const weights = remaining.map(weightOf);
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = rng() * sum;
    let chosenIdx = remaining.length - 1; // fallback (floating-point safety)
    for (let j = 0; j < weights.length; j++) {
      r -= weights[j];
      if (r <= 0) { chosenIdx = j; break; }
    }
    picked.push(remaining[chosenIdx]);
    remaining.splice(chosenIdx, 1);
  }

  return picked;
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

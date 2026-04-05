import { describe, it, expect } from 'vitest';
import { filterByEras, pickQuestions, summarizeResults } from '@/lib/scoring';
import type { QuizTrack, AttemptResult } from '@/lib/types';

const t = (era: number, title = `track-${era}`): QuizTrack => ({
  source: 'library',
  title,
  era: era as QuizTrack['era'],
  correctAnswer: title,
});

describe('filterByEras', () => {
  it('returns all tracks when era set is empty', () => {
    const tracks = [t(0), t(1), t(2)];
    expect(filterByEras(tracks, [])).toEqual(tracks);
  });

  it('returns only tracks matching the era set', () => {
    const tracks = [t(0), t(1), t(2)];
    expect(filterByEras(tracks, [1])).toEqual([t(1)]);
  });

  it('returns tracks matching any era in the set', () => {
    const tracks = [t(0), t(1), t(2), t(3)];
    expect(filterByEras(tracks, [0, 2])).toEqual([t(0), t(2)]);
  });
});

describe('pickQuestions', () => {
  it('returns exactly N tracks when pool is larger', () => {
    const pool = [t(0), t(1), t(2), t(3), t(4)];
    const picked = pickQuestions(pool, 3, () => 0.5);
    expect(picked.length).toBe(3);
  });

  it('returns all tracks when N is larger than pool', () => {
    const pool = [t(0), t(1)];
    const picked = pickQuestions(pool, 5, () => 0.5);
    expect(picked.length).toBe(2);
  });

  it('is deterministic given a fixed RNG', () => {
    const pool = [t(0), t(1), t(2), t(3)];
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    expect(pickQuestions(pool, 3, rng1)).toEqual(pickQuestions(pool, 3, rng2));
  });

  it('returns empty when pool is empty', () => {
    expect(pickQuestions([], 5, () => 0)).toEqual([]);
  });
});

describe('summarizeResults', () => {
  const result = (
    verdict: AttemptResult['verdict'],
    score: AttemptResult['score'],
  ): AttemptResult => ({
    quizTrack: t(0),
    userAnswer: '',
    verdict,
    score,
    elapsedMs: 1000,
  });

  it('counts each verdict type', () => {
    const s = summarizeResults([
      result('correct', 1),
      result('correct', 1),
      result('partial', 0.5),
      result('wrong', 0),
      result('skipped', 0),
    ]);
    expect(s.correctCount).toBe(2);
    expect(s.partialCount).toBe(1);
    expect(s.wrongCount).toBe(1);
    expect(s.skippedCount).toBe(1);
  });

  it('sums scores correctly', () => {
    const s = summarizeResults([
      result('correct', 1),
      result('partial', 0.5),
      result('wrong', 0),
    ]);
    expect(s.totalScore).toBe(1.5);
  });

  it('returns zeros for empty results', () => {
    const s = summarizeResults([]);
    expect(s).toEqual({
      totalQuestions: 0,
      correctCount: 0,
      partialCount: 0,
      wrongCount: 0,
      skippedCount: 0,
      totalScore: 0,
    });
  });
});

// Deterministic RNG for tests
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

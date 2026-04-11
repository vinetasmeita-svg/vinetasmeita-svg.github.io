import { describe, it, expect } from 'vitest';
import {
  filterByEras,
  pickQuestions,
  pickQuestionsWeighted,
  computeTrackStats,
  summarizeResults,
  type TrackStat,
} from '@/lib/scoring';
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

describe('computeTrackStats', () => {
  const mkResult = (
    title: string,
    verdict: AttemptResult['verdict'],
    score: AttemptResult['score'],
  ): AttemptResult => ({
    quizTrack: { source: 'library', title, era: 0, correctAnswer: title },
    userAnswer: '',
    verdict,
    score,
    elapsedMs: 0,
  });

  it('returns empty map for no attempts', () => {
    expect(computeTrackStats([]).size).toBe(0);
  });

  it('aggregates appearances and scores across attempts', () => {
    const stats = computeTrackStats([
      { results: [mkResult('A', 'correct', 1), mkResult('B', 'wrong', 0)] },
      { results: [mkResult('A', 'wrong', 0)] },
    ]);
    expect(stats.get('A')).toEqual({ appearances: 2, totalScore: 1 });
    expect(stats.get('B')).toEqual({ appearances: 1, totalScore: 0 });
  });

  it('counts partial (0.5) correctly', () => {
    const stats = computeTrackStats([
      { results: [mkResult('A', 'partial', 0.5)] },
    ]);
    expect(stats.get('A')).toEqual({ appearances: 1, totalScore: 0.5 });
  });
});

describe('pickQuestionsWeighted', () => {
  it('returns empty when pool is empty', () => {
    expect(pickQuestionsWeighted([], 5, new Map(), () => 0)).toEqual([]);
  });

  it('returns up to N tracks without duplicates', () => {
    const pool = [t(0, 'a'), t(0, 'b'), t(0, 'c'), t(0, 'd')];
    const picked = pickQuestionsWeighted(pool, 3, new Map(), mulberry32(1));
    expect(picked.length).toBe(3);
    expect(new Set(picked.map((p) => p.title)).size).toBe(3);
  });

  it('returns all pool tracks when N exceeds pool size', () => {
    const pool = [t(0, 'a'), t(0, 'b')];
    expect(pickQuestionsWeighted(pool, 10, new Map(), mulberry32(1)).length).toBe(2);
  });

  it('is deterministic given a fixed RNG and stats', () => {
    const pool = [t(0, 'a'), t(0, 'b'), t(0, 'c'), t(0, 'd')];
    const stats = new Map<string, TrackStat>([
      ['a', { appearances: 2, totalScore: 2 }],  // 100% → weight 0.1
      ['b', { appearances: 2, totalScore: 0 }],  // 0%   → weight 1.1
    ]);
    const a = pickQuestionsWeighted(pool, 3, stats, mulberry32(42));
    const b = pickQuestionsWeighted(pool, 3, stats, mulberry32(42));
    expect(a.map((t) => t.title)).toEqual(b.map((t) => t.title));
  });

  it('picks weak tracks far more often than mastered tracks over many samples', () => {
    // Two-track pool: one mastered (accuracy 1.0), one struggled (accuracy 0.0).
    // Over 1000 single-pick samples, the weak one should win the vast majority.
    const pool = [t(0, 'mastered'), t(0, 'weak')];
    const stats = new Map<string, TrackStat>([
      ['mastered', { appearances: 10, totalScore: 10 }], // weight 0.1
      ['weak',     { appearances: 10, totalScore: 0  }], // weight 1.1
    ]);
    const rng = mulberry32(7);
    const counts = { mastered: 0, weak: 0 };
    for (let i = 0; i < 1000; i++) {
      const pick = pickQuestionsWeighted(pool, 1, stats, rng);
      counts[pick[0].title as 'mastered' | 'weak']++;
    }
    // Expected ratio is 1.1 / 0.1 = 11:1. Allow generous margin.
    expect(counts.weak).toBeGreaterThan(counts.mastered * 5);
  });

  it('treats unseen tracks as medium priority (weight 0.7)', () => {
    // Pool: one unseen, one mastered. Unseen should be picked much more often.
    const pool = [t(0, 'unseen'), t(0, 'mastered')];
    const stats = new Map<string, TrackStat>([
      ['mastered', { appearances: 10, totalScore: 10 }], // weight 0.1
    ]);
    const rng = mulberry32(3);
    const counts = { unseen: 0, mastered: 0 };
    for (let i = 0; i < 1000; i++) {
      const pick = pickQuestionsWeighted(pool, 1, stats, rng);
      counts[pick[0].title as 'unseen' | 'mastered']++;
    }
    // 0.7 / 0.1 = 7:1. Unseen should dominate.
    expect(counts.unseen).toBeGreaterThan(counts.mastered * 3);
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

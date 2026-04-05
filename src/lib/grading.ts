import type { AttemptVerdict } from './types';

/**
 * Normalize an answer string for comparison:
 * - lowercase
 * - replace punctuation (including curly quotes) with spaces
 * - collapse whitespace runs into single spaces
 * - trim
 *
 * Ported from legacy index.html normalizeAnswer().
 */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,;:!?()"'""„"''\u201c\u201d\u2018\u2019`\-—–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Auto-grade a user answer against the canonical correct answer.
 * Returns 'skipped' for empty input, 'correct' for exact normalized match,
 * 'wrong' otherwise. Manual overrides (→ 'partial') happen in the UI.
 */
export function autoGrade(
  userAnswer: string,
  correctAnswer: string,
): AttemptVerdict {
  const normalized = normalizeAnswer(userAnswer);
  if (normalized.length === 0) return 'skipped';
  return normalized === normalizeAnswer(correctAnswer) ? 'correct' : 'wrong';
}

/**
 * Convert an AttemptVerdict into its numeric score.
 */
export function verdictToScore(v: AttemptVerdict): 0 | 0.5 | 1 {
  switch (v) {
    case 'correct': return 1;
    case 'partial': return 0.5;
    case 'wrong':
    case 'skipped':
      return 0;
  }
}

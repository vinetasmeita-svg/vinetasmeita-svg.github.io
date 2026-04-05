import { describe, it, expect } from 'vitest';
import { normalizeAnswer, autoGrade } from '@/lib/grading';

describe('normalizeAnswer', () => {
  it('lowercases text', () => {
    expect(normalizeAnswer('BACH')).toBe('bach');
  });

  it('replaces punctuation with spaces', () => {
    expect(normalizeAnswer('J.S. Bahs, Mesija!')).toBe('j s bahs mesija');
  });

  it('collapses multiple whitespace into one', () => {
    expect(normalizeAnswer('a   b\t\tc')).toBe('a b c');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeAnswer('   hello   ')).toBe('hello');
  });

  it('strips curly quotes', () => {
    expect(normalizeAnswer('\u201chello\u201d \u2018world\u2019')).toBe('hello world');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeAnswer('')).toBe('');
  });
});

describe('autoGrade', () => {
  it('returns "correct" for exact normalized match', () => {
    expect(autoGrade('J.S. Bahs', 'j s bahs')).toBe('correct');
  });

  it('returns "wrong" for no match', () => {
    expect(autoGrade('Mozart', 'Bach')).toBe('wrong');
  });

  it('returns "skipped" for empty user answer', () => {
    expect(autoGrade('', 'Bach')).toBe('skipped');
  });

  it('returns "skipped" for whitespace-only user answer', () => {
    expect(autoGrade('   ', 'Bach')).toBe('skipped');
  });

  it('is case-insensitive', () => {
    expect(autoGrade('BACH', 'bach')).toBe('correct');
  });

  it('is punctuation-insensitive', () => {
    expect(autoGrade('J.S.Bahs', 'J S Bahs')).toBe('correct');
  });
});

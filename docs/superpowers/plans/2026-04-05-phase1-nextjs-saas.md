# Mūzikas Literatūras Treniņa SaaS — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing single-file HTML music-literature quiz into a multi-user Next.js + Firebase SaaS with auth, multi-quiz CRUD, admin-curated templates, admin track library + user YouTube tracks, per-user stats, public demo, and feedback form — deployable to Vercel.

**Architecture:** Next.js 15 App Router (TypeScript) with client-side Firebase Auth, Firestore, and Firebase Storage. Server actions (with admin SDK) handle privileged operations (signed audio URLs, feedback email, writes that require validation). Legacy HTML preserved under `legacy/` as the data source for the one-shot seeding script. Styling ports the existing dark theme (Playfair Display + DM Mono) via plain CSS modules + CSS variables — no Tailwind.

**Tech Stack:**
- Next.js 15 (App Router), TypeScript, React 19
- Firebase Auth (Email/Password + Google), Cloud Firestore, Firebase Storage
- `firebase` (client SDK), `firebase-admin` (server SDK)
- Resend (feedback email)
- Vitest (unit tests), `@firebase/rules-unit-testing` (security rules), Playwright (E2E)
- CSS Modules + CSS variables
- `next/font/google` for Playfair Display + DM Mono

**Spec:** `docs/superpowers/specs/2026-04-05-muzikas-literatura-phase1-design.md`

**Branch:** `phase1-nextjs-saas`

---

## File Structure (target state)

```
/
├── legacy/                                    # existing HTML moved here
│   ├── index.html
│   └── audio/                                  # original 49 MP3s
├── package.json
├── next.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── .env.local.example
├── .gitignore
├── firebase.json                              # emulator + rules config
├── firestore.rules
├── storage.rules
├── public/
│   └── audio/                                 # 3 demo MP3s only
├── data/
│   └── tracks-seed.json                       # extracted from legacy/index.html
├── scripts/
│   ├── extract-legacy-tracks.mjs              # one-shot HTML parser
│   └── seed-firebase.ts                       # one-shot Firebase seeder
├── tests/
│   ├── unit/
│   │   ├── grading.test.ts
│   │   └── scoring.test.ts
│   ├── rules/
│   │   └── firestore.rules.test.ts
│   └── e2e/
│       └── happy-path.spec.ts
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx                           # /
    │   ├── ienākt/page.tsx
    │   ├── reģistrēties/page.tsx
    │   ├── profils/page.tsx
    │   ├── quiz/
    │   │   ├── page.tsx                       # list
    │   │   ├── jauns/page.tsx
    │   │   └── [id]/
    │   │       ├── page.tsx                   # edit
    │   │       ├── spēlēt/page.tsx
    │   │       └── rezultāti/[attemptId]/page.tsx
    │   ├── bibliotēka/page.tsx
    │   └── atsauksmes/page.tsx
    ├── components/
    │   ├── AuthProvider.tsx
    │   ├── RequireAuth.tsx
    │   ├── Header.tsx
    │   ├── quiz/
    │   │   ├── DemoQuiz.tsx                   # public 3-track demo
    │   │   ├── QuizSetup.tsx
    │   │   ├── QuizPlayer.tsx
    │   │   ├── AnswerInput.tsx
    │   │   ├── ReviewScreen.tsx               # manual grade override
    │   │   ├── ResultsScreen.tsx
    │   │   ├── TrackPicker.tsx
    │   │   └── YouTubeAddForm.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       └── styles.module.css
    ├── lib/
    │   ├── firebase/
    │   │   ├── client.ts                      # browser init
    │   │   └── admin.ts                       # server init (for server actions)
    │   ├── auth/
    │   │   └── context.tsx                    # AuthProvider + useAuth
    │   ├── grading.ts
    │   ├── scoring.ts
    │   ├── eras.ts
    │   ├── types.ts
    │   ├── demo-tracks.ts
    │   └── i18n/lv.ts
    └── server/
        ├── quizzes.ts                          # server actions
        ├── attempts.ts
        ├── feedback.ts
        └── tracks.ts                           # signed URLs
```

---

## Task Dependency Overview

```
1. Move legacy files ──┐
2. Scaffold Next.js ───┴──► 3. Type defs + i18n + eras
                                  │
                                  ▼
                          4. Grading (TDD) ──► 5. Scoring (TDD)
                                  │
                                  ▼
                          6. Extract legacy tracks → JSON
                                  │
                                  ▼
                          7. Firebase config + SDK init
                                  │
                                  ▼
                          8. Security rules + 9. Rules tests
                                  │
                                  ▼
                          10. Auth context + hooks
                                  │
                                  ▼
                          11-13. Register / Login / RequireAuth
                                  │
                                  ▼
                          14. Root layout + globals (port theme)
                                  │
                                  ▼
                          15. Landing page + 16. Demo quiz
                                  │
                                  ▼
                          17-19. Quiz server actions (CRUD, clone, signed URLs)
                                  │
                                  ▼
                          20. /bibliotēka  21. /quiz list  22. /quiz/jauns
                                  │
                                  ▼
                          23. /quiz/[id] edit + 24. TrackPicker
                                  │
                                  ▼
                          25-28. Quiz play flow (setup → player → review → results)
                                  │
                                  ▼
                          29. /profils dashboard
                                  │
                                  ▼
                          30-31. Feedback form + email
                                  │
                                  ▼
                          32. Seed script
                                  │
                                  ▼
                          33. E2E test + Vercel deploy docs
```

---

## Task 1: Move legacy HTML + audio into `legacy/` folder

**Files:**
- Move: `index.html` → `legacy/index.html`
- Move: `audio/` → `legacy/audio/`

- [ ] **Step 1: Create `legacy/` directory and move files via git**

```bash
mkdir legacy
git mv index.html legacy/index.html
git mv audio legacy/audio
```

- [ ] **Step 2: Verify structure**

Run: `ls -la && ls legacy/`
Expected: root shows `legacy/`, `.git/`, `.nojekyll`, `docs/`; `legacy/` contains `index.html` and `audio/`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: move legacy HTML and audio into legacy/ folder

Preserves the original single-file app as a reference and as the
data source for the track seeding script. The Next.js app will be
scaffolded at the repository root."
```

---

## Task 2: Scaffold Next.js 15 + TypeScript + tooling

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `.gitignore`, `.env.local.example`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Run Next.js scaffolder in-place**

Run:
```bash
npx create-next-app@latest . --typescript --app --src-dir --no-tailwind --eslint --import-alias "@/*" --no-turbopack
```

When prompted about existing non-empty directory, answer **yes** (merge). Do NOT overwrite `legacy/`, `docs/`, `.git/`.

Expected: `src/app/`, `package.json`, `next.config.mjs`, `tsconfig.json`, etc., created.

- [ ] **Step 2: Verify dev server boots**

Run: `npm run dev` (then Ctrl+C after confirming "Ready in ... ms")
Expected: Next.js dev server starts on :3000 without errors.

- [ ] **Step 3: Install runtime dependencies**

Run:
```bash
npm install firebase firebase-admin resend
```

- [ ] **Step 4: Install dev dependencies**

Run:
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @firebase/rules-unit-testing @playwright/test
npx playwright install chromium
```

- [ ] **Step 5: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/rules/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 6: Create `tests/setup.ts`**

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 7: Add npm scripts**

Edit `package.json` `scripts` section to include:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 8: Create `.env.local.example`**

```
# Firebase (client — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase admin (server — secret)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Resend
RESEND_API_KEY=
ADMIN_EMAIL=
```

- [ ] **Step 9: Verify lint + build pass**

Run: `npm run lint && npm run build`
Expected: both succeed, no errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 + TypeScript + Vitest + Playwright"
```

---

## Task 3: Type definitions, Latvian i18n strings, era enum

**Files:**
- Create: `src/lib/types.ts`, `src/lib/eras.ts`, `src/lib/i18n/lv.ts`

- [ ] **Step 1: Create `src/lib/eras.ts`**

```typescript
// Era IDs and Latvian names (matches legacy index.html exactly).
export const ERAS = [
  { id: 0,  name: 'Baroks' },
  { id: 1,  name: 'Klasicisms' },
  { id: 2,  name: 'Vācu/austriešu romantisms' },
  { id: 3,  name: 'Franču romantisms' },
  { id: 4,  name: 'Itāļu romantisms/verisms' },
  { id: 5,  name: 'Krievu romantisms' },
  { id: 6,  name: 'Latviešu romantisms' },
  { id: 7,  name: 'Impresionisms' },
  { id: 8,  name: 'XX gs. modernisms' },
  { id: 9,  name: 'Latviešu XX gs.' },
  { id: 10, name: 'Cits' },
] as const;

export type EraId = typeof ERAS[number]['id'];

export function eraName(id: number): string {
  return ERAS.find((e) => e.id === id)?.name ?? 'Nezināms';
}
```

> **Note:** Task 6 (extract-legacy-tracks) will read the actual era list from `legacy/index.html` and confirm this matches. Update this file if the legacy HTML differs.

- [ ] **Step 2: Create `src/lib/types.ts`**

```typescript
import type { EraId } from './eras';

export type UserRole = 'user' | 'admin';

export interface UserDoc {
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number; // ms since epoch
}

export interface TrackDoc {
  title: string;
  composer?: string;
  era: EraId;
  audioPath: string;      // Firebase Storage path
  ytId: string | null;
  ytStart: number;
  correctAnswer: string;  // canonical text for grading
  createdBy: string;
  createdAt: number;
}

export type QuizTrackSource = 'library' | 'youtube';

export interface QuizTrack {
  source: QuizTrackSource;
  trackId?: string;         // set if source='library'
  title: string;
  composer?: string;
  era: EraId;
  audioPath?: string;       // set if source='library'
  ytId?: string;            // set if source='youtube' OR library fallback
  ytStart?: number;
  correctAnswer: string;
}

export interface QuizDoc {
  ownerId: string;
  title: string;
  description: string;
  isTemplate: boolean;
  tracks: QuizTrack[];
  createdAt: number;
  updatedAt: number;
}

export type AttemptVerdict = 'correct' | 'partial' | 'wrong' | 'skipped';

export interface AttemptResult {
  quizTrack: QuizTrack;
  userAnswer: string;
  verdict: AttemptVerdict;
  score: 0 | 0.5 | 1;
  elapsedMs: number;
}

export interface AttemptDoc {
  userId: string;
  quizId: string;
  quizTitleSnapshot: string;
  startedAt: number;
  finishedAt: number;
  totalQuestions: number;
  correctCount: number;
  partialCount: number;
  wrongCount: number;
  skippedCount: number;
  totalScore: number;       // sum of result.score
  results: AttemptResult[];
}

export interface FeedbackDoc {
  userId: string;
  userEmail: string;
  message: string;
  createdAt: number;
  status: 'new' | 'read' | 'resolved';
}
```

- [ ] **Step 3: Create `src/lib/i18n/lv.ts`**

```typescript
// Central Latvian string table. All user-facing strings live here.
export const lv = {
  app: {
    name: 'Mūzikas literatūra',
    tagline: 'Treniņš',
  },
  nav: {
    home: 'Sākums',
    login: 'Ienākt',
    register: 'Reģistrēties',
    logout: 'Iziet',
    profile: 'Profils',
    quizzes: 'Quiz',
    library: 'Bibliotēka',
    feedback: 'Atsauksmes',
  },
  landing: {
    heroTitle: 'Mūzikas literatūras treniņš',
    heroSubtitle: 'Klausies, atpazīsti, apgūsti.',
    about: 'Bezmaksas platforma mūzikas vēstures apgūšanai. Izveido savus quiz, klausies skaņdarbus un seko savai progresam.',
    tryFree: 'Izmēģini bez maksas',
    demoHint: 'Trīs skaņdarbi, lai redzētu kā viss darbojas.',
    ctaRegister: 'Reģistrējies, lai saglabātu statistiku un veidotu savus quiz',
  },
  auth: {
    email: 'E-pasts',
    password: 'Parole',
    displayName: 'Vārds',
    signIn: 'Ienākt',
    signUp: 'Reģistrēties',
    signInWithGoogle: 'Ienākt ar Google',
    signUpWithGoogle: 'Reģistrēties ar Google',
    or: 'vai',
    alreadyHaveAccount: 'Jau ir konts?',
    noAccount: 'Vēl nav konta?',
    errorGeneric: 'Notika kļūda. Lūdzu, mēģini vēlreiz.',
    errorInvalidCredentials: 'Nepareizs e-pasts vai parole.',
    errorEmailInUse: 'Šis e-pasts jau tiek izmantots.',
  },
  quiz: {
    mine: 'Mani quiz',
    templates: 'Gatavas sagataves',
    createNew: 'Izveidot jaunu',
    fromScratch: 'Sākt no nulles',
    useTemplate: 'Izmantot gatavu sagatavi',
    clone: 'Klonēt uz manu kontu',
    play: 'Spēlēt',
    edit: 'Rediģēt',
    delete: 'Dzēst',
    confirmDelete: 'Vai tiešām dzēst šo quiz?',
    emptyState: 'Tev vēl nav quiz. Sāc ar gatavu sagatavi vai izveido savu.',
    title: 'Nosaukums',
    description: 'Apraksts',
    tracks: 'Skaņdarbi',
    addFromLibrary: 'Pievienot no bibliotēkas',
    addYouTube: 'Pievienot YouTube',
    noTracksYet: 'Vēl nav pievienots neviens skaņdarbs.',
    save: 'Saglabāt',
    saved: 'Saglabāts',
    questionCount: 'Jautājumu skaits',
    filterByEra: 'Filtrēt pēc laikmeta',
    allEras: 'Visi laikmeti',
    start: 'Sākt',
    nextQuestion: 'Nākamais',
    submit: 'Iesniegt',
    skip: 'Izlaist',
    answerPlaceholder: 'Pieraksti: autors, skaņdarba nosaukums, daļa/numurs...',
    replay: 'Atskaņot vēlreiz',
    questionOf: (cur: number, total: number) => `Jautājums ${cur} no ${total}`,
  },
  review: {
    title: 'Pārskats',
    yourAnswer: 'Tava atbilde',
    correctAnswer: 'Pareizā atbilde',
    grade: 'Ieskaitīt',
    gradePartial: 'Daļēji',
    gradeWrong: 'Neieskaitīt',
    finish: 'Pabeigt',
  },
  results: {
    title: 'Rezultāti',
    score: 'Rezultāts',
    correctCount: (n: number) => `${n} pareizi`,
    partialCount: (n: number) => `${n} daļēji`,
    wrongCount: (n: number) => `${n} nepareizi`,
    playAgain: 'Spēlēt vēlreiz',
    toProfile: 'Uz profilu',
  },
  profile: {
    title: 'Mans profils',
    totalAttempts: 'Kopā mēģinājumi',
    averageScore: 'Vidējais rezultāts',
    favouriteEra: 'Biežākais laikmets',
    myQuizzes: 'Mani quiz',
    attemptHistory: 'Mēģinājumu vēsture',
    perEraAccuracy: 'Precizitāte pēc laikmetiem',
    noAttemptsYet: 'Vēl nav neviena mēģinājuma.',
  },
  library: {
    title: 'Bibliotēka',
    searchPlaceholder: 'Meklēt pēc nosaukuma vai komponista...',
    totalTracks: (n: number) => `${n} skaņdarbi`,
  },
  feedback: {
    title: 'Atsauksmes un ieteikumi',
    intro: 'Raksti man jautājumus, ieteikumus vai ziņo par kļūdām.',
    placeholder: 'Tava ziņa...',
    submit: 'Sūtīt',
    thanks: 'Paldies! Tava ziņa ir saņemta.',
  },
  common: {
    loading: 'Ielādē...',
    error: 'Kļūda',
    cancel: 'Atcelt',
    confirm: 'Apstiprināt',
    back: 'Atpakaļ',
    yes: 'Jā',
    no: 'Nē',
  },
} as const;
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/eras.ts src/lib/i18n/lv.ts
git commit -m "feat: add type definitions, era enum, and Latvian string table"
```

---

## Task 4: Answer grading module (TDD)

**Purpose:** Port the legacy `normalizeAnswer` logic (lowercase, punctuation → space, collapse whitespace) and a strict-equality auto-grader. The review step (manual override) lives in the UI, not here.

**Files:**
- Create: `src/lib/grading.ts`
- Test: `tests/unit/grading.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/grading.test.ts
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
    expect(normalizeAnswer('“hello” ‘world’')).toBe('hello world');
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/grading.test.ts`
Expected: FAIL — `Cannot find module '@/lib/grading'` or similar.

- [ ] **Step 3: Implement `src/lib/grading.ts`**

```typescript
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
    .replace(/[.,;:!?()"'“”„"‘’`\-—–]/g, ' ')
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/grading.test.ts`
Expected: PASS (all 12 tests green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/grading.ts tests/unit/grading.test.ts
git commit -m "feat: add answer grading module with tests

Ports normalizeAnswer from legacy index.html. Strict-equality auto-grade;
manual override to 'partial' will happen in the review UI, not here."
```

---

## Task 5: Scoring / quiz-setup utilities (TDD)

**Purpose:** Deterministic quiz-setup helpers: filter tracks by era set, shuffle-and-pick N, compute aggregate score from attempt results.

**Files:**
- Create: `src/lib/scoring.ts`
- Test: `tests/unit/scoring.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/scoring.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/scoring.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/scoring.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/scoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts tests/unit/scoring.test.ts
git commit -m "feat: add scoring utilities (era filter, picker, summarizer) with tests"
```

---

## Task 6: Extract legacy tracks → `data/tracks-seed.json`

**Purpose:** One-shot Node script that parses `legacy/index.html`, extracts the tracks array, and writes a normalized JSON file. Committed for reproducibility.

**Files:**
- Create: `scripts/extract-legacy-tracks.mjs`
- Create: `data/tracks-seed.json` (generated)

- [ ] **Step 1: Create the extractor script**

`scripts/extract-legacy-tracks.mjs`:

```javascript
#!/usr/bin/env node
// One-shot: parse legacy/index.html, extract the track array,
// write normalized JSON to data/tracks-seed.json.
import fs from 'node:fs';
import path from 'node:path';

const HTML_PATH = 'legacy/index.html';
const OUT_PATH = 'data/tracks-seed.json';
const AUDIO_DIR = 'legacy/audio';

const html = fs.readFileSync(HTML_PATH, 'utf-8');

// Match each track object literal: {era:N,eraName:"...",label:"...",ytId:"...",start:N,audioSrc:"audio/X.mp3"}
const trackRegex = /\{era:(\d+),eraName:"([^"]+)",label:"((?:[^"\\]|\\.)*)",ytId:"([^"]*)",start:(\d+),audioSrc:"([^"]+)"\}/g;

const tracks = [];
let m;
while ((m = trackRegex.exec(html)) !== null) {
  const [, era, eraName, labelRaw, ytId, start, audioSrc] = m;
  const label = labelRaw.replace(/\\"/g, '"');
  const audioFilename = path.basename(audioSrc);
  const audioExists = fs.existsSync(path.join(AUDIO_DIR, audioFilename));
  tracks.push({
    era: Number(era),
    eraName,
    title: label,
    correctAnswer: label,
    ytId,
    ytStart: Number(start),
    audioFilename,
    audioExists,
  });
}

console.log(`Extracted ${tracks.length} tracks.`);
const missing = tracks.filter((t) => !t.audioExists);
if (missing.length) {
  console.warn(`Warning: ${missing.length} track(s) missing audio file:`);
  missing.forEach((t) => console.warn(`  - ${t.audioFilename} (${t.title})`));
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(tracks, null, 2) + '\n');
console.log(`Wrote ${OUT_PATH}`);
```

- [ ] **Step 2: Run the extractor**

Run: `node scripts/extract-legacy-tracks.mjs`
Expected output:
```
Extracted 50 tracks.
Warning: 1 track(s) missing audio file:
  - <filename>.mp3 (<title>)
Wrote data/tracks-seed.json
```

- [ ] **Step 3: Inspect the output**

Open `data/tracks-seed.json` and verify:
- Exactly 50 entries
- Each has `era`, `eraName`, `title`, `correctAnswer`, `ytId`, `ytStart`, `audioFilename`, `audioExists`
- All 11 eras are represented reasonably (ids 0–10)

- [ ] **Step 4: Note the missing-audio track in the spec risks list**

Open `docs/superpowers/specs/2026-04-05-muzikas-literatura-phase1-design.md`, find the "Known risks" section, update item 2 from `"The missing 50th track"` to explicitly name the file (e.g. `"The missing audio file X.mp3 for track Y — resolution: drop / re-download / YouTube-only"`).

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-legacy-tracks.mjs data/tracks-seed.json docs/superpowers/specs/2026-04-05-muzikas-literatura-phase1-design.md
git commit -m "feat: extract legacy tracks into data/tracks-seed.json

One-shot parser reads legacy/index.html and produces a normalized JSON
snapshot of all 50 tracks. Logs any tracks whose audio file is missing
from legacy/audio/."
```

---

## Task 7: Firebase configuration + client & admin SDK initialisation

**Files:**
- Create: `src/lib/firebase/client.ts`, `src/lib/firebase/admin.ts`, `firebase.json`

- [ ] **Step 1: Create `src/lib/firebase/client.ts`**

```typescript
// Browser-side Firebase init. Safe to import from client components.
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(config);
} else {
  app = getApps()[0];
}

export const firebaseApp: FirebaseApp = app;
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
```

- [ ] **Step 2: Create `src/lib/firebase/admin.ts`**

```typescript
// Server-side Firebase admin init. ONLY import from server actions or
// route handlers — never from client components.
import 'server-only';
import {
  initializeApp,
  getApps,
  cert,
  type App as AdminApp,
} from 'firebase-admin/app';
import { getAuth, type Auth as AdminAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: AdminApp;
if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
} else {
  app = getApps()[0];
}

export const adminApp = app;
export const adminAuth: AdminAuth = getAuth(app);
export const adminDb: AdminFirestore = getFirestore(app);
export const adminBucket = getStorage(app).bucket();

/**
 * Verify a client-sent Firebase ID token and return the user's uid.
 * Throws if the token is invalid. Server actions call this as their
 * first line to authenticate the caller.
 */
export async function verifyIdToken(idToken: string): Promise<string> {
  const decoded = await adminAuth.verifyIdToken(idToken);
  return decoded.uid;
}
```

- [ ] **Step 3: Install `server-only` dev helper**

Run: `npm install server-only`

- [ ] **Step 4: Create `firebase.json` for emulators + rules**

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

- [ ] **Step 5: Update `.gitignore`**

Append:
```
# Firebase emulator data
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# Firebase service account (never commit)
serviceAccount*.json
```

- [ ] **Step 6: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors (the `!` non-null assertions are acceptable; env vars are validated at runtime when the client actually initializes).

- [ ] **Step 7: Commit**

```bash
git add src/lib/firebase/ firebase.json .gitignore package.json package-lock.json
git commit -m "feat: initialize Firebase client + admin SDKs and emulator config"
```

---

## Task 8: Firestore + Storage security rules

**Files:**
- Create: `firestore.rules`, `storage.rules`

- [ ] **Step 1: Create `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users can read/write their own user doc.
    // On create, role MUST be 'user' — only admins can set 'admin' via console.
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId)
        && request.resource.data.role == 'user';
      allow update: if isOwner(userId)
        && request.resource.data.role == resource.data.role; // cannot self-promote
      allow delete: if false;
    }

    // Tracks (admin library): any signed-in user can read; only admins write.
    match /tracks/{trackId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Quizzes:
    // - Read if template OR owner
    // - Create if ownerId == auth.uid AND (isTemplate == false OR caller is admin)
    // - Update if owner AND isTemplate flag not toggled (unless admin)
    // - Delete if owner
    match /quizzes/{quizId} {
      allow read: if resource.data.isTemplate == true || isOwner(resource.data.ownerId);
      allow create: if isSignedIn()
        && request.resource.data.ownerId == request.auth.uid
        && (request.resource.data.isTemplate == false || isAdmin());
      allow update: if isOwner(resource.data.ownerId)
        && (request.resource.data.isTemplate == resource.data.isTemplate || isAdmin())
        && request.resource.data.ownerId == resource.data.ownerId;
      allow delete: if isOwner(resource.data.ownerId);
    }

    // Attempts: only own.
    match /attempts/{attemptId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isSignedIn()
        && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }

    // Feedback: any signed-in user can create; only admins can read.
    match /feedback/{feedbackId} {
      allow create: if isSignedIn()
        && request.resource.data.userId == request.auth.uid;
      allow read: if isAdmin();
      allow update, delete: if isAdmin();
    }
  }
}
```

- [ ] **Step 2: Create `storage.rules`**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Track audio: read by any signed-in user; write only via admin SDK
    // (seed script / admin), so no client-side write rule needed.
    match /tracks/{file=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add firestore.rules storage.rules
git commit -m "feat: add Firestore and Storage security rules"
```

---

## Task 9: Security-rules tests via emulator (TDD)

**Files:**
- Create: `tests/rules/firestore.rules.test.ts`

- [ ] **Step 1: Write the rules tests**

```typescript
// tests/rules/firestore.rules.test.ts
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import fs from 'node:fs';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'muzikas-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

async function seedUser(uid: string, role: 'user' | 'admin') {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', uid), {
      email: `${uid}@example.com`,
      displayName: uid,
      role,
      createdAt: Date.now(),
    });
  });
}

describe('users collection', () => {
  it('allows a user to create their own doc with role=user', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      setDoc(doc(alice, 'users', 'alice'), {
        email: 'alice@example.com',
        displayName: 'Alice',
        role: 'user',
        createdAt: Date.now(),
      }),
    );
  });

  it('forbids a user from creating their doc with role=admin', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(alice, 'users', 'alice'), {
        email: 'alice@example.com',
        displayName: 'Alice',
        role: 'admin',
        createdAt: Date.now(),
      }),
    );
  });

  it('forbids reading another user doc', async () => {
    await seedUser('bob', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(alice, 'users', 'bob')));
  });

  it('forbids self-promotion to admin', async () => {
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(
      updateDoc(doc(alice, 'users', 'alice'), { role: 'admin' }),
    );
  });
});

describe('tracks collection', () => {
  it('allows signed-in users to read tracks', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tracks', 't1'), { title: 'Test' });
    });
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(alice, 'tracks', 't1')));
  });

  it('forbids non-admin users from writing tracks', async () => {
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(alice, 'tracks', 't1'), { title: 'Test' }));
  });

  it('allows admin users to write tracks', async () => {
    await seedUser('admin1', 'admin');
    const admin = env.authenticatedContext('admin1').firestore();
    await assertSucceeds(
      setDoc(doc(admin, 'tracks', 't1'), { title: 'Test', era: 0 }),
    );
  });
});

describe('quizzes collection', () => {
  it('allows a user to create a non-template quiz they own', async () => {
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      addDoc(collection(alice, 'quizzes'), {
        ownerId: 'alice',
        title: 'My Quiz',
        description: '',
        isTemplate: false,
        tracks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
  });

  it('forbids a regular user from creating a template quiz', async () => {
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(
      addDoc(collection(alice, 'quizzes'), {
        ownerId: 'alice',
        title: 'Template',
        description: '',
        isTemplate: true,
        tracks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
  });

  it('allows any signed-in user to read a template quiz', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'quizzes', 'tmpl1'), {
        ownerId: 'admin1',
        title: 'Template',
        isTemplate: true,
        tracks: [],
      });
    });
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(alice, 'quizzes', 'tmpl1')));
  });

  it('forbids reading another user\'s non-template quiz', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'quizzes', 'q1'), {
        ownerId: 'bob',
        title: 'Bob Quiz',
        isTemplate: false,
        tracks: [],
      });
    });
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(alice, 'quizzes', 'q1')));
  });
});

describe('attempts collection', () => {
  it('allows a user to create their own attempt', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      addDoc(collection(alice, 'attempts'), {
        userId: 'alice',
        quizId: 'q1',
        quizTitleSnapshot: 'Q',
        startedAt: Date.now(),
        finishedAt: Date.now(),
        totalQuestions: 0,
        correctCount: 0,
        partialCount: 0,
        wrongCount: 0,
        skippedCount: 0,
        totalScore: 0,
        results: [],
      }),
    );
  });

  it('forbids creating an attempt for another user', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(
      addDoc(collection(alice, 'attempts'), {
        userId: 'bob',
        quizId: 'q1',
        quizTitleSnapshot: 'Q',
        startedAt: Date.now(),
        finishedAt: Date.now(),
        totalQuestions: 0,
        correctCount: 0,
        partialCount: 0,
        wrongCount: 0,
        skippedCount: 0,
        totalScore: 0,
        results: [],
      }),
    );
  });
});

describe('feedback collection', () => {
  it('allows a signed-in user to create feedback', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      addDoc(collection(alice, 'feedback'), {
        userId: 'alice',
        userEmail: 'alice@example.com',
        message: 'Hi',
        createdAt: Date.now(),
        status: 'new',
      }),
    );
  });

  it('forbids regular users from reading feedback', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'feedback', 'f1'), {
        userId: 'bob',
        message: 'Test',
      });
    });
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(alice, 'feedback', 'f1')));
  });
});
```

- [ ] **Step 2: Start the Firestore emulator in another terminal**

Run (in a separate terminal, leave running):
```bash
npx firebase emulators:start --only firestore --project muzikas-test
```
Expected: emulator listening on 127.0.0.1:8080.

- [ ] **Step 3: Run the tests**

Run: `npm test -- tests/rules/firestore.rules.test.ts`
Expected: PASS (all ~15 tests green). If any fail, fix the corresponding rule in `firestore.rules` until all pass.

- [ ] **Step 4: Stop the emulator and commit**

```bash
git add tests/rules/firestore.rules.test.ts
git commit -m "test: add Firestore security rules tests

Covers user self-create, role escalation prevention, track admin-only
writes, quiz template visibility, attempt ownership, feedback creation
and admin-only reads."
```

---

## Task 10: Auth context + `useAuth` hook

**Files:**
- Create: `src/lib/auth/context.tsx`

- [ ] **Step 1: Create the auth provider**

```typescript
// src/lib/auth/context.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import type { UserDoc } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
  signUpEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureUserDoc(user: User): Promise<UserDoc> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserDoc;
  const data: UserDoc = {
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    role: 'user',
    createdAt: Date.now(),
  };
  await setDoc(ref, data);
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const d = await ensureUserDoc(u);
          setUserDoc(d);
        } catch (e) {
          console.error('Failed to load user doc', e);
          setUserDoc(null);
        }
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signUpEmail = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    await ensureUserDoc(cred.user);
  };

  const signInEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInGoogle = async () => {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    await ensureUserDoc(cred.user);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{ user, userDoc, loading, signUpEmail, signInEmail, signInGoogle, signOut, getIdToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/context.tsx
git commit -m "feat: add AuthProvider and useAuth hook"
```

---

## Task 11: `RequireAuth` wrapper component

**Files:**
- Create: `src/components/RequireAuth.tsx`

- [ ] **Step 1: Implement the component**

```typescript
// src/components/RequireAuth.tsx
'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { lv } from '@/lib/i18n/lv';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/ienākt');
    }
  }, [loading, user, router]);

  if (loading) return <p>{lv.common.loading}</p>;
  if (!user) return null;
  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RequireAuth.tsx
git commit -m "feat: add RequireAuth wrapper for gated pages"
```

---

## Task 12: Root layout + global styles (port theme)

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Port CSS variables from legacy `index.html` into `src/app/globals.css`**

Replace contents of `src/app/globals.css` with:

```css
:root {
  --bg: #0e0c0a;
  --surface: #161310;
  --card: #1e1a16;
  --border: #2e2820;
  --accent: #c8a96e;
  --accent2: #7eb8a4;
  --text: #e8ddd0;
  --muted: #7a6e62;
  --danger: #c47a6a;
  --success: #7eb8a4;
  --partial: #c8a96e;
  --radius: 4px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html { color-scheme: dark; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-dm-mono), ui-monospace, monospace;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

main { width: 100%; max-width: 700px; padding: 40px 20px; position: relative; z-index: 1; }

h1, h2, h3 { font-family: var(--font-playfair), serif; font-weight: 400; }
h1 { font-size: clamp(28px, 5vw, 44px); line-height: 1.2; }
h1 em { font-style: italic; color: var(--accent); }
h2 { font-size: clamp(22px, 4vw, 32px); margin-bottom: 16px; }

a { color: var(--accent); text-decoration: none; }
a:hover { color: #d4b87e; }

button {
  font-family: inherit;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 10px 20px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s;
}
button:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
button:disabled { opacity: 0.6; cursor: not-allowed; }
button.primary { background: var(--accent); color: var(--bg); border-color: var(--accent); }
button.primary:hover { background: #d4b87e; border-color: #d4b87e; color: var(--bg); }

input[type="text"], input[type="email"], input[type="password"], input[type="number"], textarea, select {
  width: 100%;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 12px 14px;
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 14px;
}
input:focus, textarea:focus, select:focus { outline: none; border-color: var(--accent); }

label { display: block; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }

.card { background: var(--card); border: 1px solid var(--border); padding: 24px; border-radius: var(--radius); }
.muted { color: var(--muted); font-size: 12px; }
.stack > * + * { margin-top: 16px; }
```

- [ ] **Step 2: Rewrite `src/app/layout.tsx`**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Playfair_Display, DM_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/context';
import Header from '@/components/Header';
import { lv } from '@/lib/i18n/lv';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
});
const dmMono = DM_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
});

export const metadata: Metadata = {
  title: `${lv.app.name} — ${lv.app.tagline}`,
  description: lv.landing.about,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lv" className={`${playfair.variable} ${dmMono.variable}`}>
      <body>
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create `src/components/Header.tsx`**

```typescript
// src/components/Header.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { lv } from '@/lib/i18n/lv';
import styles from './Header.module.css';

export default function Header() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        {lv.app.name}
      </Link>
      <nav className={styles.nav}>
        {!loading && user && (
          <>
            <Link href="/profils">{lv.nav.profile}</Link>
            <Link href="/quiz">{lv.nav.quizzes}</Link>
            <Link href="/bibliotēka">{lv.nav.library}</Link>
            <Link href="/atsauksmes">{lv.nav.feedback}</Link>
            <button type="button" onClick={() => signOut()}>{lv.nav.logout}</button>
          </>
        )}
        {!loading && !user && (
          <>
            <Link href="/ienākt">{lv.nav.login}</Link>
            <Link href="/reģistrēties">{lv.nav.register}</Link>
          </>
        )}
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Create `src/components/Header.module.css`**

```css
.header {
  width: 100%;
  max-width: 700px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
  border-bottom: 1px solid var(--border);
}
.brand {
  font-family: var(--font-playfair), serif;
  font-size: 18px;
  color: var(--text);
}
.nav {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 12px;
}
.nav button {
  padding: 6px 12px;
  font-size: 12px;
}
```

- [ ] **Step 5: Delete the scaffold's default `src/app/page.tsx` contents** (will be replaced in next task) and leave a placeholder:

```typescript
// src/app/page.tsx
import { lv } from '@/lib/i18n/lv';

export default function HomePage() {
  return <h1>{lv.landing.heroTitle}</h1>;
}
```

- [ ] **Step 6: Verify dev server renders**

Run: `npm run dev` (visit http://localhost:3000), verify:
- Page loads with dark background, cream text
- Header shows "Mūzikas literatūra" brand, "Ienākt" and "Reģistrēties" links
- H1 displays in Playfair Display serif

Stop with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/app/page.tsx src/components/Header.tsx src/components/Header.module.css
git commit -m "feat: port legacy theme, add root layout with Latvian fonts and header"
```

---

## Task 13: Registration page

**Files:**
- Create: `src/app/reģistrēties/page.tsx`

- [ ] **Step 1: Implement the page**

```typescript
// src/app/reģistrēties/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { lv } from '@/lib/i18n/lv';

export default function RegisterPage() {
  const { signUpEmail, signInGoogle, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    router.replace('/profils');
    return null;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signUpEmail(email, password, displayName);
      router.replace('/profils');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setError(
        code === 'auth/email-already-in-use'
          ? lv.auth.errorEmailInUse
          : lv.auth.errorGeneric,
      );
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInGoogle();
      router.replace('/profils');
    } catch {
      setError(lv.auth.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card stack">
      <h1>{lv.nav.register}</h1>
      <form onSubmit={onSubmit} className="stack">
        <div>
          <label htmlFor="name">{lv.auth.displayName}</label>
          <input id="name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="email">{lv.auth.email}</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">{lv.auth.password}</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
        <button type="submit" className="primary" disabled={busy}>
          {lv.auth.signUp}
        </button>
      </form>
      <p style={{ textAlign: 'center' }} className="muted">{lv.auth.or}</p>
      <button type="button" onClick={onGoogle} disabled={busy}>
        {lv.auth.signUpWithGoogle}
      </button>
      <p className="muted" style={{ textAlign: 'center' }}>
        {lv.auth.alreadyHaveAccount} <Link href="/ienākt">{lv.nav.login}</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/reģistrēties/
git commit -m "feat: add registration page with email and Google sign-up"
```

---

## Task 14: Login page

**Files:**
- Create: `src/app/ienākt/page.tsx`

- [ ] **Step 1: Implement the page**

```typescript
// src/app/ienākt/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { lv } from '@/lib/i18n/lv';

export default function LoginPage() {
  const { signInEmail, signInGoogle, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    router.replace('/profils');
    return null;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInEmail(email, password);
      router.replace('/profils');
    } catch {
      setError(lv.auth.errorInvalidCredentials);
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInGoogle();
      router.replace('/profils');
    } catch {
      setError(lv.auth.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card stack">
      <h1>{lv.nav.login}</h1>
      <form onSubmit={onSubmit} className="stack">
        <div>
          <label htmlFor="email">{lv.auth.email}</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">{lv.auth.password}</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
        <button type="submit" className="primary" disabled={busy}>
          {lv.auth.signIn}
        </button>
      </form>
      <p style={{ textAlign: 'center' }} className="muted">{lv.auth.or}</p>
      <button type="button" onClick={onGoogle} disabled={busy}>
        {lv.auth.signInWithGoogle}
      </button>
      <p className="muted" style={{ textAlign: 'center' }}>
        {lv.auth.noAccount} <Link href="/reģistrēties">{lv.nav.register}</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/ienākt/
git commit -m "feat: add login page with email and Google sign-in"
```

---

## Task 15: Demo tracks data + 3 demo MP3s

**Files:**
- Create: `src/lib/demo-tracks.ts`
- Create: `public/audio/demo1.mp3`, `public/audio/demo2.mp3`, `public/audio/demo3.mp3`

Three specific tracks were selected from the legacy data by this plan's author (confirmed present in `legacy/audio/`): one Baroque, one Classical, one Romantic. Their titles come verbatim from `legacy/index.html` so `autoGrade` will match what a user types against the same strings shown on screen.

- [ ] **Step 1: Copy the three MP3 files to `public/audio/`**

Run:
```bash
mkdir -p public/audio
cp legacy/audio/BBeXF_lnj_M.mp3 public/audio/demo1.mp3
cp legacy/audio/_JAPx7_ra_A.mp3 public/audio/demo2.mp3
cp legacy/audio/zBAVutlfGOg.mp3 public/audio/demo3.mp3
```

- [ ] **Step 2: Create `src/lib/demo-tracks.ts`**

```typescript
// src/lib/demo-tracks.ts
// Three hardcoded tracks for the public landing-page demo. Deliberately
// NOT sourced from Firestore — keeps the demo fast and robust.
import type { QuizTrack } from './types';

export const DEMO_TRACKS: QuizTrack[] = [
  {
    source: 'library',
    title: 'J.S. Bahs — Sv. Mateja pasija: II d. alta ārija (Erbarme Dich)',
    era: 0,
    audioPath: '/audio/demo1.mp3',
    correctAnswer: 'J.S. Bahs — Sv. Mateja pasija: II d. alta ārija (Erbarme Dich)',
  },
  {
    source: 'library',
    title: 'V.A. Mocarts — 40. simfonija: III d. menueta tēma',
    era: 1,
    audioPath: '/audio/demo2.mp3',
    correctAnswer: 'V.A. Mocarts — 40. simfonija: III d. menueta tēma',
  },
  {
    source: 'library',
    title: 'F. Šūberts — dz. cikls Skaistā dzirnavniece: Ceļošana (nr. 1)',
    era: 2,
    audioPath: '/audio/demo3.mp3',
    correctAnswer: 'F. Šūberts — dz. cikls Skaistā dzirnavniece: Ceļošana (nr. 1)',
  },
];
```

- [ ] **Step 3: Verify each demo MP3 is reachable**

Run `npm run dev`, then visit in the browser:
- `http://localhost:3000/audio/demo1.mp3`
- `http://localhost:3000/audio/demo2.mp3`
- `http://localhost:3000/audio/demo3.mp3`

Each should download/play. Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/lib/demo-tracks.ts public/audio/
git commit -m "feat: add three hardcoded demo tracks for public landing page"
```

---

## Task 16: DemoQuiz component + landing page

**Files:**
- Create: `src/components/quiz/DemoQuiz.tsx`
- Create: `src/components/quiz/DemoQuiz.module.css`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/components/quiz/DemoQuiz.tsx`**

```typescript
// src/components/quiz/DemoQuiz.tsx
'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { DEMO_TRACKS } from '@/lib/demo-tracks';
import { autoGrade } from '@/lib/grading';
import { summarizeResults } from '@/lib/scoring';
import type { AttemptResult, AttemptVerdict } from '@/lib/types';
import { lv } from '@/lib/i18n/lv';
import { verdictToScore } from '@/lib/grading';
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
        <Link href="/reģistrēties">
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
```

- [ ] **Step 2: Create `src/components/quiz/DemoQuiz.module.css`**

```css
.resultList {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.resultList li {
  padding: 12px 16px;
  background: var(--surface);
  border-left: 3px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
}
.correct { border-left-color: var(--success) !important; }
.partial { border-left-color: var(--partial) !important; }
.wrong   { border-left-color: var(--danger) !important; }
.skipped { border-left-color: var(--muted) !important; }
```

- [ ] **Step 3: Replace `src/app/page.tsx`** with full landing page

```typescript
// src/app/page.tsx
import Link from 'next/link';
import DemoQuiz from '@/components/quiz/DemoQuiz';
import { lv } from '@/lib/i18n/lv';

export default function HomePage() {
  return (
    <div className="stack" style={{ gap: 48 }}>
      <section style={{ textAlign: 'center' }} className="stack">
        <h1>
          <em>{lv.landing.heroTitle}</em>
        </h1>
        <p className="muted">{lv.landing.heroSubtitle}</p>
      </section>

      <section className="card">
        <p>{lv.landing.about}</p>
      </section>

      <DemoQuiz />

      <section style={{ textAlign: 'center' }}>
        <Link href="/reģistrēties">
          <button type="button" className="primary">{lv.landing.ctaRegister}</button>
        </Link>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Verify the demo works end-to-end in the browser**

Run: `npm run dev`, visit http://localhost:3000, click "Sākt", play through all 3 tracks, verify results screen shows correct/wrong verdicts correctly.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/quiz/DemoQuiz.tsx src/components/quiz/DemoQuiz.module.css
git commit -m "feat: add public landing page with inline 3-track demo"
```

---

## Task 17: Quiz server actions — CRUD + clone

**Files:**
- Create: `src/server/quizzes.ts`

- [ ] **Step 1: Create the server action module**

```typescript
// src/server/quizzes.ts
'use server';

import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import type { QuizDoc, QuizTrack } from '@/lib/types';

interface AuthedArgs {
  idToken: string;
}

export async function createQuiz(
  args: AuthedArgs & { title: string; description: string; tracks: QuizTrack[] },
): Promise<{ id: string }> {
  const uid = await verifyIdToken(args.idToken);
  const ref = await adminDb.collection('quizzes').add({
    ownerId: uid,
    title: args.title,
    description: args.description,
    isTemplate: false,
    tracks: args.tracks,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } satisfies QuizDoc);
  return { id: ref.id };
}

export async function updateQuiz(
  args: AuthedArgs & {
    id: string;
    title: string;
    description: string;
    tracks: QuizTrack[];
  },
): Promise<void> {
  const uid = await verifyIdToken(args.idToken);
  const ref = adminDb.collection('quizzes').doc(args.id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Quiz not found');
  if (snap.data()!.ownerId !== uid) throw new Error('Not owner');
  await ref.update({
    title: args.title,
    description: args.description,
    tracks: args.tracks,
    updatedAt: Date.now(),
  });
}

export async function deleteQuiz(args: AuthedArgs & { id: string }): Promise<void> {
  const uid = await verifyIdToken(args.idToken);
  const ref = adminDb.collection('quizzes').doc(args.id);
  const snap = await ref.get();
  if (!snap.exists) return;
  if (snap.data()!.ownerId !== uid) throw new Error('Not owner');
  await ref.delete();
}

export async function cloneTemplate(
  args: AuthedArgs & { templateId: string; newTitle?: string },
): Promise<{ id: string }> {
  const uid = await verifyIdToken(args.idToken);
  const tmplSnap = await adminDb.collection('quizzes').doc(args.templateId).get();
  if (!tmplSnap.exists) throw new Error('Template not found');
  const tmpl = tmplSnap.data() as QuizDoc;
  if (!tmpl.isTemplate) throw new Error('Not a template');
  const ref = await adminDb.collection('quizzes').add({
    ownerId: uid,
    title: args.newTitle ?? tmpl.title,
    description: tmpl.description,
    isTemplate: false,
    tracks: tmpl.tracks,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } satisfies QuizDoc);
  return { id: ref.id };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/server/quizzes.ts
git commit -m "feat: add quiz server actions (create, update, delete, cloneTemplate)"
```

---

## Task 18: Attempt + track server actions (save attempt, signed URL)

**Files:**
- Create: `src/server/attempts.ts`, `src/server/tracks.ts`

- [ ] **Step 1: Create `src/server/attempts.ts`**

```typescript
// src/server/attempts.ts
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
```

- [ ] **Step 2: Create `src/server/tracks.ts`**

```typescript
// src/server/tracks.ts
'use server';

import { adminBucket, verifyIdToken } from '@/lib/firebase/admin';

/**
 * Return a short-lived signed URL for an audio file in Firebase Storage.
 * The caller must be signed in; the URL is valid for 1 hour.
 */
export async function getSignedAudioUrl(args: {
  idToken: string;
  audioPath: string;
}): Promise<{ url: string }> {
  await verifyIdToken(args.idToken);
  const [url] = await adminBucket.file(args.audioPath).getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000,
  });
  return { url };
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/server/attempts.ts src/server/tracks.ts
git commit -m "feat: add server actions for saving attempts and signed audio URLs"
```

---

## Task 19: Client-side Firestore query helpers

**Files:**
- Create: `src/lib/queries.ts`

**Purpose:** Shared browser-side Firestore reads. Reads go through the client SDK (not server actions) because rules already enforce access control and client reads are faster and cheaper.

- [ ] **Step 1: Create the module**

```typescript
// src/lib/queries.ts
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase/client';
import type { QuizDoc, TrackDoc, AttemptDoc } from './types';

export interface WithId<T> { id: string; data: T; }

export async function listMyQuizzes(uid: string): Promise<WithId<QuizDoc>[]> {
  const q = query(
    collection(db, 'quizzes'),
    where('ownerId', '==', uid),
    where('isTemplate', '==', false),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as QuizDoc }));
}

export async function listTemplates(): Promise<WithId<QuizDoc>[]> {
  const q = query(
    collection(db, 'quizzes'),
    where('isTemplate', '==', true),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as QuizDoc }));
}

export async function getQuiz(id: string): Promise<WithId<QuizDoc> | null> {
  const snap = await getDoc(doc(db, 'quizzes', id));
  if (!snap.exists()) return null;
  return { id: snap.id, data: snap.data() as QuizDoc };
}

export async function listTracks(): Promise<WithId<TrackDoc>[]> {
  const q = query(collection(db, 'tracks'), orderBy('era'), orderBy('title'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as TrackDoc }));
}

export async function listMyAttempts(uid: string, max = 50): Promise<WithId<AttemptDoc>[]> {
  const q = query(
    collection(db, 'attempts'),
    where('userId', '==', uid),
    orderBy('finishedAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as AttemptDoc }));
}

export async function getAttempt(id: string): Promise<WithId<AttemptDoc> | null> {
  const snap = await getDoc(doc(db, 'attempts', id));
  if (!snap.exists()) return null;
  return { id: snap.id, data: snap.data() as AttemptDoc };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/queries.ts
git commit -m "feat: add client-side Firestore query helpers"
```

---

## Task 20: `/bibliotēka` page — browse admin track library

**Files:**
- Create: `src/app/bibliotēka/page.tsx`

- [ ] **Step 1: Implement the page**

```typescript
// src/app/bibliotēka/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { listTracks, type WithId } from '@/lib/queries';
import type { TrackDoc } from '@/lib/types';
import { ERAS, eraName } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';

export default function LibraryPage() {
  return (
    <RequireAuth>
      <LibraryInner />
    </RequireAuth>
  );
}

function LibraryInner() {
  const [tracks, setTracks] = useState<WithId<TrackDoc>[] | null>(null);
  const [search, setSearch] = useState('');
  const [eraFilter, setEraFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    listTracks().then(setTracks).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    if (!tracks) return [];
    return tracks.filter((t) => {
      if (eraFilter !== 'all' && t.data.era !== eraFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.data.title.toLowerCase().includes(q) &&
          !(t.data.composer ?? '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [tracks, search, eraFilter]);

  if (!tracks) return <p>{lv.common.loading}</p>;

  return (
    <div className="stack">
      <h1>{lv.library.title}</h1>
      <p className="muted">{lv.library.totalTracks(tracks.length)}</p>
      <input
        type="text"
        placeholder={lv.library.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={eraFilter} onChange={(e) => setEraFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
        <option value="all">{lv.quiz.allEras}</option>
        {ERAS.map((era) => (
          <option key={era.id} value={era.id}>{era.name}</option>
        ))}
      </select>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((t) => (
          <li key={t.id} className="card">
            <div style={{ fontSize: 14 }}>{t.data.title}</div>
            <div className="muted">{eraName(t.data.era)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/bibliotēka/
git commit -m "feat: add /bibliotēka page with search and era filter"
```

---

## Task 21: `/quiz` list page — my quizzes + templates tabs

**Files:**
- Create: `src/app/quiz/page.tsx`, `src/app/quiz/page.module.css`

- [ ] **Step 1: Implement the page**

```typescript
// src/app/quiz/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { listMyQuizzes, listTemplates, type WithId } from '@/lib/queries';
import { useAuth } from '@/lib/auth/context';
import { cloneTemplate } from '@/server/quizzes';
import type { QuizDoc } from '@/lib/types';
import { lv } from '@/lib/i18n/lv';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function QuizListPage() {
  return (
    <RequireAuth>
      <QuizListInner />
    </RequireAuth>
  );
}

function QuizListInner() {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'mine' | 'templates'>('mine');
  const [mine, setMine] = useState<WithId<QuizDoc>[] | null>(null);
  const [templates, setTemplates] = useState<WithId<QuizDoc>[] | null>(null);

  useEffect(() => {
    if (!user) return;
    listMyQuizzes(user.uid).then(setMine).catch(console.error);
    listTemplates().then(setTemplates).catch(console.error);
  }, [user]);

  const onClone = async (templateId: string) => {
    const token = await getIdToken();
    if (!token) return;
    const { id } = await cloneTemplate({ idToken: token, templateId });
    router.push(`/quiz/${id}`);
  };

  return (
    <div className="stack">
      <h1>Quiz</h1>
      <div className={styles.tabs}>
        <button type="button" className={tab === 'mine' ? 'primary' : ''} onClick={() => setTab('mine')}>
          {lv.quiz.mine}
        </button>
        <button type="button" className={tab === 'templates' ? 'primary' : ''} onClick={() => setTab('templates')}>
          {lv.quiz.templates}
        </button>
      </div>

      {tab === 'mine' && (
        <div className="stack">
          <Link href="/quiz/jauns">
            <button type="button" className="primary" style={{ width: '100%' }}>{lv.quiz.createNew}</button>
          </Link>
          {mine === null && <p>{lv.common.loading}</p>}
          {mine && mine.length === 0 && <p className="muted">{lv.quiz.emptyState}</p>}
          {mine && mine.map((q) => (
            <Link key={q.id} href={`/quiz/${q.id}`} className="card" style={{ display: 'block' }}>
              <div>{q.data.title}</div>
              <div className="muted">{q.data.tracks.length} skaņdarbi</div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'templates' && (
        <div className="stack">
          {templates === null && <p>{lv.common.loading}</p>}
          {templates && templates.length === 0 && <p className="muted">Nav pieejamu sagatavju.</p>}
          {templates && templates.map((q) => (
            <div key={q.id} className="card stack">
              <div>{q.data.title}</div>
              <div className="muted">{q.data.tracks.length} skaņdarbi</div>
              <p className="muted">{q.data.description}</p>
              <button type="button" className="primary" onClick={() => onClone(q.id)}>
                {lv.quiz.clone}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/quiz/page.module.css`**

```css
.tabs {
  display: flex;
  gap: 8px;
}
.tabs button {
  flex: 1;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/quiz/page.tsx src/app/quiz/page.module.css
git commit -m "feat: add /quiz list page with mine/templates tabs and clone"
```

---

## Task 22: `/quiz/jauns` create page

**Files:**
- Create: `src/app/quiz/jauns/page.tsx`

- [ ] **Step 1: Implement the page**

```typescript
// src/app/quiz/jauns/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth/context';
import { createQuiz } from '@/server/quizzes';
import { lv } from '@/lib/i18n/lv';

export default function NewQuizPage() {
  return (
    <RequireAuth>
      <NewQuizInner />
    </RequireAuth>
  );
}

function NewQuizInner() {
  const { getIdToken } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('No token');
      const { id } = await createQuiz({ idToken: token, title, description, tracks: [] });
      router.push(`/quiz/${id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card stack">
      <h1>{lv.quiz.createNew}</h1>
      <div>
        <label htmlFor="title">{lv.quiz.title}</label>
        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="desc">{lv.quiz.description}</label>
        <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>
      <button type="submit" className="primary" disabled={busy}>
        {lv.quiz.createNew}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/quiz/jauns/
git commit -m "feat: add /quiz/jauns create-quiz page"
```

---

## Task 23: TrackPicker component (library + YouTube add form)

**Files:**
- Create: `src/components/quiz/TrackPicker.tsx`
- Create: `src/components/quiz/TrackPicker.module.css`

- [ ] **Step 1: Implement TrackPicker**

```typescript
// src/components/quiz/TrackPicker.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { listTracks, type WithId } from '@/lib/queries';
import type { TrackDoc, QuizTrack, EraId } from '@/lib/types';
import { ERAS, eraName } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';
import styles from './TrackPicker.module.css';

interface Props {
  onAdd: (track: QuizTrack) => void;
  onClose: () => void;
}

type Mode = 'library' | 'youtube';

export default function TrackPicker({ onAdd, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('library');

  return (
    <div className={styles.overlay} role="dialog">
      <div className={styles.modal + ' stack'}>
        <div className={styles.tabs}>
          <button type="button" className={mode === 'library' ? 'primary' : ''} onClick={() => setMode('library')}>
            {lv.quiz.addFromLibrary}
          </button>
          <button type="button" className={mode === 'youtube' ? 'primary' : ''} onClick={() => setMode('youtube')}>
            {lv.quiz.addYouTube}
          </button>
        </div>
        {mode === 'library' ? <LibraryPicker onAdd={onAdd} /> : <YouTubeForm onAdd={onAdd} />}
        <button type="button" onClick={onClose}>{lv.common.cancel}</button>
      </div>
    </div>
  );
}

function LibraryPicker({ onAdd }: { onAdd: (t: QuizTrack) => void }) {
  const [tracks, setTracks] = useState<WithId<TrackDoc>[] | null>(null);
  const [search, setSearch] = useState('');
  const [eraFilter, setEraFilter] = useState<number | 'all'>('all');

  useEffect(() => { listTracks().then(setTracks).catch(console.error); }, []);

  const filtered = useMemo(() => {
    if (!tracks) return [];
    return tracks.filter((t) => {
      if (eraFilter !== 'all' && t.data.era !== eraFilter) return false;
      if (search && !t.data.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tracks, search, eraFilter]);

  const add = (wid: WithId<TrackDoc>) => {
    const qt: QuizTrack = {
      source: 'library',
      trackId: wid.id,
      title: wid.data.title,
      composer: wid.data.composer,
      era: wid.data.era,
      audioPath: wid.data.audioPath,
      ytId: wid.data.ytId ?? undefined,
      ytStart: wid.data.ytStart,
      correctAnswer: wid.data.correctAnswer,
    };
    onAdd(qt);
  };

  if (!tracks) return <p>{lv.common.loading}</p>;

  return (
    <div className="stack">
      <input type="text" placeholder={lv.library.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
      <select value={eraFilter} onChange={(e) => setEraFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
        <option value="all">{lv.quiz.allEras}</option>
        {ERAS.map((era) => <option key={era.id} value={era.id}>{era.name}</option>)}
      </select>
      <ul className={styles.list}>
        {filtered.map((t) => (
          <li key={t.id}>
            <div>
              <div>{t.data.title}</div>
              <div className="muted">{eraName(t.data.era)}</div>
            </div>
            <button type="button" onClick={() => add(t)}>+</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function extractYouTubeId(urlOrId: string): string | null {
  if (/^[A-Za-z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const m = urlOrId.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function YouTubeForm({ onAdd }: { onAdd: (t: QuizTrack) => void }) {
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [era, setEra] = useState<EraId>(0);
  const [url, setUrl] = useState('');
  const [start, setStart] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYouTubeId(url);
    if (!ytId) { setError('Nederīgs YouTube URL'); return; }
    onAdd({
      source: 'youtube',
      title,
      composer: composer || undefined,
      era,
      ytId,
      ytStart: start,
      correctAnswer: correctAnswer || title,
    });
  };

  return (
    <form onSubmit={submit} className="stack">
      <div><label htmlFor="yt-title">{lv.quiz.title}</label><input id="yt-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
      <div><label htmlFor="yt-comp">Komponists</label><input id="yt-comp" value={composer} onChange={(e) => setComposer(e.target.value)} /></div>
      <div><label htmlFor="yt-era">Laikmets</label>
        <select id="yt-era" value={era} onChange={(e) => setEra(Number(e.target.value) as EraId)}>
          {ERAS.map((er) => <option key={er.id} value={er.id}>{er.name}</option>)}
        </select>
      </div>
      <div><label htmlFor="yt-url">YouTube URL</label><input id="yt-url" value={url} onChange={(e) => setUrl(e.target.value)} required /></div>
      <div><label htmlFor="yt-start">Sākuma sekunde</label><input id="yt-start" type="number" min={0} value={start} onChange={(e) => setStart(Number(e.target.value))} /></div>
      <div><label htmlFor="yt-ans">Pareizā atbilde</label><input id="yt-ans" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Ja tukšs — izmantos nosaukumu" /></div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
      <button type="submit" className="primary">Pievienot</button>
    </form>
  );
}
```

- [ ] **Step 2: Create `src/components/quiz/TrackPicker.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}
.tabs { display: flex; gap: 8px; }
.tabs button { flex: 1; font-size: 11px; }
.list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 40vh;
  overflow-y: auto;
}
.list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--surface);
  border-radius: var(--radius);
  font-size: 12px;
}
.list button { padding: 4px 12px; }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/quiz/TrackPicker.tsx src/components/quiz/TrackPicker.module.css
git commit -m "feat: add TrackPicker with library search and YouTube add form"
```

---

## Task 24: `/quiz/[id]` edit page

**Files:**
- Create: `src/app/quiz/[id]/page.tsx`

- [ ] **Step 1: Implement the page**

```typescript
// src/app/quiz/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import TrackPicker from '@/components/quiz/TrackPicker';
import { useAuth } from '@/lib/auth/context';
import { getQuiz, type WithId } from '@/lib/queries';
import { updateQuiz, deleteQuiz } from '@/server/quizzes';
import type { QuizDoc, QuizTrack } from '@/lib/types';
import { eraName } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';

export default function EditQuizPage() {
  return (
    <RequireAuth>
      <EditQuizInner />
    </RequireAuth>
  );
}

function EditQuizInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, getIdToken } = useAuth();

  const [quiz, setQuiz] = useState<WithId<QuizDoc> | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tracks, setTracks] = useState<QuizTrack[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!params.id) return;
    getQuiz(params.id).then((q) => {
      if (!q) { router.replace('/quiz'); return; }
      if (user && q.data.ownerId !== user.uid) { router.replace('/quiz'); return; }
      setQuiz(q);
      setTitle(q.data.title);
      setDescription(q.data.description);
      setTracks(q.data.tracks);
    });
  }, [params.id, user, router]);

  if (!quiz) return <p>{lv.common.loading}</p>;

  const onSave = async () => {
    setSaving(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('No token');
      await updateQuiz({ idToken: token, id: quiz.id, title, description, tracks });
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(lv.quiz.confirmDelete)) return;
    const token = await getIdToken();
    if (!token) return;
    await deleteQuiz({ idToken: token, id: quiz.id });
    router.replace('/quiz');
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = tracks.slice();
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setTracks(next);
  };
  const moveDown = (i: number) => {
    if (i === tracks.length - 1) return;
    const next = tracks.slice();
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setTracks(next);
  };
  const remove = (i: number) => setTracks(tracks.filter((_, idx) => idx !== i));
  const addTrack = (t: QuizTrack) => { setTracks([...tracks, t]); setPickerOpen(false); };

  return (
    <div className="stack">
      <h1>{lv.quiz.edit}</h1>
      <div className="card stack">
        <div>
          <label htmlFor="title">{lv.quiz.title}</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="desc">{lv.quiz.description}</label>
          <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
      </div>

      <div className="card stack">
        <h2>{lv.quiz.tracks} ({tracks.length})</h2>
        {tracks.length === 0 && <p className="muted">{lv.quiz.noTracksYet}</p>}
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tracks.map((t, i) => (
            <li key={i} style={{ background: 'var(--surface)', padding: 10, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13 }}>{t.title}</div>
                <div className="muted">{eraName(t.era)} · {t.source === 'library' ? 'Bibliotēka' : 'YouTube'}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" onClick={() => moveUp(i)} disabled={i === 0}>↑</button>
                <button type="button" onClick={() => moveDown(i)} disabled={i === tracks.length - 1}>↓</button>
                <button type="button" onClick={() => remove(i)}>✕</button>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setPickerOpen(true)}>+ {lv.quiz.addFromLibrary} / {lv.quiz.addYouTube}</button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="primary" onClick={onSave} disabled={saving} style={{ flex: 1 }}>
          {saving ? lv.common.loading : lv.quiz.save}
        </button>
        <Link href={`/quiz/${quiz.id}/spēlēt`} style={{ flex: 1 }}>
          <button type="button" style={{ width: '100%' }}>{lv.quiz.play}</button>
        </Link>
      </div>
      {savedAt && <p className="muted">{lv.quiz.saved}</p>}
      <button type="button" onClick={onDelete} style={{ color: 'var(--danger)' }}>{lv.quiz.delete}</button>

      {pickerOpen && <TrackPicker onAdd={addTrack} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/quiz/\[id\]/page.tsx
git commit -m "feat: add /quiz/[id] edit page with track picker, reorder, save, delete"
```

---

## Task 25: Quiz play — setup + player + review + results

**Files:**
- Create: `src/components/quiz/QuizSetup.tsx`
- Create: `src/components/quiz/QuizPlayer.tsx`
- Create: `src/components/quiz/ReviewScreen.tsx`
- Create: `src/components/quiz/ResultsScreen.tsx`
- Create: `src/app/quiz/[id]/spēlēt/page.tsx`

This task is large — split into steps carefully.

- [ ] **Step 1: Create `src/components/quiz/QuizSetup.tsx`**

```typescript
// src/components/quiz/QuizSetup.tsx
'use client';

import { useState } from 'react';
import type { QuizTrack, EraId } from '@/lib/types';
import { ERAS } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';

interface Props {
  tracks: QuizTrack[];
  onStart: (count: number, eras: EraId[]) => void;
}

const COUNT_OPTIONS = [5, 10, 20, 50];

export default function QuizSetup({ tracks, onStart }: Props) {
  const availableEras = Array.from(new Set(tracks.map((t) => t.era))) as EraId[];
  const [count, setCount] = useState(10);
  const [selectedEras, setSelectedEras] = useState<EraId[]>(availableEras);

  const toggleEra = (id: EraId) => {
    setSelectedEras((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  };

  const maxCount = tracks.filter((t) => selectedEras.includes(t.era)).length;

  return (
    <div className="card stack">
      <h2>{lv.quiz.questionCount}</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {COUNT_OPTIONS.filter((c) => c <= maxCount || c === COUNT_OPTIONS[0]).map((c) => (
          <button key={c} type="button" className={count === c ? 'primary' : ''} onClick={() => setCount(c)}>
            {c}
          </button>
        ))}
      </div>

      <h2>{lv.quiz.filterByEra}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {ERAS.filter((e) => availableEras.includes(e.id as EraId)).map((e) => (
          <button
            key={e.id}
            type="button"
            className={selectedEras.includes(e.id as EraId) ? 'primary' : ''}
            onClick={() => toggleEra(e.id as EraId)}
            style={{ fontSize: 11, textAlign: 'left' }}
          >
            {e.name}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="primary"
        disabled={selectedEras.length === 0 || maxCount === 0}
        onClick={() => onStart(Math.min(count, maxCount), selectedEras)}
      >
        {lv.quiz.start}
      </button>
      <p className="muted">Pieejami {maxCount} skaņdarbi no izvēlētajiem laikmetiem.</p>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/quiz/QuizPlayer.tsx`**

```typescript
// src/components/quiz/QuizPlayer.tsx
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const audioRef = useRef<HTMLAudioElement>(null);

  const track = questions[idx];

  useEffect(() => {
    let cancelled = false;
    setAudioUrl(null);
    startedAtRef.current = Date.now();

    (async () => {
      if (track.source === 'library' && track.audioPath) {
        const token = await getIdToken();
        if (!token) return;
        const { url } = await getSignedAudioUrl({ idToken: token, audioPath: track.audioPath });
        if (!cancelled) setAudioUrl(url);
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
        <audio ref={audioRef} src={audioUrl} controls autoPlay preload="auto" />
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
```

- [ ] **Step 3: Create `src/components/quiz/ReviewScreen.tsx`**

```typescript
// src/components/quiz/ReviewScreen.tsx
'use client';

import { useState } from 'react';
import type { AttemptResult, AttemptVerdict } from '@/lib/types';
import { verdictToScore } from '@/lib/grading';
import { lv } from '@/lib/i18n/lv';

interface Props {
  initial: AttemptResult[];
  onFinalize: (final: AttemptResult[]) => void;
}

export default function ReviewScreen({ initial, onFinalize }: Props) {
  const [results, setResults] = useState<AttemptResult[]>(initial);

  const setVerdict = (i: number, v: AttemptVerdict) => {
    setResults((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, verdict: v, score: verdictToScore(v) } : r)),
    );
  };

  return (
    <div className="stack">
      <h1>{lv.review.title}</h1>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map((r, i) => (
          <li key={i} className="card stack">
            <div><strong>{lv.review.correctAnswer}:</strong> {r.quizTrack.title}</div>
            <div className="muted">{lv.review.yourAnswer}: {r.userAnswer || '—'}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" className={r.verdict === 'correct' ? 'primary' : ''} onClick={() => setVerdict(i, 'correct')}>✓ {lv.review.grade}</button>
              <button type="button" className={r.verdict === 'partial' ? 'primary' : ''} onClick={() => setVerdict(i, 'partial')}>½ {lv.review.gradePartial}</button>
              <button type="button" className={r.verdict === 'wrong' ? 'primary' : ''} onClick={() => setVerdict(i, 'wrong')}>✗ {lv.review.gradeWrong}</button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="primary" onClick={() => onFinalize(results)}>
        {lv.review.finish}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/quiz/ResultsScreen.tsx`**

```typescript
// src/components/quiz/ResultsScreen.tsx
'use client';

import Link from 'next/link';
import type { AttemptResult } from '@/lib/types';
import { summarizeResults } from '@/lib/scoring';
import { lv } from '@/lib/i18n/lv';

interface Props {
  results: AttemptResult[];
  onPlayAgain: () => void;
}

export default function ResultsScreen({ results, onPlayAgain }: Props) {
  const s = summarizeResults(results);
  const pct = s.totalQuestions > 0 ? Math.round((s.totalScore / s.totalQuestions) * 100) : 0;

  return (
    <div className="stack">
      <h1>{lv.results.title}</h1>
      <div className="card stack" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontFamily: 'var(--font-playfair), serif' }}>{pct}%</div>
        <div className="muted">
          {lv.results.correctCount(s.correctCount)} · {lv.results.partialCount(s.partialCount)} · {lv.results.wrongCount(s.wrongCount + s.skippedCount)}
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {results.map((r, i) => (
          <li key={i} className="card" style={{ borderLeft: `3px solid var(--${r.verdict === 'correct' ? 'success' : r.verdict === 'partial' ? 'partial' : 'danger'})` }}>
            <div style={{ fontSize: 13 }}>{r.quizTrack.title}</div>
            <div className="muted">{lv.review.yourAnswer}: {r.userAnswer || '—'}</div>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onPlayAgain} style={{ flex: 1 }}>{lv.results.playAgain}</button>
        <Link href="/profils" style={{ flex: 1 }}>
          <button type="button" style={{ width: '100%' }}>{lv.results.toProfile}</button>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/app/quiz/[id]/spēlēt/page.tsx`** (orchestrates setup → player → review → results → save)

```typescript
// src/app/quiz/[id]/spēlēt/page.tsx
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
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/quiz/QuizSetup.tsx src/components/quiz/QuizPlayer.tsx src/components/quiz/ReviewScreen.tsx src/components/quiz/ResultsScreen.tsx "src/app/quiz/[id]/spēlēt/"
git commit -m "feat: implement quiz play flow (setup → player → review → results)"
```

---

## Task 26: `/quiz/[id]/rezultāti/[attemptId]` attempt detail page

**Files:**
- Create: `src/app/quiz/[id]/rezultāti/[attemptId]/page.tsx`

- [ ] **Step 1: Implement the page**

```typescript
// src/app/quiz/[id]/rezultāti/[attemptId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import { getAttempt, type WithId } from '@/lib/queries';
import type { AttemptDoc } from '@/lib/types';
import { lv } from '@/lib/i18n/lv';

export default function AttemptDetailPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const params = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<WithId<AttemptDoc> | null>(null);

  useEffect(() => {
    if (params.attemptId) getAttempt(params.attemptId).then(setAttempt);
  }, [params.attemptId]);

  if (!attempt) return <p>{lv.common.loading}</p>;
  const a = attempt.data;
  const pct = a.totalQuestions ? Math.round((a.totalScore / a.totalQuestions) * 100) : 0;

  return (
    <div className="stack">
      <h1>{a.quizTitleSnapshot}</h1>
      <div className="card">
        <div style={{ fontSize: 36, fontFamily: 'var(--font-playfair), serif' }}>{pct}%</div>
        <div className="muted">
          {lv.results.correctCount(a.correctCount)} · {lv.results.partialCount(a.partialCount)} · {lv.results.wrongCount(a.wrongCount + a.skippedCount)}
        </div>
        <div className="muted">{new Date(a.finishedAt).toLocaleString('lv-LV')}</div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {a.results.map((r, i) => (
          <li key={i} className="card" style={{ borderLeft: `3px solid var(--${r.verdict === 'correct' ? 'success' : r.verdict === 'partial' ? 'partial' : 'danger'})` }}>
            <div style={{ fontSize: 13 }}>{r.quizTrack.title}</div>
            <div className="muted">{lv.review.yourAnswer}: {r.userAnswer || '—'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/quiz/[id]/rezultāti/"
git commit -m "feat: add attempt detail page"
```

---

## Task 27: `/profils` dashboard

**Files:**
- Create: `src/app/profils/page.tsx`

- [ ] **Step 1: Implement the page**

```typescript
// src/app/profils/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth/context';
import { listMyQuizzes, listMyAttempts, type WithId } from '@/lib/queries';
import type { QuizDoc, AttemptDoc } from '@/lib/types';
import { eraName } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const { user, userDoc } = useAuth();
  const [quizzes, setQuizzes] = useState<WithId<QuizDoc>[] | null>(null);
  const [attempts, setAttempts] = useState<WithId<AttemptDoc>[] | null>(null);

  useEffect(() => {
    if (!user) return;
    listMyQuizzes(user.uid).then(setQuizzes);
    listMyAttempts(user.uid).then(setAttempts);
  }, [user]);

  const stats = useMemo(() => {
    if (!attempts) return null;
    if (attempts.length === 0) {
      return { total: 0, avgPct: 0, topEra: null as string | null, perEra: new Map<number, { correct: number; total: number }>() };
    }
    let totalScore = 0, totalQ = 0;
    const eraCounts = new Map<number, number>();
    const perEra = new Map<number, { correct: number; total: number }>();
    for (const a of attempts) {
      totalScore += a.data.totalScore;
      totalQ += a.data.totalQuestions;
      for (const r of a.data.results) {
        const era = r.quizTrack.era;
        eraCounts.set(era, (eraCounts.get(era) ?? 0) + 1);
        const pe = perEra.get(era) ?? { correct: 0, total: 0 };
        pe.total++;
        if (r.verdict === 'correct') pe.correct++;
        else if (r.verdict === 'partial') pe.correct += 0.5;
        perEra.set(era, pe);
      }
    }
    const avgPct = totalQ ? Math.round((totalScore / totalQ) * 100) : 0;
    let topEraId: number | null = null, topCount = 0;
    for (const [era, count] of eraCounts) {
      if (count > topCount) { topCount = count; topEraId = era; }
    }
    return {
      total: attempts.length,
      avgPct,
      topEra: topEraId !== null ? eraName(topEraId) : null,
      perEra,
    };
  }, [attempts]);

  return (
    <div className="stack">
      <h1>{lv.profile.title}</h1>
      {userDoc && <p className="muted">{userDoc.displayName || userDoc.email}</p>}

      {stats && (
        <div className="card stack">
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-playfair), serif' }}>{stats.total}</div>
              <div className="muted">{lv.profile.totalAttempts}</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-playfair), serif' }}>{stats.avgPct}%</div>
              <div className="muted">{lv.profile.averageScore}</div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-playfair), serif' }}>{stats.topEra ?? '—'}</div>
              <div className="muted">{lv.profile.favouriteEra}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card stack">
        <h2>{lv.profile.myQuizzes}</h2>
        {quizzes === null && <p>{lv.common.loading}</p>}
        {quizzes && quizzes.length === 0 && <p className="muted">{lv.quiz.emptyState}</p>}
        {quizzes && quizzes.map((q) => (
          <Link key={q.id} href={`/quiz/${q.id}`} style={{ display: 'block', padding: 8, borderBottom: '1px solid var(--border)' }}>
            {q.data.title} <span className="muted">({q.data.tracks.length})</span>
          </Link>
        ))}
      </div>

      {stats && stats.perEra.size > 0 && (
        <div className="card stack">
          <h2>{lv.profile.perEraAccuracy}</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Array.from(stats.perEra.entries()).map(([era, data]) => (
              <li key={era} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span>{eraName(era)}</span>
                <span className="muted">{data.correct} / {data.total}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card stack">
        <h2>{lv.profile.attemptHistory}</h2>
        {attempts === null && <p>{lv.common.loading}</p>}
        {attempts && attempts.length === 0 && <p className="muted">{lv.profile.noAttemptsYet}</p>}
        {attempts && attempts.map((a) => {
          const pct = a.data.totalQuestions ? Math.round((a.data.totalScore / a.data.totalQuestions) * 100) : 0;
          return (
            <Link key={a.id} href={`/quiz/${a.data.quizId}/rezultāti/${a.id}`} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid var(--border)' }}>
              <span>{a.data.quizTitleSnapshot}</span>
              <span className="muted">{pct}% · {new Date(a.data.finishedAt).toLocaleDateString('lv-LV')}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/profils/
git commit -m "feat: add /profils dashboard with stats, quizzes, history, per-era accuracy"
```

---

## Task 28: Feedback server action (Firestore write + Resend email)

**Files:**
- Create: `src/server/feedback.ts`

- [ ] **Step 1: Implement**

```typescript
// src/server/feedback.ts
'use server';

import { Resend } from 'resend';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import type { FeedbackDoc } from '@/lib/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitFeedback(args: {
  idToken: string;
  userEmail: string;
  message: string;
}): Promise<{ id: string }> {
  const uid = await verifyIdToken(args.idToken);
  const trimmed = args.message.trim();
  if (trimmed.length === 0 || trimmed.length > 5000) {
    throw new Error('Message length out of range');
  }

  const doc: FeedbackDoc = {
    userId: uid,
    userEmail: args.userEmail,
    message: trimmed,
    createdAt: Date.now(),
    status: 'new',
  };
  const ref = await adminDb.collection('feedback').add(doc);

  // Best-effort email notification. Failure doesn't break submission.
  try {
    await resend.emails.send({
      from: 'feedback@muzikas-literatura.app',
      to: process.env.ADMIN_EMAIL!,
      subject: `Jauna atsauksme no ${args.userEmail}`,
      text: `${args.userEmail}\n\n${trimmed}\n\n—\nID: ${ref.id}`,
    });
  } catch (e) {
    console.error('Feedback email failed:', e);
  }

  return { id: ref.id };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/server/feedback.ts
git commit -m "feat: add feedback server action with Firestore write and Resend email"
```

---

## Task 29: `/atsauksmes` feedback page

**Files:**
- Create: `src/app/atsauksmes/page.tsx`

- [ ] **Step 1: Implement**

```typescript
// src/app/atsauksmes/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth/context';
import { submitFeedback } from '@/server/feedback';
import { lv } from '@/lib/i18n/lv';

export default function FeedbackPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const { user, getIdToken } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token || !user?.email) throw new Error('not ready');
      await submitFeedback({ idToken: token, userEmail: user.email, message });
      setDone(true);
      setMessage('');
    } catch {
      setError(lv.auth.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <h1>{lv.feedback.title}</h1>
      <p className="muted">{lv.feedback.intro}</p>
      {done ? (
        <p className="card">{lv.feedback.thanks}</p>
      ) : (
        <form onSubmit={onSubmit} className="card stack">
          <textarea
            placeholder={lv.feedback.placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={5000}
            required
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
          <button type="submit" className="primary" disabled={busy || !message.trim()}>
            {lv.feedback.submit}
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/atsauksmes/
git commit -m "feat: add /atsauksmes feedback page"
```

---

## Task 30: Firebase seed script

**Files:**
- Create: `scripts/seed-firebase.ts`
- Create: `scripts/tsconfig.seed.json`

- [ ] **Step 1: Create `scripts/tsconfig.seed.json`**

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "strict": true,
    "outDir": ".seed-build",
    "types": ["node"]
  },
  "include": ["seed-firebase.ts"]
}
```

- [ ] **Step 2: Install tsx for running**

Run: `npm install -D tsx dotenv`

- [ ] **Step 3: Create `scripts/seed-firebase.ts`**

```typescript
// scripts/seed-firebase.ts
// One-shot: upload legacy MP3s to Firebase Storage, create tracks/*
// Firestore docs, and create one template quiz containing all of them.
// Requires FIREBASE_ADMIN_* and NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const ADMIN_UID = process.env.SEED_ADMIN_UID;
if (!ADMIN_UID) {
  console.error('Set SEED_ADMIN_UID in .env.local to your Firebase user UID before running.');
  process.exit(1);
}

interface SeedTrack {
  era: number;
  eraName: string;
  title: string;
  correctAnswer: string;
  ytId: string;
  ytStart: number;
  audioFilename: string;
  audioExists: boolean;
}

const seed: SeedTrack[] = JSON.parse(fs.readFileSync('data/tracks-seed.json', 'utf8'));

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db = getFirestore();
const bucket = getStorage().bucket();

async function main() {
  console.log(`Seeding ${seed.length} tracks...`);
  const now = Date.now();
  const createdTrackIds: string[] = [];
  const templateTracks: Array<{
    source: 'library';
    trackId: string;
    title: string;
    era: number;
    audioPath: string;
    ytId: string | null;
    ytStart: number;
    correctAnswer: string;
  }> = [];

  for (const t of seed) {
    const audioPath = `tracks/${t.audioFilename}`;
    if (t.audioExists) {
      const localPath = path.join('legacy/audio', t.audioFilename);
      await bucket.upload(localPath, { destination: audioPath });
      console.log(`  uploaded ${audioPath}`);
    } else {
      console.warn(`  skipping upload for missing file: ${t.audioFilename}`);
    }

    const trackRef = await db.collection('tracks').add({
      title: t.title,
      era: t.era,
      audioPath,
      ytId: t.ytId || null,
      ytStart: t.ytStart,
      correctAnswer: t.correctAnswer,
      createdBy: ADMIN_UID,
      createdAt: now,
    });
    createdTrackIds.push(trackRef.id);

    templateTracks.push({
      source: 'library',
      trackId: trackRef.id,
      title: t.title,
      era: t.era,
      audioPath,
      ytId: t.ytId || null,
      ytStart: t.ytStart,
      correctAnswer: t.correctAnswer,
    });
  }

  console.log(`Created ${createdTrackIds.length} track docs.`);

  const quizRef = await db.collection('quizzes').add({
    ownerId: ADMIN_UID,
    title: 'JMV 12.kl. 25/26',
    description: 'Mūzikas literatūras eksāmena sagatavošana — Jāzepa Mediņa 12. klase, 2025/26 mācību gads.',
    isTemplate: true,
    tracks: templateTracks,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`Created template quiz: ${quizRef.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 4: Add seed script to package.json**

Add to `scripts`:
```json
"seed": "tsx scripts/seed-firebase.ts"
```

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-firebase.ts scripts/tsconfig.seed.json package.json package-lock.json
git commit -m "feat: add Firebase seed script for tracks and template quiz"
```

---

## Task 31: E2E happy-path test (Playwright)

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/happy-path.spec.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

- [ ] **Step 2: Create `tests/e2e/happy-path.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

// Smoke test: loads the landing page, plays through the 3-track demo,
// and verifies the results screen appears.
test('landing-page demo plays through to results', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.getByRole('button', { name: /Sākt/ }).first().click();

  for (let i = 0; i < 3; i++) {
    await page.getByLabel(/Pieraksti/).fill(`answer-${i}`);
    const btn = page.getByRole('button', { name: /Nākamais|Pabeigt/ });
    await btn.click();
  }

  await expect(page.getByText('Rezultāti')).toBeVisible();
});
```

> **Note:** a full happy-path that covers register → clone template → play → save requires a live Firebase test project or auth emulator integration, which is substantial setup. Phase 1 ships with this demo-path smoke test only; a full-stack E2E is marked as a follow-up in the spec's deferred section.

- [ ] **Step 3: Run the test**

Run: `npm run test:e2e`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/ package.json
git commit -m "test: add Playwright smoke test for landing-page demo flow"
```

---

## Task 32: README with setup + deploy instructions

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

```markdown
# Mūzikas literatūras treniņš

Next.js + Firebase SaaS for music literature training. Users build their own quizzes, listen to pieces, and track progress.

## Setup

1. `npm install`
2. Create a Firebase project at https://console.firebase.google.com — enable Authentication (Email/Password + Google), Firestore, and Storage.
3. Copy `.env.local.example` to `.env.local` and fill in all values:
   - `NEXT_PUBLIC_FIREBASE_*` from Firebase console → Project settings → Web app config
   - `FIREBASE_ADMIN_*` from Firebase console → Project settings → Service accounts → Generate new private key
   - `RESEND_API_KEY` from https://resend.com
   - `ADMIN_EMAIL` — address to receive feedback notifications
4. Deploy Firestore and Storage rules:
   ```
   npx firebase deploy --only firestore:rules,storage:rules
   ```
5. Start dev server: `npm run dev`

## Seeding legacy tracks

1. Register a user account in the app, then in Firebase console → Firestore → `users/{uid}` set `role: 'admin'`.
2. Copy that UID to `.env.local` as `SEED_ADMIN_UID`.
3. `npm run seed` — uploads legacy MP3s and creates the template quiz.

## Tests

- `npm test` — unit + rules tests (rules tests require emulator running)
- `npm run test:e2e` — Playwright smoke test

## Deploy to Vercel

1. Push the branch and import the repo in Vercel.
2. Add all `.env.local` variables as Vercel project environment variables (mark `FIREBASE_ADMIN_*` and `RESEND_API_KEY` as Sensitive).
3. Deploy.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup, seeding, test, and deploy instructions"
```

---

## Task 33: Final verification + merge prep

- [ ] **Step 1: Full lint + type-check + build + tests**

Run:
```bash
npm run lint && npx tsc --noEmit && npm run build && npm test
```
Expected: all pass. Fix any issues discovered inline.

- [ ] **Step 2: Manual smoke check in browser**

```bash
npm run dev
```
Verify:
1. `/` renders landing with demo quiz, demo plays through to results
2. `/reģistrēties` and `/ienākt` pages render
3. (With a real Firebase project configured) register a user, see it in Firestore, land on `/profils`
4. `/quiz`, `/quiz/jauns`, `/bibliotēka`, `/atsauksmes` all gated behind auth

- [ ] **Step 3: Push branch and open PR**

```bash
git push -u origin phase1-nextjs-saas
gh pr create --title "Phase 1: Next.js + Firebase SaaS migration" --body "Implements the approved Phase 1 design from docs/superpowers/specs/2026-04-05-muzikas-literatura-phase1-design.md"
```

- [ ] **Step 4: Tag Phase 1 as complete in the spec**

Append to the spec file:
```
## Phase 1 Status
Implemented on <date>. See branch `phase1-nextjs-saas` / PR #N.
```
Commit and push.

---

## Known gaps / explicit follow-ups for Phase 2

- **Admin UI** for uploading tracks, promoting quizzes to templates, and reading feedback — currently done via Firestore console and seed scripts.
- **Full-stack E2E test** covering register → clone template → play → save attempt (requires Firebase auth emulator wiring).
- **Signed audio URL caching** on the client — currently re-requested per track per quiz run. Fine for Phase 1 traffic; worth caching in sessionStorage later.
- **YouTube embed pre-validation** on the track-add form (to warn about videos that block embedding). Currently the user only discovers failures at play time.
- **Email verification enforcement** — Firebase sends the verification email but we don't gate on it.
- **Password reset UI** — Firebase has the API, we haven't surfaced it.

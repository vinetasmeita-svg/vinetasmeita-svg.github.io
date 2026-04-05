# Mūzikas literatūras treniņa SaaS — Phase 1 Design

**Date:** 2026-04-05
**Status:** Approved (design phase); implementation plan pending
**Language of product:** Latvian

## Context

An existing single-file HTML app (`index.html` + 49 MP3s in `/audio/`) provides a music literature training quiz: listen to a classical piece, type the composer/title/movement, get graded. Used by the project owner to prepare for the Rīgas 3. mūzikas vidusskola 12th grade exam. The HTML defines 50 track entries; only 49 MP3 files are on disk (one track is missing its audio file — to be resolved during migration).

The goal is to transform this into a multi-user SaaS so other music students can also train — each with *their own* quizzes containing whatever repertoire their school/course requires. A paywall for premium features is planned for a later phase but is **out of scope for Phase 1**.

## Goals

1. Deploy a working, registerable multi-user training app on Vercel with Firebase backend.
2. Let any user build their own quiz from scratch or clone an admin-curated template.
3. Preserve the existing quiz experience (free-text answers, era filtering, playback UX) as the flow users see after login.
4. Save per-user attempt history and compute basic stats.
5. Provide a public intro page with a 3-track demo so visitors understand the product before registering.

## Non-goals (Phase 1)

- Admin UI for managing tracks, templates, or feedback (admins use seed scripts + Firestore console).
- User-uploaded MP3s (copyright risk; storage quotas). Users add non-library tracks via YouTube URLs only.
- User-published public templates with moderation.
- Paywall, Stripe, premium tiers.
- Leaderboards, social features, sharing attempts between users.
- Email verification enforcement, polished password reset UI.
- PWA, offline support, native mobile.

## Stack

- **Framework:** Next.js (App Router), TypeScript
- **Hosting:** Vercel
- **Auth:** Firebase Authentication — Email/Password + Google
- **Database:** Cloud Firestore
- **File storage:** Firebase Storage (admin-seeded MP3s only)
- **Transactional email:** Resend (for feedback form notifications to admin)
- **Localization:** single Latvian string table at `lib/i18n/lv.ts`

## Information architecture

All user-facing paths in Latvian.

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Landing page: welcome, "par produktu", inline 3-track demo quiz, CTA to register |
| `/ienākt` | public | Login (email+password and Google) |
| `/reģistrēties` | public | Register |
| `/profils` | auth | Dashboard: stats summary, attempt history, list of user's quizzes |
| `/quiz` | auth | Two tabs: "Mani quiz" (owned) and "Gatavas sagataves" (admin templates) |
| `/quiz/jauns` | auth | Create new quiz (from scratch or via template picker) |
| `/quiz/[id]` | auth, owner | Edit quiz (title, description, add/remove/reorder tracks) |
| `/quiz/[id]/spēlēt` | auth, owner | Play quiz — the training flow ported from current HTML |
| `/quiz/[id]/rezultāti/[attemptId]` | auth, owner | Per-attempt result detail |
| `/bibliotēka` | auth | Browse admin track library (read-only, filter by era, search) |
| `/atsauksmes` | auth | Submit feedback/suggestion to admin |

## Firestore data model

```
users/{userId}
  email: string
  displayName: string
  role: 'user' | 'admin'
  createdAt: timestamp

tracks/{trackId}                  # admin library, seeded from existing 50
  title: string                   # "J.S. Bahs — Sv. Mateja pasija: ..."
  composer: string                # optional structured field
  era: number                     # 0-10, matches existing enum
  eraName: string                 # "Baroks", "Klasicisms", ...
  audioPath: string               # Firebase Storage path: "tracks/BBeXF_lnj_M.mp3"
  ytId: string | null             # fallback reference
  ytStart: number                 # seconds
  correctAnswer: string           # canonical graded-against text
  createdBy: userId (admin)
  createdAt: timestamp

quizzes/{quizId}
  ownerId: userId
  title: string
  description: string
  isTemplate: boolean             # only admin can set true
  tracks: QuizTrack[]             # embedded array, ordered
  createdAt, updatedAt: timestamp

  # QuizTrack (embedded object):
  #   source: 'library' | 'youtube'
  #   trackId?: string            # set if source='library'
  #   title: string               # copied from library OR user-entered
  #   composer?: string
  #   era: number
  #   audioPath?: string          # copied from library
  #   ytId?: string               # set if source='youtube' OR fallback
  #   ytStart?: number
  #   correctAnswer: string

attempts/{attemptId}
  userId
  quizId
  quizTitleSnapshot: string       # preserved across rename/delete
  startedAt, finishedAt: timestamp
  totalQuestions, correctCount, partialCount, wrongCount: number
  results: AttemptResult[]        # per-track: user answer, verdict, time taken

feedback/{feedbackId}
  userId
  userEmail
  message: string
  createdAt: timestamp
  status: 'new' | 'read' | 'resolved'
```

**Why embed QuizTrack in quizzes (not a subcollection)?** Quizzes are read as a whole unit (play, edit). Tracks-per-quiz is bounded (~50-100 typical). Embedding → one document read instead of N+1. Firestore's 1MB document limit is far above what's needed.

**Why snapshot quiz title on attempts?** So old attempt history displays meaningfully after a quiz is renamed or deleted.

## Firebase Security Rules (intent)

- `users/{id}`: read/write only if `request.auth.uid == id`.
- `tracks/*`: read for any authenticated user; write only if the requester's user doc has `role == 'admin'`.
- `quizzes/*`: read if `ownerId == auth.uid` OR `isTemplate == true`; write if `ownerId == auth.uid`. Only admins may set `isTemplate: true`.
- `attempts/*`: read/write only own (`userId == auth.uid`).
- `feedback/*`: create allowed for any authenticated user; read only admin.

## Key user flows

### 1. First-time visitor
Lands on `/` → reads intro → scrolls to demo section → plays inline 3-track mini-quiz (hardcoded in the Next.js repo, no Firestore reads) → sees results → CTA: "Reģistrējies, lai saglabātu statistiku un veidotu savus quiz" → `/reģistrēties`.

### 2. Registration → first quiz
Register (email or Google) → Firestore `users/{uid}` doc created with `role: 'user'` → redirect to `/profils` → empty state prompts `[Gatavas sagataves]` or `[Izveidot no nulles]`.

### 3. Cloning a template
`/quiz` → "Gatavas sagataves" tab shows all `isTemplate: true` quizzes → pick one → preview (title, description, track count, era breakdown) → `[Klonēt uz manu kontu]` → new `quizzes/{newId}` created with `ownerId = auth.uid`, `isTemplate: false`, full `tracks[]` array copied → redirect to `/quiz/{newId}`.

### 4. Building from scratch
`/quiz/jauns` → enter title, description → add tracks:
- **"Pievienot no bibliotēkas"** — searchable/filterable picker of admin `tracks/*` (filter by era, search by title/composer). Library fields copied into the QuizTrack.
- **"Pievienot YouTube"** — form: title, composer, era (dropdown), YouTube URL, start seconds, correct answer. Saved as `source: 'youtube'`.

Reorder by drag, remove with button, save.

### 5. Playing a quiz
`/quiz/{id}/spēlēt` → setup screen (question count, era filter — same UX as current HTML) → play loop (listen → free-text answer → next, same UX as current HTML) → on finish, write `attempts/{attemptId}` → redirect to results screen → offer "Spēlēt vēlreiz" and "Uz profilu".

**Audio playback**:
- `source: 'library'` → fetch signed URL from Firebase Storage for `audioPath`, cached per-session.
- `source: 'youtube'` → YouTube IFrame API with `ytStart` (same as current HTML).

### 6. Feedback submission
`/atsauksmes` → textarea + submit → writes `feedback/{id}` → Next.js server action calls Resend to email admin (address in env var). Success toast.

## Profile dashboard (`/profils`)

- **Top card:** total attempts, average score %, most-played era
- **Per-quiz breakdown:** for each owned quiz → attempts count, best score, last attempt date
- **Attempt history list:** paginated, newest first, link to each attempt's result detail
- **Per-era accuracy:** table — for each era encountered, correct/total. Computed client-side from recent attempts.

No leaderboards, no cross-user comparisons.

## The 3-track public demo

Three hardcoded tracks embedded as static JSON in the Next.js repo — deliberately *not* hitting Firestore. Recommended selection: one Baroque, one Classical, one Romantic (for variety). MP3s served from `/public/audio/` for these three files only. Demo is self-contained: play → answer → results → soft CTA. No attempt is saved.

## Seeding existing 50 tracks

One-shot script at `scripts/seed-tracks.ts`:
1. Reads track list from a cleaned-up JSON extracted from `index.html`.
2. Uploads each MP3 to Firebase Storage under `tracks/{originalFilename}`.
3. Creates a `tracks/{id}` Firestore doc per track.
4. Creates one `quizzes/{id}` doc with `isTemplate: true`, title `"JMV 12.kl. 25/26"`, referencing the seeded tracks.
5. Logs missing audio files so the owner can decide per track: drop, re-download, or keep as YouTube-only.

Script runs against Firebase using admin credentials from a local `.env` file — never committed, never deployed.

## Testing strategy

- **Unit:** answer-grading logic (fuzzy text matching, ported from current HTML), era filtering, score computation.
- **Integration:** Firestore security rules via Firebase emulator — verify isolation between users, admin-only writes on `tracks` and `isTemplate` flag, feedback readability.
- **E2E:** one Playwright happy-path test (register → clone template → play → see result).

## Known risks & open items

1. **YouTube embed failures.** The current HTML has a "YT check" screen because some videos block embedding. Mitigation: the track-add form validates embedability on save and warns the user, suggesting an alternative source.
2. **All 50 tracks have audio files.** No missing audio — all MP3s present in legacy/audio/. Seeding can proceed directly without audio file decisions.
3. **Firebase free tier.** Firestore 50k reads/day, Storage 5GB + 1GB/day download. 50 MP3s ≈ 100MB storage — trivial. Per-session reads are minimal. Safe for early users. Revisit if usage grows.
4. **Vercel Hobby plan** has a 100MB deployment-size limit. Tracks live in Firebase Storage, not `/public`, so the build stays tiny. Only the 3 demo MP3s go into `/public/audio/`.
5. **SEO/i18n.** `lang="lv"` on `<html>`, proper meta tags, OG image. No hreflang — no English version in Phase 1.

## Deferred to later phases

- **Phase 2:** Admin UI (track upload, template promotion, feedback inbox).
- **Phase 3:** User MP3 uploads with quotas, public user-published templates (with moderation).
- **Phase 4:** Paywall, premium tiers, Stripe integration.
- **Later:** Leaderboards, social features, email verification enforcement, PWA.

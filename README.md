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

- `npm test` — unit tests (grading, scoring)
- Rules tests require the Firebase emulator (Java required):
  ```
  npx firebase emulators:exec --only firestore --project muzikas-test "npm test -- tests/rules/"
  ```
- `npm run test:e2e` — Playwright smoke test

## Deploy to Vercel

1. Push the branch and import the repo in Vercel.
2. Add all `.env.local` variables as Vercel project environment variables (mark `FIREBASE_ADMIN_*` and `RESEND_API_KEY` as Sensitive).
3. Deploy.

## Project structure

- `src/app/` — Next.js App Router pages (Latvian paths)
- `src/components/` — React components
- `src/lib/` — pure logic (grading, scoring), types, i18n, Firebase SDK init
- `src/server/` — server actions (Firestore writes with admin SDK)
- `tests/unit/` — Vitest unit tests
- `tests/rules/` — Firestore security rules tests
- `tests/e2e/` — Playwright E2E
- `scripts/` — one-shot seed + extract scripts
- `legacy/` — original HTML quiz + MP3s, preserved as reference and data source

## Branch

Phase 1 lives on `phase1-nextjs-saas`. `main` still holds the original single-file HTML app.

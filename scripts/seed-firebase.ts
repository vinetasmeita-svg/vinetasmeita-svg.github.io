// One-shot: upload legacy MP3s to Firebase Storage, create tracks/*
// Firestore docs, create the "JMV 12.kl. 25/26" template quiz, and
// also create a personal owned copy of that quiz for the admin user
// so it shows up immediately in their "Mani quiz" list.
//
// Requires FIREBASE_ADMIN_* and NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local.
//
// SEED_ADMIN_UID is optional — if not set, the script picks the first user
// doc in Firestore. With a fresh project and one registered account, that
// does the right thing automatically.
//
// Safe to re-run:
//   - existing tracks/* docs are left alone (we skip re-upload if the
//     storage object already exists and Firestore already has a doc with
//     the same audioPath)
//   - existing template / personal quizzes are NOT recreated (we check for
//     a quiz with the same title + ownerId first)
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const TEMPLATE_TITLE = 'JMV 12.kl. 25/26';
const TEMPLATE_DESCRIPTION =
  'Mūzikas literatūras eksāmena sagatavošana — Jāzepa Mediņa 12. klase, 2025/26 mācību gads.';

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

interface QuizTrack {
  source: 'library';
  trackId: string;
  title: string;
  era: number;
  audioPath: string;
  ytId: string | null;
  ytStart: number;
  correctAnswer: string;
}

const seed: SeedTrack[] = JSON.parse(
  fs.readFileSync('data/tracks-seed.json', 'utf8'),
);

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

/**
 * Resolve the admin UID: explicit env var wins, otherwise pick the first
 * user doc in Firestore. Throws if no user exists yet.
 */
async function resolveAdminUid(): Promise<{ uid: string; displayName: string }> {
  if (process.env.SEED_ADMIN_UID) {
    const snap = await db.collection('users').doc(process.env.SEED_ADMIN_UID).get();
    if (!snap.exists) {
      throw new Error(
        `SEED_ADMIN_UID=${process.env.SEED_ADMIN_UID} not found in users collection. ` +
          `Register the account in the app first, then re-run.`,
      );
    }
    return {
      uid: snap.id,
      displayName: (snap.data()?.displayName as string) ?? snap.id,
    };
  }

  const snap = await db.collection('users').limit(5).get();
  if (snap.empty) {
    throw new Error(
      'No users in Firestore. Register your account in the app first, then re-run.',
    );
  }
  if (snap.size > 1) {
    console.warn(
      `  ⚠ Multiple users exist (${snap.size}). Using the first one found: ${snap.docs[0].id}. ` +
        `Set SEED_ADMIN_UID explicitly to override.`,
    );
  }
  return {
    uid: snap.docs[0].id,
    displayName: (snap.docs[0].data()?.displayName as string) ?? snap.docs[0].id,
  };
}

async function promoteToAdmin(uid: string): Promise<void> {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  const current = snap.data();
  if (current?.role === 'admin') {
    console.log(`  = already admin`);
    return;
  }
  await ref.update({ role: 'admin' });
  console.log(`  ✓ promoted to admin`);
}

async function uploadTracks(adminUid: string): Promise<QuizTrack[]> {
  // Pre-fetch existing tracks once so we don't re-upload or duplicate docs.
  const existingSnap = await db.collection('tracks').get();
  const existingByPath = new Map<string, { id: string; title: string; era: number; audioPath: string; ytId: string | null; ytStart: number; correctAnswer: string }>();
  for (const doc of existingSnap.docs) {
    const data = doc.data();
    existingByPath.set(data.audioPath, {
      id: doc.id,
      title: data.title,
      era: data.era,
      audioPath: data.audioPath,
      ytId: data.ytId ?? null,
      ytStart: data.ytStart ?? 0,
      correctAnswer: data.correctAnswer,
    });
  }
  console.log(`  (found ${existingByPath.size} existing track docs)`);

  const now = Date.now();
  const quizTracks: QuizTrack[] = [];
  let uploadedCount = 0;
  let reusedCount = 0;

  for (const t of seed) {
    const audioPath = `tracks/${t.audioFilename}`;
    const existing = existingByPath.get(audioPath);

    if (existing) {
      quizTracks.push({
        source: 'library',
        trackId: existing.id,
        title: existing.title,
        era: existing.era,
        audioPath: existing.audioPath,
        ytId: existing.ytId,
        ytStart: existing.ytStart,
        correctAnswer: existing.correctAnswer,
      });
      reusedCount++;
      continue;
    }

    if (t.audioExists) {
      const localPath = path.join('legacy/audio', t.audioFilename);
      // Skip re-upload if the storage object already exists (fast check).
      const [exists] = await bucket.file(audioPath).exists();
      if (!exists) {
        await bucket.upload(localPath, { destination: audioPath });
        uploadedCount++;
      }
    } else {
      console.warn(`  ⚠ missing audio file: ${t.audioFilename}`);
    }

    const trackRef = await db.collection('tracks').add({
      title: t.title,
      era: t.era,
      audioPath,
      ytId: t.ytId || null,
      ytStart: t.ytStart,
      correctAnswer: t.correctAnswer,
      createdBy: adminUid,
      createdAt: now,
    });

    quizTracks.push({
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

  console.log(`  ✓ uploaded ${uploadedCount} new MP3s, reused ${reusedCount} existing tracks`);
  return quizTracks;
}

async function ensureQuiz(args: {
  ownerId: string;
  title: string;
  description: string;
  isTemplate: boolean;
  tracks: QuizTrack[];
  label: string;
}): Promise<void> {
  const now = Date.now();
  const existingSnap = await db
    .collection('quizzes')
    .where('ownerId', '==', args.ownerId)
    .where('title', '==', args.title)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    // Refresh the tracks array in case we re-seeded tracks/* with new IDs.
    const ref = existingSnap.docs[0].ref;
    await ref.update({
      description: args.description,
      isTemplate: args.isTemplate,
      tracks: args.tracks,
      updatedAt: now,
    });
    console.log(`  = updated existing ${args.label}: ${ref.id}`);
    return;
  }

  const ref = await db.collection('quizzes').add({
    ownerId: args.ownerId,
    title: args.title,
    description: args.description,
    isTemplate: args.isTemplate,
    tracks: args.tracks,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`  ✓ created ${args.label}: ${ref.id}`);
}

async function main() {
  console.log('Resolving admin user...');
  const { uid: adminUid, displayName } = await resolveAdminUid();
  console.log(`  → ${displayName} (${adminUid})`);
  console.log('');

  console.log('Promoting user to admin...');
  await promoteToAdmin(adminUid);
  console.log('');

  console.log(`Seeding ${seed.length} tracks...`);
  const quizTracks = await uploadTracks(adminUid);
  console.log('');

  console.log('Ensuring template quiz...');
  await ensureQuiz({
    ownerId: adminUid,
    title: TEMPLATE_TITLE,
    description: TEMPLATE_DESCRIPTION,
    isTemplate: true,
    tracks: quizTracks,
    label: 'template',
  });
  console.log('');

  console.log('Ensuring personal copy (so it shows up in "Mani quiz")...');
  await ensureQuiz({
    ownerId: adminUid,
    title: `${TEMPLATE_TITLE} (mans)`,
    description: TEMPLATE_DESCRIPTION,
    isTemplate: false,
    tracks: quizTracks,
    label: 'personal quiz',
  });
  console.log('');

  console.log('Done. Reload /profils or /quiz in the browser.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

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

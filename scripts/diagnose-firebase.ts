// One-shot diagnostic: does Firestore exist? Can the admin SDK write to it?
// If the admin SDK works but the client SDK hits "Missing or insufficient
// permissions", the problem is rules deployment, not database existence.
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

async function main() {
  console.log('--- Firestore database existence check ---');
  try {
    // Try writing to a throwaway diagnostic doc.
    const ref = db.collection('_diagnostic').doc('probe');
    await ref.set({ ts: Date.now(), from: 'diagnose-firebase.ts' });
    console.log('✓ Database exists and admin SDK can write.');
    const snap = await ref.get();
    console.log('✓ Admin SDK can read:', JSON.stringify(snap.data()));
    await ref.delete();
    console.log('✓ Admin SDK can delete.');
  } catch (e) {
    const err = e as { code?: string | number; message?: string };
    console.error('✗ Admin SDK write failed:');
    console.error('  code:', err.code);
    console.error('  message:', err.message);
    if (String(err.message ?? '').includes('NOT_FOUND') || err.code === 5) {
      console.error('');
      console.error('DIAGNOSIS: The Firestore database does not exist yet.');
      console.error('Fix: In Firebase Console, go to Firestore Database → Create database');
      console.error('     → choose "production mode" → pick region (europe-west1 is closest to Latvia).');
    }
    process.exit(1);
  }

  console.log('');
  console.log('--- Listing existing collections ---');
  const collections = await db.listCollections();
  if (collections.length === 0) {
    console.log('(no collections yet)');
  } else {
    for (const c of collections) {
      const countSnap = await c.count().get();
      console.log(`  ${c.id}: ${countSnap.data().count} docs`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

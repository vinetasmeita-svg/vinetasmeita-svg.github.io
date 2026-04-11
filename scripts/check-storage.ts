// Quick check: does the Storage bucket exist and can the admin SDK write to it?
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const bucket = getStorage().bucket();

async function main() {
  console.log(`Bucket: ${bucket.name}`);
  const [exists] = await bucket.exists();
  console.log(`Exists: ${exists}`);
  if (!exists) {
    console.error('');
    console.error('Bucket does not exist. Provision Firebase Storage:');
    console.error('  Firebase Console → Storage → Get started → production mode → pick region');
    process.exit(1);
  }
  // Try to write a throwaway file.
  const testFile = bucket.file('_diagnostic/probe.txt');
  await testFile.save('probe', { contentType: 'text/plain' });
  console.log('✓ Admin SDK can write');
  await testFile.delete();
  console.log('✓ Admin SDK can delete');
}

main().catch((e) => {
  console.error('Storage check failed:', (e as Error).message);
  process.exit(1);
});

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

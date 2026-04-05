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

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

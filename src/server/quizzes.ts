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

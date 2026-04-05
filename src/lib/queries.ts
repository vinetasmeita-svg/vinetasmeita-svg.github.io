import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase/client';
import type { QuizDoc, TrackDoc, AttemptDoc } from './types';

export interface WithId<T> { id: string; data: T; }

export async function listMyQuizzes(uid: string): Promise<WithId<QuizDoc>[]> {
  const q = query(
    collection(db, 'quizzes'),
    where('ownerId', '==', uid),
    where('isTemplate', '==', false),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as QuizDoc }));
}

export async function listTemplates(): Promise<WithId<QuizDoc>[]> {
  const q = query(
    collection(db, 'quizzes'),
    where('isTemplate', '==', true),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as QuizDoc }));
}

export async function getQuiz(id: string): Promise<WithId<QuizDoc> | null> {
  const snap = await getDoc(doc(db, 'quizzes', id));
  if (!snap.exists()) return null;
  return { id: snap.id, data: snap.data() as QuizDoc };
}

export async function listTracks(): Promise<WithId<TrackDoc>[]> {
  const q = query(collection(db, 'tracks'), orderBy('era'), orderBy('title'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as TrackDoc }));
}

export async function listMyAttempts(uid: string, max = 50): Promise<WithId<AttemptDoc>[]> {
  const q = query(
    collection(db, 'attempts'),
    where('userId', '==', uid),
    orderBy('finishedAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as AttemptDoc }));
}

export async function getAttempt(id: string): Promise<WithId<AttemptDoc> | null> {
  const snap = await getDoc(doc(db, 'attempts', id));
  if (!snap.exists()) return null;
  return { id: snap.id, data: snap.data() as AttemptDoc };
}

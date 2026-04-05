'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth/context';
import { createQuiz } from '@/server/quizzes';
import { lv } from '@/lib/i18n/lv';

export default function NewQuizPage() {
  return (
    <RequireAuth>
      <NewQuizInner />
    </RequireAuth>
  );
}

function NewQuizInner() {
  const { getIdToken } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('No token');
      const { id } = await createQuiz({ idToken: token, title, description, tracks: [] });
      router.push(`/quiz/${id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card stack">
      <h1>{lv.quiz.createNew}</h1>
      <div>
        <label htmlFor="title">{lv.quiz.title}</label>
        <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="desc">{lv.quiz.description}</label>
        <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>
      <button type="submit" className="primary" disabled={busy}>
        {lv.quiz.createNew}
      </button>
    </form>
  );
}

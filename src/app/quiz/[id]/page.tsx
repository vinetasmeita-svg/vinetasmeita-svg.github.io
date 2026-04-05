'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import TrackPicker from '@/components/quiz/TrackPicker';
import { useAuth } from '@/lib/auth/context';
import { getQuiz, type WithId } from '@/lib/queries';
import { updateQuiz, deleteQuiz } from '@/server/quizzes';
import type { QuizDoc, QuizTrack } from '@/lib/types';
import { eraName } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';

export default function EditQuizPage() {
  return (
    <RequireAuth>
      <EditQuizInner />
    </RequireAuth>
  );
}

function EditQuizInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, getIdToken } = useAuth();

  const [quiz, setQuiz] = useState<WithId<QuizDoc> | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tracks, setTracks] = useState<QuizTrack[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!params.id) return;
    getQuiz(params.id).then((q) => {
      if (!q) { router.replace('/quiz'); return; }
      if (user && q.data.ownerId !== user.uid) { router.replace('/quiz'); return; }
      setQuiz(q);
      setTitle(q.data.title);
      setDescription(q.data.description);
      setTracks(q.data.tracks);
    });
  }, [params.id, user, router]);

  if (!quiz) return <p>{lv.common.loading}</p>;

  const onSave = async () => {
    setSaving(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('No token');
      await updateQuiz({ idToken: token, id: quiz.id, title, description, tracks });
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(lv.quiz.confirmDelete)) return;
    const token = await getIdToken();
    if (!token) return;
    await deleteQuiz({ idToken: token, id: quiz.id });
    router.replace('/quiz');
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = tracks.slice();
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setTracks(next);
  };
  const moveDown = (i: number) => {
    if (i === tracks.length - 1) return;
    const next = tracks.slice();
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setTracks(next);
  };
  const remove = (i: number) => setTracks(tracks.filter((_, idx) => idx !== i));
  const addTrack = (t: QuizTrack) => { setTracks([...tracks, t]); setPickerOpen(false); };

  return (
    <div className="stack">
      <h1>{lv.quiz.edit}</h1>
      <div className="card stack">
        <div>
          <label htmlFor="title">{lv.quiz.title}</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="desc">{lv.quiz.description}</label>
          <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
      </div>

      <div className="card stack">
        <h2>{lv.quiz.tracks} ({tracks.length})</h2>
        {tracks.length === 0 && <p className="muted">{lv.quiz.noTracksYet}</p>}
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tracks.map((t, i) => (
            <li key={i} style={{ background: 'var(--surface)', padding: 10, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13 }}>{t.title}</div>
                <div className="muted">{eraName(t.era)} · {t.source === 'library' ? 'Bibliotēka' : 'YouTube'}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" onClick={() => moveUp(i)} disabled={i === 0}>↑</button>
                <button type="button" onClick={() => moveDown(i)} disabled={i === tracks.length - 1}>↓</button>
                <button type="button" onClick={() => remove(i)}>✕</button>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setPickerOpen(true)}>+ {lv.quiz.addFromLibrary} / {lv.quiz.addYouTube}</button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="primary" onClick={onSave} disabled={saving} style={{ flex: 1 }}>
          {saving ? lv.common.loading : lv.quiz.save}
        </button>
        <Link href={`/quiz/${quiz.id}/spēlēt`} style={{ flex: 1 }}>
          <button type="button" style={{ width: '100%' }}>{lv.quiz.play}</button>
        </Link>
      </div>
      {savedAt && <p className="muted">{lv.quiz.saved}</p>}
      <button type="button" onClick={onDelete} style={{ color: 'var(--danger)' }}>{lv.quiz.delete}</button>

      {pickerOpen && <TrackPicker onAdd={addTrack} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

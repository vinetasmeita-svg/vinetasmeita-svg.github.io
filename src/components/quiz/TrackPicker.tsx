'use client';

import { useEffect, useMemo, useState } from 'react';
import { listTracks, type WithId } from '@/lib/queries';
import type { TrackDoc, QuizTrack, EraId } from '@/lib/types';
import { ERAS, eraName } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';
import styles from './TrackPicker.module.css';

interface Props {
  onAdd: (track: QuizTrack) => void;
  onClose: () => void;
}

type Mode = 'library' | 'youtube';

export default function TrackPicker({ onAdd, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('library');

  return (
    <div className={styles.overlay} role="dialog">
      <div className={styles.modal + ' stack'}>
        <div className={styles.tabs}>
          <button type="button" className={mode === 'library' ? 'primary' : ''} onClick={() => setMode('library')}>
            {lv.quiz.addFromLibrary}
          </button>
          <button type="button" className={mode === 'youtube' ? 'primary' : ''} onClick={() => setMode('youtube')}>
            {lv.quiz.addYouTube}
          </button>
        </div>
        {mode === 'library' ? <LibraryPicker onAdd={onAdd} /> : <YouTubeForm onAdd={onAdd} />}
        <button type="button" onClick={onClose}>{lv.common.cancel}</button>
      </div>
    </div>
  );
}

function LibraryPicker({ onAdd }: { onAdd: (t: QuizTrack) => void }) {
  const [tracks, setTracks] = useState<WithId<TrackDoc>[] | null>(null);
  const [search, setSearch] = useState('');
  const [eraFilter, setEraFilter] = useState<number | 'all'>('all');

  useEffect(() => { listTracks().then(setTracks).catch(console.error); }, []);

  const filtered = useMemo(() => {
    if (!tracks) return [];
    return tracks.filter((t) => {
      if (eraFilter !== 'all' && t.data.era !== eraFilter) return false;
      if (search && !t.data.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tracks, search, eraFilter]);

  const add = (wid: WithId<TrackDoc>) => {
    const qt: QuizTrack = {
      source: 'library',
      trackId: wid.id,
      title: wid.data.title,
      composer: wid.data.composer,
      era: wid.data.era,
      audioPath: wid.data.audioPath,
      ytId: wid.data.ytId ?? undefined,
      ytStart: wid.data.ytStart,
      correctAnswer: wid.data.correctAnswer,
    };
    onAdd(qt);
  };

  if (!tracks) return <p>{lv.common.loading}</p>;

  return (
    <div className="stack">
      <input type="text" placeholder={lv.library.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
      <select value={eraFilter} onChange={(e) => setEraFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
        <option value="all">{lv.quiz.allEras}</option>
        {ERAS.map((era) => <option key={era.id} value={era.id}>{era.name}</option>)}
      </select>
      <ul className={styles.list}>
        {filtered.map((t) => (
          <li key={t.id}>
            <div>
              <div>{t.data.title}</div>
              <div className="muted">{eraName(t.data.era)}</div>
            </div>
            <button type="button" onClick={() => add(t)}>+</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function extractYouTubeId(urlOrId: string): string | null {
  if (/^[A-Za-z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const m = urlOrId.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function YouTubeForm({ onAdd }: { onAdd: (t: QuizTrack) => void }) {
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [era, setEra] = useState<EraId>(0);
  const [url, setUrl] = useState('');
  const [start, setStart] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYouTubeId(url);
    if (!ytId) { setError('Nederīgs YouTube URL'); return; }
    onAdd({
      source: 'youtube',
      title,
      composer: composer || undefined,
      era,
      ytId,
      ytStart: start,
      correctAnswer: correctAnswer || title,
    });
  };

  return (
    <form onSubmit={submit} className="stack">
      <div><label htmlFor="yt-title">{lv.quiz.title}</label><input id="yt-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
      <div><label htmlFor="yt-comp">Komponists</label><input id="yt-comp" value={composer} onChange={(e) => setComposer(e.target.value)} /></div>
      <div><label htmlFor="yt-era">Laikmets</label>
        <select id="yt-era" value={era} onChange={(e) => setEra(Number(e.target.value) as EraId)}>
          {ERAS.map((er) => <option key={er.id} value={er.id}>{er.name}</option>)}
        </select>
      </div>
      <div><label htmlFor="yt-url">YouTube URL</label><input id="yt-url" value={url} onChange={(e) => setUrl(e.target.value)} required /></div>
      <div><label htmlFor="yt-start">Sākuma sekunde</label><input id="yt-start" type="number" min={0} value={start} onChange={(e) => setStart(Number(e.target.value))} /></div>
      <div><label htmlFor="yt-ans">Pareizā atbilde</label><input id="yt-ans" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Ja tukšs — izmantos nosaukumu" /></div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
      <button type="submit" className="primary">Pievienot</button>
    </form>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { listTracks, type WithId } from '@/lib/queries';
import type { TrackDoc } from '@/lib/types';
import { ERAS, eraName } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';

export default function LibraryPage() {
  return (
    <RequireAuth>
      <LibraryInner />
    </RequireAuth>
  );
}

function LibraryInner() {
  const [tracks, setTracks] = useState<WithId<TrackDoc>[] | null>(null);
  const [search, setSearch] = useState('');
  const [eraFilter, setEraFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    listTracks().then(setTracks).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    if (!tracks) return [];
    return tracks.filter((t) => {
      if (eraFilter !== 'all' && t.data.era !== eraFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.data.title.toLowerCase().includes(q) &&
          !(t.data.composer ?? '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [tracks, search, eraFilter]);

  if (!tracks) return <p>{lv.common.loading}</p>;

  return (
    <div className="stack">
      <h1>{lv.library.title}</h1>
      <p className="muted">{lv.library.totalTracks(tracks.length)}</p>
      <input
        type="text"
        placeholder={lv.library.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={eraFilter} onChange={(e) => setEraFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
        <option value="all">{lv.quiz.allEras}</option>
        {ERAS.map((era) => (
          <option key={era.id} value={era.id}>{era.name}</option>
        ))}
      </select>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((t) => (
          <li key={t.id} className="card">
            <div style={{ fontSize: 14 }}>{t.data.title}</div>
            <div className="muted">{eraName(t.data.era)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

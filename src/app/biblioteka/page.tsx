'use client';

import { useMemo, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import ErrorBox from '@/components/ErrorBox';
import { useAuth } from '@/lib/auth/context';
import { listTracks } from '@/lib/queries';
import { useAsync } from '@/lib/useAsync';
import { getSignedAudioUrl } from '@/server/tracks';
import { ERAS, eraName } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';
import styles from './page.module.css';

export default function LibraryPage() {
  return (
    <RequireAuth>
      <LibraryInner />
    </RequireAuth>
  );
}

/**
 * Split "J.S. Bahs — Sv. Mateja pasija: ..." into ["J.S. Bahs", "Sv. Mateja pasija: ..."].
 * Falls back to (title, '') if no em-dash separator is present. Accepts both
 * em-dash (—) and en-dash (–) since the legacy source uses em-dash but some
 * user-entered tracks may use either.
 */
function splitTitle(title: string): { composer: string; work: string } {
  const match = title.match(/^(.*?)\s*[—–]\s*(.+)$/);
  if (match) return { composer: match[1].trim(), work: match[2].trim() };
  return { composer: title, work: '' };
}

function LibraryInner() {
  const { user, getIdToken } = useAuth();
  const tracksQ = useAsync(() => listTracks(), []);
  const [search, setSearch] = useState('');
  const [eraFilter, setEraFilter] = useState<number | 'all'>('all');
  // Audio URLs are fetched on-demand when user clicks play on a row.
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!tracksQ.data) return [];
    return tracksQ.data.filter((t) => {
      if (eraFilter !== 'all' && t.data.era !== eraFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.data.title.toLowerCase().includes(q) &&
          !(t.data.composer ?? '').toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [tracksQ.data, search, eraFilter]);

  const loadAudio = async (trackId: string, audioPath: string) => {
    if (audioUrls[trackId] || loadingAudio) return;
    if (!user) return;
    setLoadingAudio(trackId);
    try {
      const token = await getIdToken();
      if (!token) return;
      const { url } = await getSignedAudioUrl({ idToken: token, audioPath });
      setAudioUrls((prev) => ({ ...prev, [trackId]: url }));
    } catch (e) {
      console.error('Failed to load audio', e);
    } finally {
      setLoadingAudio(null);
    }
  };

  if (tracksQ.loading) return <p>{lv.common.loading}</p>;
  if (tracksQ.error) return <ErrorBox error={tracksQ.error} />;
  const tracks = tracksQ.data ?? [];

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
      <select
        value={eraFilter}
        onChange={(e) => setEraFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
      >
        <option value="all">{lv.quiz.allEras}</option>
        {ERAS.map((era) => (
          <option key={era.id} value={era.id}>
            {era.name}
          </option>
        ))}
      </select>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Autors</th>
            <th>Skaņdarbs</th>
            <th>Laikmets</th>
            <th>Audio</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((t) => {
            const composer = t.data.composer ?? splitTitle(t.data.title).composer;
            const work = t.data.composer ? t.data.title : splitTitle(t.data.title).work;
            const url = audioUrls[t.id];
            const ytStart = t.data.ytStart ?? 0;
            return (
              <tr key={t.id}>
                <td className={styles.composer}>{composer}</td>
                <td className={styles.work}>{work}</td>
                <td className={styles.era}>{eraName(t.data.era)}</td>
                <td className={styles.audio}>
                  {url ? (
                    <audio
                      src={url}
                      controls
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        if (ytStart > 0) e.currentTarget.currentTime = ytStart;
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => loadAudio(t.id, t.data.audioPath)}
                      disabled={loadingAudio === t.id}
                    >
                      {loadingAudio === t.id ? '…' : '▶ Klausīties'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

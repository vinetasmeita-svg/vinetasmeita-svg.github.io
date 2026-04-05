'use client';

import { useState } from 'react';
import type { QuizTrack, EraId } from '@/lib/types';
import { ERAS } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';

interface Props {
  tracks: QuizTrack[];
  onStart: (count: number, eras: EraId[]) => void;
}

const COUNT_OPTIONS = [5, 10, 20, 50];

export default function QuizSetup({ tracks, onStart }: Props) {
  const availableEras = Array.from(new Set(tracks.map((t) => t.era))) as EraId[];
  const [count, setCount] = useState(10);
  const [selectedEras, setSelectedEras] = useState<EraId[]>(availableEras);

  const toggleEra = (id: EraId) => {
    setSelectedEras((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  };

  const maxCount = tracks.filter((t) => selectedEras.includes(t.era)).length;

  return (
    <div className="card stack">
      <h2>{lv.quiz.questionCount}</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {COUNT_OPTIONS.filter((c) => c <= maxCount || c === COUNT_OPTIONS[0]).map((c) => (
          <button key={c} type="button" className={count === c ? 'primary' : ''} onClick={() => setCount(c)}>
            {c}
          </button>
        ))}
      </div>

      <h2>{lv.quiz.filterByEra}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {ERAS.filter((e) => availableEras.includes(e.id as EraId)).map((e) => (
          <button
            key={e.id}
            type="button"
            className={selectedEras.includes(e.id as EraId) ? 'primary' : ''}
            onClick={() => toggleEra(e.id as EraId)}
            style={{ fontSize: 11, textAlign: 'left' }}
          >
            {e.name}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="primary"
        disabled={selectedEras.length === 0 || maxCount === 0}
        onClick={() => onStart(Math.min(count, maxCount), selectedEras)}
      >
        {lv.quiz.start}
      </button>
      <p className="muted">Pieejami {maxCount} skaņdarbi no izvēlētajiem laikmetiem.</p>
    </div>
  );
}

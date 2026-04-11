'use client';

import { useState } from 'react';
import type { QuizTrack, EraId } from '@/lib/types';
import { ERAS } from '@/lib/eras';
import { lv } from '@/lib/i18n/lv';

export type SamplingMode = 'weighted' | 'random';

interface Props {
  tracks: QuizTrack[];
  onStart: (count: number, eras: EraId[], mode: SamplingMode) => void;
}

const COUNT_OPTIONS = [5, 10, 15, 20, 50];

export default function QuizSetup({ tracks, onStart }: Props) {
  const availableEras = Array.from(new Set(tracks.map((t) => t.era))) as EraId[];
  const [count, setCount] = useState(15);
  const [selectedEras, setSelectedEras] = useState<EraId[]>(availableEras);
  const [mode, setMode] = useState<SamplingMode>('weighted');

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

      <h2>Treniņa režīms</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className={mode === 'weighted' ? 'primary' : ''}
          onClick={() => setMode('weighted')}
          style={{ flex: 1, fontSize: 11 }}
        >
          Vājākie biežāk
        </button>
        <button
          type="button"
          className={mode === 'random' ? 'primary' : ''}
          onClick={() => setMode('random')}
          style={{ flex: 1, fontSize: 11 }}
        >
          Nejauši
        </button>
      </div>
      <p className="muted">
        {mode === 'weighted'
          ? 'Skaņdarbi, kuros līdz šim kļūdīts, parādīsies biežāk.'
          : 'Visi skaņdarbi ar vienādu varbūtību.'}
      </p>

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
        onClick={() => onStart(Math.min(count, maxCount), selectedEras, mode)}
      >
        {lv.quiz.start}
      </button>
      <p className="muted">Pieejami {maxCount} skaņdarbi no izvēlētajiem laikmetiem.</p>
    </div>
  );
}

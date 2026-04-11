'use client';

import { useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import ErrorBox from '@/components/ErrorBox';
import { listMyQuizzes, listTemplates } from '@/lib/queries';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/lib/auth/context';
import { cloneTemplate } from '@/server/quizzes';
import { lv } from '@/lib/i18n/lv';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function QuizListPage() {
  return (
    <RequireAuth>
      <QuizListInner />
    </RequireAuth>
  );
}

function QuizListInner() {
  const { user, getIdToken } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'mine' | 'templates'>('mine');

  const uid = user?.uid ?? null;
  const mineQ = useAsync(
    () => (uid ? listMyQuizzes(uid) : Promise.resolve([])),
    [uid],
  );
  const templatesQ = useAsync(() => listTemplates(), []);

  const onClone = async (templateId: string) => {
    const token = await getIdToken();
    if (!token) return;
    const { id } = await cloneTemplate({ idToken: token, templateId });
    router.push(`/quiz/${id}`);
  };

  return (
    <div className="stack">
      <h1>Quiz</h1>
      <div className={styles.tabs}>
        <button type="button" className={tab === 'mine' ? 'primary' : ''} onClick={() => setTab('mine')}>
          {lv.quiz.mine}
        </button>
        <button type="button" className={tab === 'templates' ? 'primary' : ''} onClick={() => setTab('templates')}>
          {lv.quiz.templates}
        </button>
      </div>

      {tab === 'mine' && (
        <div className="stack">
          <Link href="/quiz/jauns">
            <button type="button" className="primary" style={{ width: '100%' }}>{lv.quiz.createNew}</button>
          </Link>
          {mineQ.loading && <p>{lv.common.loading}</p>}
          {mineQ.error && <ErrorBox error={mineQ.error} />}
          {!mineQ.loading && !mineQ.error && mineQ.data?.length === 0 && (
            <p className="muted">{lv.quiz.emptyState}</p>
          )}
          {mineQ.data?.map((q) => (
            <Link key={q.id} href={`/quiz/${q.id}`} className="card" style={{ display: 'block' }}>
              <div>{q.data.title}</div>
              <div className="muted">{q.data.tracks.length} skaņdarbi</div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'templates' && (
        <div className="stack">
          {templatesQ.loading && <p>{lv.common.loading}</p>}
          {templatesQ.error && <ErrorBox error={templatesQ.error} />}
          {!templatesQ.loading && !templatesQ.error && templatesQ.data?.length === 0 && (
            <p className="muted">Nav pieejamu sagatavju.</p>
          )}
          {templatesQ.data?.map((q) => (
            <div key={q.id} className="card stack">
              <div>{q.data.title}</div>
              <div className="muted">{q.data.tracks.length} skaņdarbi</div>
              <p className="muted">{q.data.description}</p>
              <button type="button" className="primary" onClick={() => onClone(q.id)}>
                {lv.quiz.clone}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

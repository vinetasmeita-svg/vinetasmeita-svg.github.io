import Link from 'next/link';
import DemoQuiz from '@/components/quiz/DemoQuiz';
import { lv } from '@/lib/i18n/lv';

export default function HomePage() {
  return (
    <div className="stack" style={{ gap: 48 }}>
      <section style={{ textAlign: 'center' }} className="stack">
        <h1>
          <em>{lv.landing.heroTitle}</em>
        </h1>
        <p className="muted">{lv.landing.heroSubtitle}</p>
      </section>

      <section className="card">
        <p>{lv.landing.about}</p>
      </section>

      <DemoQuiz />

      <section style={{ textAlign: 'center' }}>
        <Link href="/registreties">
          <button type="button" className="primary">{lv.landing.ctaRegister}</button>
        </Link>
      </section>
    </div>
  );
}

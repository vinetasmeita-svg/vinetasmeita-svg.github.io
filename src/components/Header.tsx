'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { lv } from '@/lib/i18n/lv';
import styles from './Header.module.css';

export default function Header() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        {lv.app.name}
      </Link>
      <nav className={styles.nav}>
        {!loading && user && (
          <>
            <Link href="/profils">{lv.nav.profile}</Link>
            <Link href="/quiz">{lv.nav.quizzes}</Link>
            <Link href="/biblioteka">{lv.nav.library}</Link>
            <Link href="/atsauksmes">{lv.nav.feedback}</Link>
            <button type="button" onClick={() => signOut()}>{lv.nav.logout}</button>
          </>
        )}
        {!loading && !user && (
          <>
            <Link href="/ienakt">{lv.nav.login}</Link>
            <Link href="/registreties">{lv.nav.register}</Link>
          </>
        )}
      </nav>
    </header>
  );
}

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import type { UserDoc } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
  signUpEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureUserDoc(user: User): Promise<UserDoc> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserDoc;
  const data: UserDoc = {
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    role: 'user',
    createdAt: Date.now(),
  };
  await setDoc(ref, data);
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const d = await ensureUserDoc(u);
          setUserDoc(d);
        } catch (e) {
          console.error('Failed to load user doc', e);
          setUserDoc(null);
        }
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signUpEmail = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    await ensureUserDoc(cred.user);
  };

  const signInEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInGoogle = async () => {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    await ensureUserDoc(cred.user);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{ user, userDoc, loading, signUpEmail, signInEmail, signInGoogle, signOut, getIdToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

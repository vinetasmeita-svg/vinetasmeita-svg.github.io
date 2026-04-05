import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import fs from 'node:fs';
import { doc, setDoc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'muzikas-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

async function seedUser(uid: string, role: 'user' | 'admin') {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', uid), {
      email: `${uid}@example.com`,
      displayName: uid,
      role,
      createdAt: Date.now(),
    });
  });
}

describe('users collection', () => {
  it('allows a user to create their own doc with role=user', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      setDoc(doc(alice, 'users', 'alice'), {
        email: 'alice@example.com',
        displayName: 'Alice',
        role: 'user',
        createdAt: Date.now(),
      }),
    );
  });

  it('forbids a user from creating their doc with role=admin', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(
      setDoc(doc(alice, 'users', 'alice'), {
        email: 'alice@example.com',
        displayName: 'Alice',
        role: 'admin',
        createdAt: Date.now(),
      }),
    );
  });

  it('forbids reading another user doc', async () => {
    await seedUser('bob', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(alice, 'users', 'bob')));
  });

  it('forbids self-promotion to admin', async () => {
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(
      updateDoc(doc(alice, 'users', 'alice'), { role: 'admin' }),
    );
  });
});

describe('tracks collection', () => {
  it('allows signed-in users to read tracks', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tracks', 't1'), { title: 'Test' });
    });
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(alice, 'tracks', 't1')));
  });

  it('forbids non-admin users from writing tracks', async () => {
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(alice, 'tracks', 't1'), { title: 'Test' }));
  });

  it('allows admin users to write tracks', async () => {
    await seedUser('admin1', 'admin');
    const admin = env.authenticatedContext('admin1').firestore();
    await assertSucceeds(
      setDoc(doc(admin, 'tracks', 't1'), { title: 'Test', era: 0 }),
    );
  });
});

describe('quizzes collection', () => {
  it('allows a user to create a non-template quiz they own', async () => {
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      addDoc(collection(alice, 'quizzes'), {
        ownerId: 'alice',
        title: 'My Quiz',
        description: '',
        isTemplate: false,
        tracks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
  });

  it('forbids a regular user from creating a template quiz', async () => {
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(
      addDoc(collection(alice, 'quizzes'), {
        ownerId: 'alice',
        title: 'Template',
        description: '',
        isTemplate: true,
        tracks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
  });

  it('allows any signed-in user to read a template quiz', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'quizzes', 'tmpl1'), {
        ownerId: 'admin1',
        title: 'Template',
        isTemplate: true,
        tracks: [],
      });
    });
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(alice, 'quizzes', 'tmpl1')));
  });

  it('forbids reading another user non-template quiz', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'quizzes', 'q1'), {
        ownerId: 'bob',
        title: 'Bob Quiz',
        isTemplate: false,
        tracks: [],
      });
    });
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(alice, 'quizzes', 'q1')));
  });
});

describe('attempts collection', () => {
  it('allows a user to create their own attempt', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      addDoc(collection(alice, 'attempts'), {
        userId: 'alice',
        quizId: 'q1',
        quizTitleSnapshot: 'Q',
        startedAt: Date.now(),
        finishedAt: Date.now(),
        totalQuestions: 0,
        correctCount: 0,
        partialCount: 0,
        wrongCount: 0,
        skippedCount: 0,
        totalScore: 0,
        results: [],
      }),
    );
  });

  it('forbids creating an attempt for another user', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(
      addDoc(collection(alice, 'attempts'), {
        userId: 'bob',
        quizId: 'q1',
        quizTitleSnapshot: 'Q',
        startedAt: Date.now(),
        finishedAt: Date.now(),
        totalQuestions: 0,
        correctCount: 0,
        partialCount: 0,
        wrongCount: 0,
        skippedCount: 0,
        totalScore: 0,
        results: [],
      }),
    );
  });
});

describe('feedback collection', () => {
  it('allows a signed-in user to create feedback', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertSucceeds(
      addDoc(collection(alice, 'feedback'), {
        userId: 'alice',
        userEmail: 'alice@example.com',
        message: 'Hi',
        createdAt: Date.now(),
        status: 'new',
      }),
    );
  });

  it('forbids regular users from reading feedback', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'feedback', 'f1'), {
        userId: 'bob',
        message: 'Test',
      });
    });
    await seedUser('alice', 'user');
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(alice, 'feedback', 'f1')));
  });
});

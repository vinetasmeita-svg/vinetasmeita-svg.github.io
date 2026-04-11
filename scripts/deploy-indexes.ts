// Deploy Firestore composite indexes defined in firestore.indexes.json
// via the Firestore Admin REST API, using the admin service-account
// credentials in .env.local. Avoids needing `firebase login`.
//
// Run: npm run deploy:indexes
//
// REQUIRED IAM (one-time setup on the service account):
//   roles/datastore.indexAdmin
// Grant via Google Cloud Console → IAM & Admin → IAM → find your Firebase
// Admin SDK service account → Edit → +Add Role → "Cloud Datastore Index Admin".
// Without this role, create POSTs return 403 PERMISSION_DENIED.
//
// Idempotent: reads existing indexes first and only POSTs ones that
// aren't already present. Index creation is async on Firebase's side
// (takes a minute or two on small collections) — this script returns
// as soon as the create requests are accepted.
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });

import fs from 'node:fs';
import { JWT } from 'google-auth-library';

const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.error('Missing FIREBASE_ADMIN_* env vars in .env.local');
  process.exit(1);
}

const client = new JWT({
  email: CLIENT_EMAIL,
  key: PRIVATE_KEY,
  scopes: [
    'https://www.googleapis.com/auth/datastore',
    'https://www.googleapis.com/auth/cloud-platform',
  ],
});

type IndexField = { fieldPath: string; order: 'ASCENDING' | 'DESCENDING' };
type IndexDef = {
  collectionGroup: string;
  queryScope: 'COLLECTION' | 'COLLECTION_GROUP';
  fields: IndexField[];
};

interface IndexesFile {
  indexes: IndexDef[];
}

const file: IndexesFile = JSON.parse(
  fs.readFileSync('firestore.indexes.json', 'utf8'),
);

async function authHeaders(): Promise<Record<string, string>> {
  const { token } = await client.getAccessToken();
  if (!token) throw new Error('No access token from service account');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function indexBase(collection: string): string {
  return (
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/(default)/collectionGroups/${collection}/indexes`
  );
}

/** Two index fields match if they target the same path with the same order. */
function fieldsMatch(a: IndexField[], b: IndexField[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].fieldPath !== b[i].fieldPath) return false;
    if (a[i].order !== b[i].order) return false;
  }
  return true;
}

async function listExistingIndexes(collection: string): Promise<Array<{ fields: IndexField[]; state?: string; name?: string }>> {
  const headers = await authHeaders();
  const resp = await fetch(indexBase(collection), { headers });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`List indexes for ${collection} failed: ${resp.status} ${body}`);
  }
  const data = (await resp.json()) as {
    indexes?: Array<{
      name?: string;
      state?: string;
      fields?: Array<{ fieldPath: string; order?: string }>;
    }>;
  };
  return (data.indexes ?? [])
    .map((idx) => ({
      name: idx.name,
      state: idx.state,
      // The API returns a trailing __name__ ASCENDING entry on every
      // composite index — strip it so we can compare against our config.
      fields: (idx.fields ?? [])
        .filter((f) => f.fieldPath !== '__name__' && f.order)
        .map((f) => ({
          fieldPath: f.fieldPath,
          order: f.order as 'ASCENDING' | 'DESCENDING',
        })),
    }))
    .filter((idx) => idx.fields.length > 0);
}

async function createIndex(def: IndexDef): Promise<void> {
  const headers = await authHeaders();
  const resp = await fetch(indexBase(def.collectionGroup), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      queryScope: def.queryScope,
      fields: def.fields,
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Create index for ${def.collectionGroup} failed: ${resp.status} ${body}`);
  }
  const body = (await resp.json()) as { name?: string };
  console.log(`  ✓ created index on ${def.collectionGroup}: ${def.fields.map((f) => `${f.fieldPath}:${f.order[0]}`).join(', ')}`);
  if (body.name) console.log(`    (${body.name})`);
}

async function main() {
  console.log(`Deploying ${file.indexes.length} Firestore indexes to project: ${PROJECT_ID}`);
  console.log('');

  // Group by collection so we only list existing indexes once per collection.
  const byCollection = new Map<string, IndexDef[]>();
  for (const def of file.indexes) {
    const arr = byCollection.get(def.collectionGroup) ?? [];
    arr.push(def);
    byCollection.set(def.collectionGroup, arr);
  }

  for (const [collection, defs] of byCollection) {
    console.log(`Collection: ${collection}`);
    const existing = await listExistingIndexes(collection);

    for (const def of defs) {
      const match = existing.find((e) => fieldsMatch(e.fields, def.fields));
      if (match) {
        console.log(`  = exists (${match.state ?? 'READY'}): ${def.fields.map((f) => `${f.fieldPath}:${f.order[0]}`).join(', ')}`);
        continue;
      }
      await createIndex(def);
    }
    console.log('');
  }

  console.log('Done. Note: index creation is async — new indexes may need');
  console.log('1-2 minutes before queries succeed. Check status in the');
  console.log('Firebase console → Firestore → Indexes tab.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

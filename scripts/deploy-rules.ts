// Deploy firestore.rules and storage.rules via the Firebase Rules REST API,
// using the admin service-account credentials in .env.local. This avoids
// needing `firebase login` interactively.
//
// Run: npx tsx scripts/deploy-rules.ts
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });

import fs from 'node:fs';
import { JWT } from 'google-auth-library';

const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.error('Missing FIREBASE_ADMIN_* env vars in .env.local');
  process.exit(1);
}

const client = new JWT({
  email: CLIENT_EMAIL,
  key: PRIVATE_KEY,
  scopes: [
    'https://www.googleapis.com/auth/firebase',
    'https://www.googleapis.com/auth/cloud-platform',
  ],
});

async function authHeaders(): Promise<Record<string, string>> {
  const { token } = await client.getAccessToken();
  if (!token) throw new Error('No access token from service account');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function deployRules(
  rulesFile: string,
  releaseName: string,
  label: string,
) {
  const source = fs.readFileSync(rulesFile, 'utf8');
  const headers = await authHeaders();

  // 1. Create a new ruleset
  const createRulesetResp = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source: {
          files: [{ name: rulesFile, content: source }],
        },
      }),
    },
  );
  if (!createRulesetResp.ok) {
    const body = await createRulesetResp.text();
    throw new Error(`${label}: create ruleset failed: ${createRulesetResp.status} ${body}`);
  }
  const ruleset = await createRulesetResp.json() as { name: string };
  console.log(`  ✓ created ruleset: ${ruleset.name}`);

  // 2. Update the release to point at this ruleset. If the release doesn't
  //    exist yet, create it. PATCH on a non-existent release returns 404, so
  //    we check-and-create.
  const releasePath = `projects/${PROJECT_ID}/releases/${releaseName}`;
  const getResp = await fetch(
    `https://firebaserules.googleapis.com/v1/${releasePath}`,
    { headers },
  );

  if (getResp.status === 404) {
    const createResp = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: releasePath,
          rulesetName: ruleset.name,
        }),
      },
    );
    if (!createResp.ok) {
      const body = await createResp.text();
      throw new Error(`${label}: create release failed: ${createResp.status} ${body}`);
    }
    console.log(`  ✓ created release ${releaseName}`);
  } else if (getResp.ok) {
    const updateResp = await fetch(
      `https://firebaserules.googleapis.com/v1/${releasePath}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          release: { name: releasePath, rulesetName: ruleset.name },
        }),
      },
    );
    if (!updateResp.ok) {
      const body = await updateResp.text();
      throw new Error(`${label}: update release failed: ${updateResp.status} ${body}`);
    }
    console.log(`  ✓ updated release ${releaseName}`);
  } else {
    const body = await getResp.text();
    throw new Error(`${label}: get release failed: ${getResp.status} ${body}`);
  }
}

async function main() {
  console.log(`Deploying rules to project: ${PROJECT_ID}`);
  console.log('');

  console.log('Firestore rules:');
  await deployRules('firestore.rules', 'cloud.firestore', 'firestore');
  console.log('');

  if (STORAGE_BUCKET) {
    console.log('Storage rules:');
    try {
      // Storage release name format: firebase.storage/{bucket}
      await deployRules('storage.rules', `firebase.storage/${STORAGE_BUCKET}`, 'storage');
    } catch (e) {
      console.warn('  ⚠ Storage rules deploy failed — this is OK if Firebase Storage');
      console.warn('    hasn\'t been provisioned yet. Signed URLs (used by the app) bypass');
      console.warn('    storage rules anyway. To enable public client-side storage access,');
      console.warn('    go to Firebase Console → Storage → Get started, then re-run this script.');
      console.warn(`    Original error: ${(e as Error).message.split('\n')[0]}`);
    }
    console.log('');
  } else {
    console.warn('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not set — skipping storage rules.');
  }

  console.log('Done. Rules should now be active.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

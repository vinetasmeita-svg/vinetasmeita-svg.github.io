#!/bin/bash
# Deploy Firestore indexes via firebase-tools using the service-account
# credentials in .env.local. Avoids interactive `firebase login`.
#
# Run: bash scripts/deploy-indexes-via-firebase-cli.sh
#
# Why this script exists:
#   Our scripts/deploy-indexes.ts hits the Firestore Admin REST API directly,
#   but that requires the "Cloud Datastore Index Admin" IAM role which isn't
#   granted to the default Firebase Admin SDK service account. firebase-tools
#   uses a different code path internally that works with the default SDK
#   role, so we shell out to it here.

set -euo pipefail

cd "$(dirname "$0")/.."

# Parse .env.local to extract admin credentials
if [ ! -f .env.local ]; then
  echo "Error: .env.local not found"
  exit 1
fi

# Build a minimal service-account JSON on the fly in a temp file so we
# never commit the key material and so it gets cleaned up on exit.
SA_FILE=$(mktemp -t firebase-sa-XXXXXX.json)
trap 'rm -f "$SA_FILE"' EXIT

# Source helper: read a single line value from .env.local
get_env() {
  grep -E "^$1=" .env.local | sed "s/^$1=//" | sed 's/^"//; s/"$//'
}

PROJECT_ID=$(get_env FIREBASE_ADMIN_PROJECT_ID)
CLIENT_EMAIL=$(get_env FIREBASE_ADMIN_CLIENT_EMAIL)
PRIVATE_KEY=$(get_env FIREBASE_ADMIN_PRIVATE_KEY)

if [ -z "$PROJECT_ID" ] || [ -z "$CLIENT_EMAIL" ] || [ -z "$PRIVATE_KEY" ]; then
  echo "Error: FIREBASE_ADMIN_* not set in .env.local"
  exit 1
fi

# Write the service-account JSON. Using python3 for safe JSON escaping
# because bash heredoc + backslashes in the private key is a minefield.
python3 - "$PROJECT_ID" "$CLIENT_EMAIL" "$PRIVATE_KEY" > "$SA_FILE" <<'PY'
import json, sys
project_id, client_email, private_key = sys.argv[1:4]
# The private key in .env.local has literal "\n" sequences that must
# be expanded to real newlines for google-auth to accept it.
private_key = private_key.replace('\\n', '\n')
json.dump({
    "type": "service_account",
    "project_id": project_id,
    "private_key": private_key,
    "client_email": client_email,
    "token_uri": "https://oauth2.googleapis.com/token",
}, sys.stdout)
PY

export GOOGLE_APPLICATION_CREDENTIALS="$SA_FILE"
export FIREBASE_PROJECT="$PROJECT_ID"

echo "Deploying indexes to $PROJECT_ID via firebase-tools..."
npx firebase deploy --only firestore:indexes --project "$PROJECT_ID" --non-interactive

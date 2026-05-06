#!/bin/sh
set -e

SECRETS_FILE="/data/.shipnote-secrets"

if [ -f "$SECRETS_FILE" ]; then
  . "$SECRETS_FILE"
fi

if [ -z "$SHIPNOTE_ADMIN_PASSWORD" ]; then
  SHIPNOTE_ADMIN_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")
  export SHIPNOTE_ADMIN_PASSWORD
  echo ""
  echo "========================================================="
  echo "  Shipnote admin password (save this!):"
  echo "  $SHIPNOTE_ADMIN_PASSWORD"
  echo "========================================================="
  echo ""
fi

if [ -z "$SHIPNOTE_SESSION_SECRET" ]; then
  SHIPNOTE_SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  export SHIPNOTE_SESSION_SECRET
fi

echo "export SHIPNOTE_ADMIN_PASSWORD=$SHIPNOTE_ADMIN_PASSWORD" > "$SECRETS_FILE"
echo "export SHIPNOTE_SESSION_SECRET=$SHIPNOTE_SESSION_SECRET" >> "$SECRETS_FILE"

node server.js

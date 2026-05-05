#!/bin/sh
set -e

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

node server.js

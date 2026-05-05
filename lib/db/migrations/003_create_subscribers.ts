// Subscribers for email notifications. Double opt-in via confirmation_token,
// one-click unsubscribe via unsubscribe_token. Both are random opaque strings.

import type { Migration } from "./types";

const migration: Migration = {
  version: 3,
  name: "create_subscribers",
  up: (db) => {
    db.exec(`
      CREATE TABLE subscribers (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        confirmed INTEGER NOT NULL DEFAULT 0,
        confirmation_token TEXT NOT NULL,
        unsubscribe_token TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
  },
};

export default migration;

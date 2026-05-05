// Categories. Created first because posts has an FK to it.
//
// Note: SHIPNOTE.md spec'd a column called "order" but that is a SQL reserved
// keyword. We use `display_order` instead. Functionally identical; documented
// in AGENTS.md sharp edges.

import type { Migration } from "./types";

const migration: Migration = {
  version: 1,
  name: "create_categories",
  up: (db) => {
    db.exec(`
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0
      );
    `);
  },
};

export default migration;

// Posts. The heart of the data model. FK to categories with ON DELETE SET NULL
// so deleting a category does not delete history.

import type { Migration } from "./types";

const migration: Migration = {
  version: 2,
  name: "create_posts",
  up: (db) => {
    db.exec(`
      CREATE TABLE posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        body_markdown TEXT NOT NULL,
        body_html TEXT NOT NULL DEFAULT '',
        category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
        is_draft INTEGER NOT NULL DEFAULT 1,
        published_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX idx_posts_published_at ON posts(published_at);
      CREATE INDEX idx_posts_is_draft ON posts(is_draft);
    `);
  },
};

export default migration;

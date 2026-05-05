// Widget config. v1 supports one project = one row. Seeded by migration 005.

import type { Migration } from "./types";

const migration: Migration = {
  version: 4,
  name: "create_widget_config",
  up: (db) => {
    db.exec(`
      CREATE TABLE widget_config (
        id TEXT PRIMARY KEY,
        project_name TEXT NOT NULL DEFAULT 'Shipnote',
        logo_url TEXT,
        accent_color TEXT NOT NULL DEFAULT '#3b82f6',
        position TEXT NOT NULL DEFAULT 'bottom-right',
        theme TEXT NOT NULL DEFAULT 'auto'
      );
    `);
  },
};

export default migration;

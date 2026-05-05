// SQLite connection + migrations runner.
//
// better-sqlite3 is synchronous on purpose. Do NOT wrap calls in `await`.
// The DB file location comes from SHIPNOTE_DB_PATH (see lib/env.ts).
//
// On first server-side import, we eagerly open the DB and run pending
// migrations so the schema is ready before any request arrives. To add a
// new migration, drop a file in `lib/db/migrations/` and register it in
// `migrations/index.ts`.

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";
import { migrations } from "./migrations";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = path.resolve(env.DB_PATH);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);

  _db = db;
  return db;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  const applied = new Set(
    db
      .prepare("SELECT version FROM _migrations")
      .all()
      .map((r) => (r as { version: number }).version)
  );

  const pending = migrations
    .filter((m) => !applied.has(m.version))
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) return;

  for (const m of pending) {
    const tx = db.transaction(() => {
      m.up(db);
      db.prepare(
        "INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)"
      ).run(m.version, m.name, Date.now());
    });
    tx();
    console.log(`[shipnote] applied migration ${m.version}: ${m.name}`);
  }
}

// Eagerly initialize on server-side import so migrations run on boot.
// Safe to call multiple times — getDb() is idempotent after first call.
if (typeof window === "undefined") {
  try {
    getDb();
  } catch {
    // If the DB can't be opened yet (e.g. during build), silently skip.
  }
}

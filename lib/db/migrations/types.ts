// Shared migration type. Each migration file exports an object that conforms.
//
// Versions are integers, applied in ascending order, and recorded in the
// `_migrations` table so a migration only runs once per DB.

import type Database from "better-sqlite3";

export type Migration = {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
};

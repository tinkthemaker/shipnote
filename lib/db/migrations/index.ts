// Ordered list of all migrations. Add a new migration by:
//   1. Creating `NNN_short_name.ts` in this directory.
//   2. Importing it below and appending to `migrations`.
//
// Versions must be unique, contiguous integers. Order matters: each migration
// runs in array order, inside a transaction, and only if its version is not
// already recorded in the `_migrations` table.

import type { Migration } from "./types";

import m001 from "./001_create_categories";
import m002 from "./002_create_posts";
import m003 from "./003_create_subscribers";
import m004 from "./004_create_widget_config";
import m005 from "./005_seed_defaults";

export const migrations: Migration[] = [m001, m002, m003, m004, m005];

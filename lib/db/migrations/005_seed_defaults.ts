// Seed the four default categories from SHIPNOTE.md Section 3, plus the single
// widget_config row. Runs once on first boot.

import crypto from "node:crypto";
import type { Migration } from "./types";

const migration: Migration = {
  version: 5,
  name: "seed_defaults",
  up: (db) => {
    const insertCategory = db.prepare(
      "INSERT INTO categories (id, name, color, display_order) VALUES (?, ?, ?, ?)"
    );
    const defaults: Array<[string, string, number]> = [
      ["Feature", "#22c55e", 1],
      ["Fix", "#ef4444", 2],
      ["Improvement", "#3b82f6", 3],
      ["Breaking Change", "#f59e0b", 4],
    ];
    for (const [name, color, order] of defaults) {
      insertCategory.run(crypto.randomUUID(), name, color, order);
    }

    db.prepare("INSERT INTO widget_config (id, project_name) VALUES (?, ?)").run(
      crypto.randomUUID(),
      "Shipnote"
    );
  },
};

export default migration;

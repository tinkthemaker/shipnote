// Slug generation and deduplication helpers.

import slugify from "slugify";
import { getDb } from "@/lib/db";

export function toSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, locale: "en" });
}

export function uniqueSlug(base: string): string {
  const slug = toSlug(base);
  const db = getDb();

  const existing = db
    .prepare("SELECT slug FROM posts WHERE slug = ?")
    .get(slug) as { slug: string } | undefined;

  if (!existing) return slug;

  let counter = 1;
  while (true) {
    const candidate = `${slug}-${counter}`;
    const collision = db
      .prepare("SELECT slug FROM posts WHERE slug = ?")
      .get(candidate) as { slug: string } | undefined;
    if (!collision) return candidate;
    counter++;
  }
}

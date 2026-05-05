// Server-side query helpers for public-facing routes.
// These run directly against SQLite (no API fetch needed in server components).

import { getDb } from "@/lib/db";

export type PublicPost = {
  id: string;
  title: string;
  slug: string;
  body_html: string;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  published_at: number;
  created_at: number;
  updated_at: number;
};

export function getPublishedPosts(): PublicPost[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.id, p.title, p.slug, p.body_html, p.category_id,
              p.published_at, p.created_at, p.updated_at,
              c.name AS category_name, c.color AS category_color
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_draft = 0
       ORDER BY p.published_at DESC`
    )
    .all() as PublicPost[];
}

export function getPublishedPostBySlug(slug: string): PublicPost | null {
  const db = getDb();
  return (db
    .prepare(
      `SELECT p.id, p.title, p.slug, p.body_html, p.category_id,
              p.published_at, p.created_at, p.updated_at,
              c.name AS category_name, c.color AS category_color
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? AND p.is_draft = 0`
    )
    .get(slug) ?? null) as PublicPost | null;
}

export function getCategories() {
  const db = getDb();
  return db
    .prepare("SELECT * FROM categories ORDER BY display_order ASC")
    .all() as Array<{
    id: string;
    name: string;
    color: string;
    display_order: number;
  }>;
}

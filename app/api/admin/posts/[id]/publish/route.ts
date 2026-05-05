// POST /api/admin/posts/[id]/publish
// Sets is_draft = false, published_at = now(), re-renders body_html.

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  body_markdown: string;
  body_html: string;
  category_id: string | null;
  is_draft: number;
  published_at: number | null;
  created_at: number;
  updated_at: number;
  category_name: string | null;
  category_color: string | null;
};

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = getDb();

  const existing = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.color AS category_color
       FROM posts p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`
    )
    .get(id) as PostRow | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  if (!existing.is_draft) {
    return NextResponse.json({ error: "Already published." }, { status: 400 });
  }

  const now = Date.now();
  const bodyHtml = renderMarkdown(existing.body_markdown);

  db.prepare(
    `UPDATE posts SET is_draft = 0, published_at = ?, body_html = ?, updated_at = ? WHERE id = ?`
  ).run(now, bodyHtml, now, id);

  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.color AS category_color
       FROM posts p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`
    )
    .get(id) as PostRow;

  return NextResponse.json({
    id: row.id,
    title: row.title,
    slug: row.slug,
    category_id: row.category_id,
    category_name: row.category_name,
    category_color: row.category_color,
    is_draft: false,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

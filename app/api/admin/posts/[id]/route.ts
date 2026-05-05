// PUT /api/admin/posts/[id] — update a post
// DELETE /api/admin/posts/[id] — delete a post

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

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = getDb();

  const existing = db
    .prepare("SELECT id FROM posts WHERE id = ?")
    .get(id) as { id: string } | undefined;
  if (!existing) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    slug?: string;
    body_markdown?: string;
    category_id?: string | null;
  };

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) {
    updates.push("title = ?");
    values.push(body.title.trim());
  }
  if (body.slug !== undefined) {
    updates.push("slug = ?");
    values.push(body.slug);
  }
  if (body.body_markdown !== undefined) {
    updates.push("body_markdown = ?");
    values.push(body.body_markdown);
    updates.push("body_html = ?");
    values.push(renderMarkdown(body.body_markdown));
  }
  if (body.category_id !== undefined) {
    updates.push("category_id = ?");
    values.push(body.category_id);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  updates.push("updated_at = ?");
  values.push(Date.now());
  values.push(id);

  db.prepare(`UPDATE posts SET ${updates.join(", ")} WHERE id = ?`).run(
    ...values
  );

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
    body_markdown: row.body_markdown,
    body_html: row.body_html,
    category_id: row.category_id,
    category_name: row.category_name,
    category_color: row.category_color,
    is_draft: Boolean(row.is_draft),
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = getDb();

  const result = db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

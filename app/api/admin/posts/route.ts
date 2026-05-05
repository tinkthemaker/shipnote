// GET /api/admin/posts — list all posts (drafts first, then published, sorted by date)
// POST /api/admin/posts — create a new post

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { renderMarkdown } from "@/lib/markdown";
import crypto from "node:crypto";

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

export function GET() {
  const db = getDb();
  const posts = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.color AS category_color
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.is_draft DESC, COALESCE(p.published_at, p.created_at) DESC`
    )
    .all() as PostRow[];

  return NextResponse.json(
    posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      body_markdown: p.body_markdown,
      body_html: p.body_html,
      category_id: p.category_id,
      category_name: p.category_name,
      category_color: p.category_color,
      is_draft: Boolean(p.is_draft),
      published_at: p.published_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }))
  );
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    title?: string;
    slug?: string;
    body_markdown?: string;
    category_id?: string;
  };

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const bodyMarkdown =
    typeof body.body_markdown === "string" ? body.body_markdown : "";
  const categoryId =
    typeof body.category_id === "string" ? body.category_id : null;

  const now = Date.now();
  const id = crypto.randomUUID();
  const slug = uniqueSlug(body.slug?.trim() || title);
  const bodyHtml = renderMarkdown(bodyMarkdown);

  const db = getDb();
  db.prepare(
    `INSERT INTO posts (id, title, slug, body_markdown, body_html, category_id, is_draft, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(id, title, slug, bodyMarkdown, bodyHtml, categoryId, now, now);

  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.color AS category_color
       FROM posts p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`
    )
    .get(id) as PostRow;

  return NextResponse.json(
    {
      id: row.id,
      title: row.title,
      slug: row.slug,
      category_id: row.category_id,
      category_name: row.category_name,
      category_color: row.category_color,
      is_draft: true,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    { status: 201 }
  );
}

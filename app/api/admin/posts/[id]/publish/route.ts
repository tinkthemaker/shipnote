// POST /api/admin/posts/[id]/publish
// Sets is_draft = false, published_at = now(), re-renders body_html.

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

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

  sendNotificationEmails(row).catch((err) => {
    console.error("[shipnote] failed to send notification emails:", err);
  });

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

async function sendNotificationEmails(post: PostRow) {
  if (!env.EMAIL_API_KEY) return;

  const db = getDb();
  const subscribers = db
    .prepare("SELECT email, unsubscribe_token FROM subscribers WHERE confirmed = 1")
    .all() as Array<{ email: string; unsubscribe_token: string }>;

  if (subscribers.length === 0) return;

  const postUrl = `${env.BASE_URL}/changelog/${post.slug}`;

  for (const sub of subscribers) {
    const unsubUrl = `${env.BASE_URL}/api/unsubscribe/${sub.unsubscribe_token}`;
    await sendEmail({
      to: sub.email,
      subject: post.title,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 22px; margin-bottom: 8px;">${escapeHtml(post.title)}</h1>
          ${
            post.category_name
              ? `<span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:600;color:white;background:${post.category_color ?? "#6b7280"}">${escapeHtml(post.category_name)}</span>`
              : ""
          }
          <div style="margin-top: 16px; line-height: 1.6; color: #3f3f46;">${post.body_html}</div>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;" />
          <p style="font-size: 12px; color: #a1a1aa;">
            <a href="${unsubUrl}" style="color: #a1a1aa;">Unsubscribe</a>
          </p>
        </div>
      `,
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

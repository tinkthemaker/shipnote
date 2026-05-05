import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const posts = db
    .prepare(
      `SELECT p.id, p.title, p.slug, p.body_html, p.published_at,
              c.name AS category_name, c.color AS category_color
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_draft = 0
       ORDER BY p.published_at DESC
       LIMIT 20`
    )
    .all();

  return NextResponse.json(
    posts.map((row: unknown) => {
      const p = row as Record<string, unknown>;
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        body_html: p.body_html,
        published_at: p.published_at,
        category_name: p.category_name,
        category_color: p.category_color,
      };
    })
  );
}

// GET /api/admin/categories — list all categories

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const db = getDb();
  const categories = db
    .prepare("SELECT * FROM categories ORDER BY display_order ASC")
    .all();
  return NextResponse.json(categories);
}

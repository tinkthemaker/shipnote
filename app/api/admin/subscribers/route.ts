import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const subscribers = db
    .prepare(
      "SELECT id, email, confirmed, created_at FROM subscribers ORDER BY created_at DESC"
    )
    .all();
  return NextResponse.json(subscribers);
}

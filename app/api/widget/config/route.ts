import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const config = db
    .prepare("SELECT project_name, logo_url, accent_color, position, theme FROM widget_config LIMIT 1")
    .get() as {
    project_name: string;
    logo_url: string | null;
    accent_color: string;
    position: string;
    theme: string;
  } | undefined;

  if (!config) {
    return NextResponse.json({
      project_name: "Shipnote",
      logo_url: null,
      accent_color: "#3b82f6",
      position: "bottom-right",
      theme: "auto",
    });
  }

  return NextResponse.json(config);
}

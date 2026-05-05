import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const db = getDb();

  const sub = db
    .prepare("SELECT id, confirmed FROM subscribers WHERE confirmation_token = ?")
    .get(params.token) as { id: string; confirmed: number } | undefined;

  if (!sub) {
    return new Response(renderPage("Invalid link", "This confirmation link is not valid."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  if (sub.confirmed) {
    return new Response(renderPage("Already confirmed", "You're already subscribed!"), {
      headers: { "Content-Type": "text/html" },
    });
  }

  db.prepare("UPDATE subscribers SET confirmed = 1 WHERE id = ?").run(sub.id);

  return new Response(renderPage("You're subscribed!", "You'll now receive email notifications when we publish updates."), {
    headers: { "Content-Type": "text/html" },
  });
}

function renderPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f4f4f5;">
  <div style="text-align:center;padding:24px;">
    <h1 style="font-size:24px;margin-bottom:12px;">${title}</h1>
    <p style="color:#71717a;font-size:16px;">${message}</p>
    <a href="/" style="display:inline-block;margin-top:16px;color:#3b82f6;">Back to changelog</a>
  </div>
</body>
</html>`;
}

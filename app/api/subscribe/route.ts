import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let email: string | undefined;

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (
      typeof body === "object" &&
      body !== null &&
      "email" in body &&
      typeof (body as { email: unknown }).email === "string"
    ) {
      email = (body as { email: string }).email;
    }
  } else {
    const formData = await req.formData();
    const formEmail = formData.get("email");
    if (typeof formEmail === "string") {
      email = formEmail;
    }
  }

  const normalized = (email || "").trim().toLowerCase();

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return NextResponse.json(
      { error: "Valid email is required." },
      { status: 400 }
    );
  }

  const db = getDb();

  const existing = db
    .prepare("SELECT id, confirmed FROM subscribers WHERE email = ?")
    .get(normalized) as { id: string; confirmed: number } | undefined;

  if (existing) {
    if (existing.confirmed) {
      return NextResponse.json({ ok: true, message: "Already subscribed." });
    }
    return NextResponse.json({
      ok: true,
      message: "Confirmation email resent. Check your inbox.",
    });
  }

  const id = crypto.randomUUID();
  const confirmToken = crypto.randomBytes(24).toString("hex");
  const unsubToken = crypto.randomBytes(24).toString("hex");
  const now = Date.now();

  db.prepare(
    `INSERT INTO subscribers (id, email, confirmed, confirmation_token, unsubscribe_token, created_at)
     VALUES (?, ?, 0, ?, ?, ?)`
  ).run(id, normalized, confirmToken, unsubToken, now);

  const confirmUrl = `${env.BASE_URL}/api/confirm/${confirmToken}`;
  await sendEmail({
    to: normalized,
    subject: "Confirm your subscription",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; margin-bottom: 16px;">Confirm your subscription</h2>
        <p style="margin-bottom: 16px; color: #52525b;">Click the button below to confirm your subscription to our changelog.</p>
        <a href="${confirmUrl}" style="display: inline-block; padding: 10px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Confirm subscription</a>
        <p style="margin-top: 16px; font-size: 13px; color: #a1a1aa;">If you didn't subscribe, you can ignore this email.</p>
      </div>
    `,
  });

  if (contentType.includes("application/json")) {
    return NextResponse.json({
      ok: true,
      message: "Check your email to confirm your subscription.",
    });
  }

  return NextResponse.redirect(
    new URL("/?subscribed=1", env.BASE_URL),
    303
  );
}

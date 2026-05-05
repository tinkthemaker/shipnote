// Protects /admin/* and /api/admin/* (except the login + logout routes).
// Verifies the session cookie's HMAC and expiry.
//
// Next.js middleware runs in the Edge Runtime, which does not support
// `node:crypto`. We use the Web Crypto API here instead. The server-side
// counterpart (lib/auth.ts) uses `node:crypto` for the route handlers.

import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "shipnote_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const PROTECTED_PREFIXES = ["/admin", "/api/admin"];
const PUBLIC_ADMIN_ROUTES = new Set([
  "/admin/login",
  "/api/admin/login",
  "/api/admin/logout",
]);

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const binary = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifySessionCookie(
  value: string | undefined
): Promise<boolean> {
  if (!value) return false;
  const [payloadB64, hmacHex] = value.split(".");
  if (!payloadB64 || !hmacHex) return false;

  const secret = process.env.SHIPNOTE_SESSION_SECRET;
  if (!secret) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signature = new Uint8Array(
    hmacHex.match(/.{2}/g)!.map((b) => parseInt(b, 16))
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    new TextEncoder().encode(payloadB64)
  );
  if (!valid) return false;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payloadB64))
    ) as { exp: number };
    if (typeof payload.exp !== "number") return false;
    if (Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const protectedHit = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!protectedHit) return NextResponse.next();
  if (PUBLIC_ADMIN_ROUTES.has(pathname)) return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Because verify is async but Next.js middleware can be async, we return
  // a promise-based check. Next.js handles async middleware natively.
  return verifySessionCookie(cookie).then((ok) => {
    if (ok) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

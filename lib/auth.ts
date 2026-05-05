// Admin session cookie: signed, expiry-bound, no DB lookup needed.
//
// Cookie value format: <base64url(payload)>.<hex(hmac)>
// Payload JSON: { exp: <unix_ms> }
// HMAC: SHA-256 over the payload bytes, keyed by SHIPNOTE_SESSION_SECRET.
//
// We avoid a Users table per SHIPNOTE.md Section 3. There is one admin.

import crypto from "node:crypto";
import { env } from "@/lib/env";

export const SESSION_COOKIE_NAME = "shipnote_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type SessionPayload = { exp: number };

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payloadB64: string): string {
  return crypto
    .createHmac("sha256", env.SESSION_SECRET)
    .update(payloadB64)
    .digest("hex");
}

export function createSessionCookie(): {
  name: string;
  value: string;
  maxAgeSeconds: number;
} {
  const payload: SessionPayload = { exp: Date.now() + SESSION_TTL_MS };
  const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload)));
  const hmac = sign(payloadB64);
  return {
    name: SESSION_COOKIE_NAME,
    value: `${payloadB64}.${hmac}`,
    maxAgeSeconds: Math.floor(SESSION_TTL_MS / 1000),
  };
}

export function verifySessionCookie(value: string | undefined): boolean {
  if (!value) return false;
  const [payloadB64, hmac] = value.split(".");
  if (!payloadB64 || !hmac) return false;

  const expected = sign(payloadB64);
  // Length-equal check before timingSafeEqual to avoid throwing.
  if (expected.length !== hmac.length) return false;
  if (
    !crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(hmac, "hex"))
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(b64urlDecode(payloadB64).toString()) as SessionPayload;
    if (typeof payload.exp !== "number") return false;
    if (Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

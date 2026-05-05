// Centralized env var access. Throws early if a required value is missing.
// Defaults match `.env.example` and `SHIPNOTE.md` Section 7.

import crypto from "node:crypto";

function read(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value !== undefined && value !== "") return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

function readOptional(name: string): string | undefined {
  const value = process.env[name];
  return value === undefined || value === "" ? undefined : value;
}

// SHIPNOTE_ADMIN_PASSWORD: required. In dev, default to "dev". In prod, callers
// should set it explicitly (the Docker entrypoint generates one on first boot).
const ADMIN_PASSWORD = read(
  "SHIPNOTE_ADMIN_PASSWORD",
  process.env.NODE_ENV === "production" ? undefined : "dev"
);

// SHIPNOTE_SESSION_SECRET: required. Used to HMAC the admin session cookie.
// In dev, fall back to a placeholder so first-run is frictionless. Warn if used.
let sessionSecret = readOptional("SHIPNOTE_SESSION_SECRET");
if (!sessionSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SHIPNOTE_SESSION_SECRET must be set in production. Generate one with `openssl rand -hex 32`."
    );
  }
  sessionSecret = "dev-secret-change-me-in-production";
  if (typeof window === "undefined") {
    // Only log on the server.
    console.warn(
      "[shipnote] SHIPNOTE_SESSION_SECRET not set; using insecure dev default."
    );
  }
}

export const env = {
  ADMIN_PASSWORD,
  SESSION_SECRET: sessionSecret,
  BASE_URL: read("SHIPNOTE_BASE_URL", "http://localhost:3000"),
  DB_PATH: read("SHIPNOTE_DB_PATH", "./data/shipnote.db"),
  EMAIL_PROVIDER: read("SHIPNOTE_EMAIL_PROVIDER", "resend"),
  EMAIL_API_KEY: readOptional("SHIPNOTE_EMAIL_API_KEY"),
  EMAIL_FROM: readOptional("SHIPNOTE_EMAIL_FROM"),
  MCP_TOKEN: readOptional("SHIPNOTE_MCP_TOKEN"),
};

// Constant-time password comparison. Used by the login route.
export function passwordMatches(submitted: string): boolean {
  const a = Buffer.from(submitted);
  const b = Buffer.from(env.ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

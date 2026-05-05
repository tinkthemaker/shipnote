# AGENTS.md — Operating Instructions for AI Agents

> If you are a model, agent, or contributor working in this repo, read this file first. Read `SHIPNOTE.md` second. Then start work.

## Read order

1. `SHIPNOTE.md` — the product spec. What Shipnote is, what it does, what it does not do. This document is the source of truth. If anything else in the repo contradicts it, `SHIPNOTE.md` wins.
2. `TASKS.md` — the build plan as vertical slices. Pick the next unchecked slice and do that one only.
3. This file — how to actually work in the repo without losing your bearings.

## Project at a glance

Shipnote is a self-hosted, open-source changelog tool. Stack is Next.js (App Router) + TypeScript, better-sqlite3, TipTap, Tailwind CSS, Resend. One Docker container, one SQLite file, one process. The full spec is in `SHIPNOTE.md`; do not duplicate it here.

## Working in the repo

### Run the dev server

```bash
npm install
cp .env.example .env.local
npm run dev
```

App runs on `http://localhost:3000`. Admin is at `/admin`. Public changelog is at `/`. Demo page (fake "Acme App" with the widget embedded) is at `/demo`.

### Reset the database

```bash
rm -f ./data/shipnote.db
npm run dev
```

Migrations live in `lib/db/migrations/` and run on app boot when the DB file is missing or behind. Default seed data (the four built-in categories and one widget config row) is inserted on first migration.

### Dev credentials

The admin password in development is whatever you set in `.env.local` as `SHIPNOTE_ADMIN_PASSWORD`. The default in `.env.example` is `dev`. Do not commit a real password.

### Verify a slice

Each slice in `TASKS.md` has a "Verify" section listing the curl commands or click paths that prove the slice works. Run those before claiming a slice is done. If a step fails, fix it before committing. Do not check the slice off in `TASKS.md` until every step passes.

## Rules

### Scope

Do not add features that are not in `SHIPNOTE.md` or in the current slice in `TASKS.md`. Section 8 of `SHIPNOTE.md` lists what is explicitly out of scope; re-read it before adding anything. If you think a feature is helpful, write it down in the "v2 candidates" section at the bottom of `TASKS.md` and move on.

### Dependencies

The tech stack listed in `SHIPNOTE.md` Section 5 is fixed. Do not add new top-level dependencies (a new framework, ORM, queue, broker, etc.) without explicit approval. Small utility libraries (slugify, date-fns, zod, uuid, marked, dompurify) are fine if they directly serve a slice; note them in your commit message.

The widget is vanilla JS only. No React, no Preact, no jQuery in `widget/`. Total widget bundle stays under 15KB gzipped.

### Code style

TypeScript everywhere except the widget. Prefer simple functions over classes. Server components by default; use `"use client"` only where interactivity demands it. No clever abstractions until there are at least three call sites. No premature performance optimization.

### Git discipline

Commit at the end of each slice. One slice = one commit (or a small handful if it gets large). Tag each completed slice: `git tag slice-N-name`. Commit message format: `slice N: <what was done>`. Example: `slice 2: admin post CRUD with TipTap editor`. Do not amend or force-push to a tagged commit.

### When you are unsure

If a user request contradicts `SHIPNOTE.md`, ask before changing course. Do not silently expand scope. If a slice's "Verify" recipe fails, do not mark the slice done.

## File map (target — created across the slices)

```
shipnote/
├── app/                    # Next.js App Router routes
│   ├── (public)/           # Public changelog, post page, RSS, demo
│   ├── admin/              # Admin dashboard pages
│   └── api/                # Public + admin API route handlers
├── components/             # React components (admin + public)
├── lib/
│   ├── db/                 # SQLite connection, migrations, query helpers
│   │   └── migrations/
│   ├── email.ts            # Resend integration
│   ├── markdown.ts         # Markdown -> sanitized HTML
│   └── mcp/                # MCP server implementation
├── widget/
│   └── widget.js           # Vanilla JS widget; built and served at /widget.js
├── public/
│   └── demo.html           # Fake Acme App for widget testing (served at /demo)
├── data/                   # Gitignored. SQLite file lives here in dev.
├── SHIPNOTE.md             # Product spec
├── TASKS.md                # Build plan (slices)
├── AGENTS.md               # This file
├── .env.example            # All env vars, with dev defaults
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Sharp edges (add to this list as you find more)

- TipTap's markdown extension needs the markdown serializer wired up explicitly. Defaults are HTML.
- better-sqlite3 is synchronous. Do not wrap calls in `await`.
- Next.js App Router caches GET API routes aggressively. Use `export const dynamic = 'force-dynamic'` on routes that read mutable state.
- Shadow DOM in the widget needs styles attached inside the shadow root, not the document head, or they will be stripped by host-page CSS resets.
- Resend will reject `from` addresses on unverified domains. In dev, use the provider's default test sender.
- `categories.order` from `SHIPNOTE.md` Section 3 is implemented as `categories.display_order` because `order` is a SQL reserved keyword. Use `display_order` in all queries and code.

If you discover another sharp edge, append it here so the next agent does not re-discover it.

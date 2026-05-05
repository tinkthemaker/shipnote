# TASKS.md — Build Plan

> Shipnote is built in vertical slices. Each slice ends with the app still running and something newly testable. Do one slice per branch or commit. Tag completed slices.
>
> Read `SHIPNOTE.md` for the product spec. Read `AGENTS.md` for how to work in the repo. Then pick the next unchecked slice below.

## Slice progress

- [x] Slice 1 — Project scaffold + DB + admin login
- [x] Slice 2 — Admin post CRUD with TipTap
- [x] Slice 3 — Markdown rendering + public changelog page
- [x] Slice 4 — Permalinks, category filter, RSS feed
- [x] Slice 5 — Vanilla JS widget + /demo page
- [x] Slice 6 — Subscribers, double opt-in, publish-triggered email
- [x] Slice 7 — MCP server (SSE) with two tools
- [x] Slice 8 — Dockerfile + one-command run

---

## Slice 1 — Project scaffold + DB + admin login

**Goal:** A Next.js app that boots, connects to SQLite, runs migrations, and lets you log into `/admin` with a password from `.env.local`.

**In scope:**

- `npm init`, Next.js (App Router) + TypeScript, Tailwind CSS configured.
- `lib/db/index.ts` — better-sqlite3 connection that opens `SHIPNOTE_DB_PATH`.
- `lib/db/migrations/` — one migration file per table. Run on boot if the DB file is missing or behind the latest migration version.
- Tables created: `posts`, `categories`, `subscribers`, `widget_config` (matching `SHIPNOTE.md` Section 3 schemas).
- Seed data: the four default categories (Feature, Fix, Improvement, Breaking Change) and one widget config row.
- `/admin/login` page: password field, posts to `/api/admin/login`.
- `/api/admin/login` route: compares against `SHIPNOTE_ADMIN_PASSWORD`, sets a signed session cookie on success.
- `/admin` page: shows "Hello, admin" placeholder if logged in, redirects to `/admin/login` otherwise.
- Middleware (or per-route check) protecting `/admin/*` and `/api/admin/*`.
- `.gitignore` covering `node_modules/`, `.next/`, `.env.local`, `data/`.

**Verify:**

1. `npm install && npm run dev` starts on `:3000` with no errors.
2. `./data/shipnote.db` is created. `sqlite3 ./data/shipnote.db ".tables"` lists `posts`, `categories`, `subscribers`, `widget_config`.
3. `sqlite3 ./data/shipnote.db "SELECT name FROM categories;"` returns the four defaults.
4. Visiting `/admin` while logged out redirects to `/admin/login`.
5. `curl -X POST http://localhost:3000/api/admin/login -d '{"password":"wrong"}' -H 'Content-Type: application/json'` returns 401.
6. Same with the correct password returns 200 and a `Set-Cookie` header.
7. With that cookie, `/admin` renders the placeholder.

**Commit:** `slice 1: project scaffold, sqlite, admin login` → `git tag slice-1-scaffold`.

---

## Slice 2 — Admin post CRUD with TipTap

**Goal:** The admin can write, edit, list, draft, and delete posts. Publish flips `is_draft = false` and sets `published_at`. No emails yet.

**In scope:**

- `/admin` becomes a sidebar layout: left side lists posts (drafts above published, sorted by date), right side is the editor or empty state.
- "New Post" button opens the editor at `/admin/posts/new`.
- TipTap editor with markdown serialization. Toolbar: H1/H2/H3, bold, italic, inline code, code block, ordered list, unordered list, link.
- Title field. Slug auto-generated from title, editable.
- Category dropdown populated from the `categories` table.
- "Save Draft" and "Publish" buttons. Publishing sets `is_draft = false`, `published_at = now()`, and stores rendered `body_html` alongside `body_markdown`.
- API routes (all session-protected): `GET /api/admin/posts`, `POST /api/admin/posts`, `PUT /api/admin/posts/:id`, `DELETE /api/admin/posts/:id`, `POST /api/admin/posts/:id/publish`.

**Verify:**

1. Log into `/admin`. Click "New Post". Write a markdown post. Click "Save Draft" → returns to list with the draft at the top.
2. Click the draft, edit it, click "Publish" → moves to "Published" section. `published_at` is set.
3. `sqlite3 ./data/shipnote.db "SELECT id, title, slug, is_draft, length(body_html) FROM posts;"` shows the row with rendered HTML present.
4. Delete a post from the list → row removed from DB.
5. Two posts with the same title produce different slugs (collision handling).

**Commit:** `slice 2: admin post CRUD with TipTap` → `git tag slice-2-post-crud`.

---

## Slice 3 — Markdown rendering + public changelog page

**Goal:** Anonymous visitors at `/` see a reverse-chronological list of published posts, server-rendered, no login required.

**In scope:**

- `lib/markdown.ts` — markdown to sanitized HTML. Use a boring library (e.g. `marked` plus `isomorphic-dompurify`, or `unified` + `rehype-sanitize`). Note the choice in the commit message.
- `/` page (server component): fetch all published posts, render title, date, category badge, body HTML.
- Tailwind styling that looks decent at zero config (clean, single column, generous spacing).
- "Powered by Shipnote" footer link, on by default. Togglable later from widget config.
- Drafts must never appear on `/`.

**Verify:**

1. Publish three posts with different categories from the admin.
2. Visit `/` in a logged-out browser. All three appear, newest first, with category badges and rendered markdown.
3. Drafts do not appear.
4. View source — content is in the initial HTML payload (server-rendered, not a client fetch).
5. A post with `<script>` in its markdown body renders as escaped text, not an executed script.

**Commit:** `slice 3: public changelog page with markdown rendering` → `git tag slice-3-public-page`.

---

## Slice 4 — Permalinks, category filter, RSS feed

**Goal:** Each post has its own URL. Visitors can filter by category. RSS works.

**In scope:**

- `/changelog/[slug]` route — single post view. 404 if slug not found or post is a draft.
- Category filter bar at the top of `/`. Clicking a category filters the list via query param `?category=feature`. "All" link clears the filter.
- `/feed.xml` route — RSS 2.0 feed of published posts. Includes title, link (using `SHIPNOTE_BASE_URL`), pubDate, category, and full rendered HTML in `<description>`.

**Verify:**

1. Click a post on `/` → routes to `/changelog/<slug>` showing the full post.
2. Visit `/changelog/does-not-exist` → 404.
3. Click the "Feature" badge in the filter bar → URL becomes `/?category=feature`, only Feature posts show.
4. `curl http://localhost:3000/feed.xml` returns valid XML with all published posts and correct content type (`application/rss+xml`).
5. Paste the feed URL into an RSS reader (or run it through `https://validator.w3.org/feed/`) — passes validation.

**Commit:** `slice 4: permalinks, category filter, RSS feed` → `git tag slice-4-permalinks-rss`.

---

## Slice 5 — Vanilla JS widget + /demo page

**Goal:** A `<script>` tag drops a working "What's New" bell into any page. The demo page proves it.

**In scope:**

- `widget/widget.js` — vanilla JS, no framework. Built and served at `/widget.js`.
- On load: fetches `/api/widget/config` (theming) and `/api/widget/posts` (recent published posts). Mounts a shadow DOM, renders a floating bell at the configured screen position.
- Badge shows count of posts published after the timestamp in `localStorage.shipnote_last_seen`.
- Click the bell → slide-out panel from the right. Cards show title, date, category badge, truncated preview. Click a card → expands inline.
- `/api/widget/config` and `/api/widget/posts` route handlers.
- `/demo` route serving a single static HTML page with mock SaaS dashboard layout (sidebar, header, fake content cards) and the widget script tag embedded.
- Total widget bundle target: under 15KB gzipped. Report size in the slice's commit message.

**Verify:**

1. Open `/demo`. The bell icon appears in the configured position.
2. With three published posts and an empty `localStorage`, the badge shows "3".
3. Click the bell → panel slides in. All three posts render correctly. Click one → expands.
4. Close panel, reload `/demo`. Badge shows "0" (last_seen updated). Publish a fourth post in admin. Reload `/demo`. Badge shows "1".
5. View page source on `/demo`. Confirm widget styles live inside the shadow root and do not leak to the host page (host-page text styling unaffected).
6. Bundle size check: `gzip -c <built widget.js> | wc -c` reports under 15360 bytes.

**Commit:** `slice 5: embeddable widget + demo page` → `git tag slice-5-widget`.

---

## Slice 6 — Subscribers, double opt-in, publish-triggered email

**Goal:** Visitors can subscribe by email. They get a confirmation email. When you publish, confirmed subscribers get the post.

**In scope:**

- Subscribe form on `/` (and optionally inside the widget panel).
- `POST /api/subscribe` — creates an unconfirmed subscriber, sends a confirmation email containing a link to `/api/confirm/{token}`.
- `GET /api/confirm/[token]` — flips `confirmed = true`. Renders a "you're subscribed" page.
- `GET /api/unsubscribe/[token]` — removes (or marks) the subscriber. Renders a "you're unsubscribed" page.
- `lib/email.ts` — Resend integration. If `SHIPNOTE_EMAIL_API_KEY` is unset, log the email body to console and return success. The rest of the app keeps working.
- On publish: synchronously send a styled HTML email to all confirmed subscribers with the post title (subject), rendered HTML body, and a per-subscriber unsubscribe link.

**Verify:**

1. With a Resend test key set, subscribe with your own email on `/`. Confirmation email arrives.
2. Click confirmation link → page says "You're subscribed." Subscriber row has `confirmed = 1`.
3. Publish a new post in admin. Email arrives at the inbox with the post body and an unsubscribe link.
4. Click unsubscribe → row removed (or marked). Future publishes do not send to that address.
5. Without `SHIPNOTE_EMAIL_API_KEY` set, repeat steps 1 and 3. The app does not crash; emails are logged to the dev console; everything else still works.

**Commit:** `slice 6: subscribers, double opt-in, publish emails` → `git tag slice-6-email`.

---

## Slice 7 — MCP server (SSE) with two tools

**Goal:** An MCP client can connect to `/mcp` with a bearer token and call `draft_changelog_entry` and `list_recent_entries`.

**In scope:**

- `lib/mcp/` — SSE-based MCP server implementation. Use the official MCP SDK if it integrates with Next.js route handlers; otherwise minimal handcrafted SSE.
- `/mcp` route handler.
- Bearer token check against `SHIPNOTE_MCP_TOKEN`. If the env var is unset, the route returns 404 (server effectively disabled).
- Tool `draft_changelog_entry` — input `{ title: string, body: string, category?: string }`. Creates a draft post (matches category by name; falls back to the first category if not found). Returns `{ id, title, slug, status: "draft" }`.
- Tool `list_recent_entries` — input `{ count?: number }` (default 10, max 50). Returns array of `{ id, title, slug, category, published_at, body_markdown }`.

**Verify:**

1. Set `SHIPNOTE_MCP_TOKEN=test123` in `.env.local`. Restart the dev server.
2. Connect an MCP client (Claude Code, Cursor, or a small test script using `@modelcontextprotocol/sdk`) to `http://localhost:3000/mcp` with the bearer token.
3. Call `draft_changelog_entry` with `title: "Test from MCP"`, `body: "## hello"` → returns success. Check `/admin` — the draft appears.
4. Call `list_recent_entries` with `count: 3` → returns the three most recent published posts in the documented shape.
5. Without the bearer token, the connection is rejected with 401.
6. With `SHIPNOTE_MCP_TOKEN` unset, `curl /mcp` returns 404.

**Commit:** `slice 7: MCP server with draft and list tools` → `git tag slice-7-mcp`.

---

## Slice 8 — Dockerfile + one-command run

**Goal:** `docker run -d -p 3000:3000 -v shipnote-data:/data shipnote/shipnote` works exactly as promised in the README.

**In scope:**

- `Dockerfile` — multi-stage build. Final image runs `next start` (or the standalone server output).
- `docker-compose.yml` for local development.
- README quick-start updated to match the Docker promise.
- Migrations run on container boot. If `SHIPNOTE_ADMIN_PASSWORD` is unset, generate a random one and print it to the container logs on first boot.
- Volume mount at `/data` holds the SQLite file (default `SHIPNOTE_DB_PATH` for the Docker image is `/data/shipnote.db`).

**Verify:**

1. `docker build -t shipnote/shipnote .` succeeds.
2. `docker run -d -p 3000:3000 -v shipnote-data:/data shipnote/shipnote` starts cleanly.
3. `docker logs <container>` shows the generated admin password if no env var was set.
4. Visit `http://localhost:3000/admin` and log in with the printed password.
5. Stop and restart the container. Posts persist (volume mount works).
6. README quick-start commands copy-paste cleanly to a fresh machine and produce a working install.

**Commit:** `slice 8: dockerfile + one-command run` → `git tag slice-8-docker` and `git tag v0.1.0`.

---

## v2 candidates (do not build now)

Capture ideas here as they come up so they don't drift into v1. None of these should be started until v0.1.0 ships.

- AI writing assist that drafts posts from a list of merged PRs.
- Multi-project support (one Shipnote, many widgets, many changelogs).
- Post search.
- Scheduled publishing.
- Image upload (currently external URLs in markdown only).
- Webhook integrations on publish.
- Analytics dashboard (views, opens, clicks).
- Custom CSS theming beyond accent color.
- Multi-user admin auth with roles.
- Comments or reactions on posts.
- Internationalization.

# Shipnote — Project Definition

> **Purpose of this document:** This is the single source of truth for building Shipnote. Any model, agent, or contributor working on this project should read this file first. It defines what Shipnote is, what it does, what it does not do, and how it should be built. If a decision contradicts this document, this document wins unless explicitly updated.

---

## 1. What Shipnote Is

Shipnote is a standalone, self-hosted, open-source changelog tool. It lets developers write release notes in markdown, display them to users via a public page and an embeddable widget, notify subscribers by email, and expose an MCP server so AI agents can draft entries automatically.

One Docker container. One SQLite database. One purpose.

---

## 2. Who It Is For

**Primary audience:** Solo developers and small teams shipping SaaS products who need a changelog but don't want to pay $29–$99/month for Beamer/Headway and don't want to maintain a Notion page.

**Secondary audiences:**
- Developer tool companies (APIs, CLIs, platforms) whose users expect structured changelogs with RSS and category filtering.
- Open source maintainers who already write CHANGELOG.md and want a hosted, browsable, subscribable version.

**Who it is NOT for:**
- Large enterprises with compliance-driven release management.
- Marketing teams who want announcement pages with embedded video, confetti, and campaign analytics.
- Anyone who needs a roadmap, feedback board, or feature voting — that is a different product.

---

## 3. Data Model

Four entities. No more.

### Posts
| Field         | Type     | Notes                                      |
|---------------|----------|--------------------------------------------|
| id            | string   | UUID or CUID                               |
| title         | string   | Required                                   |
| slug          | string   | Auto-generated from title, unique           |
| body_markdown | text     | Raw markdown as written by the author       |
| body_html     | text     | Rendered HTML, generated on save            |
| category_id   | FK       | References Categories                       |
| is_draft      | boolean  | Default true                                |
| published_at  | datetime | Set when is_draft flips to false            |
| created_at    | datetime |                                             |
| updated_at    | datetime |                                             |

### Categories
| Field | Type   | Notes                                              |
|-------|--------|----------------------------------------------------|
| id    | string | UUID or CUID                                       |
| name  | string | e.g. "Feature", "Fix", "Improvement", "Breaking"  |
| color | string | Hex color code for badge rendering                  |
| order | int    | Display sort order                                  |

Default seed: Feature (#22c55e), Fix (#ef4444), Improvement (#3b82f6), Breaking Change (#f59e0b).

### Subscribers
| Field             | Type     | Notes                                  |
|-------------------|----------|----------------------------------------|
| id                | string   |                                         |
| email             | string   | Unique, validated format                |
| confirmed         | boolean  | Default false (double opt-in)          |
| confirmation_token| string   | For double opt-in flow                  |
| unsubscribe_token | string   | For one-click unsubscribe              |
| created_at        | datetime |                                         |

### WidgetConfig
| Field        | Type   | Notes                                         |
|--------------|--------|-----------------------------------------------|
| id           | string | One row per project (v1 supports one project) |
| project_name | string | Displayed in widget header                    |
| logo_url     | string | Optional                                       |
| accent_color | string | Hex code                                       |
| position     | string | "bottom-right" | "bottom-left"                |
| theme        | string | "light" | "dark" | "auto"                     |

**There is no Users table in v1.** Admin auth is a single password set via environment variable. A lightweight session cookie keeps the admin logged in.

---

## 4. Application Surfaces

### 4.1 Admin Dashboard (`/admin`)

- Protected by password login (password from `SHIPNOTE_ADMIN_PASSWORD` env var).
- Sidebar listing all posts: drafts at top, published below, sorted by date.
- "New Post" opens the editor.
- Editor uses TipTap with markdown serialization. Toolbar for headings, bold, italic, code, lists, links, images.
- Category dropdown selector.
- "Save Draft" and "Publish" buttons. Publishing sets `is_draft = false` and `published_at = now()`, triggers email notification to confirmed subscribers.
- Settings page for: project name, logo URL, accent color, widget position, widget theme, email provider API key.
- Subscriber list view (email, confirmed status, date). No bulk actions in v1.

### 4.2 Public Changelog Page (`/`)

- Server-rendered, SEO-friendly, no login required.
- Reverse-chronological list of published posts.
- Each post displays: title, published date, category badge (colored), rendered markdown body.
- Filter bar at top to filter by category.
- Each post has a permalink: `/changelog/{slug}`.
- RSS icon linking to `/feed.xml`.
- Email subscribe form at bottom (triggers double opt-in flow).
- Optional "Powered by Shipnote" footer link (on by default, togglable in admin settings).

### 4.3 Embeddable Widget

**Embed code:**
```html
<script src="https://your-shipnote-instance.com/widget.js" data-project="default"></script>
```

**Behavior:**
1. On load, fetches `/api/widget/config` for theming and `/api/widget/posts` for recent published posts.
2. Renders a floating button (bell icon) at the configured screen position.
3. Badge on the button shows count of posts published after the user's last viewed timestamp (tracked in `localStorage`).
4. Clicking the button opens a slide-out panel with post cards (title, date, category badge, truncated preview).
5. Clicking a card expands it inline within the panel to show the full rendered post.
6. Panel has a header showing the project name and optionally the logo.

**Technical constraints:**
- Vanilla JS. No framework dependency.
- Shadow DOM to isolate styles from the host app.
- Total bundle size target: under 15KB gzipped.
- Must work on any site: static HTML, React, Vue, Svelte, Rails, whatever.

### 4.4 RSS Feed (`/feed.xml`)

- Standard RSS 2.0 or Atom feed.
- Auto-generated from published posts.
- Includes title, date, category, and full rendered HTML body per entry.
- Updates immediately on publish.

### 4.5 Email Notifications

- Triggered on post publish (fire-and-forget). The publish API returns immediately; emails are sent in the background. If the process dies mid-send, some subscribers may not receive the email with no retry. This is acceptable for v1 scale (dozens to hundreds of subscribers).
- Sent only to confirmed subscribers. Emails are sent serially, one per subscriber.
- Email content: post title as subject, rendered markdown body as HTML email body, unsubscribe link at bottom.
- Requires one env var: `SHIPNOTE_EMAIL_API_KEY` (for Resend or Postmark — pick one as default, document the other).
- If no email API key is configured, email notifications are silently skipped. The rest of the app works fine without it.

### 4.6 MCP Server (`/mcp`)

Speaks JSON-RPC over HTTP POST (Streamable HTTP pattern — SSE was deprecated in the MCP spec on 2025-03-26). Exposes two tools:

**`draft_changelog_entry`**
- Input: `title` (string, required), `body` (string, markdown, required), `category` (string, optional — matches by name, falls back to uncategorized).
- Action: Creates a draft post in the database. Does NOT publish.
- Returns: `{ id, title, slug, status: "draft" }`

**`list_recent_entries`**
- Input: `count` (integer, optional, default 10, max 50).
- Action: Returns the last N published posts.
- Returns: Array of `{ id, title, slug, category, published_at, body_markdown }`

**Auth:** The MCP server requires a bearer token set via `SHIPNOTE_MCP_TOKEN` env var. If not set, the MCP server is disabled.

### 4.7 Demo Page (`/demo`)

A fake "Acme App" dashboard page bundled with Shipnote for development and demonstration purposes. It is a single static HTML page with placeholder SaaS UI content and the Shipnote widget script tag embedded. This page is used to:

1. Develop and test the widget without needing a real app.
2. Let potential users try the widget experience before installing.
3. Serve as living documentation for the embed integration.

---

## 5. Tech Stack

| Layer          | Choice                  | Rationale                                   |
|----------------|-------------------------|---------------------------------------------|
| Framework      | Next.js (App Router)    | SSR for public page, SPA for admin          |
| Database       | SQLite (better-sqlite3) | Zero-config, single file, no server         |
| Markdown       | TipTap                  | Rich editor with markdown serialization     |
| Email          | Resend (primary)        | Simple API, generous free tier              |
| MCP Transport  | SSE                     | 2026 standard, simplest to implement        |
| Containerization | Docker                | Single container, single volume mount       |
| Styling        | Tailwind CSS            | Utility-first, keeps styling co-located     |

**Hard constraints:**
- No Redis.
- No background job queue (email is synchronous on publish).
- No external database server.
- No Kafka, RabbitMQ, or any message broker.
- One Docker container, one process.

---

## 6. API Routes

### Public
| Method | Path                        | Purpose                          |
|--------|-----------------------------|---------------------------------|
| GET    | `/`                         | Public changelog page            |
| GET    | `/changelog/{slug}`         | Single post page                 |
| GET    | `/feed.xml`                 | RSS feed                         |
| GET    | `/demo`                     | Demo page with embedded widget   |
| POST   | `/api/subscribe`            | Email subscribe (double opt-in)  |
| GET    | `/api/confirm/{token}`      | Confirm subscription             |
| GET    | `/api/unsubscribe/{token}`  | One-click unsubscribe            |
| GET    | `/api/widget/config`        | Widget theming config            |
| GET    | `/api/widget/posts`         | Recent posts for widget          |

### Admin (session-protected)
| Method | Path                        | Purpose                          |
|--------|-----------------------------|---------------------------------|
| POST   | `/api/admin/login`          | Password login, returns session  |
| GET    | `/api/admin/posts`          | List all posts (drafts + published)|
| POST   | `/api/admin/posts`          | Create post                      |
| PUT    | `/api/admin/posts/{id}`     | Update post                      |
| DELETE | `/api/admin/posts/{id}`     | Delete post                      |
| POST   | `/api/admin/posts/{id}/publish` | Publish post + send emails    |
| GET    | `/api/admin/subscribers`    | List subscribers                 |
| GET    | `/api/admin/categories`     | List categories                  |
| POST   | `/api/admin/categories`     | Create category                  |
| PUT    | `/api/admin/categories/{id}`| Update category                  |
| DELETE | `/api/admin/categories/{id}`| Delete category                  |
| GET    | `/api/admin/settings`       | Get widget config + settings     |
| PUT    | `/api/admin/settings`       | Update widget config + settings  |

### MCP (bearer token protected)
| Transport | Path   | Tools                                           |
|-----------|--------|-------------------------------------------------|
| SSE       | `/mcp` | `draft_changelog_entry`, `list_recent_entries`  |

---

## 7. Environment Variables

| Variable                    | Required | Default                  | Purpose                                    |
|-----------------------------|----------|--------------------------|--------------------------------------------|
| `SHIPNOTE_ADMIN_PASSWORD`   | Yes      | (generated on first run) | Admin login password                       |
| `SHIPNOTE_SESSION_SECRET`   | Yes      | (generated on first run) | HMAC secret for signing admin session cookie |
| `SHIPNOTE_BASE_URL`         | No       | `http://localhost:3000`  | Used in emails, RSS, widget                |
| `SHIPNOTE_EMAIL_PROVIDER`   | No       | `resend`                 | "resend" or "postmark"                     |
| `SHIPNOTE_EMAIL_API_KEY`    | No       | (none)                   | Enables email notifications                |
| `SHIPNOTE_EMAIL_FROM`       | No       | (none)                   | "From" address for outgoing email; required if email API key is set |
| `SHIPNOTE_MCP_TOKEN`        | No       | (none)                   | Enables MCP server                         |
| `SHIPNOTE_DB_PATH`          | No       | `/data/shipnote.db`      | SQLite file location                       |

---

## 8. What v1 Does NOT Include

These are explicitly out of scope. Do not build them. They are listed here so that no agent or contributor adds them thinking they are helpful.

- **Analytics/metrics** — no view counts, click tracking, or engagement dashboards.
- **Multi-user auth** — no team accounts, roles, or permissions.
- **AI writing assistance** — no "generate changelog from commits" in the editor.
- **Webhook integrations** — no outbound webhooks on publish.
- **Marketplace or plugin system** — no extensions, no third-party integrations.
- **Multi-project support** — one Shipnote instance = one project.
- **Comments or reactions** — the changelog is one-directional communication.
- **Search** — category filtering is sufficient for v1 volume.
- **Internationalization** — English only in v1.
- **Image uploads** — use external image URLs in markdown. No file storage.
- **Scheduled publishing** — publish is immediate. No "schedule for Tuesday."
- **Custom CSS/themes beyond the config** — accent color, position, and light/dark mode. No custom CSS editor.

---

## 9. Design Principles

1. **One Docker command to run.** If installation requires more than `docker run` with a volume mount, it is too complex.
2. **Works without optional features.** No email key? Email is skipped. No MCP token? MCP is disabled. The core (write posts, show changelog, embed widget) always works.
3. **Opinionated defaults.** The public page and widget should look good with zero configuration. Default categories, default colors, default positioning.
4. **Markdown is the source of truth.** Posts are stored as markdown. HTML is a rendered artifact. If the rendering engine changes, re-render from markdown.
5. **No external services required.** SQLite is the database. The app serves its own assets. The only optional external dependency is a transactional email API.
6. **Boring technology.** Next.js, SQLite, Tailwind. No exotic dependencies, no bleeding-edge libraries, no build tools that require explanation.
7. **Scope is a feature.** What Shipnote does not do is as important as what it does. Resist scope creep. If a feature doesn't serve the core loop (write → publish → notify → display), it waits for v2.

---

## 10. Development & Testing Without a Real App

Since there is no SaaS product to embed the widget into during development, the following setup is used for end-to-end verification:

1. **Admin flow:** Run Shipnote locally. Open `/admin`. Create a post, assign a category, publish it.
2. **Public page flow:** Open `/` in a browser. Confirm the post appears. Click into the permalink. Confirm category filtering works.
3. **Widget flow:** Open `/demo` (the fake Acme App page). Confirm the widget button appears. Confirm the badge shows new post count. Click it, confirm the slide-out panel shows the post.
4. **RSS flow:** Open `/feed.xml` in a browser or RSS reader. Confirm the published post appears.
5. **Email flow:** Set `SHIPNOTE_EMAIL_API_KEY` to a Resend test key. Subscribe with your own email on the public page. Confirm the double opt-in email. Publish a post. Confirm the notification email arrives.
6. **MCP flow:** Point an MCP client (Claude Code, Cursor, or a test script) at `localhost:3000/mcp` with the bearer token. Call `draft_changelog_entry`. Confirm the draft appears in the admin. Call `list_recent_entries`. Confirm it returns published posts.

---

## 11. File Structure (Reference)

```
shipnote/
├── app/                    # Next.js App Router
│   ├── (public)/           # Public routes (changelog, feed, demo)
│   ├── admin/              # Admin dashboard pages
│   └── api/                # API route handlers
├── components/             # React components (admin UI, public page)
├── lib/
│   ├── db.ts               # SQLite connection + query helpers
│   ├── email.ts            # Email sending (Resend/Postmark)
│   ├── markdown.ts         # Markdown → HTML rendering
│   └── mcp.ts              # MCP server implementation
├── widget/
│   └── widget.js           # Embeddable vanilla JS widget (built separately)
├── public/
│   └── demo.html           # Fake Acme App for widget testing
├── Dockerfile
├── docker-compose.yml
├── SHIPNOTE.md             # This file
├── README.md
└── package.json
```

---

## 12. Guiding Instruction for AI Agents

If you are a model or agent working on this project:

- Read this entire document before writing any code.
- Do not add features not listed in this document.
- If you are unsure whether something is in scope, it is not.
- Prefer simple, readable code over clever abstractions.
- Every component should be understandable in isolation.
- Do not introduce dependencies not listed in the tech stack (Section 5) without explicit approval.
- The widget (Section 4.3) is vanilla JS with a shadow DOM. Do not use React, Preact, or any framework for the widget.
- SQLite is the only database. Do not add Postgres, MySQL, or any other database support.
- If a test can be done with curl, write the curl command. Do not add a test framework unless the project reaches a scale where it is necessary.
- When in doubt, do less. Ship the simplest version that works.

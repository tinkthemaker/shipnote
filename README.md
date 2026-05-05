# Shipnote

Self-hosted, open-source changelog tool. One Docker container, one SQLite file, one process.

<!-- screenshots: public page, admin editor, widget on demo page -->

## Features

- **Markdown editor** — TipTap-powered rich editor with markdown serialization
- **Public changelog** — Server-rendered, fast, SEO-friendly
- **Permalinks** — Every post at `/changelog/<slug>`
- **Categories** — Feature, Fix, Improvement, Breaking Change (customizable)
- **RSS feed** — Full-content RSS 2.0 at `/feed.xml`
- **Email subscribers** — Double opt-in, publish-triggered notifications via Resend
- **Embeddable widget** — Vanilla JS, shadow DOM, 3KB gzipped. Drop it into any site
- **MCP server** — Let AI agents draft entries via `draft_changelog_entry` and `list_recent_entries`
- **One binary** — No Redis, no Postgres, no external dependencies

## Quick start

### Docker (recommended)

```bash
docker run -d \
  --name shipnote \
  -p 3000:3000 \
  -v shipnote-data:/data \
  shipnote/shipnote
```

On first boot, Shipnote prints a generated admin password to the container logs:

```bash
docker logs shipnote
```

Then visit `http://localhost:3000/admin` and log in.

### docker compose

```bash
git clone https://github.com/tinkthemaker/shipnote.git
cd shipnote
docker compose up -d
```

### Local development

```bash
git clone https://github.com/tinkthemaker/shipnote.git
cd shipnote
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Admin is at `/admin`, password is `dev`.

## Embedding the widget

Add this snippet to any page:

```html
<script src="https://your-shipnote-domain.com/widget.js" async></script>
```

A bell icon appears in the bottom-right corner. Visitors click it to see recent updates. Unread count is tracked automatically via `localStorage`.

See `/demo` for a live example.

## Configuration

All config is via environment variables. Copy `.env.example` to `.env.local` for development, or pass them with `docker run -e`.

| Variable | Default | Description |
|---|---|---|
| `SHIPNOTE_ADMIN_PASSWORD` | *(auto-generated)* | Admin login password. In dev: `dev`. In Docker: printed to logs on first boot. |
| `SHIPNOTE_BASE_URL` | `http://localhost:3000` | Public URL. Used in email links, RSS, widget. |
| `SHIPNOTE_DB_PATH` | `./data/shipnote.db` | SQLite file path. Docker default: `/data/shipnote.db`. |
| `SHIPNOTE_SESSION_SECRET` | *(auto-generated)* | HMAC key for session cookies. |
| `SHIPNOTE_EMAIL_PROVIDER` | `resend` | Email provider. Currently only `resend`. |
| `SHIPNOTE_EMAIL_API_KEY` | — | Resend API key. Unset = emails logged to console, app still works. |
| `SHIPNOTE_EMAIL_FROM` | — | Sender address (e.g. `changelog@yourdomain.com`). |
| `SHIPNOTE_MCP_TOKEN` | — | Bearer token for MCP access. Unset = MCP server disabled (404). |

## Project structure

```
shipnote/
├── app/                    # Next.js App Router
│   ├── (public)/           # Public changelog, permalinks, RSS, demo
│   ├── admin/              # Admin dashboard + editor
│   ├── api/                # REST API routes (public + admin)
│   ├── mcp/                # MCP JSON-RPC endpoint
│   └── widget.js/          # Serves the embeddable widget
├── components/             # React components
├── lib/
│   ├── db/                 # SQLite connection + migrations
│   ├── email.ts            # Resend integration
│   ├── markdown.ts         # Markdown → sanitized HTML
│   └── mcp/                # MCP request handler
├── widget/widget.js        # Vanilla JS widget source
├── public/demo.html        # Demo page (fake "Acme App")
├── data/                   # SQLite file (gitignored)
├── Dockerfile
├── docker-compose.yml
└── entrypoint.sh
```

## Tech stack

- **Next.js 14** (App Router, standalone output)
- **better-sqlite3** — synchronous, file-based, zero-config
- **TipTap** — rich text editor with markdown serialization
- **Tailwind CSS** — utility-first styling
- **Resend** — transactional email
- **Vanilla JS** — widget (no framework, under 15KB gzipped)

## API

### Public

| Method | Path | Description |
|---|---|---|
| GET | `/` | Public changelog |
| GET | `/changelog/[slug]` | Single post |
| GET | `/feed.xml` | RSS 2.0 feed |
| POST | `/api/subscribe` | Subscribe by email |
| GET | `/api/confirm/[token]` | Confirm subscription |
| GET | `/api/unsubscribe/[token]` | Unsubscribe |
| GET | `/widget.js` | Embeddable widget script |
| GET | `/api/widget/config` | Widget configuration |
| GET | `/api/widget/posts` | Widget post data |

### Admin (session-protected)

| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/login` | Login |
| GET | `/api/admin/posts` | List all posts |
| POST | `/api/admin/posts` | Create post |
| GET | `/api/admin/posts/[id]` | Get single post |
| PUT | `/api/admin/posts/[id]` | Update post |
| DELETE | `/api/admin/posts/[id]` | Delete post |
| POST | `/api/admin/posts/[id]/publish` | Publish draft |
| GET | `/api/admin/subscribers` | List subscribers |

### MCP

`POST /mcp` — JSON-RPC 2.0 endpoint. Requires `Authorization: Bearer <token>` header.

**Tools:**
- `draft_changelog_entry` — Create a draft post
- `list_recent_entries` — List recent published posts

## License

MIT

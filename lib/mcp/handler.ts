import { getDb } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

const TOOLS = [
  {
    name: "draft_changelog_entry",
    description: "Create a new draft changelog entry",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Post title" },
        body: { type: "string", description: "Post body in Markdown" },
        category: {
          type: "string",
          description:
            "Category name (e.g. Feature, Fix). Falls back to first category if not found.",
        },
      },
      required: ["title", "body"],
    },
  },
  {
    name: "list_recent_entries",
    description: "List recent changelog entries",
    inputSchema: {
      type: "object" as const,
      properties: {
        count: {
          type: "number",
          description: "Number of entries to return (default 10, max 50)",
        },
      },
    },
  },
];

function ok(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function err(
  id: string | number | null,
  code: number,
  message: string
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function handleDraftChangelogEntry(
  params: Record<string, unknown>
): unknown {
  const title = typeof params.title === "string" ? params.title : "";
  const body = typeof params.body === "string" ? params.body : "";
  const category =
    typeof params.category === "string" ? params.category : undefined;

  if (!title || !body) {
    throw new Error("title and body are required");
  }

  const db = getDb();

  let categoryId: string | null = null;
  if (category) {
    const found = db
      .prepare("SELECT id FROM categories WHERE LOWER(name) = LOWER(?)")
      .get(category) as { id: string } | undefined;
    if (found) categoryId = found.id;
  }

  if (!categoryId) {
    const first = db
      .prepare(
        "SELECT id FROM categories ORDER BY display_order ASC LIMIT 1"
      )
      .get() as { id: string } | undefined;
    categoryId = first?.id ?? null;
  }

  const slug = uniqueSlug(title);
  const id = crypto.randomUUID();
  const now = Date.now();

  db.prepare(
    `INSERT INTO posts (id, title, slug, body_markdown, body_html, category_id, is_draft, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, '', ?, 1, NULL, ?, ?)`
  ).run(id, title, slug, body, categoryId, now, now);

  return { id, title, slug, status: "draft" };
}

function handleListRecentEntries(params: Record<string, unknown>): unknown {
  const count =
    typeof params.count === "number" ? Math.min(Math.max(params.count, 1), 50) : 10;
  const db = getDb();

  const posts = db
    .prepare(
      `SELECT p.id, p.title, p.slug, p.body_markdown, p.published_at, c.name AS category
       FROM posts p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_draft = 0
       ORDER BY p.published_at DESC
       LIMIT ?`
    )
    .all(count) as Array<{
    id: string;
    title: string;
    slug: string;
    body_markdown: string;
    published_at: number;
    category: string | null;
  }>;

  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category,
    published_at: p.published_at,
    body_markdown: p.body_markdown,
  }));
}

export function handleMcpRequest(req: JsonRpcRequest): JsonRpcResponse {
  const { id = null, method, params = {} } = req;

  switch (method) {
    case "initialize":
      return ok(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "shipnote", version: "1.0.0" },
      });

    case "notifications/initialized":
      return ok(id, {});

    case "tools/list":
      return ok(id, { tools: TOOLS });

    case "tools/call": {
      const toolName = typeof params.name === "string" ? params.name : "";
      const toolArgs =
        typeof params.arguments === "object" && params.arguments !== null
          ? (params.arguments as Record<string, unknown>)
          : {};

      try {
        switch (toolName) {
          case "draft_changelog_entry":
            return ok(id, {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(handleDraftChangelogEntry(toolArgs)),
                },
              ],
            });

          case "list_recent_entries":
            return ok(id, {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(handleListRecentEntries(toolArgs)),
                },
              ],
            });

          default:
            return err(id, -32601, `Unknown tool: ${toolName}`);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Tool execution failed";
        return err(id, -32000, message);
      }
    }

    case "ping":
      return ok(id, {});

    default:
      return err(id, -32601, `Method not found: ${method}`);
  }
}

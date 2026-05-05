import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { handleMcpRequest } from "@/lib/mcp/handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

function unauthorized() {
  return NextResponse.json(
    { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Unauthorized" } },
    { status: 401 }
  );
}

export async function POST(req: Request) {
  if (!env.MCP_TOKEN) {
    return new NextResponse(null, { status: 404 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${env.MCP_TOKEN}`) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400 }
    );
  }

  if (Array.isArray(body)) {
    const results = body.map((item: unknown) =>
      handleMcpRequest(item as JsonRpcRequest)
    );
    return NextResponse.json(results);
  }

  const response = handleMcpRequest(body as JsonRpcRequest);
  return NextResponse.json(response);
}

export async function GET() {
  if (!env.MCP_TOKEN) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse("SSE endpoint — use POST for JSON-RPC", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

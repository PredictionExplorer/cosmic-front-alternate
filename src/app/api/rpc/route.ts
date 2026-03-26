/**
 * JSON-RPC proxy — forwards requests to NEXT_PUBLIC_RPC_URL from the server.
 * The browser calls same-origin /api/rpc (HTTPS) so we avoid mixed-content and
 * typical CORS blocks on self-hosted HTTP nodes.
 */
import { NextRequest, NextResponse } from "next/server";
import { extractJsonRpcErrors } from "@/lib/web3/jsonRpcResponseIssues";

const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "sepolia";

const DEFAULT_RPC: Record<string, string> = {
  local: "http://161.129.67.42:22945",
  sepolia: "http://161.129.67.42:22545",
  mainnet: "",
};

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL?.trim() ||
  DEFAULT_RPC[NETWORK] ||
  DEFAULT_RPC.sepolia;

/** Upstream RPC can be slow; avoid aborting before the node responds */
const UPSTREAM_TIMEOUT_MS = 60_000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!RPC_URL) {
    return NextResponse.json(
      { error: "RPC URL not configured (NEXT_PUBLIC_RPC_URL)" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      console.error(
        "[api/rpc] Upstream returned non-JSON:",
        res.status,
        text.slice(0, 500),
      );
      return NextResponse.json(
        {
          error: "RPC upstream returned non-JSON",
          status: res.status,
          preview: text.slice(0, 200),
        },
        { status: 502 },
      );
    }

    if (process.env.NODE_ENV === "development") {
      const rpcErrors = extractJsonRpcErrors(data);
      if (rpcErrors.length > 0) {
        console.error(
          "[api/rpc] Upstream JSON-RPC error (forwarded to client). HTTP",
          res.status,
          "| errors:",
          JSON.stringify(rpcErrors).slice(0, 2000),
        );
      }
      if (!res.ok) {
        console.error(
          "[api/rpc] Upstream non-OK HTTP",
          res.status,
          "| body preview:",
          text.slice(0, 500),
        );
      }
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : "Error";

    console.error("[api/rpc] Failed:", name, message, "| target:", RPC_URL);

    const isAbort = name === "AbortError" || message.includes("aborted");
    return NextResponse.json(
      {
        error: isAbort
          ? "RPC upstream timed out (check node reachability from this machine)"
          : "RPC proxy request failed",
        detail: message,
        target: RPC_URL,
      },
      { status: 502 },
    );
  }
}

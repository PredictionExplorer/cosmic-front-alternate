/**
 * JSON-RPC proxy — forwards requests to NEXT_PUBLIC_RPC_URL from the server.
 * The browser calls same-origin /api/rpc (HTTPS) so we avoid mixed-content and
 * typical CORS blocks on self-hosted HTTP nodes.
 */
import { NextRequest, NextResponse } from "next/server";

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
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/rpc]", err);
    return NextResponse.json(
      { error: "RPC proxy request failed" },
      { status: 500 },
    );
  }
}

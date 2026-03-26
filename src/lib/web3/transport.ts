/**
 * Web3 transport for viem/wagmi.
 *
 * JSON-RPC to **http://** nodes from an **https://** page is blocked (mixed content)
 * and many self-hosted nodes omit CORS. The Next.js route `/api/rpc` proxies to
 * NEXT_PUBLIC_RPC_URL server-side (same pattern as the blue frontend).
 *
 * **Browser:** every JSON-RPC POST is sent to same-origin `/api/rpc` via
 * viem’s `onFetchRequest`, not only a URL computed at module init. That matters
 * because `http(url)` closes over `url` when the transport is created — if that
 * runs before `window` exists or in an unexpected order, requests could still
 * hit the raw RPC and fail CORS on `https://localhost` (`--experimental-https`).
 *
 * **Server (RSC / Node):** no `window` → requests go to the chain’s RPC URL directly.
 */

import { http, type Transport } from "viem";
import { type Chain } from "viem/chains";
import { extractJsonRpcErrors } from "@/lib/web3/jsonRpcResponseIssues";

/**
 * Used for startup logging: true when the browser will use `/api/rpc` for reads.
 */
export function shouldUseRpcProxy(rpcUrl: string): boolean {
  return rpcUrl.trim().length > 0;
}

/**
 * Create a transport for a chain (browser POSTs to /api/rpc; server uses RPC URL).
 */
export function createProxyTransport(chain: Chain): Transport {
  const rpcUrl = chain.rpcUrls.default.http[0]?.trim();
  if (!rpcUrl) {
    throw new Error(`Chain "${chain.name}" has no default RPC HTTP URL`);
  }

  return http(rpcUrl, {
    timeout: 30_000,
    retryCount: 3,
    retryDelay: 1000,
    key: "http",
    name: "HTTP JSON-RPC",
    async onFetchRequest(_request, init) {
      if (typeof window === "undefined") {
        return undefined;
      }
      return { ...init, url: `${window.location.origin}/api/rpc` };
    },
    async onFetchResponse(response) {
      if (process.env.NODE_ENV !== "development") return;
      if (typeof window === "undefined") return;

      if (!response.ok) {
        const text = await response.clone().text().catch(() => "");
        console.error(
          "[viem→/api/rpc] HTTP",
          response.status,
          response.statusText,
          "| body:",
          text.slice(0, 800),
        );
        return;
      }

      const text = await response.clone().text().catch(() => "");
      if (!text) return;
      try {
        const json = JSON.parse(text) as unknown;
        const rpcErrors = extractJsonRpcErrors(json);
        if (rpcErrors.length > 0) {
          console.error(
            "[viem→/api/rpc] JSON-RPC error in response body:",
            JSON.stringify(rpcErrors).slice(0, 2000),
          );
        }
      } catch {
        /* not JSON */
      }
    },
  });
}

/**
 * Create transports for all chains.
 */
export function createTransportsForChains(
  chains: readonly Chain[],
): Record<number, Transport> {
  const transports: Record<number, Transport> = {};
  for (const chain of chains) {
    transports[chain.id] = createProxyTransport(chain);
  }
  return transports;
}

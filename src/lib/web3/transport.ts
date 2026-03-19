/**
 * Web3 transport for viem/wagmi.
 *
 * JSON-RPC to **http://** nodes from an **https://** page is blocked (mixed content)
 * and many self-hosted nodes omit CORS. The Next.js route `/api/rpc` proxies to
 * NEXT_PUBLIC_RPC_URL server-side (same pattern as the blue frontend).
 *
 * **https://** RPC URLs (Infura, public Arbitrum, etc.) are used directly.
 */

import { http, type Transport } from "viem";
import { type Chain } from "viem/chains";

/**
 * True when the browser should call same-origin /api/rpc instead of the raw URL.
 * HTTPS RPC endpoints are used directly; HTTP (e.g. LAN / self-hosted) uses the proxy.
 */
export function shouldUseRpcProxy(rpcUrl: string): boolean {
  const u = rpcUrl.trim();
  if (!u) return false;
  if (u.startsWith("https://")) return false;
  if (u.startsWith("http://")) return true;
  return false;
}

function getEffectiveRpcUrl(rpcUrl: string): string {
  if (typeof window === "undefined") {
    // Server / SSR: no mixed-content; call node directly
    return rpcUrl;
  }
  if (shouldUseRpcProxy(rpcUrl)) {
    return `${window.location.origin}/api/rpc`;
  }
  return rpcUrl;
}

/**
 * Create a transport for a chain (proxy on browser for HTTP RPC URLs).
 */
export function createProxyTransport(chain: Chain): Transport {
  const rpcUrl = chain.rpcUrls.default.http[0];
  const url = getEffectiveRpcUrl(rpcUrl);
  return http(url, {
    timeout: 30_000,
    retryCount: 3,
    retryDelay: 1000,
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

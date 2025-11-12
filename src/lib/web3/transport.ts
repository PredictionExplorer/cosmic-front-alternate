/**
 * Custom Web3 Transport with Proxy Support
 * 
 * Handles RPC requests through the Next.js proxy when running on HTTPS
 * to avoid mixed content errors with HTTP RPC endpoints.
 */

import { http, type Transport } from 'viem';
import { type Chain } from 'viem/chains';

/**
 * Check if we need to proxy RPC requests
 */
function shouldUseRpcProxy(rpcUrl: string): boolean {
  // Only check in browser
  if (typeof window === 'undefined') return false;
  
  // Check if page is HTTPS
  const isPageSecure = window.location.protocol === 'https:';
  if (!isPageSecure) return false;
  
  // Check if RPC URL is HTTP
  return rpcUrl.startsWith('http://');
}

/**
 * Wrap RPC URL with proxy if needed
 */
function wrapRpcWithProxy(rpcUrl: string): string {
  if (!shouldUseRpcProxy(rpcUrl)) return rpcUrl;
  return `/api/proxy?url=${encodeURIComponent(rpcUrl)}`;
}

/**
 * Create a transport with automatic proxy routing for HTTP RPCs
 */
export function createProxyTransport(chain: Chain): Transport {
  const rpcUrl = chain.rpcUrls.default.http[0];
  const proxiedUrl = wrapRpcWithProxy(rpcUrl);
  
  return http(proxiedUrl, {
    timeout: 30_000,
    retryCount: 3,
    retryDelay: 1000,
  });
}

/**
 * Create transports for all chains with proxy support
 */
export function createTransportsForChains(chains: readonly Chain[]): Record<number, Transport> {
  const transports: Record<number, Transport> = {};
  
  for (const chain of chains) {
    transports[chain.id] = createProxyTransport(chain);
  }
  
  return transports;
}


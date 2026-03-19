/**
 * API Network Hook
 *
 * Sets the API client chain id from NEXT_PUBLIC_NETWORK (same convention as blue).
 * Base URL comes from NEXT_PUBLIC_API_URL (see networkConfig / api service).
 */

"use client";

import { useEffect } from "react";
import { api } from "@/services/api";
import { getNetworkName, getDefaultChainId } from "@/lib/networkConfig";

/**
 * Hook to align API client with the env-selected network.
 *
 * Uses NEXT_PUBLIC_NETWORK → chain id; API base is NEXT_PUBLIC_API_URL.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useApiNetwork();
 * }
 * ```
 */
export function useApiNetwork() {
  useEffect(() => {
    const envChainId = getDefaultChainId();
    const networkName = getNetworkName(envChainId);

    console.log(
      `[useApiNetwork] Using network from ENV: ${networkName} (Chain ID: ${envChainId})`,
    );
    api.setChainId(envChainId);
  }, []);

  return { chainId: getDefaultChainId() };
}

/**
 * API Network Hook
 *
 * Automatically updates the API service endpoint when the user switches networks.
 * Ensures API calls go to the correct backend for the current chain.
 */

"use client";

import { useEffect } from "react";
import { useChainId } from "wagmi";
import { api } from "@/services/api";

/**
 * Hook to sync API endpoint with current network
 *
 * This hook monitors the current chain ID and automatically
 * updates the API service to use the correct backend endpoint.
 *
 * - Local Testnet (31337): Port 7070
 * - Arbitrum Sepolia (421614): Port 8383
 * - Arbitrum One (42161): Port 8383
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useApiNetwork(); // That's it! API endpoint will auto-update
 *   
 *   // Your component code...
 * }
 * ```
 */
export function useApiNetwork() {
  const chainId = useChainId();

  useEffect(() => {
    // Update API service with current chain ID
    if (chainId) {
      api.setChainId(chainId);
    }
  }, [chainId]);

  return { chainId };
}


/**
 * API Network Hook
 *
 * Sets the API service endpoint based on NEXT_PUBLIC_DEFAULT_NETWORK environment variable.
 * The API endpoint is controlled by ENV configuration, not by MetaMask network.
 */

"use client";

import { useEffect } from "react";
import { api } from "@/services/api";
import { getNetworkName, getDefaultChainId } from "@/lib/networkConfig";

/**
 * Hook to set API endpoint from environment configuration
 *
 * ALWAYS uses the network specified in NEXT_PUBLIC_DEFAULT_NETWORK,
 * regardless of MetaMask connection or selected network.
 *
 * - Local Testnet (31337): Port 7070
 * - Arbitrum Sepolia (421614): Port 8353
 * - Arbitrum One (42161): Port 8383
 *
 * Configuration:
 * - Set NEXT_PUBLIC_DEFAULT_NETWORK in .env.local
 * - Options: "local" | "sepolia" | "mainnet"
 * - Falls back to "local" if not configured
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useApiNetwork(); // Sets API endpoint from ENV
 *   
 *   // Your component code...
 * }
 * ```
 */
export function useApiNetwork() {
  useEffect(() => {
    // Always use the default network from environment variable
    const envChainId = getDefaultChainId();
    const networkName = getNetworkName(envChainId);
    
    console.log(`[useApiNetwork] Using network from ENV: ${networkName} (Chain ID: ${envChainId})`);
    api.setChainId(envChainId);
  }, []); // Empty deps - only run once on mount

  return { chainId: getDefaultChainId() };
}


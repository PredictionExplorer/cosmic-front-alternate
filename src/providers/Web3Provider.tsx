/**
 * Web3 Provider
 *
 * Wraps the application with Web3 functionality using wagmi and RainbowKit.
 * Provides wallet connection, chain switching, and contract interaction capabilities.
 *
 * Uses the latest standards:
 * - wagmi v2 (React hooks for Ethereum)
 * - viem (TypeScript Ethereum library)
 * - RainbowKit (beautiful multi-wallet connector)
 * - TanStack Query (data fetching and caching)
 */

"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/web3/config";
import { useApiNetwork } from "@/hooks/useApiNetwork";

import "@rainbow-me/rainbowkit/styles.css";

/**
 * Query client for TanStack Query
 * Handles caching and data fetching
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // Data is fresh for 1 minute
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Props for Web3Provider
 */
interface Web3ProviderProps {
  children: ReactNode;
}

/**
 * API Network Sync Component
 * 
 * Internal component that syncs the API endpoint with the current network.
 * Must be inside WagmiProvider to access chain information.
 */
function ApiNetworkSync() {
  useApiNetwork();
  return null;
}

/**
 * Web3Provider Component
 *
 * Wraps children with all necessary Web3 providers.
 * Must be used at the root of the application (in layout.tsx).
 *
 * Features:
 * - Multi-wallet support (MetaMask, Coinbase, WalletConnect, Rainbow, etc.)
 * - Beautiful connection UI with luxury theme
 * - Multi-network support (Local Testnet, Arbitrum Sepolia, Arbitrum One)
 * - Automatic API endpoint switching based on network
 * - Transaction status tracking
 * - Account balance display
 * - ENS name resolution
 *
 * @example
 * ```tsx
 * <Web3Provider>
 *   <YourApp />
 * </Web3Provider>
 * ```
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme()}
          modalSize="compact"
          showRecentTransactions={true}
          coolMode // Adds confetti on connect 🎉
        >
          <ApiNetworkSync />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

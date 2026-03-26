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

import { ReactNode, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/web3/config";
import { getCosmicApiBaseUrl, getDefaultChainId, getEnvValidation } from "@/lib/networkConfig";
import { defaultChain } from "@/lib/web3/chains";
import { shouldUseRpcProxy } from "@/lib/web3/transport";
import { useApiNetwork } from "@/hooks/useApiNetwork";
import { NetworkSwitchGuard } from "@/components/web3/NetworkSwitchGuard";

import "@rainbow-me/rainbowkit/styles.css";

const envValidation = getEnvValidation();

function EnvErrorScreen({ missing }: { missing: string[] }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-6 text-[#e5e5e5]">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-xl font-semibold">
          Cannot run: required environment variables are not set.
        </h1>
        <p className="mb-6 opacity-90">
          Set them in your shell or in a .env file, then restart the dev server.
        </p>
        <p className="mb-2 text-sm">Missing or invalid:</p>
        <ul className="list-none space-y-1 text-sm opacity-90">
          {missing.map((name) => (
            <li key={name}>
              <code className="rounded bg-[#222] px-1.5 py-0.5">{name}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

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
 * Logs resolved network, chain id, RPC, and API URL once on startup (same idea as blue frontend).
 */
/**
 * Wagmi/viem failures usually land in TanStack Query as `status: "error"` only.
 * In development, mirror those to the browser console so RPC issues are visible.
 */
function TanStackQueryErrorLogger() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    return queryClient.getQueryCache().subscribe((event) => {
      const q = event.query;
      if (!q || q.state.status !== "error" || !q.state.error) return;
      const key = q.queryKey;
      if (!Array.isArray(key) || key.length < 1) return;
      const head = String(key[0]);
      if (
        head === "balance" ||
        head === "readContract" ||
        head === "feeHistory" ||
        head === "estimateGas"
      ) {
        console.error(`[TanStack Query failed: ${head}]`, q.queryKey, q.state.error);
      }
    });
  }, [queryClient]);

  return null;
}

function StartupConfigLog() {
  useEffect(() => {
    const chainId = getDefaultChainId();
    const rpcUrl = defaultChain.rpcUrls.default.http[0] ?? "";
    const apiUrl = getCosmicApiBaseUrl();
    const networkEnv = process.env.NEXT_PUBLIC_NETWORK ?? "";
    const rpcDisplay =
      typeof window !== "undefined" &&
      rpcUrl &&
      shouldUseRpcProxy(rpcUrl)
        ? `${window.location.origin}/api/rpc → ${rpcUrl}`
        : rpcUrl;

    console.log(
      "[Cosmic Signature] Config:\n" +
        `  Network: ${networkEnv}\n` +
        `  Chain ID: ${chainId}\n` +
        `  RPC URL: ${rpcDisplay}\n` +
        `  API URL: ${apiUrl}`,
    );
  }, []);

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
 * - Automatic network switching when wrong network detected
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
  if (!envValidation.valid) {
    return <EnvErrorScreen missing={envValidation.missing} />;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TanStackQueryErrorLogger />
        <RainbowKitProvider
          theme={darkTheme()}
          modalSize="compact"
          showRecentTransactions={true}
          coolMode // Adds confetti on connect 🎉
        >
          <StartupConfigLog />
          <ApiNetworkSync />
          <NetworkSwitchGuard />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

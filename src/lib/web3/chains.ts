/**
 * Blockchain Network Configurations
 *
 * Defines the Arbitrum network configurations for the application.
 * RPC for the chain selected by NEXT_PUBLIC_NETWORK uses NEXT_PUBLIC_RPC_URL
 * (same env convention as the blue frontend).
 */

import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { Chain } from "viem";
import { getDefaultChainId, getDefaultNetwork } from "@/lib/networkConfig";

/**
 * Arbitrum One - Layer 2 Ethereum mainnet
 *
 * Official production network for Cosmic Signature.
 * Chain ID: 42161
 */
export const arbitrumOne: Chain = {
  ...arbitrum,
  rpcUrls: {
    default: {
      http: ["https://arb1.arbitrum.io/rpc"],
    },
    public: {
      http: ["https://arb1.arbitrum.io/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arbiscan",
      url: "https://arbiscan.io",
    },
  },
};

/**
 * Arbitrum Sepolia - Layer 2 Ethereum testnet
 *
 * Testnet for development and testing.
 * Chain ID: 421614
 */
export const arbitrumSepoliaChain: Chain = {
  ...arbitrumSepolia,
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://sepolia-rollup.arbitrum.io/rpc"],
    },
    public: {
      http: ["https://sepolia-rollup.arbitrum.io/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arbiscan",
      url: "https://sepolia.arbiscan.io",
    },
  },
  testnet: true,
};

/**
 * Local Testnet - Custom Arbitrum test network
 * Chain ID: 31337 (0x7A69 in hex)
 */
export const localTestnet: Chain = {
  id: 31337,
  name: "Localhost 22945",
  nativeCurrency: {
    name: "AGOR",
    symbol: "AGOR",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://161.129.67.42:22945"],
    },
    public: {
      http: ["http://161.129.67.42:22945"],
    },
  },
  blockExplorers: {
    default: {
      name: "Local Explorer",
      url: "http://161.129.67.42:22945",
    },
  },
  testnet: true,
};

/**
 * When NEXT_PUBLIC_RPC_URL is set, apply it to the chain that matches
 * NEXT_PUBLIC_NETWORK (same pattern as blue: one RPC URL for the active network).
 */
function applyEnvRpcToChain(chain: Chain): Chain {
  const rpcOverride = process.env.NEXT_PUBLIC_RPC_URL?.trim();
  if (!rpcOverride) return chain;
  if (chain.id !== getDefaultChainId()) return chain;
  return {
    ...chain,
    rpcUrls: {
      default: { http: [rpcOverride] },
      public: { http: [rpcOverride] },
    },
  };
}

/**
 * Chains registered with wagmi / RainbowKit.
 *
 * **One chain per deployment (from NEXT_PUBLIC_NETWORK).** If we register multiple
 * chains (e.g. local + Arbitrum Sepolia), RainbowKit + MetaMask SDK can keep or
 * revert internal state to a non-local chain (421614) after you switch to 31337,
 * which reopens the “Switch network” modal. Local dev should only expose 31337.
 */
function buildSupportedChainsForEnv(): Chain[] {
  const local = applyEnvRpcToChain(localTestnet);
  const sepolia = applyEnvRpcToChain(arbitrumSepoliaChain);
  const main = applyEnvRpcToChain(arbitrumOne);

  switch (getDefaultNetwork()) {
    case "local":
      return [local];
    case "sepolia":
      return [sepolia];
    case "mainnet":
      return [main];
    default:
      return [local];
  }
}

export const supportedChains: Chain[] = buildSupportedChainsForEnv();

/**
 * Get the default chain based on NEXT_PUBLIC_NETWORK
 */
function getDefaultChainConfig(): Chain {
  const id = getDefaultChainId();
  return (
    supportedChains.find((c) => c.id === id) ?? supportedChains[0]
  );
}

/**
 * Default chain for the application
 */
export const defaultChain = getDefaultChainConfig();

/**
 * Chain configuration utilities
 */
export const chainConfig = {
  /**
   * Get block explorer URL for a transaction
   */
  getTransactionUrl: (chain: Chain, txHash: string): string => {
    return `${chain.blockExplorers?.default?.url || ""}/tx/${txHash}`;
  },

  /**
   * Get block explorer URL for an address
   */
  getAddressUrl: (chain: Chain, address: string): string => {
    return `${chain.blockExplorers?.default?.url || ""}/address/${address}`;
  },

  /**
   * Get block explorer URL for a token
   */
  getTokenUrl: (chain: Chain, tokenAddress: string): string => {
    return `${chain.blockExplorers?.default?.url || ""}/token/${tokenAddress}`;
  },

  /**
   * Check if chain is supported
   */
  isChainSupported: (chainId: number): boolean => {
    return supportedChains.some((chain) => chain.id === chainId);
  },
};

// ─── Network-aware explorer helpers ──────────────────────────────────────────

const explorerBase: string =
  defaultChain.blockExplorers?.default?.url ?? "https://arbiscan.io";

export const explorer = {
  tx: (hash: string) => `${explorerBase}/tx/${hash}`,
  address: (addr: string) => `${explorerBase}/address/${addr}`,
  token: (addr: string, tokenId?: number | string) =>
    tokenId !== undefined
      ? `${explorerBase}/token/${addr}?a=${tokenId}`
      : `${explorerBase}/token/${addr}`,
  block: (blockNum: number | string) => `${explorerBase}/block/${blockNum}`,
};

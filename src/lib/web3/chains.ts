/**
 * Blockchain Network Configurations
 *
 * Defines the Arbitrum network configurations for the application.
 * Supports both mainnet and testnet for development/testing.
 */

import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { Chain } from "viem";

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
 *
 * This is a custom local testnet hosted at http://161.129.67.42:22945
 * Used for development and testing of Cosmic Signature
 *
 * RainbowKit will automatically prompt users to add this network if not present
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
 * Supported chains for the application
 * Default is local testnet matching the reference implementation
 */
export const supportedChains: Chain[] = [
  localTestnet,
  arbitrumSepoliaChain,
  arbitrumOne,
];

/**
 * Default chain for the application
 * Set to local testnet to match reference implementation
 */
export const defaultChain = localTestnet;

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

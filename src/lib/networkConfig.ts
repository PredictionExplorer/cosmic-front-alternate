/**
 * Network Configuration
 * 
 * Centralized configuration for default network settings.
 * Can be controlled via NEXT_PUBLIC_DEFAULT_NETWORK environment variable.
 * 
 * Usage:
 * Set in .env.local:
 * NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
 * 
 * Options: "local" | "sepolia" | "mainnet"
 */

export type NetworkType = "local" | "sepolia" | "mainnet";

/**
 * Network configuration mapping
 */
export const NETWORK_CONFIG = {
  local: {
    chainId: 31337,
    name: "Local Testnet",
    apiPort: 7070,
  },
  sepolia: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    apiPort: 8353,
  },
  mainnet: {
    chainId: 42161,
    name: "Arbitrum One",
    apiPort: 8383,
  },
} as const;

/**
 * Get the default network from environment variable
 * Falls back to "local" if not set or invalid
 */
export function getDefaultNetwork(): NetworkType {
  const envNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK?.toLowerCase();
  
  if (envNetwork === "sepolia" || envNetwork === "mainnet" || envNetwork === "local") {
    return envNetwork;
  }
  
  // Default to local if not set
  return "local";
}

/**
 * Get the default chain ID based on environment configuration
 */
export function getDefaultChainId(): number {
  const network = getDefaultNetwork();
  return NETWORK_CONFIG[network].chainId;
}

/**
 * Get network configuration by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkType | null {
  if (chainId === 31337) return "local";
  if (chainId === 421614) return "sepolia";
  if (chainId === 42161) return "mainnet";
  return null;
}

/**
 * Get network name by chain ID
 */
export function getNetworkName(chainId: number): string {
  const network = getNetworkByChainId(chainId);
  return network ? NETWORK_CONFIG[network].name : "Unknown Network";
}

// Log the default network on module load (development only)
if (process.env.NODE_ENV === "development") {
  const defaultNetwork = getDefaultNetwork();
  const config = NETWORK_CONFIG[defaultNetwork];
  console.log(
    `[Network Config] Default network: ${config.name} (Chain ID: ${config.chainId}, API Port: ${config.apiPort})`
  );
}


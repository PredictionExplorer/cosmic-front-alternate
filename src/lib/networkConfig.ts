/**
 * Network Configuration
 *
 * Same env convention as the blue (cosmicgame) frontend:
 * - NEXT_PUBLIC_NETWORK — local | sepolia | mainnet
 * - NEXT_PUBLIC_API_URL — Cosmic Game API base URL (HTTPS recommended)
 * - NEXT_PUBLIC_RPC_URL — JSON-RPC endpoint for the selected network
 *
 * No implicit defaults for these three — they must be set (see getEnvValidation).
 */

export type NetworkType = "local" | "sepolia" | "mainnet";

/** Required env vars — matches blue frontend naming. */
export const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_NETWORK",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_RPC_URL",
] as const;

export interface EnvValidation {
  valid: boolean;
  missing: string[];
}

/**
 * Validates that required environment variables are set (same rules as blue).
 */
export function getEnvValidation(): EnvValidation {
  const missing: string[] = [];
  const network = process.env.NEXT_PUBLIC_NETWORK?.trim().toLowerCase();

  if (!network) {
    missing.push("NEXT_PUBLIC_NETWORK");
  } else if (!["local", "sepolia", "mainnet"].includes(network)) {
    missing.push("NEXT_PUBLIC_NETWORK (must be: local, sepolia, or mainnet)");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl) missing.push("NEXT_PUBLIC_API_URL");

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL?.trim();
  if (!rpcUrl) missing.push("NEXT_PUBLIC_RPC_URL");

  return { valid: missing.length === 0, missing };
}

/**
 * Normalized Cosmic Game API base URL (trailing slash).
 * Reads NEXT_PUBLIC_API_URL — same variable name as the blue frontend.
 */
export function getCosmicApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (!url) return "";
  return url.endsWith("/") ? url : `${url}/`;
}

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
 * Get the default network from NEXT_PUBLIC_NETWORK (same as blue).
 * Falls back to "local" only when unset/invalid (build paths; use getEnvValidation for strict checks).
 */
export function getDefaultNetwork(): NetworkType {
  const envNetwork = process.env.NEXT_PUBLIC_NETWORK?.trim().toLowerCase();

  if (
    envNetwork === "sepolia" ||
    envNetwork === "mainnet" ||
    envNetwork === "local"
  ) {
    return envNetwork;
  }

  return "local";
}

/**
 * Get the default chain ID based on NEXT_PUBLIC_NETWORK.
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
    `[Network Config] Default network: ${config.name} (Chain ID: ${config.chainId}, API Port: ${config.apiPort})`,
  );
}

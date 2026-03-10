/**
 * API Service
 *
 * Comprehensive service for fetching data from the Cosmic Signature backend.
 * All methods throw {@link ApiError} on API-level failure (status !== 1 or
 * non-empty error field) and propagate network/axios errors as-is.
 * Callers must handle errors explicitly; no method silently swallows failures.
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { getDefaultChainId } from "@/lib/networkConfig";
import { transformBidList, transformRaffleDepositList } from "@/lib/apiTransforms";
import type {
  ApiBidResponse,
  ApiCSTToken,
  ApiStakedCSTToken,
  ApiStakedRWLKToken,
  ApiDashboardData,
  ApiStakingAction,
  ApiStakingReward,
  ApiCollectedStakingReward,
  ApiClaimHistory,
  ApiMarketingReward,
  ApiRWLKMint,
  ApiDonatedNFT,
  ApiDonatedERC20,
  ApiRaffleDepositResponse,
} from "@/services/apiTypes";

// ── API response contract ──────────────────────────────────────────────

/**
 * Thrown when the backend returns a response with status !== 1 or a non-empty
 * error string. Carries the backend's own message so callers can surface it.
 */
export class ApiError extends Error {
  constructor(
    public readonly apiMessage: string,
    public readonly apiStatus: number,
  ) {
    super(apiMessage);
    this.name = "ApiError";
  }
}

/**
 * Backend sometimes ships the same logical payload under different keys
 * depending on version. We map known aliases to a single canonical key so
 * the rest of the app only ever sees one name.
 */
const KEY_ALIASES: Record<string, string> = {
  EthDonations: "DirectCGDonations",
  EthDonationsWithInfo: "DirectCGDonations",
  nfDonations: "NFTDonations",
  DonationsERC20: "ERC20Donations",
  DonatedPrizesERC20: "ERC20Donations",
  GlobalERC20Donations: "ERC20Donations",
};

/**
 * Validate the API envelope ({@code status}/{@code error}) and extract the
 * payload living under {@code payloadKey}.
 *
 * If {@code payloadKey} is omitted the entire data object (minus envelope
 * fields) is returned — useful for endpoints whose payload *is* the
 * top-level object (e.g. dashboard, user info).
 */
function unwrapApiResponse<T = Record<string, unknown>>(
  data: Record<string, unknown>,
  payloadKey?: string,
): T {
  const status = data?.status ?? data?.Status;
  const error = data?.error ?? data?.Error;

  if (status !== undefined && status !== 1) {
    throw new ApiError(
      typeof error === "string" && error
        ? error
        : `API returned status ${status}`,
      typeof status === "number" ? status : 0,
    );
  }
  if (typeof error === "string" && error.length > 0) {
    throw new ApiError(error, 0);
  }

  if (!payloadKey) {
    return data as unknown as T;
  }

  // Try canonical key first, then check aliases that map to it
  if (data[payloadKey] !== undefined) {
    return data[payloadKey] as T;
  }

  for (const [alias, canonical] of Object.entries(KEY_ALIASES)) {
    if (canonical === payloadKey && data[alias] !== undefined) {
      return data[alias] as T;
    }
  }

  return undefined as unknown as T;
}

/**
 * API Base URLs by network
 * Configure based on chain ID
 */
const API_ENDPOINTS = {
  // Local Testnet (Chain ID: 31337)
  31337:
    process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL ||
    "http://161.129.67.42:7070/api/cosmicgame/",
  // Arbitrum Sepolia (Chain ID: 421614)
  421614:
    process.env.NEXT_PUBLIC_API_BASE_URL_SEPOLIA ||
    "http://161.129.67.42:8353/api/cosmicgame/",
  // Arbitrum One (Chain ID: 42161)
  42161:
    process.env.NEXT_PUBLIC_API_BASE_URL_MAINNET ||
    "http://69.10.55.2:2121/api/cosmicgame/",
} as const;

/**
 * Get API base URL for a specific chain
 * Defaults to network specified in NEXT_PUBLIC_DEFAULT_NETWORK env var
 */
function getApiBaseUrl(chainId?: number): string {
  const defaultChainId = getDefaultChainId();
  const id = chainId || defaultChainId;
  
  // Type-safe endpoint lookup
  if (id === 31337) return API_ENDPOINTS[31337];
  if (id === 421614) return API_ENDPOINTS[421614];
  if (id === 42161) return API_ENDPOINTS[42161];
  
  // Fallback to default
  return API_ENDPOINTS[defaultChainId as keyof typeof API_ENDPOINTS];
}

// Default API base URL (from environment config)
const API_BASE_URL = getApiBaseUrl();
const ASSETS_BASE_URL =
  process.env.NEXT_PUBLIC_ASSETS_BASE_URL ||
  "https://nfts.cosmicsignature.com/";

/**
 * Check if we need to use proxy
 * Returns true if:
 * 1. We're on HTTPS and trying to access HTTP (mixed content)
 * 2. We're in development mode (localhost) to avoid CORS issues
 */
function shouldUseProxy(url: string): boolean {
  // Only apply in browser
  if (typeof window === "undefined") return false;

  // Use proxy in development (localhost) to avoid CORS issues
  const isDevelopment =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // Check if page is HTTPS
  const isPageSecure = window.location.protocol === "https:";

  // Check if target URL is HTTP
  const targetUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  const isTargetHttp = targetUrl.startsWith("http://");

  // Use proxy if in development OR if mixed content (HTTPS page + HTTP API)
  return isDevelopment || (isPageSecure && isTargetHttp);
}

/**
 * Axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor for proxy routing and auth
 */
apiClient.interceptors.request.use(
  (config) => {
    // If we need proxy, rewrite the URL
    if (config.url && shouldUseProxy(config.url)) {
      const fullUrl = config.url.startsWith("http")
        ? config.url
        : `${config.baseURL || API_BASE_URL}${config.url}`;

      config.url = `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
      config.baseURL = ""; // Clear baseURL since we're using absolute proxy path
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", error.message);
    }

    // Transform error for better UX
    const customError = {
      message:
        error.response?.statusText ||
        error.message ||
        "An unknown error occurred",
      status: error.response?.status,
      data: error.response?.data,
    };

    return Promise.reject(customError);
  }
);

/**
 * API Service Class
 *
 * Organized by feature area for easy navigation
 */
class CosmicSignatureAPI {
  /**
   * Current chain ID
   * Used to determine which API endpoint to use
   */
  private currentChainId: number = getDefaultChainId(); // Default from environment config

  /**
   * Set the current chain ID and update API base URL
   * Should be called when the user switches networks
   */
  setChainId(chainId: number) {
    this.currentChainId = chainId;
    const newBaseUrl = getApiBaseUrl(chainId);
    apiClient.defaults.baseURL = newBaseUrl;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `API endpoint switched to ${newBaseUrl} for chain ${chainId}`
      );
    }
  }

  /**
   * Get the current chain ID
   */
  getChainId(): number {
    return this.currentChainId;
  }

  // ==================== DASHBOARD & STATISTICS ====================

  async getDashboardInfo(): Promise<ApiDashboardData> {
    const { data } = await apiClient.get("statistics/dashboard");
    return unwrapApiResponse<ApiDashboardData>(data);
  }

  async getUniqueBidders(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("statistics/unique/bidders");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "UniqueBidders") ?? [];
  }

  async getUniqueWinners(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("statistics/unique/winners");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "UniqueWinners") ?? [];
  }

  async getUniqueDonors(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("statistics/unique/donors");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "UniqueDonors") ?? [];
  }

  async getUniqueStakersCST(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("statistics/unique/stakers/cst");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "UniqueStakersCST") ?? [];
  }

  async getUniqueStakersRWLK(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("statistics/unique/stakers/rwalk");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "UniqueStakersRWalk") ?? [];
  }

  // ==================== ROUNDS & PRIZES ====================

  async getRoundList(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("rounds/list/0/1000000");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "Rounds") ?? [];
  }

  async getRoundInfo(roundNum: number) {
    const { data } = await apiClient.get(`rounds/info/${roundNum}`);
    return unwrapApiResponse<Record<string, unknown>>(data, "RoundInfo");
  }

  async getPrizeTime() {
    const { data } = await apiClient.get("rounds/current/time");
    return unwrapApiResponse<number>(data, "CurRoundPrizeTime");
  }

  async getClaimHistory(): Promise<ApiClaimHistory[]> {
    const { data } = await apiClient.get("prizes/history/global/0/1000000");
    return unwrapApiResponse<ApiClaimHistory[]>(data, "GlobalPrizeHistory") ?? [];
  }

  async getClaimHistoryByUser(address: string): Promise<ApiClaimHistory[]> {
    const { data } = await apiClient.get(
      `prizes/history/by_user/${address}/0/1000000`,
    );
    return unwrapApiResponse<ApiClaimHistory[]>(data, "UserPrizeHistory") ?? [];
  }

  async getUnclaimedRaffleDeposits(address: string) {
    const { data } = await apiClient.get(
      `prizes/deposits/unclaimed/by_user/${address}/0/1000000`,
    );
    const deposits = unwrapApiResponse<ApiRaffleDepositResponse[]>(data, "UnclaimedDeposits") ?? [];
    return transformRaffleDepositList(deposits);
  }

  async getRaffleDepositsByUser(address: string): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      `prizes/deposits/raffle/by_user/${address}`,
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "UserRaffleDeposits") ?? [];
  }

  // ==================== BIDDING ====================

  async getBidList() {
    const { data } = await apiClient.get("bid/list/all/0/1000000");
    const bids = unwrapApiResponse<ApiBidResponse[]>(data, "Bids") ?? [];
    return transformBidList(bids);
  }

  async getBidInfo(evtLogId: number) {
    const { data } = await apiClient.get(`bid/info/${evtLogId}`);
    return unwrapApiResponse<Record<string, unknown>>(data, "BidInfo");
  }

  async getBidListByRound(roundNum: number, sortDir: "asc" | "desc" = "desc") {
    const dir = sortDir === "asc" ? 0 : 1;
    const { data } = await apiClient.get(
      `bid/list/by_round/${roundNum}/${dir}/0/1000000`,
    );
    const bids = unwrapApiResponse<ApiBidResponse[]>(data, "BidsByRound") ?? [];
    return transformBidList(bids);
  }

  async getUsedRWLKNfts(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("bid/used_rwalk_nfts");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "UsedRwalkNFTs") ?? [];
  }

  async getCSTPrice(): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get("bid/cst_price");
    return unwrapApiResponse<Record<string, unknown>>(data);
  }

  async getETHBidPrice(): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get("bid/eth_price");
    return unwrapApiResponse<Record<string, unknown>>(data);
  }

  async getCurrentSpecialWinners(): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get("bid/current_special_winners");
    return unwrapApiResponse<Record<string, unknown>>(data);
  }

  // ==================== NFTs (ERC-721) ====================

  async getCSTList(): Promise<ApiCSTToken[]> {
    const { data } = await apiClient.get("cst/list/all/0/1000000");
    return unwrapApiResponse<ApiCSTToken[]>(data, "CosmicSignatureTokenList") ?? [];
  }

  async getCSTTokensByUser(address: string): Promise<ApiCSTToken[]> {
    const { data } = await apiClient.get(
      `cst/list/by_user/${address}/0/1000000`,
    );
    return unwrapApiResponse<ApiCSTToken[]>(data, "UserTokens") ?? [];
  }

  async getCSTInfo(tokenId: number): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get(`cst/info/${tokenId}`);
    return unwrapApiResponse<Record<string, unknown>>(data, "TokenInfo");
  }

  async getNameHistory(tokenId: number): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(`cst/names/history/${tokenId}`);
    return unwrapApiResponse<Record<string, unknown>[]>(data, "TokenNameHistory") ?? [];
  }

  async searchTokenByName(name: string): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      `cst/names/search/${encodeURIComponent(name)}`,
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "TokenNameSearchResults") ?? [];
  }

  async getNamedNFTs(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("cst/names/named_only");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "NamedTokens") ?? [];
  }

  async getCSTDistribution(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("cst/distribution");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "CosmicSignatureTokenDistribution") ?? [];
  }

  async getCSTTransfers(address: string): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      `cst/transfers/by_user/${address}/0/1000000`,
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "CosmicSignatureTransfers") ?? [];
  }

  async getTokenOwnershipTransfers(tokenId: number): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      `cst/transfers/all/${tokenId}/0/1000000`,
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "TokenTransfers") ?? [];
  }

  /**
   * Trigger NFT image/video generation.
   * Unlike other methods this hits the assets server, not the game API.
   * Throws on failure (callers must handle).
   */
  async createNFTAssets(tokenId: number, count: number) {
    const { data } = await axios.post(`${ASSETS_BASE_URL}cosmicgame_tokens`, {
      token_id: tokenId,
      count,
    });
    return data?.task_id ?? -1;
  }

  // ==================== TOKENS (ERC-20) ====================

  async getCTBalanceDistribution(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("ct/balances");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "CosmicTokenBalances") ?? [];
  }

  async getCTTransfers(address: string): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      `ct/transfers/by_user/${address}/0/1000000`,
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "CosmicTokenTransfers") ?? [];
  }

  // ==================== USER INFO ====================

  async getUserInfo(address: string): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get(`user/info/${address}`);
    const payload = unwrapApiResponse<Record<string, unknown>>(data);

    if (payload && Array.isArray(payload.Bids)) {
      payload.Bids = transformBidList(payload.Bids);
    }

    return payload;
  }

  async getUserBalance(address: string): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get(`user/balances/${address}`);
    return unwrapApiResponse<Record<string, unknown>>(data);
  }

  async getUserWinnings(address: string) {
    const { data } = await apiClient.get(`user/notif_red_box/${address}`);
    return unwrapApiResponse<Record<string, unknown>>(data, "Winnings");
  }

  // ==================== DONATIONS ====================

  async getETHDonationsSimple(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("donations/eth/simple/list/0/1000000");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "DirectCGDonations") ?? [];
  }

  async getETHDonationsWithInfo(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      "donations/eth/with_info/list/0/1000000",
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "DirectCGDonations") ?? [];
  }

  async getETHDonationsByRound(roundNum: number): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      `donations/eth/both/by_round/${roundNum}`,
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "CosmicGameDonations") ?? [];
  }

  async getAllETHDonations(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("donations/eth/both/all");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "CosmicGameDonations") ?? [];
  }

  async getNFTDonationsList(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("donations/nft/list/0/1000000");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "NFTDonations") ?? [];
  }

  async getNFTDonationStatistics(): Promise<Record<string, unknown>> {
    const { data } = await apiClient.get("donations/nft/statistics");
    return unwrapApiResponse<Record<string, unknown>>(data);
  }

  async getNFTDonationsByRound(roundNum: number): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(`donations/nft/by_round/${roundNum}`);
    return unwrapApiResponse<Record<string, unknown>[]>(data, "NFTDonations") ?? [];
  }

  async getUnclaimedDonatedNFTsByRound(roundNum: number): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      `donations/nft/unclaimed/by_round/${roundNum}`,
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "NFTDonations") ?? [];
  }

  async getUnclaimedDonatedNFTsByUser(address: string): Promise<ApiDonatedNFT[]> {
    const { data } = await apiClient.get(
      `donations/nft/unclaimed/by_user/${address}`,
    );
    return unwrapApiResponse<ApiDonatedNFT[]>(data, "UnclaimedDonatedNFTs") ?? [];
  }

  async getClaimedDonatedNFTsByUser(address: string): Promise<ApiDonatedNFT[]> {
    const { data } = await apiClient.get(
      `donations/nft/claims/by_user/${address}`,
    );
    return unwrapApiResponse<ApiDonatedNFT[]>(data, "DonatedNFTClaims") ?? [];
  }

  async getERC20DonationsByRound(roundNum: number): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      `donations/erc20/by_round/detailed/${roundNum}`,
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "DonationsERC20ByRoundDetailed") ?? [];
  }

  async getERC20DonationsList(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("donations/erc20/global/0/1000000");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "ERC20Donations") ?? [];
  }

  async getERC20DonationsByUser(address: string): Promise<ApiDonatedERC20[]> {
    const { data } = await apiClient.get(`donations/erc20/by_user/${address}`);
    return unwrapApiResponse<ApiDonatedERC20[]>(data, "DonatedPrizesERC20ByWinner") ?? [];
  }

  // ==================== STAKING ====================

  async getStakingCSTActionsByUser(address: string): Promise<ApiStakingAction[]> {
    const { data } = await apiClient.get(
      `staking/cst/actions/by_user/${address}/0/1000000`,
    );
    return unwrapApiResponse<ApiStakingAction[]>(data, "StakingCSTActions") ?? [];
  }

  async getStakingCSTActions(): Promise<ApiStakingAction[]> {
    const { data } = await apiClient.get(
      "staking/cst/actions/global/0/1000000",
    );
    return unwrapApiResponse<ApiStakingAction[]>(data, "StakingCSTActions") ?? [];
  }

  async getStakedCSTTokensByUser(address: string): Promise<ApiStakedCSTToken[]> {
    const { data } = await apiClient.get(
      `staking/cst/staked_tokens/by_user/${address}`,
    );
    return unwrapApiResponse<ApiStakedCSTToken[]>(data, "StakedTokensCST") ?? [];
  }

  async getStakedCSTTokens(): Promise<ApiStakedCSTToken[]> {
    const { data } = await apiClient.get("staking/cst/staked_tokens/all");
    return unwrapApiResponse<ApiStakedCSTToken[]>(data, "StakedTokensCST") ?? [];
  }

  async getStakingRewardsByUser(address: string): Promise<ApiStakingReward[]> {
    const { data } = await apiClient.get(
      `staking/cst/rewards/by_user/by_token/summary/${address}`,
    );
    return unwrapApiResponse<ApiStakingReward[]>(data, "RewardsByToken") ?? [];
  }

  async getStakingCSTRewardsToClaim(address: string): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      `staking/cst/rewards/to_claim/by_user/${address}`,
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "UnclaimedEthDeposits") ?? [];
  }

  async getStakingCSTRewardsCollected(address: string): Promise<ApiCollectedStakingReward[]> {
    const { data } = await apiClient.get(
      `staking/cst/rewards/collected/by_user/${address}/0/1000000`,
    );
    return unwrapApiResponse<ApiCollectedStakingReward[]>(data, "CollectedStakingCSTRewards") ?? [];
  }

  async getStakingCSTRewards(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("staking/cst/rewards/global");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "StakingCSTRewards") ?? [];
  }

  async getStakingCSTRewardsByRound(roundNum: number): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      `staking/cst/rewards/by_round/${roundNum}`,
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "Rewards") ?? [];
  }

  async getStakingRWLKActionsByUser(address: string): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      `staking/rwalk/actions/by_user/${address}/0/1000000`,
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "UserStakingActionsRWalk") ?? [];
  }

  /**
   * Get all RWLK NFT token IDs that were ever staked by this user.
   * Throws on failure — callers must handle.
   */
  async getEverStakedRWLKTokenIdsByUser(address: string): Promise<number[]> {
    const actions = await this.getStakingRWLKActionsByUser(address);
    const ids = actions
      .map((a) =>
        Number(a["TokenId"] ?? a["StakedTokenId"] ?? a["NftTokenId"] ?? -1),
      )
      .filter((id) => id >= 0);
    return [...new Set(ids)];
  }

  async getStakingRWLKActions(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      "staking/rwalk/actions/global/0/1000000",
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "GlobalStakingActionsRWalk") ?? [];
  }

  async getStakedRWLKTokensByUser(address: string): Promise<ApiStakedRWLKToken[]> {
    const { data } = await apiClient.get(
      `staking/rwalk/staked_tokens/by_user/${address}`,
    );
    return unwrapApiResponse<ApiStakedRWLKToken[]>(data, "StakedTokensRWalk") ?? [];
  }

  async getStakedRWLKTokens(): Promise<ApiStakedRWLKToken[]> {
    const { data } = await apiClient.get("staking/rwalk/staked_tokens/all");
    return unwrapApiResponse<ApiStakedRWLKToken[]>(data, "StakedTokensRWalk") ?? [];
  }

  async getStakingRWLKMintsByUser(address: string): Promise<ApiRWLKMint[]> {
    const { data } = await apiClient.get(
      `staking/rwalk/mints/by_user/${address}`,
    );
    return unwrapApiResponse<ApiRWLKMint[]>(data, "RWalkStakingRewardMints") ?? [];
  }

  async getStakingRWLKMintsGlobal(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(
      "staking/rwalk/mints/global/0/1000000",
    );
    return unwrapApiResponse<Record<string, unknown>[]>(data, "StakingRWalkRewardsMints") ?? [];
  }

  // ==================== RAFFLE ====================

  async getRaffleNFTWinners(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("raffle/nft/all/list/0/1000000");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "RaffleNFTWinners") ?? [];
  }

  async getRaffleNFTWinnersByRound(roundNum: number): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(`raffle/nft/by_round/${roundNum}`);
    return unwrapApiResponse<Record<string, unknown>[]>(data, "RaffleNFTWinners") ?? [];
  }

  async getRaffleNFTWinningsByUser(address: string): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(`raffle/nft/by_user/${address}`);
    return unwrapApiResponse<Record<string, unknown>[]>(data, "UserRaffleNFTWinnings") ?? [];
  }

  // ==================== MARKETING ====================

  async getMarketingRewards(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("marketing/rewards/global/0/1000000");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "MarketingRewards") ?? [];
  }

  async getMarketingRewardsByUser(address: string): Promise<ApiMarketingReward[]> {
    const { data } = await apiClient.get(
      `marketing/rewards/by_user/${address}/0/1000000`,
    );
    return unwrapApiResponse<ApiMarketingReward[]>(data, "UserMarketingRewards") ?? [];
  }

  // ==================== CHARITY ====================

  async getCharityDeposits(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("donations/charity/deposits");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "CharityDonations") ?? [];
  }

  async getCharityCGDeposits(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("donations/charity/cg_deposits");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "CharityDonations") ?? [];
  }

  async getCharityVoluntary(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("donations/charity/voluntary");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "CharityDonations") ?? [];
  }

  async getCharityWithdrawals(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("donations/charity/withdrawals");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "CharityWithdrawals") ?? [];
  }

  // ==================== SYSTEM ====================

  async getCurrentTime() {
    const { data } = await apiClient.get("time/current");
    return unwrapApiResponse<number>(data, "CurrentTimeStamp");
  }

  async getTimeUntilPrize() {
    const { data } = await apiClient.get("time/until_prize");
    return unwrapApiResponse<number>(data, "TimeUntilPrize");
  }

  async getSystemModeList(): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get("system/modelist/-1/1000000");
    return unwrapApiResponse<Record<string, unknown>[]>(data, "SystemModeChanges") ?? [];
  }

  async getSystemEvents(start: number, end: number): Promise<Record<string, unknown>[]> {
    const { data } = await apiClient.get(`system/admin_events/${start}/${end}`);
    return unwrapApiResponse<Record<string, unknown>[]>(data, "AdminEvents") ?? [];
  }

  // ==================== ADMIN / ASSETS SERVER ====================

  async getBannedBids() {
    const { data } = await axios.get(`${ASSETS_BASE_URL}get_banned_bids`);
    return data || [];
  }

  async banBid(bidId: number, userAddr: string) {
    const { data } = await axios.post(`${ASSETS_BASE_URL}ban_bid`, {
      bid_id: bidId,
      user_addr: userAddr,
    });
    return data;
  }

  async unbanBid(bidId: number) {
    const { data } = await axios.post(`${ASSETS_BASE_URL}unban_bid`, {
      bid_id: bidId,
    });
    return data;
  }
}

/**
 * Export singleton instance
 */
export const api = new CosmicSignatureAPI();

/**
 * Export for default import
 */
export default api;

/**
 * Helper function to get assets URL
 */
export function getAssetsUrl(path: string): string {
  return `${ASSETS_BASE_URL}${path}`;
}

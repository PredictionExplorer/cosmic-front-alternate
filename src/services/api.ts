/**
 * API Service
 *
 * Comprehensive service for fetching data from the Cosmic Signature backend.
 * Provides 80+ API endpoints for dashboard, bidding, prizes, staking, and more.
 *
 * Architecture:
 * - Axios-based with automatic retries
 * - Type-safe responses
 * - Error handling with user-friendly messages
 * - Request caching where appropriate
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { getDefaultChainId } from "@/lib/networkConfig";
import { transformBidList, transformRaffleDepositList } from "@/lib/apiTransforms";

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
    "http://161.129.67.42:8383/api/cosmicgame/",
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

  /**
   * Get main dashboard information
   * Returns overview of current round and global statistics
   */
  async getDashboardInfo() {
    const { data } = await apiClient.get("statistics/dashboard");
    return data;
  }

  /**
   * Get list of unique bidders
   */
  async getUniqueBidders() {
    const { data } = await apiClient.get("statistics/unique/bidders");
    return data.UniqueBidders || [];
  }

  /**
   * Get list of unique winners
   */
  async getUniqueWinners() {
    const { data } = await apiClient.get("statistics/unique/winners");
    return data.UniqueWinners || [];
  }

  /**
   * Get list of unique ETH donors
   */
  async getUniqueDonors() {
    const { data } = await apiClient.get("statistics/unique/donors");
    return data.UniqueDonors || [];
  }

  /**
   * Get unique CST stakers
   */
  async getUniqueStakersCST() {
    const { data } = await apiClient.get("statistics/unique/stakers/cst");
    return data.UniqueStakersCST || [];
  }

  /**
   * Get unique RandomWalk stakers
   */
  async getUniqueStakersRWLK() {
    const { data } = await apiClient.get("statistics/unique/stakers/rwalk");
    return data.UniqueStakersRWalk || [];
  }

  // ==================== ROUNDS & PRIZES ====================

  /**
   * Get list of all completed rounds
   */
  async getRoundList() {
    const { data } = await apiClient.get("rounds/list/0/1000000");
    return data.Rounds || [];
  }

  /**
   * Get detailed information for a specific round
   */
  async getRoundInfo(roundNum: number) {
    const { data } = await apiClient.get(`rounds/info/${roundNum}`);
    return data.RoundInfo;
  }

  /**
   * Get current round prize time
   */
  async getPrizeTime() {
    const { data } = await apiClient.get("rounds/current/time");
    return data.CurRoundPrizeTime;
  }

  /**
   * Get global prize claim history
   */
  async getClaimHistory() {
    const { data } = await apiClient.get("prizes/history/global/0/1000000");
    return data.GlobalPrizeHistory || [];
  }

  /**
   * Get prize claim history for specific user
   */
  async getClaimHistoryByUser(address: string) {
    const { data } = await apiClient.get(
      `prizes/history/by_user/${address}/0/1000000`
    );
    return data.UserPrizeHistory || [];
  }

  /**
   * Get unclaimed raffle deposits for user
   */
  async getUnclaimedRaffleDeposits(address: string) {
    const { data } = await apiClient.get(
      `prizes/deposits/unclaimed/by_user/${address}/0/1000000`
    );
    const deposits = data.UnclaimedDeposits || [];
    return transformRaffleDepositList(deposits);
  }

  /**
   * Get raffle deposits by user
   */
  async getRaffleDepositsByUser(address: string) {
    const { data } = await apiClient.get(
      `prizes/deposits/raffle/by_user/${address}`
    );
    return data.UserRaffleDeposits || [];
  }

  // ==================== BIDDING ====================

  /**
   * Get all bids (global)
   * @returns Transformed bid list with flattened structure
   */
  async getBidList() {
    const { data } = await apiClient.get("bid/list/all/0/1000000");
    const bids = data.Bids || [];
    return transformBidList(bids);
  }

  /**
   * Get bid information by event log ID
   */
  async getBidInfo(evtLogId: number) {
    const { data } = await apiClient.get(`bid/info/${evtLogId}`);
    return data.BidInfo;
  }

  /**
   * Get bids for a specific round
   *
   * @param roundNum - Round number
   * @param sortDir - 'asc' or 'desc'
   * @returns Transformed bid list with flattened structure
   */
  async getBidListByRound(roundNum: number, sortDir: "asc" | "desc" = "desc") {
    const dir = sortDir === "asc" ? 0 : 1;
    const { data } = await apiClient.get(
      `bid/list/by_round/${roundNum}/${dir}/0/1000000`
    );
    const bids = data.BidsByRound || [];
    return transformBidList(bids);
  }

  /**
   * Get used RandomWalk NFTs
   */
  async getUsedRWLKNfts() {
    const { data } = await apiClient.get("bid/used_rwalk_nfts");
    return data.UsedRwalkNFTs || [];
  }

  /**
   * Get current CST bid price
   */
  async getCSTPrice() {
    const { data } = await apiClient.get("bid/cst_price");
    return data;
  }

  /**
   * Get current ETH bid price
   */
  async getETHBidPrice() {
    const { data } = await apiClient.get("bid/eth_price");
    return data;
  }

  /**
   * Get current special winners (Endurance Champion, Chrono-Warrior)
   */
  async getCurrentSpecialWinners() {
    const { data } = await apiClient.get("bid/current_special_winners");
    return data;
  }

  // ==================== NFTs (ERC-721) ====================

  /**
   * Get all Cosmic Signature NFTs
   */
  async getCSTList() {
    const { data } = await apiClient.get("cst/list/all/0/1000000");
    return data.CosmicSignatureTokenList || [];
  }

  /**
   * Get user's Cosmic Signature NFTs
   */
  async getCSTTokensByUser(address: string) {
    const { data } = await apiClient.get(
      `cst/list/by_user/${address}/0/1000000`
    );
    return data.UserTokens || [];
  }

  /**
   * Get NFT information
   */
  async getCSTInfo(tokenId: number) {
    const { data } = await apiClient.get(`cst/info/${tokenId}`);
    return data.TokenInfo;
  }

  /**
   * Get NFT name change history
   */
  async getNameHistory(tokenId: number) {
    const { data } = await apiClient.get(`cst/names/history/${tokenId}`);
    return data.TokenNameHistory || [];
  }

  /**
   * Search NFTs by name
   */
  async searchTokenByName(name: string) {
    const { data } = await apiClient.get(
      `cst/names/search/${encodeURIComponent(name)}`
    );
    return data.TokenNameSearchResults || [];
  }

  /**
   * Get all NFTs with custom names
   */
  async getNamedNFTs() {
    const { data } = await apiClient.get("cst/names/named_only");
    return data.NamedTokens || [];
  }

  /**
   * Get CS NFT distribution
   */
  async getCSTDistribution() {
    const { data } = await apiClient.get("cst/distribution");
    return data.CosmicSignatureTokenDistribution || [];
  }

  /**
   * Get NFT transfer history for user
   */
  async getCSTTransfers(address: string) {
    const { data } = await apiClient.get(
      `cst/transfers/by_user/${address}/0/1000000`
    );
    return data.CosmicSignatureTransfers || [];
  }

  /**
   * Get all transfers for a specific token
   */
  async getTokenOwnershipTransfers(tokenId: number) {
    const { data } = await apiClient.get(
      `cst/transfers/all/${tokenId}/0/1000000`
    );
    return data.TokenTransfers || [];
  }

  /**
   * Trigger NFT image/video generation
   * Called after prize claim to generate NFT assets
   */
  async createNFTAssets(tokenId: number, count: number) {
    try {
      const { data } = await axios.post(`${ASSETS_BASE_URL}cosmicgame_tokens`, {
        token_id: tokenId,
        count,
      });
      return data?.task_id || -1;
    } catch (err) {
      console.error("Failed to trigger NFT generation:", err);
      return -1;
    }
  }

  // ==================== TOKENS (ERC-20) ====================

  /**
   * Get CST token balance distribution
   */
  async getCTBalanceDistribution() {
    const { data } = await apiClient.get("ct/balances");
    return data.CosmicTokenBalances || [];
  }

  /**
   * Get CST token transfer history for user
   */
  async getCTTransfers(address: string) {
    const { data } = await apiClient.get(
      `ct/transfers/by_user/${address}/0/1000000`
    );
    return data.CosmicTokenTransfers || [];
  }

  // ==================== USER INFO ====================

  /**
   * Get comprehensive user information
   * Returns user stats, bid history, and more
   */
  async getUserInfo(address: string) {
    const { data } = await apiClient.get(`user/info/${address}`);
    
    // Transform bid history if present
    if (data && data.Bids && Array.isArray(data.Bids)) {
      data.Bids = transformBidList(data.Bids);
    }
    
    return data;
  }

  /**
   * Get user balances (ETH and CST)
   */
  async getUserBalance(address: string) {
    const { data } = await apiClient.get(`user/balances/${address}`);
    return data;
  }

  /**
   * Get user's unclaimed winnings summary
   */
  async getUserWinnings(address: string) {
    const { data } = await apiClient.get(`user/notif_red_box/${address}`);
    return data.Winnings;
  }

  // ==================== DONATIONS ====================

  /**
   * Get ETH donations (simple)
   */
  async getETHDonationsSimple() {
    const { data } = await apiClient.get("donations/eth/simple/list/0/1000000");
    return data.DirectCGDonations || [];
  }

  /**
   * Get ETH donations (with info/JSON data)
   */
  async getETHDonationsWithInfo() {
    const { data } = await apiClient.get(
      "donations/eth/with_info/list/0/1000000"
    );
    return data.DirectCGDonations || [];
  }

  /**
   * Get ETH donations by round
   */
  async getETHDonationsByRound(roundNum: number) {
    const { data } = await apiClient.get(
      `donations/eth/both/by_round/${roundNum}`
    );
    return data.CosmicGameDonations || [];
  }

  /**
   * Get all ETH donations (both types)
   */
  async getAllETHDonations() {
    const { data } = await apiClient.get("donations/eth/both/all");
    return data.CosmicGameDonations || [];
  }

  /**
   * Get NFT donations list (global)
   */
  async getNFTDonationsList() {
    const { data } = await apiClient.get("donations/nft/list/0/1000000");
    return data.NFTDonations || [];
  }

  /**
   * Get NFT donations by round
   */
  async getNFTDonationsByRound(roundNum: number) {
    const { data } = await apiClient.get(`donations/nft/by_round/${roundNum}`);
    return data.NFTDonations || [];
  }

  /**
   * Get unclaimed donated NFTs by user
   */
  async getUnclaimedDonatedNFTsByUser(address: string) {
    const { data } = await apiClient.get(
      `donations/nft/unclaimed/by_user/${address}`
    );
    return data.UnclaimedDonatedNFTs || [];
  }

  /**
   * Get claimed donated NFTs by user
   */
  async getClaimedDonatedNFTsByUser(address: string) {
    const { data } = await apiClient.get(
      `donations/nft/claims/by_user/${address}`
    );
    return data.DonatedNFTClaims || [];
  }

  /**
   * Get ERC-20 token donations by round
   */
  async getERC20DonationsByRound(roundNum: number) {
    const { data } = await apiClient.get(
      `donations/erc20/by_round/detailed/${roundNum}`
    );
    return data.DonationsERC20ByRoundDetailed || [];
  }

  /**
   * Get ERC-20 donations by user
   */
  async getERC20DonationsByUser(address: string) {
    const { data } = await apiClient.get(`donations/erc20/by_user/${address}`);
    return data.DonatedPrizesERC20ByWinner || [];
  }

  // ==================== STAKING ====================

  /**
   * Get user's CST staking actions
   */
  async getStakingCSTActionsByUser(address: string) {
    const { data } = await apiClient.get(
      `staking/cst/actions/by_user/${address}/0/1000000`
    );
    return data.StakingCSTActions || [];
  }

  /**
   * Get global CST staking actions
   */
  async getStakingCSTActions() {
    const { data } = await apiClient.get(
      "staking/cst/actions/global/0/1000000"
    );
    return data.StakingCSTActions || [];
  }

  /**
   * Get staked CST tokens by user
   */
  async getStakedCSTTokensByUser(address: string) {
    const { data } = await apiClient.get(
      `staking/cst/staked_tokens/by_user/${address}`
    );
    return data.StakedTokensCST || [];
  }

  /**
   * Get all staked CST tokens (global)
   */
  async getStakedCSTTokens() {
    const { data } = await apiClient.get("staking/cst/staked_tokens/all");
    return data.StakedTokensCST || [];
  }

  /**
   * Get CST staking rewards by user
   */
  async getStakingRewardsByUser(address: string) {
    const { data } = await apiClient.get(
      `staking/cst/rewards/by_user/by_token/summary/${address}`
    );
    return data.RewardsByToken || [];
  }

  /**
   * Get uncollected CST staking rewards
   */
  async getStakingCSTRewardsToClaim(address: string) {
    const { data } = await apiClient.get(
      `staking/cst/rewards/to_claim/by_user/${address}`
    );
    return data.UnclaimedEthDeposits || [];
  }

  /**
   * Get collected CST staking rewards
   */
  async getStakingCSTRewardsCollected(address: string) {
    const { data } = await apiClient.get(
      `staking/cst/rewards/collected/by_user/${address}/0/1000000`
    );
    return data.CollectedStakingCSTRewards || [];
  }

  /**
   * Get global CST staking rewards
   */
  async getStakingCSTRewards() {
    const { data } = await apiClient.get("staking/cst/rewards/global");
    return data.StakingCSTRewards || [];
  }

  /**
   * Get CST staking rewards by round
   */
  async getStakingCSTRewardsByRound(roundNum: number) {
    const { data } = await apiClient.get(
      `staking/cst/rewards/by_round/${roundNum}`
    );
    return data.Rewards || [];
  }

  /**
   * Get RandomWalk staking actions by user
   */
  async getStakingRWLKActionsByUser(address: string) {
    const { data } = await apiClient.get(
      `staking/rwalk/actions/by_user/${address}/0/1000000`
    );
    return data.UserStakingActionsRWalk || [];
  }

  /**
   * Get global RandomWalk staking actions
   */
  async getStakingRWLKActions() {
    const { data } = await apiClient.get(
      "staking/rwalk/actions/global/0/1000000"
    );
    return data.GlobalStakingActionsRWalk || [];
  }

  /**
   * Get staked RandomWalk tokens by user
   */
  async getStakedRWLKTokensByUser(address: string) {
    const { data } = await apiClient.get(
      `staking/rwalk/staked_tokens/by_user/${address}`
    );
    return data.StakedTokensRWalk || [];
  }

  /**
   * Get all staked RandomWalk tokens
   */
  async getStakedRWLKTokens() {
    const { data } = await apiClient.get("staking/rwalk/staked_tokens/all");
    return data.StakedTokensRWalk || [];
  }

  /**
   * Get RandomWalk staking reward mints (CS NFTs won from staking)
   */
  async getStakingRWLKMintsByUser(address: string) {
    const { data } = await apiClient.get(
      `staking/rwalk/mints/by_user/${address}`
    );
    return data.RWalkStakingRewardMints || [];
  }

  /**
   * Get global RandomWalk staking rewards
   */
  async getStakingRWLKMintsGlobal() {
    const { data } = await apiClient.get(
      "staking/rwalk/mints/global/0/1000000"
    );
    return data.StakingRWalkRewardsMints || [];
  }

  // ==================== RAFFLE ====================

  /**
   * Get raffle NFT winners (global)
   */
  async getRaffleNFTWinners() {
    const { data } = await apiClient.get("raffle/nft/all/list/0/1000000");
    return data.RaffleNFTWinners || [];
  }

  /**
   * Get raffle NFT winners by round
   */
  async getRaffleNFTWinnersByRound(roundNum: number) {
    const { data } = await apiClient.get(`raffle/nft/by_round/${roundNum}`);
    return data.RaffleNFTWinners || [];
  }

  /**
   * Get raffle NFT winnings by user
   */
  async getRaffleNFTWinningsByUser(address: string) {
    const { data } = await apiClient.get(`raffle/nft/by_user/${address}`);
    return data.UserRaffleNFTWinnings || [];
  }

  // ==================== MARKETING ====================

  /**
   * Get global marketing rewards
   */
  async getMarketingRewards() {
    const { data } = await apiClient.get("marketing/rewards/global/0/1000000");
    return data.MarketingRewards || [];
  }

  /**
   * Get marketing rewards by user
   */
  async getMarketingRewardsByUser(address: string) {
    const { data } = await apiClient.get(
      `marketing/rewards/by_user/${address}/0/1000000`
    );
    return data.UserMarketingRewards || [];
  }

  // ==================== CHARITY ====================

  /**
   * Get charity deposits
   */
  async getCharityDeposits() {
    const { data } = await apiClient.get("donations/charity/deposits");
    return data.CharityDonations || [];
  }

  /**
   * Get charity deposits from Cosmic Game
   */
  async getCharityCGDeposits() {
    const { data } = await apiClient.get("donations/charity/cg_deposits");
    return data.CharityDonations || [];
  }

  /**
   * Get voluntary charity donations
   */
  async getCharityVoluntary() {
    const { data } = await apiClient.get("donations/charity/voluntary");
    return data.CharityDonations || [];
  }

  /**
   * Get charity withdrawals
   */
  async getCharityWithdrawals() {
    const { data } = await apiClient.get("donations/charity/withdrawals");
    return data.CharityWithdrawals || [];
  }

  // ==================== SYSTEM ====================

  /**
   * Get current server time
   */
  async getCurrentTime() {
    const { data } = await apiClient.get("time/current");
    return data.CurrentTimeStamp;
  }

  /**
   * Get time until prize can be claimed
   */
  async getTimeUntilPrize() {
    const { data } = await apiClient.get("time/until_prize");
    return data.TimeUntilPrize;
  }

  /**
   * Get system mode changes (round activations)
   */
  async getSystemModeList() {
    const { data } = await apiClient.get("system/modelist/-1/1000000");
    return data.SystemModeChanges || [];
  }

  /**
   * Get system events (admin actions)
   */
  async getSystemEvents(start: number, end: number) {
    const { data } = await apiClient.get(`system/admin_events/${start}/${end}`);
    return data.AdminEvents || [];
  }

  // ==================== ADMIN (if needed) ====================

  /**
   * Get banned bids
   */
  async getBannedBids() {
    try {
      const { data } = await axios.get(`${ASSETS_BASE_URL}get_banned_bids`);
      return data || [];
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 400) return [];
      throw err;
    }
  }

  /**
   * Ban a bid
   */
  async banBid(bidId: number, userAddr: string) {
    const { data } = await axios.post(`${ASSETS_BASE_URL}ban_bid`, {
      bid_id: bidId,
      user_addr: userAddr,
    });
    return data;
  }

  /**
   * Unban a bid
   */
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

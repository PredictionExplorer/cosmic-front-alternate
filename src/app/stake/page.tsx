"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Gem, TrendingUp, AlertCircle, Award, Zap, ChevronDown, X, HelpCircle } from "lucide-react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/game/StatCard";
import { formatEth } from "@/lib/utils";
import { api } from "@/services/api";
import type {
  CSTToken,
  StakedCSTToken,
  RWLKToken,
  StakedRWLKToken,
} from "@/types";
import { useCosmicSignatureNFT } from "@/hooks/useCosmicSignatureNFT";
import {
  useStakingWalletCST,
  useStakingWalletRWLK,
} from "@/hooks/useStakingWallet";
import { useRandomWalkNFT } from "@/hooks/useRandomWalkNFT";
import { CONTRACTS } from "@/lib/web3/contracts";
import { useNotification } from "@/contexts/NotificationContext";
import { useApiData } from "@/contexts/ApiDataContext";

/**
 * Type for staking rewards from API
 */
interface StakingReward {
  TokenId: number;
  RewardToCollectEth?: number;
  TotalReward?: number;
}

/**
 * Get user's available (unstaked) Cosmic Signature NFTs
 * Filters tokens where Staked === false
 */
async function getAvailableCSTTokensByUser(
  address: string
): Promise<CSTToken[]> {
  const tokens = await api.getCSTTokensByUser(address);
  return tokens.filter(
    (token: CSTToken) => !token.Staked && !token.WasUnstaked
  );
}

/**
 * Get NFT image URL from token ID
 */
function getNFTImageUrl(tokenId: number): string {
  return `/nfts/${tokenId}.jpg`;
}

export default function StakePage() {
  const { address, isConnected } = useAccount();
  const { dashboardData: apiDashboardData } = useApiData();
  const [activeTab, setActiveTab] = useState<"cosmic" | "randomwalk">("cosmic");
  const [availableTokens, setAvailableTokens] = useState<CSTToken[]>([]);
  const [stakedTokens, setStakedTokens] = useState<StakedCSTToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [stakingTokenId, setStakingTokenId] = useState<number | null>(null);
  const [selectedTokenIds, setSelectedTokenIds] = useState<Set<number>>(
    new Set()
  );
  const [isStakingMultiple, setIsStakingMultiple] = useState(false);
  const [unstakingActionId, setUnstakingActionId] = useState<number | null>(
    null
  );
  const [stakingRewards, setStakingRewards] = useState<StakingReward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [selectedStakedIds, setSelectedStakedIds] = useState<Set<number>>(
    new Set()
  );
  const [stakedCurrentPage, setStakedCurrentPage] = useState(1);
  const itemsPerPage = 8; // Show 8 NFTs per page (2 rows of 4)
  const stakedItemsPerPage = 5; // Show 5 staked NFTs per page

  // Get staking percentage from dashboard API
  const stakingPercentage = apiDashboardData?.StakignPercentage || 0;

  // Random Walk NFT state
  const [availableRWLKTokens, setAvailableRWLKTokens] = useState<RWLKToken[]>(
    []
  );
  const [stakedRWLKTokens, setStakedRWLKTokens] = useState<StakedRWLKToken[]>(
    []
  );
  const [rwlkLoading, setRwlkLoading] = useState(false);
  const [rwlkCurrentPage, setRwlkCurrentPage] = useState(1);
  const [stakedRwlkCurrentPage, setStakedRwlkCurrentPage] = useState(1);
  const [selectedRWLKTokenIds, setSelectedRWLKTokenIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedStakedRWLKIds, setSelectedStakedRWLKIds] = useState<
    Set<number>
  >(new Set());
  const [stakingRWLKTokenId, setStakingRWLKTokenId] = useState<number | null>(
    null
  );
  const [isStakingRWLKMultiple, setIsStakingRWLKMultiple] = useState(false);
  const [unstakingRWLKActionId, setUnstakingRWLKActionId] = useState<
    number | null
  >(null);

  // Help sections visibility
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showRWalkHowItWorks, setShowRWalkHowItWorks] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<{
    CosmicSignatureTokenStakingTotalSupply?: number;
    RandomWalkNFTStakingTotalSupply?: number;
    MainStats?: {
      StakeStatisticsCST?: {
        TotalTokensStaked?: number;
        TotalRewardEth?: number;
      };
    };
  } | null>(null);

  // Hooks
  const { showSuccess, showError, showInfo } = useNotification();
  const nftContract = useCosmicSignatureNFT();
  const rwlkNftContract = useRandomWalkNFT();
  const stakingContract = useStakingWalletCST();
  const rwlkStakingContract = useStakingWalletRWLK();

  // Fetch dashboard data for global staking stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await api.getDashboardInfo();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch user's CST tokens
  useEffect(() => {
    if (!address || !isConnected) {
      setAvailableTokens([]);
      setStakedTokens([]);
      setCurrentPage(1);
      return;
    }

    const fetchTokens = async () => {
      setLoading(true);
      try {
        // Fetch staked and available tokens separately using dedicated API methods
        const [staked, available] = await Promise.all([
          api.getStakedCSTTokensByUser(address),
          getAvailableCSTTokensByUser(address),
        ]);
        setStakedTokens(staked);
        setAvailableTokens(available);
        setCurrentPage(1); // Reset to first page when data changes
      } catch (error) {
        console.error("Failed to fetch CST tokens:", error);
        // Fall back to empty arrays on error
        setAvailableTokens([]);
        setStakedTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [address, isConnected]);

  // Check if NFT contracts are approved for staking
  const { data: isApprovedForAll } = nftContract.read.useIsApprovedForAll(
    (address as `0x${string}`) || "0x0000000000000000000000000000000000000000",
    CONTRACTS.STAKING_WALLET_CST
  );

  const { data: isRWLKApprovedForAll } =
    rwlkNftContract.read.useIsApprovedForAll(
      (address as `0x${string}`) ||
        "0x0000000000000000000000000000000000000000",
      CONTRACTS.STAKING_WALLET_RWLK
    );

  // Get user's Random Walk NFT token IDs
  const { data: rwlkTokenIds } = rwlkNftContract.read.useWalletOfOwner(
    address as `0x${string}` | undefined
  );

  // Refresh token data
  const refreshTokenData = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      // Fetch staked and available tokens separately using dedicated API methods
      const [staked, available] = await Promise.all([
        api.getStakedCSTTokensByUser(address),
        getAvailableCSTTokensByUser(address),
      ]);

      setStakedTokens(staked);
      setAvailableTokens(available);
      // Clear selections after refresh
      setSelectedTokenIds(new Set());
      setSelectedStakedIds(new Set());
    } catch (error) {
      console.error("Failed to refresh token data:", error);
    }
  }, [address, isConnected]);

  // Refresh Random Walk NFT data
  const refreshRWLKTokenData = useCallback(async () => {
    if (!address || !isConnected || !rwlkTokenIds) return;

    try {
      // Fetch staked tokens and staking actions
      const [stakedTokens, rwalkActions] = await Promise.all([
        api.getStakedRWLKTokensByUser(address),
        api.getStakingRWLKActionsByUser(address),
      ]);

      // Convert BigInt array to number array and sort
      const ownedTokenIds = (rwlkTokenIds as bigint[])
        .map((id) => Number(id))
        .sort((a, b) => a - b);

      // Create set of staked token IDs for quick lookup
      const stakedTokenIdsSet = new Set(
        stakedTokens.map((token: StakedRWLKToken) => token.TokenId)
      );

      // Filter available tokens (owned and not currently staked)
      const available: RWLKToken[] = ownedTokenIds
        .filter((tokenId) => !stakedTokenIdsSet.has(tokenId))
        .map((tokenId) => ({
          TokenId: tokenId,
          IsUsed: false,
          IsStaked: false,
        }));

      setStakedRWLKTokens(stakedTokens);
      setAvailableRWLKTokens(available);
      setSelectedRWLKTokenIds(new Set());
      setSelectedStakedRWLKIds(new Set());
    } catch (error) {
      console.error("Failed to refresh Random Walk token data:", error);
    }
  }, [address, isConnected, rwlkTokenIds]);

  // Fetch user's Random Walk NFTs
  useEffect(() => {
    if (!address || !isConnected || !rwlkTokenIds) {
      setAvailableRWLKTokens([]);
      setStakedRWLKTokens([]);
      setRwlkCurrentPage(1);
      return;
    }

    const fetchRWLKTokens = async () => {
      setRwlkLoading(true);
      try {
        // Fetch staked tokens and staking actions
        const [stakedTokens, rwalkActions] = await Promise.all([
          api.getStakedRWLKTokensByUser(address),
          api.getStakingRWLKActionsByUser(address),
        ]);

        // Convert BigInt array to number array and sort
        const ownedTokenIds = (rwlkTokenIds as bigint[])
          .map((id) => Number(id))
          .sort((a, b) => a - b);

        // Create set of staked token IDs for quick lookup
        const stakedTokenIdsSet = new Set(
          stakedTokens.map((token: StakedRWLKToken) => token.TokenId)
        );

        // Filter available tokens (owned and not currently staked)
        const available: RWLKToken[] = ownedTokenIds
          .filter((tokenId) => !stakedTokenIdsSet.has(tokenId))
          .map((tokenId) => ({
            TokenId: tokenId,
            IsUsed: false,
            IsStaked: false,
          }));

        setStakedRWLKTokens(stakedTokens);
        setAvailableRWLKTokens(available);
        setRwlkCurrentPage(1); // Reset to first page when data changes
      } catch (error) {
        console.error("Failed to fetch Random Walk tokens:", error);
        setAvailableRWLKTokens([]);
        setStakedRWLKTokens([]);
      } finally {
        setRwlkLoading(false);
      }
    };

    fetchRWLKTokens();
  }, [address, isConnected, rwlkTokenIds]);

  // Fetch staking rewards
  const fetchStakingRewards = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      setLoadingRewards(true);
      const rewards = await api.getStakingRewardsByUser(address);
      setStakingRewards(rewards);
    } catch (error) {
      console.error("Failed to fetch staking rewards:", error);
      setStakingRewards([]);
    } finally {
      setLoadingRewards(false);
    }
  }, [address, isConnected]);

  // Fetch rewards when staked tokens change
  useEffect(() => {
    if (stakedTokens.length > 0) {
      fetchStakingRewards();
    }
  }, [stakedTokens.length, fetchStakingRewards]);

  // Watch for transaction success and refresh data
  useEffect(() => {
    if (
      stakingContract.status.isSuccess &&
      !stakingContract.status.isPending &&
      !stakingContract.status.isConfirming &&
      address &&
      (stakingTokenId !== null || isStakingMultiple || unstakingActionId !== null)
    ) {
      // Transaction is fully confirmed, refresh data and show success
      const handleSuccess = async () => {
        await refreshTokenData();

        // Show success message
        if (isStakingMultiple && selectedTokenIds.size > 0) {
          showSuccess(
            `Successfully staked ${selectedTokenIds.size} NFT${
              selectedTokenIds.size > 1 ? "s" : ""
            }!`
          );
          setSelectedTokenIds(new Set());
        } else if (stakingTokenId) {
          showSuccess(`Successfully staked token #${stakingTokenId}!`);
        } else if (unstakingActionId) {
          showSuccess(`Successfully unstaked NFT and claimed rewards!`);
        }

        // Clear staking/unstaking states
        setStakingTokenId(null);
        setIsStakingMultiple(false);
        setUnstakingActionId(null);
      };

      handleSuccess();
    }
  }, [
    stakingContract.status.isSuccess,
    stakingContract.status.isPending,
    stakingContract.status.isConfirming,
    address,
    stakingTokenId,
    isStakingMultiple,
    unstakingActionId,
    refreshTokenData,
    selectedTokenIds.size,
    showSuccess,
  ]);

  // Watch for CST transaction failures
  useEffect(() => {
    if (
      stakingContract.status.error &&
      !stakingContract.status.isPending &&
      !stakingContract.status.isConfirming &&
      (stakingTokenId !== null || isStakingMultiple || unstakingActionId !== null)
    ) {
      // Transaction failed, show error and reset states
      const errorMessage = (stakingContract.status.error as Error)?.message || "Transaction failed";
      showError(errorMessage);
      
      setStakingTokenId(null);
      setIsStakingMultiple(false);
      setUnstakingActionId(null);
    }
  }, [
    stakingContract.status.error,
    stakingContract.status.isPending,
    stakingContract.status.isConfirming,
    stakingTokenId,
    isStakingMultiple,
    unstakingActionId,
    showError,
  ]);

  // Get reward for a specific token
  const getTokenReward = (tokenId: number) => {
    const reward = stakingRewards.find((r) => r.TokenId === tokenId);
    return reward?.RewardToCollectEth || reward?.TotalReward || 0;
  };

  // Calculate total rewards
  const totalRewards = stakingRewards.reduce(
    (sum, reward) =>
      sum + (reward.RewardToCollectEth || reward?.TotalReward || 0),
    0
  );

  // Toggle staked token selection
  const toggleStakedTokenSelection = (stakeActionId: number) => {
    console.log("Toggling StakeActionId:", stakeActionId);
    console.log("Current selections:", Array.from(selectedStakedIds));
    
    setSelectedStakedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stakeActionId)) {
        console.log("Removing:", stakeActionId);
        newSet.delete(stakeActionId);
      } else {
        console.log("Adding:", stakeActionId);
        newSet.add(stakeActionId);
      }
      console.log("New selections:", Array.from(newSet));
      return newSet;
    });
  };

  // Select all staked tokens
  const selectAllStakedTokens = () => {
    console.log("Select all called");
    console.log("Staked tokens:", stakedTokens);
    const allStakeActionIds = new Set(
      stakedTokens.map((stakedToken) => {
        const actionId = stakedToken.TokenInfo.StakeActionId;
        console.log(
          "Mapping token:",
          stakedToken.TokenInfo.TokenId,
          "StakeActionId:",
          actionId
        );
        return actionId;
      })
    );
    console.log("All StakeActionIds:", Array.from(allStakeActionIds));
    setSelectedStakedIds(allStakeActionIds);
  };

  // Select current page staked tokens
  const selectCurrentPageStakedTokens = () => {
    const startIdx = (stakedCurrentPage - 1) * stakedItemsPerPage;
    const endIdx = startIdx + stakedItemsPerPage;
    const pageTokens = stakedTokens.slice(startIdx, endIdx);
    const pageActionIds = new Set(
      pageTokens.map((stakedToken) => stakedToken.TokenInfo.StakeActionId)
    );
    setSelectedStakedIds(pageActionIds);
  };

  // Deselect all staked tokens
  const deselectAllStakedTokens = () => {
    setSelectedStakedIds(new Set());
  };

  // Handle unstake many selected
  const handleUnstakeSelected = async () => {
    if (selectedStakedIds.size === 0) {
      showError("Please select at least one NFT to unstake.");
      return;
    }

    try {
      if (!stakingContract) {
        showError(
          "Please connect your wallet and ensure you are on the correct network."
        );
        return;
      }

      setIsStakingMultiple(true);

      const stakeActionIds = Array.from(selectedStakedIds).map((id) =>
        BigInt(id)
      );

      await stakingContract.write.unstakeMany(stakeActionIds);
      showSuccess(
        `Transaction submitted! Unstaking ${selectedStakedIds.size} NFTs and claiming rewards...`
      );
    } catch (error: unknown) {
      console.error("Unstake selected failed:", error);
      showError((error as Error)?.message || "Failed to unstake NFTs. Please try again.");
      setIsStakingMultiple(false);
    }
  };

  // Toggle NFT selection
  const toggleTokenSelection = (tokenId: number) => {
    setSelectedTokenIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  };

  // Select all available tokens
  const selectAllTokens = () => {
    const allTokenIds = new Set(availableTokens.map((token) => token.TokenId));
    setSelectedTokenIds(allTokenIds);
  };

  // Deselect all tokens
  const deselectAllTokens = () => {
    setSelectedTokenIds(new Set());
  };

  // Handle approve action
  const handleApprove = useCallback(async () => {
    if (!nftContract) return false;

    try {
      await nftContract.write.setApprovalForAll(
        CONTRACTS.STAKING_WALLET_CST,
        true
      );
      showSuccess("Approval requested! Please confirm the transaction.");
      return true;
    } catch (error: unknown) {
      console.error("Approval failed:", error);
      showError((error as Error)?.message || "Failed to approve. Please try again.");
      return false;
    }
  }, [nftContract, showSuccess, showError]);

  // Handle staking action
  const handleStake = async (tokenId: number) => {
    try {
      // Check if contracts are initialized
      if (!nftContract || !stakingContract) {
        showError(
          "Please connect your wallet and ensure you are on the correct network."
        );
        return;
      }

      setStakingTokenId(tokenId);

      // Check if approval is needed
      if (!isApprovedForAll) {
        const approved = await handleApprove();
        if (!approved) {
          setStakingTokenId(null);
          return;
        }
        // Wait for approval to be confirmed
        showSuccess(
          "Waiting for approval confirmation... You can then stake your NFT."
        );
        setStakingTokenId(null);
        return;
      }

      // Stake the NFT
      showInfo("Please confirm the transaction in your wallet...");
      await stakingContract.write.stake(BigInt(tokenId));
      showInfo("Transaction submitted! Waiting for confirmation...");

      // Note: List will auto-refresh when transaction completes (see useEffect)
    } catch (error: unknown) {
      console.error("Staking failed:", error);
      showError((error as Error)?.message || "Failed to stake NFT. Please try again.");
      setStakingTokenId(null);
    }
  };

  // Handle staking multiple NFTs
  const handleStakeMany = async (tokenIds: number[]) => {
    try {
      // Check if contracts are initialized
      if (!nftContract || !stakingContract) {
        showError(
          "Please connect your wallet and ensure you are on the correct network."
        );
        return;
      }

      if (tokenIds.length === 0) {
        showError("Please select at least one NFT to stake.");
        return;
      }

      setIsStakingMultiple(true);

      // Check if approval is needed
      if (!isApprovedForAll) {
        const approved = await handleApprove();
        if (!approved) {
          setIsStakingMultiple(false);
          return;
        }
        // Wait for approval to be confirmed
        showSuccess(
          "Waiting for approval confirmation... You can then stake your NFTs."
        );
        setIsStakingMultiple(false);
        return;
      }

      // Stake multiple NFTs
      showInfo("Please confirm the transaction in your wallet...");
      const tokenIdsBigInt = tokenIds.map((id) => BigInt(id));
      await stakingContract.write.stakeMany(tokenIdsBigInt);
      showInfo(`Transaction submitted! Staking ${tokenIds.length} NFTs...`);

      // Note: List will auto-refresh when transaction completes (see useEffect)
    } catch (error: unknown) {
      console.error("Multi-staking failed:", error);
      showError((error as Error)?.message || "Failed to stake NFTs. Please try again.");
      setIsStakingMultiple(false);
    }
  };

  // Handle unstaking action
  const handleUnstake = async (stakeActionId: number, tokenId: number) => {
    try {
      // Check if contracts are initialized
      if (!stakingContract) {
        showError(
          "Please connect your wallet and ensure you are on the correct network."
        );
        return;
      }

      setUnstakingActionId(stakeActionId);

      // Unstake the NFT
      showInfo("Please confirm the transaction in your wallet...");
      await stakingContract.write.unstake(BigInt(stakeActionId));
      showInfo(
        `Transaction submitted! Unstaking token #${tokenId} and claiming rewards...`
      );

      // Note: List will auto-refresh when transaction completes (see useEffect)
    } catch (error: unknown) {
      console.error("Unstaking failed:", error);
      showError((error as Error)?.message || "Failed to unstake NFT. Please try again.");
      setUnstakingActionId(null);
    }
  };

  // === Random Walk NFT Handlers ===

  // Handle RWLK approve action
  const handleRWLKApprove = useCallback(async () => {
    if (!rwlkNftContract) return false;

    try {
      await rwlkNftContract.write.setApprovalForAll(
        CONTRACTS.STAKING_WALLET_RWLK,
        true
      );
      showSuccess("Approval requested! Please confirm the transaction.");
      return true;
    } catch (error: unknown) {
      console.error("RWLK Approval failed:", error);
      showError((error as Error)?.message || "Failed to approve. Please try again.");
      return false;
    }
  }, [rwlkNftContract, showSuccess, showError]);

  // Handle RWLK staking action
  const handleRWLKStake = async (tokenId: number) => {
    try {
      if (!rwlkNftContract || !rwlkStakingContract) {
        showError(
          "Please connect your wallet and ensure you are on the correct network."
        );
        return;
      }

      setStakingRWLKTokenId(tokenId);

      // Check if approval is needed
      if (!isRWLKApprovedForAll) {
        const approved = await handleRWLKApprove();
        if (!approved) {
          setStakingRWLKTokenId(null);
          return;
        }
        showSuccess(
          "Waiting for approval confirmation... You can then stake your NFT."
        );
        setStakingRWLKTokenId(null);
        return;
      }

      // Stake the NFT
      showInfo("Please confirm the transaction in your wallet...");
      await rwlkStakingContract.write.stake(BigInt(tokenId));
      showInfo("Transaction submitted! Waiting for confirmation...");
      // Success will be handled by useEffect when transaction confirms
    } catch (error: unknown) {
      console.error("RWLK Staking failed:", error);
      showError((error as Error)?.message || "Failed to stake NFT. Please try again.");
      setStakingRWLKTokenId(null);
    }
  };

  // Handle staking multiple RWLK NFTs
  const handleRWLKStakeMany = async (tokenIds: number[]) => {
    try {
      if (!rwlkNftContract || !rwlkStakingContract) {
        showError(
          "Please connect your wallet and ensure you are on the correct network."
        );
        return;
      }

      if (tokenIds.length === 0) {
        showError("Please select at least one NFT to stake.");
        return;
      }

      setIsStakingRWLKMultiple(true);

      // Check if approval is needed
      if (!isRWLKApprovedForAll) {
        const approved = await handleRWLKApprove();
        if (!approved) {
          setIsStakingRWLKMultiple(false);
          return;
        }
        showSuccess(
          "Waiting for approval confirmation... You can then stake your NFTs."
        );
        setIsStakingRWLKMultiple(false);
        return;
      }

      // Stake multiple NFTs
      showInfo("Please confirm the transaction in your wallet...");
      const tokenIdsBigInt = tokenIds.map((id) => BigInt(id));
      await rwlkStakingContract.write.stakeMany(tokenIdsBigInt);
      showInfo(`Transaction submitted! Staking ${tokenIds.length} NFTs...`);
      // Success will be handled by useEffect when transaction confirms
    } catch (error: unknown) {
      console.error("RWLK Multi-staking failed:", error);
      showError((error as Error)?.message || "Failed to stake NFTs. Please try again.");
      setIsStakingRWLKMultiple(false);
    }
  };

  // Handle RWLK unstaking action
  const handleRWLKUnstake = async (stakeActionId: number, tokenId: number) => {
    try {
      if (!rwlkStakingContract) {
        showError(
          "Please connect your wallet and ensure you are on the correct network."
        );
        return;
      }

      setUnstakingRWLKActionId(stakeActionId);

      showInfo("Please confirm the transaction in your wallet...");
      await rwlkStakingContract.write.unstake(BigInt(stakeActionId));
      showInfo(`Transaction submitted! Unstaking token #${tokenId}...`);
      // Success will be handled by useEffect when transaction confirms
    } catch (error: unknown) {
      console.error("RWLK Unstaking failed:", error);
      showError((error as Error)?.message || "Failed to unstake NFT. Please try again.");
      setUnstakingRWLKActionId(null);
    }
  };

  // Handle unstaking selected RWLK NFTs
  const handleRWLKUnstakeSelected = async () => {
    if (selectedStakedRWLKIds.size === 0) {
      showError("Please select at least one NFT to unstake.");
      return;
    }

    try {
      if (!rwlkStakingContract) {
        showError(
          "Please connect your wallet and ensure you are on the correct network."
        );
        return;
      }

      setIsStakingRWLKMultiple(true);

      const stakeActionIds = Array.from(selectedStakedRWLKIds).map((id) =>
        BigInt(id)
      );

      showInfo("Please confirm the transaction in your wallet...");
      await rwlkStakingContract.write.unstakeMany(stakeActionIds);
      showInfo(
        `Transaction submitted! Unstaking ${selectedStakedRWLKIds.size} NFTs...`
      );
      // Success will be handled by useEffect when transaction confirms
    } catch (error: unknown) {
      console.error("RWLK Unstake selected failed:", error);
      showError((error as Error)?.message || "Failed to unstake NFTs. Please try again.");
      setIsStakingRWLKMultiple(false);
    }
  };

  // Watch for RWLK transaction success and refresh data
  useEffect(() => {
    if (
      rwlkStakingContract.status.isSuccess &&
      !rwlkStakingContract.status.isPending &&
      !rwlkStakingContract.status.isConfirming &&
      address &&
      (stakingRWLKTokenId !== null || isStakingRWLKMultiple || unstakingRWLKActionId !== null)
    ) {
      // Transaction is fully confirmed, refresh data and show success
      const handleSuccess = async () => {
        await refreshRWLKTokenData();

        // Handle success messages based on what operation was performed
        if (isStakingRWLKMultiple && selectedRWLKTokenIds.size > 0) {
          // Staking multiple NFTs
          showSuccess(
            `Successfully staked ${selectedRWLKTokenIds.size} NFT${
              selectedRWLKTokenIds.size > 1 ? "s" : ""
            }!`
          );
          setSelectedRWLKTokenIds(new Set());
        } else if (isStakingRWLKMultiple && selectedStakedRWLKIds.size > 0) {
          // Unstaking multiple NFTs
          showSuccess(
            `Successfully unstaked ${selectedStakedRWLKIds.size} NFT${
              selectedStakedRWLKIds.size > 1 ? "s" : ""
            }!`
          );
          setSelectedStakedRWLKIds(new Set());
        } else if (stakingRWLKTokenId) {
          // Staking single NFT
          showSuccess(`Successfully staked token #${stakingRWLKTokenId}!`);
        } else if (unstakingRWLKActionId) {
          // Unstaking single NFT
          showSuccess(`Successfully unstaked NFT!`);
        }

        setStakingRWLKTokenId(null);
        setIsStakingRWLKMultiple(false);
        setUnstakingRWLKActionId(null);
      };

      handleSuccess();
    }
  }, [
    rwlkStakingContract.status.isSuccess,
    rwlkStakingContract.status.isPending,
    rwlkStakingContract.status.isConfirming,
    address,
    stakingRWLKTokenId,
    isStakingRWLKMultiple,
    unstakingRWLKActionId,
    refreshRWLKTokenData,
    selectedRWLKTokenIds.size,
    selectedStakedRWLKIds.size,
    showSuccess,
  ]);

  // Watch for RWLK transaction failures
  useEffect(() => {
    if (
      rwlkStakingContract.status.error &&
      !rwlkStakingContract.status.isPending &&
      !rwlkStakingContract.status.isConfirming &&
      (stakingRWLKTokenId !== null || isStakingRWLKMultiple || unstakingRWLKActionId !== null)
    ) {
      // Transaction failed, show error and reset states
      const errorMessage = (rwlkStakingContract.status.error as Error)?.message || "Transaction failed";
      showError(errorMessage);
      
      setStakingRWLKTokenId(null);
      setIsStakingRWLKMultiple(false);
      setUnstakingRWLKActionId(null);
    }
  }, [
    rwlkStakingContract.status.error,
    rwlkStakingContract.status.isPending,
    rwlkStakingContract.status.isConfirming,
    stakingRWLKTokenId,
    isStakingRWLKMultiple,
    unstakingRWLKActionId,
    showError,
  ]);

  // Calculate pagination for available tokens
  const totalPages = Math.ceil(availableTokens.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTokens = availableTokens.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to the NFT section
    const nftSection = document.getElementById("available-nfts-section");
    if (nftSection) {
      nftSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Calculate pagination for staked tokens
  const stakedTotalPages = Math.ceil(stakedTokens.length / stakedItemsPerPage);
  const stakedStartIndex = (stakedCurrentPage - 1) * stakedItemsPerPage;
  const stakedEndIndex = stakedStartIndex + stakedItemsPerPage;
  const paginatedStakedTokens = useMemo(() => {
    // Sort by stake timestamp (oldest first, matching legacy component)
    const sorted = [...stakedTokens].sort(
      (a, b) => a.StakeTimeStamp - b.StakeTimeStamp
    );
    return sorted.slice(stakedStartIndex, stakedEndIndex);
  }, [stakedTokens, stakedStartIndex, stakedEndIndex]);

  const handleStakedPageChange = (page: number) => {
    setStakedCurrentPage(page);
    const stakedSection = document.getElementById("staked-nfts-section");
    if (stakedSection) {
      stakedSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Calculate stats from real data
  const yourNFTCount = isConnected
    ? availableTokens.length + stakedTokens.length
    : 0;
  const yourStakedCount = isConnected ? stakedTokens.length : 0;
  const yourAvailableCount = isConnected ? availableTokens.length : 0;

  // Get totalStaked and rewardPerNFT from API data
  const totalStaked = dashboardData?.MainStats?.StakeStatisticsCST?.TotalTokensStaked || 0;
  const stakingAmountEth = dashboardData?.MainStats?.StakeStatisticsCST?.TotalRewardEth || 0;
  const rewardPerNFT = totalStaked > 0 ? stakingAmountEth / totalStaked : 0;

  return (
    <div className="min-h-screen">
      {/* Compact Tab Selector */}
      <section className="py-4 bg-background-surface/50 sticky top-[72px] lg:top-[88px] z-40 backdrop-blur-xl border-b border-text-muted/10">
        <Container>
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-lg bg-background-elevated border border-text-muted/10">
              <button
                onClick={() => setActiveTab("cosmic")}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === "cosmic"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Cosmic Signature NFTs
              </button>
              <button
                onClick={() => setActiveTab("randomwalk")}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === "randomwalk"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Random Walk NFTs
              </button>
            </div>
          </div>
        </Container>
      </section>

      {activeTab === "cosmic" && (
        <>
          {/* Overview Stats */}
          <section className="py-12 relative">
            {/* Floating Info Card - Positioned over stats (hidden on mobile) */}
            <div className="hidden lg:block absolute top-12 left-8 z-10 pointer-events-none">
              <Card glass className="w-80 p-6 shadow-2xl border-2 border-text-muted/20 backdrop-blur-md">
                <h1 className="text-2xl font-serif font-semibold text-text-primary mb-2">
                  Stake NFTs,
                  <span className="text-gradient block">Earn Rewards</span>
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Lock your NFTs to earn a share of {stakingPercentage}% of each round&apos;s prize pool. Withdraw anytime with accumulated rewards.
                </p>
              </Card>
            </div>

            <Container>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="Your NFTs"
                  value={loading ? "..." : yourNFTCount}
                  icon={Gem}
                  className="h-full"
                />
                <StatCard
                  label="Currently Staked"
                  value={loading ? "..." : yourStakedCount}
                  icon={Award}
                  className="h-full"
                />
                <StatCard
                  label="Total Rewards (Global)"
                  value={loading ? "..." : `${formatEth(stakingAmountEth)} ETH`}
                  valueClassName="text-xl md:text-2xl"
                  icon={TrendingUp}
                  className="h-full"
                />
                <StatCard
                  label="Reward Per NFT"
                  value={`${formatEth(rewardPerNFT)} ETH`}
                  valueClassName="text-xl md:text-2xl"
                  icon={Zap}
                  className="h-full"
                />
              </div>
            </Container>
          </section>

          {/* How It Works - Collapsible */}
          <section className="py-6">
            <Container size="lg">
              <div className="flex justify-center mb-4">
                <Button
                  variant="outline"
                  onClick={() => setShowHowItWorks(!showHowItWorks)}
                  className="gap-2"
                >
                  <HelpCircle size={18} />
                  {showHowItWorks ? 'Hide' : 'Show'} How Staking Works
                  <ChevronDown 
                    size={18} 
                    className={`transition-transform ${showHowItWorks ? 'rotate-180' : ''}`}
                  />
                </Button>
              </div>

              {showHowItWorks && (
                <Card glass className="p-8 md:p-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl font-semibold text-text-primary">
                      How Staking Works
                    </h2>
                    <button
                      onClick={() => setShowHowItWorks(false)}
                      className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
                      aria-label="Close"
                    >
                      <X size={20} className="text-text-secondary hover:text-text-primary" />
                    </button>
                  </div>
                  <p className="text-center text-text-secondary mb-8">Follow these simple steps</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    {
                      step: "1",
                      title: "Stake Your NFTs",
                      description:
                        "Transfer your Cosmic Signature NFTs to the staking contract. They remain your property.",
                    },
                    {
                      step: "2",
                      title: "Earn Every Round",
                      description:
                        `${stakingPercentage}% of each round's prize pool is distributed proportionally among all staked NFTs.`,
                    },
                    {
                      step: "3",
                      title: "Unstake Anytime",
                      description:
                        "Withdraw your NFTs and claim accumulated rewards whenever you want. No lock period.",
                    },
                  ].map((item, index) => (
                    <div key={item.step} className="relative">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="font-mono text-xl font-semibold text-primary">
                            #{item.step}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      {index < 2 && (
                        <div className="hidden md:block absolute top-6 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-lg bg-background-elevated border border-text-muted/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Award className="text-primary" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          Total NFTs Staked (Globally)
                        </p>
                        <p className="font-mono text-2xl font-semibold text-primary">
                          {totalStaked}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted">
                      Total number of NFTs staked by all users across the network
                    </p>
                  </div>

                  <div className="p-6 rounded-lg bg-background-elevated border border-text-muted/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-status-success/10 flex items-center justify-center">
                        <Zap className="text-status-success" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          Reward Per NFT (Current)
                        </p>
                        <p className="font-mono text-2xl font-semibold text-status-success">
                          {formatEth(rewardPerNFT)} ETH
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted">
                      Estimated reward per staked NFT based on current round
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-text-secondary">
                    💡 <strong>How rewards work:</strong> Rewards update after each round ends. 
                    The more rounds that pass while you&apos;re staked, the more you earn. 
                    Rewards are distributed proportionally - if you stake 10 NFTs out of 
                    {totalStaked > 0 ? ` ${totalStaked}` : ' 100'} total staked, you earn 
                    {totalStaked > 0 ? ` ${((10 / totalStaked) * 100).toFixed(1)}%` : ' 10%'} of 
                    the staking pool each round.
                  </p>
                </div>
              </Card>
              )}
            </Container>
          </section>

          {/* Your Unstaked NFTs */}
          {!isConnected && (
            <section className="py-12">
              <Container>
                <Card glass className="p-8">
                  <div className="text-center py-12">
                    <Gem size={48} className="text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary mb-6">
                      Connect your wallet to view and stake your Cosmic
                      Signature NFTs
                    </p>
                  </div>
                </Card>
              </Container>
            </section>
          )}

          {isConnected && yourAvailableCount > 0 && (
            <section id="available-nfts-section" className="py-12">
              <Container>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-semibold text-text-primary">
                    Your Available NFTs
                  </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary">
                        Showing {startIndex + 1}-
                        {Math.min(endIndex, yourAvailableCount)} of{" "}
                        {yourAvailableCount}
                      </span>
                    </div>
                  </div>

                  {/* Selection Controls */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                    <div className="flex items-center gap-4">
                      {selectedTokenIds.size > 0 ? (
                        <>
                          <span className="text-sm font-medium text-text-primary">
                            {selectedTokenIds.size} NFT
                            {selectedTokenIds.size > 1 ? "s" : ""} selected
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={deselectAllTokens}
                          >
                            Deselect All
                  </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={selectAllTokens}
                        >
                          Select All ({yourAvailableCount})
                        </Button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        handleStakeMany(Array.from(selectedTokenIds))
                      }
                      disabled={
                        selectedTokenIds.size === 0 ||
                        isStakingMultiple ||
                        stakingContract.status.isPending ||
                        stakingContract.status.isConfirming
                      }
                    >
                      {isStakingMultiple
                        ? "Staking..."
                        : `Stake Selected ${
                            selectedTokenIds.size > 0
                              ? `(${selectedTokenIds.size})`
                              : ""
                          }`}
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-text-secondary">Loading your NFTs...</p>
                  </div>
                ) : (
                  <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {paginatedTokens.map((token) => {
                        const isSelected = selectedTokenIds.has(token.TokenId);
                        return (
                          <Card
                            key={token.TokenId}
                            glass
                            hover
                            className={`overflow-hidden transition-all ${
                              isSelected ? "ring-2 ring-primary" : ""
                            }`}
                          >
                      <div className="aspect-square bg-background-elevated relative">
                        <Image
                                src={getNFTImageUrl(token.TokenId)}
                                alt={
                                  token.TokenName || `Token #${token.TokenId}`
                                }
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                              <div className="absolute top-3 left-3 flex items-center gap-2">
                                <Badge variant="default">
                                  #{token.TokenId}
                                </Badge>
                              </div>
                              {/* Selection Checkbox */}
                              <div className="absolute top-3 right-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleTokenSelection(token.TokenId)
                                  }
                                  className="w-5 h-5 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                                  onClick={(e) => e.stopPropagation()}
                                />
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="font-serif font-semibold text-text-primary mb-2 truncate">
                                {token.TokenName || `Token #${token.TokenId}`}
                              </p>
                              <p className="text-xs text-text-secondary mb-3">
                                Round {token.RoundNum}
                              </p>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleStake(token.TokenId)}
                                disabled={
                                  stakingTokenId === token.TokenId ||
                                  isStakingMultiple ||
                                  stakingContract.status.isPending ||
                                  stakingContract.status.isConfirming
                                }
                              >
                                {stakingTokenId === token.TokenId
                                  ? "Staking..."
                                  : "Stake NFT"}
                        </Button>
                      </div>
                    </Card>
                        );
                      })}
                </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-8">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>

                        <div className="flex gap-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => {
                            // Show first page, last page, current page, and pages around current
                            const showPage =
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 &&
                                page <= currentPage + 1);

                            const showEllipsisBefore =
                              page === currentPage - 2 && currentPage > 3;
                            const showEllipsisAfter =
                              page === currentPage + 2 &&
                              currentPage < totalPages - 2;

                            if (showEllipsisBefore || showEllipsisAfter) {
                              return (
                                <span
                                  key={page}
                                  className="px-3 py-2 text-text-muted"
                                >
                                  ...
                                </span>
                              );
                            }

                            if (!showPage) return null;

                            return (
                              <Button
                                key={page}
                                size="sm"
                                variant={
                                  currentPage === page ? "primary" : "outline"
                                }
                                onClick={() => handlePageChange(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Container>
            </section>
          )}

          {/* Staked NFTs */}
          {isConnected && yourStakedCount > 0 && (
            <section
              id="staked-nfts-section"
              className="py-12 bg-background-surface/50"
            >
              <Container>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-semibold text-text-primary">
                    Your Staked NFTs
                  </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary">
                        Showing {stakedStartIndex + 1}-
                        {Math.min(stakedEndIndex, yourStakedCount)} of{" "}
                        {yourStakedCount}
                      </span>
                    </div>
                  </div>

                  {/* Rewards Summary */}
                  <div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-secondary mb-1">
                          Total Claimable Rewards
                        </p>
                        {loadingRewards ? (
                          <p className="text-sm text-text-muted">Loading...</p>
                        ) : (
                          <p className="font-mono text-2xl font-semibold text-primary">
                            {formatEth(totalRewards)} ETH
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary mb-1">
                          NFTs Staked
                        </p>
                        <p className="font-mono text-2xl font-semibold text-text-primary">
                          {yourStakedCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selection Controls */}
                  {yourStakedCount > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                      <div className="flex items-center gap-4">
                        {selectedStakedIds.size > 0 ? (
                          <>
                            <span className="text-sm font-medium text-text-primary">
                              {selectedStakedIds.size} NFT
                              {selectedStakedIds.size > 1 ? "s" : ""} selected
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={deselectAllStakedTokens}
                            >
                              Deselect All
                  </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={selectAllStakedTokens}
                            >
                              Select All ({yourStakedCount})
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={selectCurrentPageStakedTokens}
                            >
                              Select Current Page
                            </Button>
                          </>
                        )}
                      </div>
                      {selectedStakedIds.size > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleUnstakeSelected}
                          disabled={
                            isStakingMultiple ||
                            stakingContract.status.isPending ||
                            stakingContract.status.isConfirming
                          }
                        >
                          {isStakingMultiple
                            ? "Unstaking..."
                            : `Unstake Selected & Claim (${selectedStakedIds.size})`}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <Card glass>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-text-muted/10">
                          <tr className="text-left">
                            <th className="p-4 text-sm font-medium text-text-secondary w-12">
                              <input
                                type="checkbox"
                                checked={
                                  stakedTokens.length > 0 &&
                                  selectedStakedIds.size === stakedTokens.length
                                }
                                ref={(input) => {
                                  if (input) {
                                    input.indeterminate =
                                      selectedStakedIds.size > 0 &&
                                      selectedStakedIds.size <
                                        stakedTokens.length;
                                  }
                                }}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    selectAllStakedTokens();
                                  } else {
                                    deselectAllStakedTokens();
                                  }
                                }}
                                className="w-4 h-4 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                              />
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              NFT
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Token ID
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Stake Action ID
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Staked On
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Rewards Earned
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-text-muted/10">
                          {paginatedStakedTokens.map((stakedToken) => {
                            const token = stakedToken.TokenInfo;
                            // Use TokenInfo.StakeActionId as the unique identifier
                            const actionId = token.StakeActionId;
                            const isSelected = selectedStakedIds.has(actionId);
                            
                            return (
                              <tr
                                key={`staked-${actionId}-${token.TokenId}`}
                                className={`hover:bg-background-elevated/50 transition-colors ${
                                  isSelected ? "bg-primary/5" : ""
                                }`}
                              >
                                <td className="p-4">
                                  <input
                                    type="checkbox"
                                    id={`checkbox-${actionId}`}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      console.log(
                                        `Checkbox ${actionId} changed, checked:`,
                                        e.target.checked
                                      );
                                      toggleStakedTokenSelection(actionId);
                                    }}
                                    className="w-4 h-4 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                                  />
                                </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="h-12 w-12 rounded bg-background-elevated overflow-hidden relative">
                                    <Image
                                        src={getNFTImageUrl(token.TokenId)}
                                        alt={
                                          token.TokenName ||
                                          `Token #${token.TokenId}`
                                        }
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-serif font-semibold text-text-primary">
                                        {token.TokenName ||
                                          `Token #${token.TokenId}`}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        Round {token.RoundNum}
                                    </p>
                                  </div>
                                </div>
                              </td>
                                <td className="p-4 text-center">
                                  <p className="font-mono text-text-primary">
                                    #{token.TokenId}
                                  </p>
                                </td>
                                <td className="p-4 text-center">
                                  <p className="font-mono text-text-primary">
                                    {actionId}
                                  </p>
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-text-primary">
                                    {stakedToken.StakeDateTime
                                      ? new Date(
                                          stakedToken.StakeDateTime
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                  {stakedToken.StakeDateTime && (
                                    <p className="text-xs text-text-muted">
                                      {Math.floor(
                                        (Date.now() -
                                          new Date(
                                            stakedToken.StakeDateTime
                                          ).getTime()) /
                                          (1000 * 60 * 60 * 24)
                                      )}{" "}
                                      days ago
                                    </p>
                                  )}
                              </td>
                              <td className="p-4">
                                  {loadingRewards ? (
                                    <p className="text-sm text-text-muted">
                                      Loading...
                                    </p>
                                  ) : (
                                    <>
                                <p className="font-mono text-primary font-semibold">
                                        {formatEth(
                                          getTokenReward(token.TokenId)
                                        )}{" "}
                                  ETH
                                </p>
                                      <p className="text-xs text-text-muted">
                                        Claimable
                                      </p>
                                    </>
                                  )}
                              </td>
                              <td className="p-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleUnstake(actionId, token.TokenId)
                                    }
                                    disabled={
                                      unstakingActionId === actionId ||
                                      stakingContract.status.isPending ||
                                      stakingContract.status.isConfirming
                                    }
                                  >
                                    {unstakingActionId === actionId
                                      ? "Unstaking..."
                                      : "Unstake"}
                                </Button>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination for Staked Tokens */}
                    {stakedTotalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 p-4 border-t border-text-muted/10">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStakedPageChange(stakedCurrentPage - 1)
                          }
                          disabled={stakedCurrentPage === 1}
                        >
                          Previous
                        </Button>

                        <div className="flex gap-1">
                          {Array.from(
                            { length: stakedTotalPages },
                            (_, i) => i + 1
                          ).map((page) => {
                            const showPage =
                              page === 1 ||
                              page === stakedTotalPages ||
                              (page >= stakedCurrentPage - 1 &&
                                page <= stakedCurrentPage + 1);

                            if (!showPage) {
                              if (
                                page === stakedCurrentPage - 2 ||
                                page === stakedCurrentPage + 2
                              ) {
                                return (
                                  <span
                                    key={page}
                                    className="px-3 py-2 text-text-muted"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }

                            return (
                              <Button
                                key={page}
                                size="sm"
                                variant={
                                  stakedCurrentPage === page
                                    ? "primary"
                                    : "outline"
                                }
                                onClick={() => handleStakedPageChange(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStakedPageChange(stakedCurrentPage + 1)
                          }
                          disabled={stakedCurrentPage === stakedTotalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Container>
            </section>
          )}
        </>
      )}

      {activeTab === "randomwalk" && (
        <>
          {/* Random Walk NFT Staking */}
          <section className="py-12 relative">
            {/* Floating Info Card - Positioned over content (hidden on mobile) */}
            <div className="hidden lg:block absolute top-12 left-8 z-10 pointer-events-none">
              <Card glass className="w-80 p-6 shadow-2xl border-2 border-text-muted/20 backdrop-blur-md">
                <h2 className="text-2xl font-serif font-semibold text-text-primary mb-2">
                  Random Walk
                  <span className="text-gradient block">NFT Staking</span>
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Stake Random Walk NFTs to become eligible for raffle prize drawings each round.
                </p>
              </Card>
            </div>

            <Container size="lg">
              {/* Empty State - No Random Walk NFTs */}
              {!rwlkLoading && isConnected && availableRWLKTokens.length === 0 && stakedRWLKTokens.length === 0 && (
                <Card glass className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <Gem className="mx-auto mb-4 text-text-muted" size={64} />
                    <h3 className="font-serif text-2xl font-semibold text-text-primary mb-3">
                      No Random Walk NFTs
                    </h3>
                    <p className="text-text-secondary mb-6">
                      You don&apos;t have anything staked at the moment. You need to own Random Walk NFTs to stake them for raffle eligibility.
                    </p>
                  </div>
                </Card>
              )}

              {/* Not Connected State */}
              {!isConnected && (
                <Card glass className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <AlertCircle className="mx-auto mb-4 text-text-muted" size={64} />
                    <h3 className="font-serif text-2xl font-semibold text-text-primary mb-3">
                      Connect Your Wallet
                    </h3>
                    <p className="text-text-secondary">
                      Connect your wallet to view and stake your Random Walk NFTs.
                    </p>
                  </div>
                </Card>
              )}

              {/* Random Walk Staking Info Card - Collapsible */}
              {(rwlkLoading || availableRWLKTokens.length > 0 || stakedRWLKTokens.length > 0) && (
                <>
                  <div className="flex justify-center mb-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowRWalkHowItWorks(!showRWalkHowItWorks)}
                      className="gap-2"
                    >
                      <HelpCircle size={18} />
                      {showRWalkHowItWorks ? 'Hide' : 'Show'} How Random Walk Staking Works
                      <ChevronDown 
                        size={18} 
                        className={`transition-transform ${showRWalkHowItWorks ? 'rotate-180' : ''}`}
                      />
                    </Button>
                  </div>

                  {showRWalkHowItWorks && (
                    <Card glass className="p-8 md:p-12 mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif text-2xl font-semibold text-text-primary">
                          Random Walk NFT Staking
                        </h2>
                        <button
                          onClick={() => setShowRWalkHowItWorks(false)}
                          className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
                          aria-label="Close"
                        >
                          <X size={20} className="text-text-secondary hover:text-text-primary" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h3 className="font-serif text-xl font-semibold text-text-primary">
                            How It Works
                          </h3>
                    <ul className="space-y-3 text-text-secondary">
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                        <span className="text-sm leading-relaxed">
                          Stake your Random Walk NFTs to enter the raffle pool
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                        <span className="text-sm leading-relaxed">
                          Each round, 4 Cosmic Signature NFTs are randomly
                          awarded to stakers
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                        <span className="text-sm leading-relaxed">
                          The more NFTs you stake, the higher your odds of
                          winning
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                        <span className="text-sm leading-relaxed">
                          Unstake anytime - no ETH rewards, just raffle
                          eligibility
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-serif text-xl font-semibold text-text-primary">
                      Important Notes
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/20">
                        <div className="flex items-start space-x-2">
                          <AlertCircle
                            size={16}
                            className="text-status-warning mt-0.5 flex-shrink-0"
                          />
                          <div className="text-sm text-text-secondary">
                            <p className="font-semibold text-text-primary mb-1">
                              One-Time Staking Only
                            </p>
                            <p>
                              Once a Random Walk NFT is staked, it can NEVER be
                              staked again, even after unstaking. This is
                              permanent.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/20">
                        <div className="flex items-start space-x-2">
                          <AlertCircle
                            size={16}
                            className="text-status-info mt-0.5 flex-shrink-0"
                          />
                          <div className="text-sm text-text-secondary">
                            <p className="font-semibold text-text-primary mb-1">
                              No ETH Rewards
                            </p>
                            <p>
                              Unlike Cosmic Signature NFT staking, Random Walk
                              staking does not earn ETH rewards. The benefit is
                              raffle eligibility only.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-status-error/10 border border-status-error/20">
                        <div className="flex items-start space-x-2">
                          <AlertCircle
                            size={16}
                            className="text-status-error mt-0.5 flex-shrink-0"
                          />
                          <div className="text-sm text-text-secondary">
                            <p className="font-semibold text-text-primary mb-1">
                              Cannot Stake After Bidding
                            </p>
                            <p>
                              If you&apos;ve used a Random Walk NFT for bidding
                              (to get the 50% discount), you cannot stake it.
                              Used NFTs are permanently consumed.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                    </Card>
                  )}
                </>
              )}
            </Container>
          </section>

          {/* Your Available Random Walk NFTs */}
          {isConnected && availableRWLKTokens.length > 0 && (
            <section id="available-rwlk-nfts-section" className="py-12">
              <Container>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-semibold text-text-primary">
                      Your Available Random Walk NFTs
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary">
                        Showing {(rwlkCurrentPage - 1) * itemsPerPage + 1}-
                        {Math.min(
                          rwlkCurrentPage * itemsPerPage,
                          availableRWLKTokens.length
                        )}{" "}
                        of {availableRWLKTokens.length}
                      </span>
                    </div>
                  </div>

                  {/* Selection Controls */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                    <div className="flex items-center gap-4">
                      {selectedRWLKTokenIds.size > 0 ? (
                        <>
                          <span className="text-sm font-medium text-text-primary">
                            {selectedRWLKTokenIds.size} NFT
                            {selectedRWLKTokenIds.size > 1 ? "s" : ""} selected
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRWLKTokenIds(new Set())}
                          >
                            Deselect All
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSelectedRWLKTokenIds(
                              new Set(availableRWLKTokens.map((t) => t.TokenId))
                            )
                          }
                        >
                          Select All ({availableRWLKTokens.length})
                        </Button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        handleRWLKStakeMany(Array.from(selectedRWLKTokenIds))
                      }
                      disabled={
                        selectedRWLKTokenIds.size === 0 ||
                        isStakingRWLKMultiple ||
                        rwlkStakingContract.status.isPending ||
                        rwlkStakingContract.status.isConfirming
                      }
                    >
                      {isStakingRWLKMultiple
                        ? "Staking..."
                        : `Stake Selected ${
                            selectedRWLKTokenIds.size > 0
                              ? `(${selectedRWLKTokenIds.size})`
                              : ""
                          }`}
                    </Button>
                  </div>
                </div>

                {rwlkLoading ? (
                  <div className="text-center py-12">
                    <p className="text-text-secondary">Loading your NFTs...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {availableRWLKTokens
                        .slice(
                          (rwlkCurrentPage - 1) * itemsPerPage,
                          rwlkCurrentPage * itemsPerPage
                        )
                        .map((token) => {
                          const isSelected = selectedRWLKTokenIds.has(
                            token.TokenId
                          );
                          return (
                            <Card
                              key={token.TokenId}
                              glass
                              hover
                              className={`overflow-hidden transition-all ${
                                isSelected ? "ring-2 ring-primary" : ""
                              }`}
                            >
                              <div className="aspect-square bg-background-elevated relative">
                                <Image
                                  src={getNFTImageUrl(token.TokenId)}
                                  alt={
                                    token.TokenName ||
                                    `Random Walk #${token.TokenId}`
                                  }
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                />
                                <div className="absolute top-3 left-3 flex items-center gap-2">
                                  <Badge variant="default">
                                    #{token.TokenId}
                                  </Badge>
                                </div>
                                {/* Selection Checkbox */}
                                <div className="absolute top-3 right-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      const newSet = new Set(
                                        selectedRWLKTokenIds
                                      );
                                      if (newSet.has(token.TokenId)) {
                                        newSet.delete(token.TokenId);
                                      } else {
                                        newSet.add(token.TokenId);
                                      }
                                      setSelectedRWLKTokenIds(newSet);
                                    }}
                                    className="w-5 h-5 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              <div className="p-4">
                                <p className="font-serif font-semibold text-text-primary mb-2 truncate">
                                  {token.TokenName ||
                                    `Random Walk #${token.TokenId}`}
                                </p>
                                <Button
                                  size="sm"
                                  className="w-full"
                                  onClick={() => handleRWLKStake(token.TokenId)}
                                  disabled={
                                    stakingRWLKTokenId === token.TokenId ||
                                    isStakingRWLKMultiple ||
                                    rwlkStakingContract.status.isPending ||
                                    rwlkStakingContract.status.isConfirming
                                  }
                                >
                                  {stakingRWLKTokenId === token.TokenId
                                    ? "Staking..."
                                    : "Stake NFT"}
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {Math.ceil(availableRWLKTokens.length / itemsPerPage) >
                      1 && (
                      <div className="flex justify-center items-center gap-2 mt-8">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setRwlkCurrentPage(rwlkCurrentPage - 1)
                          }
                          disabled={rwlkCurrentPage === 1}
                        >
                          Previous
                        </Button>

                        <div className="flex gap-1">
                          {Array.from(
                            {
                              length: Math.ceil(
                                availableRWLKTokens.length / itemsPerPage
                              ),
                            },
                            (_, i) => i + 1
                          ).map((page) => {
                            const totalPages = Math.ceil(
                              availableRWLKTokens.length / itemsPerPage
                            );
                            const showPage =
                              page === 1 ||
                              page === totalPages ||
                              (page >= rwlkCurrentPage - 1 &&
                                page <= rwlkCurrentPage + 1);

                            if (!showPage) {
                              if (
                                page === rwlkCurrentPage - 2 ||
                                page === rwlkCurrentPage + 2
                              ) {
                                return (
                                  <span
                                    key={page}
                                    className="px-3 py-2 text-text-muted"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }

                            return (
                              <Button
                                key={page}
                                size="sm"
                                variant={
                                  rwlkCurrentPage === page
                                    ? "primary"
                                    : "outline"
                                }
                                onClick={() => setRwlkCurrentPage(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setRwlkCurrentPage(rwlkCurrentPage + 1)
                          }
                          disabled={
                            rwlkCurrentPage ===
                            Math.ceil(availableRWLKTokens.length / itemsPerPage)
                          }
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Container>
            </section>
          )}

          {/* Staked Random Walk NFTs */}
          {isConnected && stakedRWLKTokens.length > 0 && (
            <section
              id="staked-rwlk-nfts-section"
              className="py-12 bg-background-surface/50"
            >
              <Container>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-semibold text-text-primary">
                      Your Staked Random Walk NFTs
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary">
                        Showing{" "}
                        {(stakedRwlkCurrentPage - 1) * stakedItemsPerPage + 1}-
                        {Math.min(
                          stakedRwlkCurrentPage * stakedItemsPerPage,
                          stakedRWLKTokens.length
                        )}{" "}
                        of {stakedRWLKTokens.length}
                      </span>
                    </div>
                  </div>

                  {/* Selection Controls */}
                  {stakedRWLKTokens.length > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                      <div className="flex items-center gap-4">
                        {selectedStakedRWLKIds.size > 0 ? (
                          <>
                            <span className="text-sm font-medium text-text-primary">
                              {selectedStakedRWLKIds.size} NFT
                              {selectedStakedRWLKIds.size > 1 ? "s" : ""}{" "}
                              selected
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSelectedStakedRWLKIds(new Set())
                              }
                            >
                              Deselect All
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSelectedStakedRWLKIds(
                                  new Set(
                                    stakedRWLKTokens.map((t) => t.StakeActionId)
                                  )
                                )
                              }
                            >
                              Select All ({stakedRWLKTokens.length})
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const startIdx =
                                  (stakedRwlkCurrentPage - 1) *
                                  stakedItemsPerPage;
                                const endIdx = startIdx + stakedItemsPerPage;
                                const pageTokens = stakedRWLKTokens.slice(
                                  startIdx,
                                  endIdx
                                );
                                setSelectedStakedRWLKIds(
                                  new Set(
                                    pageTokens.map((t) => t.StakeActionId)
                                  )
                                );
                              }}
                            >
                              Select Current Page
                            </Button>
                          </>
                        )}
                      </div>
                      {selectedStakedRWLKIds.size > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleRWLKUnstakeSelected}
                          disabled={
                            isStakingRWLKMultiple ||
                            rwlkStakingContract.status.isPending ||
                            rwlkStakingContract.status.isConfirming
                          }
                        >
                          {isStakingRWLKMultiple
                            ? "Unstaking..."
                            : `Unstake Selected (${selectedStakedRWLKIds.size})`}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <Card glass>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-text-muted/10">
                          <tr className="text-left">
                            <th className="p-4 text-sm font-medium text-text-secondary w-12">
                              <input
                                type="checkbox"
                                checked={
                                  stakedRWLKTokens.length > 0 &&
                                  selectedStakedRWLKIds.size ===
                                    stakedRWLKTokens.length
                                }
                                ref={(input) => {
                                  if (input) {
                                    input.indeterminate =
                                      selectedStakedRWLKIds.size > 0 &&
                                      selectedStakedRWLKIds.size <
                                        stakedRWLKTokens.length;
                                  }
                                }}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStakedRWLKIds(
                                      new Set(
                                        stakedRWLKTokens.map(
                                          (t) => t.StakeActionId
                                        )
                                      )
                                    );
                                  } else {
                                    setSelectedStakedRWLKIds(new Set());
                                  }
                                }}
                                className="w-4 h-4 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                              />
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              NFT
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Token ID
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Stake Action ID
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Staked On
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-text-muted/10">
                          {stakedRWLKTokens
                            .slice(
                              (stakedRwlkCurrentPage - 1) * stakedItemsPerPage,
                              stakedRwlkCurrentPage * stakedItemsPerPage
                            )
                            .map((stakedToken) => {
                              const actionId = stakedToken.StakeActionId;
                              const isSelected =
                                selectedStakedRWLKIds.has(actionId);

                              return (
                                <tr
                                  key={`staked-rwlk-${actionId}-${stakedToken.TokenId}`}
                                  className={`hover:bg-background-elevated/50 transition-colors ${
                                    isSelected ? "bg-primary/5" : ""
                                  }`}
                                >
                                  <td className="p-4">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {
                                        const newSet = new Set(
                                          selectedStakedRWLKIds
                                        );
                                        if (newSet.has(actionId)) {
                                          newSet.delete(actionId);
                                        } else {
                                          newSet.add(actionId);
                                        }
                                        setSelectedStakedRWLKIds(newSet);
                                      }}
                                      className="w-4 h-4 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                                    />
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="h-12 w-12 rounded bg-background-elevated overflow-hidden relative">
                                        <Image
                                          src={getNFTImageUrl(
                                            stakedToken.TokenId
                                          )}
                                          alt={
                                            stakedToken.TokenName ||
                                            `Random Walk #${stakedToken.TokenId}`
                                          }
                                          fill
                                          className="object-cover"
                                          sizes="48px"
                                        />
                                      </div>
                                      <div>
                                        <p className="font-serif font-semibold text-text-primary">
                                          {stakedToken.TokenName ||
                                            `Random Walk #${stakedToken.TokenId}`}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-center">
                                    <p className="font-mono text-text-primary">
                                      #{stakedToken.TokenId}
                                    </p>
                                  </td>
                                  <td className="p-4 text-center">
                                    <p className="font-mono text-text-primary">
                                      {actionId}
                                    </p>
                                  </td>
                                  <td className="p-4">
                                    <p className="text-sm text-text-primary">
                                      {stakedToken.StakeDateTime
                                        ? new Date(
                                            stakedToken.StakeDateTime
                                          ).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                    {stakedToken.StakeDateTime && (
                                      <p className="text-xs text-text-muted">
                                        {Math.floor(
                                          (Date.now() -
                                            new Date(
                                              stakedToken.StakeDateTime
                                            ).getTime()) /
                                            (1000 * 60 * 60 * 24)
                                        )}{" "}
                                        days ago
                                      </p>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleRWLKUnstake(
                                          actionId,
                                          stakedToken.TokenId
                                        )
                                      }
                                      disabled={
                                        unstakingRWLKActionId === actionId ||
                                        rwlkStakingContract.status.isPending ||
                                        rwlkStakingContract.status.isConfirming
                                      }
                                    >
                                      {unstakingRWLKActionId === actionId
                                        ? "Unstaking..."
                                        : "Unstake"}
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination for Staked Tokens */}
                    {Math.ceil(stakedRWLKTokens.length / stakedItemsPerPage) >
                      1 && (
                      <div className="flex justify-center items-center gap-2 p-4 border-t border-text-muted/10">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setStakedRwlkCurrentPage(stakedRwlkCurrentPage - 1)
                          }
                          disabled={stakedRwlkCurrentPage === 1}
                        >
                          Previous
                        </Button>

                        <div className="flex gap-1">
                          {Array.from(
                            {
                              length: Math.ceil(
                                stakedRWLKTokens.length / stakedItemsPerPage
                              ),
                            },
                            (_, i) => i + 1
                          ).map((page) => {
                            const totalPages = Math.ceil(
                              stakedRWLKTokens.length / stakedItemsPerPage
                            );
                            const showPage =
                              page === 1 ||
                              page === totalPages ||
                              (page >= stakedRwlkCurrentPage - 1 &&
                                page <= stakedRwlkCurrentPage + 1);

                            if (!showPage) {
                              if (
                                page === stakedRwlkCurrentPage - 2 ||
                                page === stakedRwlkCurrentPage + 2
                              ) {
                                return (
                                  <span
                                    key={page}
                                    className="px-3 py-2 text-text-muted"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }

                            return (
                              <Button
                                key={page}
                                size="sm"
                                variant={
                                  stakedRwlkCurrentPage === page
                                    ? "primary"
                                    : "outline"
                                }
                                onClick={() => setStakedRwlkCurrentPage(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setStakedRwlkCurrentPage(stakedRwlkCurrentPage + 1)
                          }
                          disabled={
                            stakedRwlkCurrentPage ===
                            Math.ceil(
                              stakedRWLKTokens.length / stakedItemsPerPage
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Container>
            </section>
          )}
        </>
      )}

      {/* FAQ Section - Collapsible */}
      <section className="py-6 bg-background-surface/50">
        <Container size="lg">
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFAQ(!showFAQ)}
              className="gap-2"
            >
              <HelpCircle size={18} />
              {showFAQ ? 'Hide' : 'Show'} Staking FAQ
              <ChevronDown 
                size={18} 
                className={`transition-transform ${showFAQ ? 'rotate-180' : ''}`}
              />
            </Button>
          </div>

          {showFAQ && (
            <Card glass className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="heading-md">Staking FAQ</h2>
                <button
                  onClick={() => setShowFAQ(false)}
                  className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-text-secondary hover:text-text-primary" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "When do I receive staking rewards?",
                a: "Rewards accumulate automatically after each round ends. You can claim them whenever you unstake your NFTs.",
              },
              {
                q: "Can I stake and unstake multiple times?",
                a: "No, each NFT can only be staked once, ever.",
              },
              {
                q: "How are rewards calculated?",
                a: "Rewards are distributed proportionally. If you have 10 staked NFTs out of 100 total staked, you earn 10% of the staking reward pool each round.",
              },
              {
                q: "Is there a minimum staking period?",
                a: "No. You can unstake at any time and claim your accumulated rewards. There are no lock periods or penalties.",
              },
              {
                q: "What happens if no one stakes?",
                a: `If there are no Cosmic Signature NFTs staked when a round ends, the ${stakingPercentage}% staking allocation is added to the charity donation instead.`,
              },
              {
                q: "Can staked NFTs be traded?",
                a: "No. While your NFTs are staked, they are held by the staking contract and cannot be transferred or sold. You must unstake first.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card glass className="p-6 h-full">
                  <h3 className="font-serif text-lg font-semibold text-text-primary mb-3">
                    {faq.q}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {faq.a}
                  </p>
                </Card>
              </motion.div>
            ))}
              </div>
            </Card>
          )}
        </Container>
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { api } from "@/services/api";
import type { ApiStakingReward } from "@/services/apiTypes";

export function useStakingRewards(stakedCount: number) {
  const { address, isConnected } = useAccount();

  const [rewards, setRewards] = useState<ApiStakingReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const totalUncollected = rewards.reduce(
    (sum, reward) => sum + (reward.RewardToCollectEth || reward?.TotalReward || 0),
    0
  );

  const getTokenReward = useCallback(
    (tokenId: number): number => {
      const reward = rewards.find((r) => r.TokenId === tokenId);
      return reward?.RewardToCollectEth || reward?.TotalReward || 0;
    },
    [rewards]
  );

  const fetchRewards = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      setIsLoading(true);
      const data = await api.getStakingRewardsByUser(address);
      setRewards(data);
    } catch (error) {
      console.error("Failed to fetch staking rewards:", error);
      setRewards([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    if (stakedCount > 0) {
      fetchRewards();
    }
  }, [stakedCount, fetchRewards]);

  return {
    rewards,
    totalUncollected,
    isLoading,
    getTokenReward,
    refetch: fetchRewards,
  };
}

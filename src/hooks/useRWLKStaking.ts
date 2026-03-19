"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { readContract, writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { useAccount } from "wagmi";
import { api } from "@/services/api";
import type { ApiRWLKToken, ApiStakedRWLKToken } from "@/services/apiTypes";
import { useRandomWalkNFT } from "@/hooks/useRandomWalkNFT";
import { useStakingWalletRWLK } from "@/hooks/useStakingWallet";
import { CONTRACTS } from "@/lib/web3/contracts";
import { useNotification } from "@/contexts/NotificationContext";
import { estimateContractGas } from "@/lib/web3/gasEstimation";
import { wagmiConfig } from "@/lib/web3/config";
import { getBufferedEip1559Fees } from "@/lib/web3/transactionFees";
import StakingWalletRWLKABI from "@/contracts/StakingWalletRandomWalkNft.json";
import RandomWalkNFTABI from "@/contracts/RandomWalkNFT.json";

async function getFeesWithBuffer() {
  const fees = await getBufferedEip1559Fees(wagmiConfig);
  return fees ?? {};
}

function isUserRejection(error: unknown): boolean {
  const msg = (error as Error)?.message || "";
  return (
    msg.includes("User denied") ||
    msg.includes("User rejected") ||
    msg.includes("user rejected") ||
    msg.includes("rejected the request")
  );
}

export function useRWLKStaking() {
  const { address, isConnected } = useAccount();
  const { showSuccess, showError, showInfo } = useNotification();

  const rwlkNftContract = useRandomWalkNFT();
  const rwlkStakingContract = useStakingWalletRWLK();

  const [availableTokens, setAvailableTokens] = useState<ApiRWLKToken[]>([]);
  const [stakedTokens, setStakedTokens] = useState<ApiStakedRWLKToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [stakingTokenId, setStakingTokenId] = useState<number | null>(null);
  const [isStakingMultiple, setIsStakingMultiple] = useState(false);
  const [unstakingActionId, setUnstakingActionId] = useState<number | null>(null);

  const confirmedUsedIds = useRef<Set<number>>(new Set());
  const processedTxRef = useRef<string | null | undefined>(null);
  const selectedTokenIdsRef = useRef<number>(0);
  const selectedStakedIdsRef = useRef<number>(0);

  const { data: isApprovedForAll, refetch: refetchApproval } =
    rwlkNftContract.read.useIsApprovedForAll(
      (address as `0x${string}`) || "0x0000000000000000000000000000000000000000",
      CONTRACTS.STAKING_WALLET_RWLK
    );

  const { data: rwlkTokenIds, refetch: refetchWallet } =
    rwlkNftContract.read.useWalletOfOwner(address as `0x${string}` | undefined);

  const effectiveRwlkTokenIds = rwlkTokenIds as bigint[] | undefined;

  const buildAvailableTokens = useCallback(
    async (
      ownedTokenIds: number[],
      stakedTokensList: ApiStakedRWLKToken[],
      everStakedIds: Set<number>
    ): Promise<ApiRWLKToken[]> => {
      const stakedTokenIdsSet = new Set(stakedTokensList.map((t) => t.TokenId));

      const contractUsedIds = new Set<number>();
      await Promise.all(
        ownedTokenIds
          .filter((id) => !everStakedIds.has(id))
          .map(async (tokenId) => {
            try {
              const result = await readContract(wagmiConfig, {
                address: CONTRACTS.STAKING_WALLET_RWLK,
                abi: StakingWalletRWLKABI,
                functionName: "wasNftUsed",
                args: [BigInt(tokenId)],
              });
              if ((result as bigint) !== 0n) contractUsedIds.add(tokenId);
            } catch {
              // Function may not exist on this contract version
            }
          })
      );

      return ownedTokenIds
        .filter(
          (id) =>
            !stakedTokenIdsSet.has(id) &&
            !everStakedIds.has(id) &&
            !contractUsedIds.has(id) &&
            !confirmedUsedIds.current.has(id)
        )
        .map((tokenId) => ({
          TokenId: tokenId,
          IsUsed: false,
          IsStaked: false,
        }));
    },
    []
  );

  const refetch = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      const walletResultPromise = refetchWallet();
      const [stakedTokensRaw, stakingHistory, walletResult] = await Promise.all([
        api.getStakedRWLKTokensByUser(address),
        api.getEverStakedRWLKTokenIdsByUser(address),
        walletResultPromise,
      ]);

      const freshRwlkTokenIds = walletResult?.data;

      const stakedList: ApiStakedRWLKToken[] = stakedTokensRaw.map(
        (token: ApiStakedRWLKToken & { StakedTokenId?: number }) => ({
          TokenId: token.StakedTokenId ?? token.TokenId,
          TokenName: token.TokenName,
          StakeActionId: token.StakeActionId,
          StakeTimeStamp: token.StakeTimeStamp,
          StakeDateTime: token.StakeDateTime,
          UserAddr: token.UserAddr,
          UserAid: token.UserAid,
        })
      );

      setStakedTokens(stakedList);

      const everStakedIds = new Set<number>(stakingHistory as number[]);
      everStakedIds.forEach((id) => confirmedUsedIds.current.add(id));

      if (!freshRwlkTokenIds) {
        setAvailableTokens([]);
        return;
      }

      const ownedTokenIds = (freshRwlkTokenIds as bigint[])
        .map((id) => Number(id))
        .sort((a, b) => a - b);

      const available = await buildAvailableTokens(ownedTokenIds, stakedList, everStakedIds);
      setAvailableTokens(available);
    } catch (error) {
      console.error("Failed to refresh RWLK token data:", error);
    }
  }, [address, isConnected, refetchWallet, buildAvailableTokens]);

  // Fetch on mount / address change
  useEffect(() => {
    if (!address || !isConnected || !effectiveRwlkTokenIds) {
      setAvailableTokens([]);
      setStakedTokens([]);
      return;
    }

    const fetchTokens = async () => {
      setIsLoading(true);
      try {
        const [stakedTokensRaw, stakingHistory] = await Promise.all([
          api.getStakedRWLKTokensByUser(address),
          api.getEverStakedRWLKTokenIdsByUser(address),
        ]);

        const stakedList: ApiStakedRWLKToken[] = stakedTokensRaw.map(
          (token: ApiStakedRWLKToken & { StakedTokenId?: number }) => ({
            TokenId: token.StakedTokenId ?? token.TokenId,
            TokenName: token.TokenName,
            StakeActionId: token.StakeActionId,
            StakeTimeStamp: token.StakeTimeStamp,
            StakeDateTime: token.StakeDateTime,
            UserAddr: token.UserAddr,
            UserAid: token.UserAid,
          })
        );

        const everStakedIds = new Set<number>(stakingHistory as number[]);
        everStakedIds.forEach((id) => confirmedUsedIds.current.add(id));

        const ownedTokenIds = (effectiveRwlkTokenIds as bigint[])
          .map((id) => Number(id))
          .sort((a, b) => a - b);

        const available = await buildAvailableTokens(ownedTokenIds, stakedList, everStakedIds);

        setStakedTokens(stakedList);
        setAvailableTokens(available);
      } catch (error) {
        console.error("Failed to fetch RWLK tokens:", error);
        setAvailableTokens([]);
        setStakedTokens([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [address, isConnected, effectiveRwlkTokenIds, buildAvailableTokens]);

  // Clear processed tx when new transaction starts
  useEffect(() => {
    if (rwlkStakingContract.status.isPending) {
      processedTxRef.current = null;
    }
  }, [rwlkStakingContract.status.isPending]);

  // Watch for transaction success
  useEffect(() => {
    const txHash = rwlkStakingContract.status.hash;

    if (
      rwlkStakingContract.status.isSuccess &&
      !rwlkStakingContract.status.isPending &&
      !rwlkStakingContract.status.isConfirming &&
      address &&
      txHash &&
      processedTxRef.current !== txHash &&
      (stakingTokenId !== null || isStakingMultiple || unstakingActionId !== null)
    ) {
      processedTxRef.current = txHash;

      const handleSuccess = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await refetch();

        if (isStakingMultiple && selectedTokenIdsRef.current > 0) {
          const count = selectedTokenIdsRef.current;
          showSuccess(`Successfully staked ${count} NFT${count > 1 ? "s" : ""}!`);
        } else if (isStakingMultiple && selectedStakedIdsRef.current > 0) {
          const count = selectedStakedIdsRef.current;
          showSuccess(`Successfully unstaked ${count} NFT${count > 1 ? "s" : ""}!`);
        } else if (stakingTokenId) {
          showSuccess(`Successfully staked token #${stakingTokenId}!`);
        } else if (unstakingActionId) {
          showSuccess(`Successfully unstaked NFT!`);
        }

        setStakingTokenId(null);
        setIsStakingMultiple(false);
        setUnstakingActionId(null);
        selectedTokenIdsRef.current = 0;
        selectedStakedIdsRef.current = 0;
      };

      handleSuccess();
    }
  }, [
    rwlkStakingContract.status.isSuccess,
    rwlkStakingContract.status.isPending,
    rwlkStakingContract.status.isConfirming,
    rwlkStakingContract.status.hash,
    address,
    stakingTokenId,
    isStakingMultiple,
    unstakingActionId,
    refetch,
    showSuccess,
  ]);

  // Watch for transaction failures
  useEffect(() => {
    if (
      rwlkStakingContract.status.error &&
      !rwlkStakingContract.status.isPending &&
      !rwlkStakingContract.status.isConfirming &&
      (stakingTokenId !== null || isStakingMultiple || unstakingActionId !== null)
    ) {
      if (!isUserRejection(rwlkStakingContract.status.error)) {
        showError((rwlkStakingContract.status.error as Error)?.message || "Transaction failed");
      }
      processedTxRef.current = null;
      setStakingTokenId(null);
      setIsStakingMultiple(false);
      setUnstakingActionId(null);
    }
  }, [
    rwlkStakingContract.status.error,
    rwlkStakingContract.status.isPending,
    rwlkStakingContract.status.isConfirming,
    stakingTokenId,
    isStakingMultiple,
    unstakingActionId,
    showError,
  ]);

  const handleApprove = useCallback(async (): Promise<boolean> => {
    if (!rwlkNftContract) return false;

    try {
      showInfo("Requesting approval... Please confirm the transaction in your wallet.");

      const fees = await getFeesWithBuffer();
      const hash = await writeContract(wagmiConfig, {
        address: CONTRACTS.RANDOM_WALK_NFT,
        abi: RandomWalkNFTABI,
        functionName: "setApprovalForAll",
        args: [CONTRACTS.STAKING_WALLET_RWLK, true],
        ...fees,
      });

      showInfo("Approval transaction submitted. Waiting for confirmation...");

      await waitForTransactionReceipt(wagmiConfig, { hash });
      showSuccess("Approval confirmed! Proceeding with staking...");
      await refetchApproval();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    } catch (error: unknown) {
      console.error("RWLK Approval failed:", error);
      if (!isUserRejection(error)) {
        showError((error as Error)?.message || "Failed to approve. Please try again.");
      }
      return false;
    }
  }, [rwlkNftContract, showInfo, showSuccess, showError, refetchApproval]);

  const stake = useCallback(
    async (tokenId: number) => {
      if (!rwlkNftContract || !rwlkStakingContract) {
        showError("Please connect your wallet and ensure you are on the correct network.");
        return;
      }

      setStakingTokenId(tokenId);

      if (!isApprovedForAll) {
        const approved = await handleApprove();
        if (!approved) {
          setStakingTokenId(null);
          return;
        }
      }

      const estimation = await estimateContractGas(wagmiConfig, {
        address: CONTRACTS.STAKING_WALLET_RWLK,
        abi: StakingWalletRWLKABI,
        functionName: "stake",
        args: [BigInt(tokenId)],
        account: address,
      });

      if (!estimation.success) {
        const errMsg = estimation.error || "";
        const isAlreadyUsed =
          errMsg.toLowerCase().includes("already been staked") ||
          errMsg.toLowerCase().includes("staked only once") ||
          errMsg.toLowerCase().includes("nfthasalreadybeenstaked");
        if (isAlreadyUsed) {
          confirmedUsedIds.current.add(tokenId);
          setAvailableTokens((prev) => prev.filter((t) => t.TokenId !== tokenId));
          showError("This RandomWalk NFT has already been staked before. Each NFT can only be staked once.");
        } else {
          showError(errMsg || "Cannot stake this NFT at this time");
        }
        setStakingTokenId(null);
        return;
      }

      try {
        showInfo("Please confirm the transaction in your wallet...");
        await rwlkStakingContract.write.stake(BigInt(tokenId));
        showInfo("Transaction submitted! Waiting for confirmation...");
      } catch (error: unknown) {
        console.error("RWLK Staking failed:", error);
        if (!isUserRejection(error)) {
          showError((error as Error)?.message || "Failed to stake NFT. Please try again.");
        }
        setStakingTokenId(null);
      }
    },
    [rwlkNftContract, rwlkStakingContract, isApprovedForAll, handleApprove, address, showError, showInfo]
  );

  const stakeMany = useCallback(
    async (tokenIds: number[]) => {
      if (!rwlkNftContract || !rwlkStakingContract) {
        showError("Please connect your wallet and ensure you are on the correct network.");
        return;
      }
      if (tokenIds.length === 0) {
        showError("Please select at least one NFT to stake.");
        return;
      }

      setIsStakingMultiple(true);
      selectedTokenIdsRef.current = tokenIds.length;

      if (!isApprovedForAll) {
        const approved = await handleApprove();
        if (!approved) {
          setIsStakingMultiple(false);
          return;
        }
      }

      const tokenIdsBigInt = tokenIds.map((id) => BigInt(id));
      const estimation = await estimateContractGas(wagmiConfig, {
        address: CONTRACTS.STAKING_WALLET_RWLK,
        abi: StakingWalletRWLKABI,
        functionName: "stakeMany",
        args: [tokenIdsBigInt],
        account: address,
      });

      if (!estimation.success) {
        const errMsg = estimation.error || "";
        const isAlreadyUsed =
          errMsg.toLowerCase().includes("already been staked") ||
          errMsg.toLowerCase().includes("staked only once") ||
          errMsg.toLowerCase().includes("nfthasalreadybeenstaked");
        if (isAlreadyUsed) {
          await refetch();
          showError("One or more NFTs have already been staked before. The list has been refreshed — please try again.");
        } else {
          showError(errMsg || "Cannot stake these NFTs at this time");
        }
        setIsStakingMultiple(false);
        return;
      }

      try {
        showInfo("Please confirm the transaction in your wallet...");
        await rwlkStakingContract.write.stakeMany(tokenIdsBigInt);
        showInfo(`Transaction submitted! Staking ${tokenIds.length} NFTs...`);
      } catch (error: unknown) {
        console.error("RWLK Multi-staking failed:", error);
        if (!isUserRejection(error)) {
          showError((error as Error)?.message || "Failed to stake NFTs. Please try again.");
        }
        setIsStakingMultiple(false);
      }
    },
    [rwlkNftContract, rwlkStakingContract, isApprovedForAll, handleApprove, address, showError, showInfo, refetch]
  );

  const unstake = useCallback(
    async (stakeActionId: number, tokenId: number) => {
      if (!rwlkStakingContract) {
        showError("Please connect your wallet and ensure you are on the correct network.");
        return;
      }

      setUnstakingActionId(stakeActionId);

      const estimation = await estimateContractGas(wagmiConfig, {
        address: CONTRACTS.STAKING_WALLET_RWLK,
        abi: StakingWalletRWLKABI,
        functionName: "unstake",
        args: [BigInt(stakeActionId)],
        account: address,
      });

      if (!estimation.success) {
        showError(estimation.error || "Cannot unstake this NFT at this time");
        setUnstakingActionId(null);
        return;
      }

      try {
        showInfo("Please confirm the transaction in your wallet...");
        await rwlkStakingContract.write.unstake(BigInt(stakeActionId));
        showInfo(`Transaction submitted! Unstaking token #${tokenId}...`);
      } catch (error: unknown) {
        console.error("RWLK Unstaking failed:", error);
        if (!isUserRejection(error)) {
          showError((error as Error)?.message || "Failed to unstake NFT. Please try again.");
        }
        setUnstakingActionId(null);
      }
    },
    [rwlkStakingContract, address, showError, showInfo]
  );

  const unstakeMany = useCallback(
    async (stakeActionIds: number[]) => {
      if (stakeActionIds.length === 0) {
        showError("Please select at least one NFT to unstake.");
        return;
      }
      if (!rwlkStakingContract) {
        showError("Please connect your wallet and ensure you are on the correct network.");
        return;
      }

      setIsStakingMultiple(true);
      selectedStakedIdsRef.current = stakeActionIds.length;

      const ids = stakeActionIds.map((id) => BigInt(id));
      const estimation = await estimateContractGas(wagmiConfig, {
        address: CONTRACTS.STAKING_WALLET_RWLK,
        abi: StakingWalletRWLKABI,
        functionName: "unstakeMany",
        args: [ids],
        account: address,
      });

      if (!estimation.success) {
        showError(estimation.error || "Cannot unstake these NFTs at this time");
        setIsStakingMultiple(false);
        return;
      }

      try {
        showInfo("Please confirm the transaction in your wallet...");
        await rwlkStakingContract.write.unstakeMany(ids);
        showInfo(`Transaction submitted! Unstaking ${stakeActionIds.length} NFTs...`);
      } catch (error: unknown) {
        console.error("RWLK Unstake selected failed:", error);
        if (!isUserRejection(error)) {
          showError((error as Error)?.message || "Failed to unstake NFTs. Please try again.");
        }
        setIsStakingMultiple(false);
      }
    },
    [rwlkStakingContract, address, showError, showInfo]
  );

  const isSubmitting =
    stakingTokenId !== null ||
    isStakingMultiple ||
    unstakingActionId !== null ||
    rwlkStakingContract.status.isPending ||
    rwlkStakingContract.status.isConfirming;

  return {
    availableTokens,
    stakedTokens,
    isLoading,
    stake,
    unstake,
    stakeMany,
    unstakeMany,
    isSubmitting,
    stakingTokenId,
    unstakingActionId,
    isStakingMultiple,
    isPending: rwlkStakingContract.status.isPending,
    isConfirming: rwlkStakingContract.status.isConfirming,
    error: rwlkStakingContract.status.error,
    refetch,
  };
}

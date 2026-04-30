"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { useAccount } from "wagmi";
import { api } from "@/services/api";
import type { ApiCSTToken, ApiStakedCSTToken } from "@/services/apiTypes";
import { useCosmicSignatureNFT } from "@/hooks/useCosmicSignatureNFT";
import { useStakingWalletCST } from "@/hooks/useStakingWallet";
import { useContractAddresses } from "@/hooks/useContractAddresses";
import { useNotification } from "@/contexts/NotificationContext";
import { estimateContractGas } from "@/lib/web3/gasEstimation";
import { wagmiConfig } from "@/lib/web3/config";
import { getBufferedEip1559Fees } from "@/lib/web3/transactionFees";
import StakingWalletCSTABI from "@/contracts/StakingWalletCosmicSignatureNft.json";
import CosmicSignatureNFTABI from "@/contracts/CosmicSignature.json";
import {
  isUserRejection,
  WALLET_TRANSACTION_CANCELLED_MESSAGE,
} from "@/lib/errorReporter";

async function getAvailableCSTTokensByUser(address: string): Promise<ApiCSTToken[]> {
  const tokens = await api.getCSTTokensByUser(address);
  return tokens.filter((token: ApiCSTToken) => !token.Staked && !token.WasUnstaked);
}

async function getFeesWithBuffer() {
  const fees = await getBufferedEip1559Fees(wagmiConfig);
  return fees ?? {};
}

export function useCSTStaking() {
  const { address, isConnected } = useAccount();
  const { showSuccess, showError, showInfo } = useNotification();
  const contracts = useContractAddresses();
  const cstStakingAddr = contracts?.STAKING_WALLET_CST;
  const cosmicSigNftAddr = contracts?.COSMIC_SIGNATURE_NFT;

  const nftContract = useCosmicSignatureNFT();
  const stakingContract = useStakingWalletCST();

  const [availableTokens, setAvailableTokens] = useState<ApiCSTToken[]>([]);
  const [stakedTokens, setStakedTokens] = useState<ApiStakedCSTToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [stakingTokenId, setStakingTokenId] = useState<number | null>(null);
  const [isStakingMultiple, setIsStakingMultiple] = useState(false);
  const [unstakingActionId, setUnstakingActionId] = useState<number | null>(null);

  const processedTxRef = useRef<string | null | undefined>(null);
  const selectedTokenIdsRef = useRef<number>(0);
  const selectedStakedIdsRef = useRef<number>(0);

  const { data: isApprovedForAll, refetch: refetchApproval } =
    nftContract.read.useIsApprovedForAll(
      (address as `0x${string}`) || "0x0000000000000000000000000000000000000000",
      (cstStakingAddr ?? "0x0000000000000000000000000000000000000000") as `0x${string}`
    );

  // Fetch tokens on mount / address change
  useEffect(() => {
    if (!address || !isConnected) {
      setAvailableTokens([]);
      setStakedTokens([]);
      return;
    }

    const fetchTokens = async () => {
      setIsLoading(true);
      try {
        const [staked, available] = await Promise.all([
          api.getStakedCSTTokensByUser(address),
          getAvailableCSTTokensByUser(address),
        ]);
        setStakedTokens(staked);
        setAvailableTokens(available);
      } catch (error) {
        console.error("Failed to fetch CST tokens:", error);
        setAvailableTokens([]);
        setStakedTokens([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [address, isConnected]);

  const refetch = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const [staked, available] = await Promise.all([
        api.getStakedCSTTokensByUser(address),
        getAvailableCSTTokensByUser(address),
      ]);
      setStakedTokens(staked);
      setAvailableTokens(available);
    } catch (error) {
      console.error("Failed to refresh CST token data:", error);
    }
  }, [address, isConnected]);

  // Clear processed tx when a new transaction starts
  useEffect(() => {
    if (stakingContract.status.isPending) {
      processedTxRef.current = null;
    }
  }, [stakingContract.status.isPending]);

  // Watch for transaction success
  useEffect(() => {
    const txHash = stakingContract.status.hash;

    if (
      stakingContract.status.isSuccess &&
      !stakingContract.status.isPending &&
      !stakingContract.status.isConfirming &&
      address &&
      txHash &&
      processedTxRef.current !== txHash &&
      (stakingTokenId !== null || isStakingMultiple || unstakingActionId !== null)
    ) {
      processedTxRef.current = txHash;

      const handleSuccess = async () => {
        await refetch();

        if (isStakingMultiple && selectedTokenIdsRef.current > 0) {
          const count = selectedTokenIdsRef.current;
          showSuccess(`Successfully staked ${count} NFT${count > 1 ? "s" : ""}!`);
        } else if (isStakingMultiple && selectedStakedIdsRef.current > 0) {
          const count = selectedStakedIdsRef.current;
          showSuccess(`Successfully unstaked ${count} NFT${count > 1 ? "s" : ""} and claimed rewards!`);
        } else if (stakingTokenId) {
          showSuccess(`Successfully staked token #${stakingTokenId}!`);
        } else if (unstakingActionId) {
          showSuccess(`Successfully unstaked NFT and claimed rewards!`);
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
    stakingContract.status.isSuccess,
    stakingContract.status.isPending,
    stakingContract.status.isConfirming,
    stakingContract.status.hash,
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
      stakingContract.status.error &&
      !stakingContract.status.isPending &&
      !stakingContract.status.isConfirming &&
      (stakingTokenId !== null || isStakingMultiple || unstakingActionId !== null)
    ) {
      if (isUserRejection(stakingContract.status.error)) {
        showInfo(WALLET_TRANSACTION_CANCELLED_MESSAGE);
      } else {
        showError((stakingContract.status.error as Error)?.message || "Transaction failed");
      }
      processedTxRef.current = null;
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
    showInfo,
  ]);

  const handleApprove = useCallback(async (): Promise<boolean> => {
    if (!nftContract) return false;
    if (!cosmicSigNftAddr || !cstStakingAddr) {
      showError("Game configuration is still loading. Please wait and try again.");
      return false;
    }

    try {
      showInfo("Requesting approval... Please confirm the transaction in your wallet.");

      const fees = await getFeesWithBuffer();
      const hash = await writeContract(wagmiConfig, {
        address: cosmicSigNftAddr,
        abi: CosmicSignatureNFTABI,
        functionName: "setApprovalForAll",
        args: [cstStakingAddr, true],
        ...fees,
      });

      showInfo("Approval transaction submitted. Waiting for confirmation...");

      await waitForTransactionReceipt(wagmiConfig, { hash });
      showSuccess("Approval confirmed! Proceeding with staking...");
      await refetchApproval();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    } catch (error: unknown) {
      console.error("Approval failed:", error);
      if (isUserRejection(error)) {
        showInfo(WALLET_TRANSACTION_CANCELLED_MESSAGE);
      } else {
        showError((error as Error)?.message || "Failed to approve. Please try again.");
      }
      return false;
    }
  }, [nftContract, cosmicSigNftAddr, cstStakingAddr, showSuccess, showError, showInfo, refetchApproval]);

  const stake = useCallback(
    async (tokenId: number) => {
      if (!nftContract || !stakingContract) {
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

      if (!cstStakingAddr) {
        showError("Game configuration is still loading. Please wait and try again.");
        setStakingTokenId(null);
        return;
      }
      const estimation = await estimateContractGas(wagmiConfig, {
        address: cstStakingAddr,
        abi: StakingWalletCSTABI,
        functionName: "stake",
        args: [BigInt(tokenId)],
        account: address,
      });

      if (!estimation.success) {
        showError(estimation.error || "Cannot stake this NFT at this time");
        setStakingTokenId(null);
        return;
      }

      try {
        showInfo("Please confirm the transaction in your wallet...");
        await stakingContract.write.stake(BigInt(tokenId));
        showInfo("Transaction submitted! Waiting for confirmation...");
      } catch (error: unknown) {
        console.error("Staking failed:", error);
        if (isUserRejection(error)) {
          showInfo(WALLET_TRANSACTION_CANCELLED_MESSAGE);
        } else {
          showError((error as Error)?.message || "Failed to stake NFT. Please try again.");
        }
        setStakingTokenId(null);
      }
    },
    [nftContract, stakingContract, cstStakingAddr, isApprovedForAll, handleApprove, address, showError, showInfo]
  );

  const stakeMany = useCallback(
    async (tokenIds: number[]) => {
      if (!nftContract || !stakingContract) {
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

      if (!cstStakingAddr) {
        showError("Game configuration is still loading. Please wait and try again.");
        setIsStakingMultiple(false);
        return;
      }
      const tokenIdsBigInt = tokenIds.map((id) => BigInt(id));
      const estimation = await estimateContractGas(wagmiConfig, {
        address: cstStakingAddr,
        abi: StakingWalletCSTABI,
        functionName: "stakeMany",
        args: [tokenIdsBigInt],
        account: address,
      });

      if (!estimation.success) {
        showError(estimation.error || "Cannot stake these NFTs at this time");
        setIsStakingMultiple(false);
        return;
      }

      try {
        showInfo("Please confirm the transaction in your wallet...");
        await stakingContract.write.stakeMany(tokenIdsBigInt);
        showInfo(`Transaction submitted! Staking ${tokenIds.length} NFTs...`);
      } catch (error: unknown) {
        console.error("Multi-staking failed:", error);
        if (isUserRejection(error)) {
          showInfo(WALLET_TRANSACTION_CANCELLED_MESSAGE);
        } else {
          showError((error as Error)?.message || "Failed to stake NFTs. Please try again.");
        }
        setIsStakingMultiple(false);
      }
    },
    [nftContract, stakingContract, cstStakingAddr, isApprovedForAll, handleApprove, address, showError, showInfo]
  );

  const unstake = useCallback(
    async (stakeActionId: number, _tokenId: number) => {
      if (!stakingContract) {
        showError("Please connect your wallet and ensure you are on the correct network.");
        return;
      }

      setUnstakingActionId(stakeActionId);

      if (!cstStakingAddr) {
        showError("Game configuration is still loading. Please wait and try again.");
        setUnstakingActionId(null);
        return;
      }
      const estimation = await estimateContractGas(wagmiConfig, {
        address: cstStakingAddr,
        abi: StakingWalletCSTABI,
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
        await stakingContract.write.unstake(BigInt(stakeActionId));
        showInfo(`Transaction submitted! Unstaking token #${_tokenId} and claiming rewards...`);
      } catch (error: unknown) {
        console.error("Unstaking failed:", error);
        if (isUserRejection(error)) {
          showInfo(WALLET_TRANSACTION_CANCELLED_MESSAGE);
        } else {
          showError((error as Error)?.message || "Failed to unstake NFT. Please try again.");
        }
        setUnstakingActionId(null);
      }
    },
    [stakingContract, cstStakingAddr, address, showError, showInfo]
  );

  const unstakeMany = useCallback(
    async (stakeActionIds: number[]) => {
      if (stakeActionIds.length === 0) {
        showError("Please select at least one NFT to unstake.");
        return;
      }
      if (!stakingContract) {
        showError("Please connect your wallet and ensure you are on the correct network.");
        return;
      }

      setIsStakingMultiple(true);
      selectedStakedIdsRef.current = stakeActionIds.length;

      if (!cstStakingAddr) {
        showError("Game configuration is still loading. Please wait and try again.");
        setIsStakingMultiple(false);
        return;
      }
      const ids = stakeActionIds.map((id) => BigInt(id));
      const estimation = await estimateContractGas(wagmiConfig, {
        address: cstStakingAddr,
        abi: StakingWalletCSTABI,
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
        await stakingContract.write.unstakeMany(ids);
        showInfo(`Transaction submitted! Unstaking ${stakeActionIds.length} NFTs and claiming rewards...`);
      } catch (error: unknown) {
        console.error("Unstake selected failed:", error);
        if (isUserRejection(error)) {
          showInfo(WALLET_TRANSACTION_CANCELLED_MESSAGE);
        } else {
          showError((error as Error)?.message || "Failed to unstake NFTs. Please try again.");
        }
        setIsStakingMultiple(false);
      }
    },
    [stakingContract, cstStakingAddr, address, showError, showInfo]
  );

  const isSubmitting =
    stakingTokenId !== null ||
    isStakingMultiple ||
    unstakingActionId !== null ||
    stakingContract.status.isPending ||
    stakingContract.status.isConfirming;

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
    isPending: stakingContract.status.isPending,
    isConfirming: stakingContract.status.isConfirming,
    error: stakingContract.status.error,
    refetch,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Coins,
  CheckCircle,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "@/lib/web3/config";
import { CONTRACTS } from "@/lib/web3/contracts";
import { defaultChain } from "@/lib/web3/chains";
import PrizesWalletABI from "@/contracts/PrizesWallet.json";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/data/EmptyState";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";
import { usePrizesWallet } from "@/hooks/usePrizesWallet";
import { useStakingWalletCST } from "@/hooks/useStakingWallet";
import { formatTime } from "@/lib/utils";
import { useNotification } from "@/contexts/NotificationContext";

interface RaffleWinning {
  EvtLogId: number;
  TxHash: string;
  TimeStamp: number;
  RoundNum: number;
  Amount: number;
}

interface DonatedNFT {
  RecordId: number;
  Tx: {
    EvtLogId: number;
    BlockNum: number;
    TxId: number;
    TxHash: string;
    TimeStamp: number;
    DateTime: string;
  };
  Index: number;
  TokenAddr: string;
  NFTTokenId: number;
  NFTTokenURI: string;
  RoundNum: number;
  DonorAid: number;
  DonorAddr: string;
  TokenAddressId?: number; // Only in unclaimed
  WinnerIndex?: number; // Only in claimed
  WinnerAid?: number; // Only in claimed
  WinnerAddr?: string; // Only in claimed
  // Transformed fields for UI (always set by transformation)
  NftAddr: string;
  TokenId: number;
  TimeStamp: number;
  Claimed: boolean;
}

interface DonatedERC20 {
  RoundNum: number;
  TokenAddr: string;
  TokenSymbol: string;
  TokenName: string;
  AmountEth: string;
  Amount: number;
  TimeStamp: number;
  Claimed: boolean;
}

interface StakingReward {
  RecordId: number;
  Tx?: {
    TimeStamp?: number;
    DateTime?: string;
    TxHash?: string;
  };
  DepositId: number;
  DepositTimeStamp: number;
  DepositDate: string;
  NumStakedNFTs: number;
  DepositAmount: string;
  DepositAmountEth: number;
  YourTokensStaked: number;
  YourRewardAmount: string;
  YourRewardAmountEth: number;
  YourCollectedAmount: string;
  YourCollectedAmountEth: number;
  PendingToClaim: string;
  PendingToClaimEth: number;
  NumUnclaimedTokens: number;
  AmountPerToken: string;
  AmountPerTokenEth: number;
}

interface StakedTokenAction {
  TokenId: number;
  StakeActionId: number;
  StakeTimeStamp: number;
}

/**
 * Extract user-friendly error message from Web3 error
 */
function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  
  // Type guard for error objects
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    
    // Check various error message locations
    if (err.shortMessage && typeof err.shortMessage === 'string') {
      return err.shortMessage;
    }
    if (err.message && typeof err.message === 'string') {
      // Remove technical prefixes
      return err.message.replace(/^.*?Error:\s*/i, '');
    }
    if (err.data && typeof err.data === 'object') {
      const data = err.data as Record<string, unknown>;
      if (data.message && typeof data.message === 'string') {
        return data.message;
      }
    }
    if (err.reason && typeof err.reason === 'string') {
      return err.reason;
    }
  }
  
  return 'Transaction failed. Please try again.';
}

export default function MyWinningsPage() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);

  // Unclaimed winnings data
  const [raffleETHWinnings, setRaffleETHWinnings] = useState<RaffleWinning[]>(
    []
  );
  const [donatedNFTs, setDonatedNFTs] = useState<DonatedNFT[]>([]);
  const [donatedERC20, setDonatedERC20] = useState<DonatedERC20[]>([]);
  const [stakingRewards, setStakingRewards] = useState<StakingReward[]>([]);
  const [stakedTokenActions, setStakedTokenActions] = useState<StakedTokenAction[]>([]);

  // Round timeout data for expiration tracking
  const [roundTimeouts, setRoundTimeouts] = useState<Record<number, number>>(
    {}
  );

  // Summary data
  const [totalEthToClaim, setTotalEthToClaim] = useState(0);
  const [totalStakingRewards, setTotalStakingRewards] = useState(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [stakingPage, setStakingPage] = useState(1);
  const [nftPage, setNftPage] = useState(1);
  const [erc20Page, setErc20Page] = useState(1);
  const perPage = 5;

  // Transaction states
  const [claiming, setClaiming] = useState({
    eth: false,
    nft: null as number | null,
    erc20: null as number | null,
  });

  const prizesWallet = usePrizesWallet();
  const stakingWallet = useStakingWalletCST();
  const { showSuccess, showError, showInfo } = useNotification();

  // Track claiming operations for success messages
  const [pendingClaim, setPendingClaim] = useState<{
    type: 'eth' | 'nft' | 'nft-all' | 'erc20' | 'erc20-all' | 'staking-all' | null;
    data?: {
      amount?: number;
      count?: number;
      symbol?: string;
      nftIndex?: number;
    };
  }>({ type: null });

  // Fetch all unclaimed winnings
  const fetchWinnings = useCallback(async () => {
    if (!address || !isConnected) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [
        raffleDeposits,
        unclaimedNFTs,
        claimedNFTs,
        erc20Tokens,
        stakingRewardsData,
        stakedTokens,
      ] = await Promise.all([
        api.getUnclaimedRaffleDeposits(address),
        api.getUnclaimedDonatedNFTsByUser(address),
        api.getClaimedDonatedNFTsByUser(address),
        api.getERC20DonationsByUser(address),
        api.getStakingCSTRewardsToClaim(address),
        api.getStakedCSTTokensByUser(address),
      ]);

      // Sort raffle winnings by timestamp (most recent first)
      setRaffleETHWinnings(
        raffleDeposits.sort(
          (a: RaffleWinning, b: RaffleWinning) => b.TimeStamp - a.TimeStamp
        )
      );

      // Transform donated NFTs from API response
      const transformNFT = (nft: Record<string, unknown>, claimed: boolean): DonatedNFT => {
        const tx = nft.Tx as Record<string, unknown>;
        return {
          RecordId: nft.RecordId as number,
          Tx: {
            EvtLogId: tx?.EvtLogId as number || 0,
            BlockNum: tx?.BlockNum as number || 0,
            TxId: tx?.TxId as number || 0,
            TxHash: tx?.TxHash as string || '',
            TimeStamp: tx?.TimeStamp as number || 0,
            DateTime: tx?.DateTime as string || '',
          },
          Index: nft.Index as number,
          TokenAddr: nft.TokenAddr as string,
          NFTTokenId: nft.NFTTokenId as number,
          NFTTokenURI: nft.NFTTokenURI as string || '',
          RoundNum: nft.RoundNum as number,
          DonorAid: nft.DonorAid as number,
          DonorAddr: nft.DonorAddr as string,
          TokenAddressId: nft.TokenAddressId as number | undefined,
          WinnerIndex: nft.WinnerIndex as number | undefined,
          WinnerAid: nft.WinnerAid as number | undefined,
          WinnerAddr: nft.WinnerAddr as string | undefined,
          // Add transformed fields for backward compatibility
          NftAddr: nft.TokenAddr as string,
          TokenId: nft.NFTTokenId as number,
          TimeStamp: tx?.TimeStamp as number || 0,
          Claimed: claimed,
        };
      };

      const transformedUnclaimedNFTs = unclaimedNFTs.map((nft: Record<string, unknown>) => 
        transformNFT(nft, false)
      );
      const transformedClaimedNFTs = claimedNFTs.map((nft: Record<string, unknown>) => 
        transformNFT(nft, true)
      );

      setDonatedNFTs(
        [...transformedUnclaimedNFTs, ...transformedClaimedNFTs].sort(
          (a: DonatedNFT, b: DonatedNFT) => a.TimeStamp - b.TimeStamp
        )
      );

      // Sort ERC20 tokens
      setDonatedERC20(
        erc20Tokens.sort(
          (a: DonatedERC20, b: DonatedERC20) => b.TimeStamp - a.TimeStamp
        )
      );
      setStakingRewards(stakingRewardsData);
      
      // Extract action IDs from staked tokens
      const actionIds = stakedTokens.map((token: {
        TokenInfo?: { TokenId: number };
        TokenId: number;
        StakeActionId: number;
        StakeTimeStamp: number;
      }) => ({
        TokenId: token.TokenInfo?.TokenId || token.TokenId,
        StakeActionId: token.StakeActionId,
        StakeTimeStamp: token.StakeTimeStamp,
      }));
      setStakedTokenActions(actionIds);

      // Calculate totals
      const ethTotal = raffleDeposits.reduce(
        (sum: number, w: RaffleWinning) => sum + w.Amount,
        0
      );
      const stakingTotal = stakingRewardsData.reduce(
        (sum: number, r: StakingReward) => sum + r.PendingToClaimEth,
        0
      );

      setTotalEthToClaim(ethTotal);
      setTotalStakingRewards(stakingTotal);

      // Fetch round timeouts for raffle winnings
      const uniqueRounds: number[] = [
        ...new Set<number>(
          raffleDeposits.map((w: RaffleWinning) => w.RoundNum)
        ),
      ];
      const timeouts: Record<number, number> = {};

      for (const roundNum of uniqueRounds) {
        try {
          const timeoutData = await readContract(wagmiConfig, {
            address: CONTRACTS.PRIZES_WALLET,
            abi: PrizesWalletABI,
            chainId: defaultChain.id,
            functionName: 'roundTimeoutTimesToWithdrawPrizes',
            args: [BigInt(roundNum)]
          });
          
          if (timeoutData) {
            timeouts[roundNum] = Number(timeoutData);
          }
        } catch (err) {
          console.error(`Error fetching timeout for round ${roundNum}:`, err);
        }
      }
      setRoundTimeouts(timeouts);
    } catch (error) {
      console.error("Error fetching winnings:", error);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchWinnings();
  }, [fetchWinnings]);

  // Watch for successful prizes wallet transactions
  useEffect(() => {
    if (
      pendingClaim.type &&
      ['eth', 'nft', 'nft-all', 'erc20', 'erc20-all'].includes(pendingClaim.type) &&
      !prizesWallet.isTransactionPending &&
      prizesWallet.write.status.isSuccess
    ) {
      // Show appropriate success message
      switch (pendingClaim.type) {
        case 'eth':
          showSuccess(`Successfully claimed ${pendingClaim.data?.amount?.toFixed(6)} ETH! Refreshing data...`);
          setClaiming((prev) => ({ ...prev, eth: false }));
          break;
        case 'nft':
          showSuccess("NFT claimed successfully! Refreshing data...");
          setClaiming((prev) => ({ ...prev, nft: null }));
          break;
        case 'nft-all':
          showSuccess(`Successfully claimed ${pendingClaim.data?.count} NFT(s)! Refreshing data...`);
          break;
        case 'erc20':
          showSuccess(`${pendingClaim.data?.symbol} tokens claimed successfully! Refreshing data...`);
          setClaiming((prev) => ({ ...prev, erc20: null }));
          break;
        case 'erc20-all':
          showSuccess(`Successfully claimed ${pendingClaim.data?.count} ERC20 token(s)! Refreshing data...`);
          break;
      }
      
      setPendingClaim({ type: null });
      // Refresh winnings data after a delay to allow backend to index the transaction
      setTimeout(() => {
        fetchWinnings();
      }, 3000);
    }
  }, [
    pendingClaim,
    prizesWallet.isTransactionPending,
    prizesWallet.write.status.isSuccess,
    fetchWinnings,
    showSuccess,
  ]);

  // Watch for failed prizes wallet transactions
  useEffect(() => {
    if (
      pendingClaim.type &&
      ['eth', 'nft', 'nft-all', 'erc20', 'erc20-all'].includes(pendingClaim.type) &&
      !prizesWallet.isTransactionPending &&
      prizesWallet.write.status.error
    ) {
      const errorMessage = getErrorMessage(prizesWallet.write.status.error);
      showError(errorMessage);
      
      // Reset claiming states
      if (pendingClaim.type === 'eth') {
        setClaiming((prev) => ({ ...prev, eth: false }));
      } else if (pendingClaim.type === 'nft') {
        setClaiming((prev) => ({ ...prev, nft: null }));
      } else if (pendingClaim.type === 'erc20') {
        setClaiming((prev) => ({ ...prev, erc20: null }));
      }
      
      setPendingClaim({ type: null });
    }
  }, [
    pendingClaim,
    prizesWallet.isTransactionPending,
    prizesWallet.write.status.error,
    showError,
  ]);

  // Watch for successful staking wallet transactions
  useEffect(() => {
    if (
      pendingClaim.type === 'staking-all' &&
      !stakingWallet.status.isPending &&
      stakingWallet.status.isSuccess
    ) {
      showSuccess(`Successfully unstaked ${pendingClaim.data?.count} NFT(s) and claimed all rewards! Refreshing data...`);
      setPendingClaim({ type: null });
      // Refresh winnings data after a delay to allow backend to index the transaction
      setTimeout(() => {
        fetchWinnings();
      }, 3000);
    }
  }, [
    pendingClaim,
    stakingWallet.status.isPending,
    stakingWallet.status.isSuccess,
    fetchWinnings,
    showSuccess,
  ]);

  // Watch for failed staking wallet transactions
  useEffect(() => {
    if (
      pendingClaim.type === 'staking-all' &&
      !stakingWallet.status.isPending &&
      stakingWallet.status.error
    ) {
      const errorMessage = getErrorMessage(stakingWallet.status.error);
      showError(errorMessage);
      setPendingClaim({ type: null });
    }
  }, [
    pendingClaim,
    stakingWallet.status.isPending,
    stakingWallet.status.error,
    showError,
  ]);

  // Claim all ETH (raffle prizes)
  const handleClaimETH = async () => {
    if (totalEthToClaim === 0 || raffleETHWinnings.length === 0) return;
    
    setClaiming((prev) => ({ ...prev, eth: true }));
    try {
      showInfo("Please confirm the transaction in your wallet...");
      
      // Get all unique round numbers from raffle winnings
      const roundNumbers = [...new Set(raffleETHWinnings.map(w => BigInt(w.RoundNum)))];
      
      // Use withdrawEverything to claim all ETH in one transaction
      await prizesWallet.write.withdrawEverything(
        roundNumbers,  // ETH prize round numbers
        [],            // No ERC20 tokens
        []             // No NFTs
      );
      
      // Show waiting for confirmation and set pending claim for success handling
      showInfo("Transaction submitted! Waiting for confirmation...");
      setPendingClaim({ type: 'eth', data: { amount: totalEthToClaim } });
    } catch (error) {
      console.error("Error claiming ETH:", error);
      const errorMessage = getErrorMessage(error);
      showError(errorMessage);
      setClaiming((prev) => ({ ...prev, eth: false }));
    }
  };

  // Claim single donated NFT
  const handleClaimNFT = async (nftIndex: number) => {
    setClaiming((prev) => ({ ...prev, nft: nftIndex }));
    try {
      showInfo("Please confirm the transaction in your wallet...");
      await prizesWallet.write.claimDonatedNft(BigInt(nftIndex));
      
      showInfo("Transaction submitted! Waiting for confirmation...");
      setPendingClaim({ type: 'nft', data: { nftIndex } });
    } catch (error) {
      console.error("Error claiming NFT:", error);
      const errorMessage = getErrorMessage(error);
      showError(errorMessage);
      setClaiming((prev) => ({ ...prev, nft: null }));
    }
  };

  // Claim all donated NFTs
  const handleClaimAllNFTs = async () => {
    const unclaimedNFTs = donatedNFTs.filter((nft) => !nft.Claimed);
    if (unclaimedNFTs.length === 0) return;

    try {
      showInfo("Please confirm the transaction in your wallet...");
      
      const indexes = unclaimedNFTs.map((nft) => BigInt(nft.Index));
      await prizesWallet.write.claimManyDonatedNfts(indexes);
      
      showInfo("Transaction submitted! Waiting for confirmation...");
      setPendingClaim({ type: 'nft-all', data: { count: unclaimedNFTs.length } });
    } catch (error) {
      console.error("Error claiming all NFTs:", error);
      const errorMessage = getErrorMessage(error);
      showError(errorMessage);
    }
  };

  // Claim single ERC20 token
  const handleClaimERC20 = async (token: DonatedERC20) => {
    setClaiming((prev) => ({ ...prev, erc20: token.RoundNum }));
    try {
      showInfo("Please confirm the transaction in your wallet...");
      
      await prizesWallet.write.claimDonatedToken(
        BigInt(token.RoundNum),
        token.TokenAddr as `0x${string}`,
        BigInt(token.AmountEth)
      );
      
      showInfo("Transaction submitted! Waiting for confirmation...");
      setPendingClaim({ type: 'erc20', data: { symbol: token.TokenSymbol } });
    } catch (error) {
      console.error("Error claiming ERC20:", error);
      const errorMessage = getErrorMessage(error);
      showError(errorMessage);
      setClaiming((prev) => ({ ...prev, erc20: null }));
    }
  };

  // Claim all ERC20 tokens
  const handleClaimAllERC20 = async () => {
    const unclaimedTokens = donatedERC20.filter((t) => !t.Claimed);
    if (unclaimedTokens.length === 0) return;

    try {
      showInfo("Please confirm the transaction in your wallet...");
      
      const tokens = unclaimedTokens.map((token) => ({
        roundNum: BigInt(token.RoundNum),
        tokenAddress: token.TokenAddr as `0x${string}`,
        amount: BigInt(token.AmountEth),
      }));

      await prizesWallet.write.claimManyDonatedTokens(tokens);
      
      showInfo("Transaction submitted! Waiting for confirmation...");
      setPendingClaim({ type: 'erc20-all', data: { count: unclaimedTokens.length } });
    } catch (error) {
      console.error("Error claiming all ERC20:", error);
      const errorMessage = getErrorMessage(error);
      showError(errorMessage);
    }
  };

  // Claim all staking rewards (unstake all deposits)
  const handleClaimAllStaking = async () => {
    if (stakingRewards.length === 0 || stakedTokenActions.length === 0) return;

    try {
      showInfo("Please confirm the transaction in your wallet...");
      
      // Get all action IDs from currently staked tokens
      const allActionIds = stakedTokenActions.map((token) => BigInt(token.StakeActionId));
      
      if (allActionIds.length === 0) {
        showError("No staked tokens found.");
        return;
      }
      
      await stakingWallet.write.unstakeMany(allActionIds);
      
      showInfo("Transaction submitted! Waiting for confirmation...");
      setPendingClaim({ type: 'staking-all', data: { count: allActionIds.length } });
    } catch (error) {
      console.error("Error claiming all staking rewards:", error);
      const errorMessage = getErrorMessage(error);
      showError(errorMessage);
    }
  };

  const formatTimestamp = (timestamp: number, includeTime = false) => {
    const date = new Date(timestamp * 1000);
    if (includeTime) {
      return date.toLocaleString();
    }
    return date.toLocaleDateString();
  };

  const getExpirationStatus = (roundNum: number) => {
    const timeout = roundTimeouts[roundNum];
    if (!timeout) return null;

    const now = Math.floor(Date.now() / 1000);
    const isExpired = timeout < now;
    const timeLeft = timeout - now;

    return { timeout, isExpired, timeLeft };
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <section className="section-padding bg-background-surface/50">
          <Container>
            <Breadcrumbs
              items={[
                { label: "My Account", href: "/account" },
                { label: "Winnings" },
              ]}
              className="mb-8"
            />
            <Card glass className="p-12 text-center">
              <Trophy className="mx-auto mb-4 text-text-muted" size={64} />
              <h1 className="heading-sm mb-4">Connect Your Wallet</h1>
              <p className="text-text-secondary">
                Please connect your wallet to view and claim your prizes
              </p>
            </Card>
          </Container>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <Loader2
              className="animate-spin mx-auto mb-4 text-primary"
              size={48}
            />
            <p className="text-text-secondary">Loading your prizes...</p>
          </Card>
        </Container>
      </div>
    );
  }

  const unclaimedNFTs = donatedNFTs.filter((nft) => !nft.Claimed);
  const unclaimedERC20 = donatedERC20.filter((t) => !t.Claimed);

  const hasUnclaimedPrizes =
    totalEthToClaim > 0 ||
    totalStakingRewards > 0 ||
    unclaimedNFTs.length > 0 ||
    unclaimedERC20.length > 0;

  const totalClaimableEth = totalEthToClaim + totalStakingRewards;

  // Paginate raffle winnings
  const paginatedRaffleWinnings = raffleETHWinnings.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );
  const totalPages = Math.ceil(raffleETHWinnings.length / perPage);

  // Paginate staking rewards
  const paginatedStakingRewards = stakingRewards.slice(
    (stakingPage - 1) * perPage,
    stakingPage * perPage
  );
  const stakingTotalPages = Math.ceil(stakingRewards.length / perPage);

  // Paginate donated NFTs
  const paginatedDonatedNFTs = donatedNFTs.slice(
    (nftPage - 1) * perPage,
    nftPage * perPage
  );
  const nftTotalPages = Math.ceil(donatedNFTs.length / perPage);

  // Paginate donated ERC20 tokens
  const paginatedDonatedERC20 = donatedERC20.slice(
    (erc20Page - 1) * perPage,
    erc20Page * perPage
  );
  const erc20TotalPages = Math.ceil(donatedERC20.length / perPage);

  if (
    !hasUnclaimedPrizes &&
    raffleETHWinnings.length === 0 &&
    donatedNFTs.length === 0
  ) {
    return (
      <div className="min-h-screen section-padding">
        <Container>
          <Breadcrumbs
            items={[
              { label: "My Account", href: "/account" },
              { label: "Winnings" },
            ]}
            className="mb-8"
          />

          <EmptyState
            icon={Trophy}
            title="No Prizes Yet"
            description="Start playing to win prizes! Every round has 15+ opportunities to win."
            action={{
              label: "Start Playing",
              href: "/game/play",
            }}
          />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <Breadcrumbs
            items={[
              { label: "My Account", href: "/account" },
              { label: "Winnings" },
            ]}
            className="mb-8"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="heading-xl mb-4">Pending Winnings</h1>
            {totalClaimableEth > 0 && (
              <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-primary/10 border border-primary/20">
                <Trophy size={24} className="text-primary" />
                <span className="font-mono text-3xl font-semibold text-primary">
                  {totalClaimableEth.toFixed(6)} ETH
                </span>
              </div>
            )}
          </motion.div>
        </Container>
      </section>

      {/* Transaction Status */}
      {prizesWallet.isTransactionPending && (
        <section className="py-4">
          <Container>
            <Card glass className="p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-primary" size={24} />
                <div>
                  <p className="font-semibold text-text-primary">
                    Transaction in progress...
                  </p>
                  <p className="text-sm text-text-secondary">
                    Please wait while your transaction is being confirmed
                  </p>
                  {prizesWallet.transactionHash && (
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${prizesWallet.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      View on Arbiscan <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          </Container>
        </section>
      )}

      {/* Claimable ETH Rewards (Raffle) */}
      <section className="py-12">
        <Container>
          <h2 className="font-serif text-3xl font-semibold text-text-primary mb-6">
            Claimable ETH Rewards
          </h2>

          {raffleETHWinnings.length === 0 ? (
            <Card glass className="p-8 text-center">
              <p className="text-text-secondary">No ETH winnings yet.</p>
            </Card>
          ) : (
            <>
              {/* Summary Card */}
              {totalEthToClaim > 0 && (
                <Card glass className="p-6 mb-6 bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <Coins size={40} className="text-primary" />
                      <div>
                        <p className="text-sm text-text-secondary mb-1">
                          Your claimable winnings are
                        </p>
                        <p className="font-mono text-3xl font-bold text-primary">
                          {totalEthToClaim.toFixed(6)} ETH
                        </p>
                        <p className="text-sm text-text-muted mt-1">
                          ≈ ${(totalEthToClaim * 2400).toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleClaimETH}
                      disabled={
                        claiming.eth || prizesWallet.isTransactionPending
                      }
                    >
                      {claiming.eth ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" size={20} />
                          Claiming...
                        </>
                      ) : (
                        "Claim All"
                      )}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Raffle Winnings Table */}
              <Card glass className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background-elevated border-b border-text-muted/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                          Datetime
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                          Round
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                          Expiration Date
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                          Amount (ETH)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRaffleWinnings.map((winning, index) => {
                        const expiration = getExpirationStatus(
                          winning.RoundNum
                        );

                        return (
                          <tr
                            key={winning.EvtLogId}
                            className={`border-b border-text-muted/5 ${
                              index % 2 === 0 ? "bg-background-surface/30" : ""
                            }`}
                          >
                            <td className="px-6 py-4">
                              <a
                                href={`https://sepolia.arbiscan.io/tx/${winning.TxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1"
                              >
                                {formatTimestamp(winning.TimeStamp, true)}
                                <ExternalLink size={12} />
                              </a>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Link
                                href={`/game/history/rounds/${winning.RoundNum}`}
                              >
                                <Badge variant="default">
                                  Round {winning.RoundNum}
                                </Badge>
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {expiration ? (
                                <div className="text-sm">
                                  <div
                                    className={
                                      expiration.isExpired
                                        ? "text-red-400"
                                        : "text-text-secondary"
                                    }
                                  >
                                    {formatTimestamp(expiration.timeout, true)}
                                  </div>
                                  {expiration.isExpired ? (
                                    <div className="text-xs text-red-400 mt-1">
                                      (Expired)
                                    </div>
                                  ) : (
                                    <div className="text-xs text-text-muted mt-1">
                                      ({formatTime(expiration.timeLeft)})
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-text-muted">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-text-primary">
                              {winning.Amount.toFixed(7)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center gap-2">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="text-text-muted">...</span>
                          )}
                          <Button
                            size="sm"
                            variant={
                              currentPage === page ? "primary" : "outline"
                            }
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
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

      {/* CST Staking Rewards */}
      {stakingRewards.length > 0 && (
        <section className="py-12 bg-background-surface/50">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl font-semibold text-text-primary">
                Claimable CST Staking Rewards
              </h2>
              {stakingRewards.length > 0 && (
                <Button
                  onClick={handleClaimAllStaking}
                  disabled={stakingWallet.status.isPending}
                >
                  {stakingWallet.status.isPending ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Processing...
                    </>
                  ) : (
                    `Claim All (${stakingRewards.length})`
                  )}
                </Button>
              )}
            </div>

            <div className="mb-6 p-4 rounded-lg bg-status-info/10 border border-status-info/20">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="text-status-info flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="text-sm text-text-secondary">
                  <p className="font-semibold text-text-primary mb-1">
                    How staking rewards work:
                  </p>
                  <p>
                    When you unstake your NFTs, the pending rewards will be automatically 
                    transferred to your wallet. Use &quot;Claim All&quot; to unstake all deposits 
                    and claim all rewards at once.
                  </p>
                </div>
              </div>
            </div>

            <Card glass className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-elevated border-b border-text-muted/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                        Deposit ID
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Date
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Your NFTs
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Total NFTs
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                        Total Deposit
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                        Per NFT
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                        Your Reward
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStakingRewards.map((reward, index) => (
                      <tr
                        key={reward.DepositId}
                        className={`border-b border-text-muted/5 ${
                          index % 2 === 0 ? "bg-background-surface/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-primary font-semibold">
                            #{reward.DepositId}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-text-secondary">
                          {new Date(reward.DepositDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="info">
                            {reward.YourTokensStaked}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center text-text-secondary">
                          {reward.NumStakedNFTs}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-text-primary">
                          {reward.DepositAmountEth.toFixed(6)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-text-muted text-sm">
                          {reward.AmountPerTokenEth.toFixed(8)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-status-success font-semibold">
                          {reward.PendingToClaimEth.toFixed(7)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalStakingRewards > 0 && (
                <div className="p-6 bg-background-elevated border-t border-text-muted/10">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Total Deposits
                      </p>
                      <p className="font-mono text-lg font-bold text-text-primary">
                        {stakingRewards.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Your NFTs Staked
                      </p>
                      <p className="font-mono text-lg font-bold text-text-primary">
                        {stakingRewards.reduce((sum, r) => sum + r.YourTokensStaked, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Unclaimed Tokens
                      </p>
                      <p className="font-mono text-lg font-bold text-text-primary">
                        {stakingRewards.reduce((sum, r) => sum + r.NumUnclaimedTokens, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Total Rewards
                      </p>
                      <p className="font-mono text-2xl font-bold text-status-success">
                        {totalStakingRewards.toFixed(6)} ETH
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleClaimAllStaking}
                      disabled={stakingWallet.status.isPending}
                    >
                      {stakingWallet.status.isPending ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" size={16} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2" size={16} />
                          Claim All Rewards
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {stakingTotalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setStakingPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={stakingPage === 1}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: stakingTotalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === stakingTotalPages ||
                          Math.abs(page - stakingPage) <= 1
                        );
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center gap-2">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="text-text-muted">...</span>
                          )}
                          <Button
                            size="sm"
                            variant={
                              stakingPage === page ? "primary" : "outline"
                            }
                            onClick={() => setStakingPage(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setStakingPage((prev) =>
                        Math.min(stakingTotalPages, prev + 1)
                      )
                    }
                    disabled={stakingPage === stakingTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </Card>
          </Container>
        </section>
      )}

      {/* Donated NFTs */}
      {donatedNFTs.length > 0 && (
        <section className="py-12">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl font-semibold text-text-primary">
                Donated NFTs
              </h2>
              {unclaimedNFTs.length > 0 && (
                <Button
                  onClick={handleClaimAllNFTs}
                  disabled={prizesWallet.isTransactionPending}
                >
                  Claim All ({unclaimedNFTs.length})
                </Button>
              )}
            </div>

            <Card glass className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-elevated border-b border-text-muted/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                        Token ID
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Contract Address
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Round
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Date
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDonatedNFTs.map((nft, index) => (
                      <tr
                        key={`${nft.RecordId}-${nft.Index}-${nft.TokenId}-${nft.RoundNum}-${index}`}
                        className={`border-b border-text-muted/5 ${
                          index % 2 === 0 ? "bg-background-surface/30" : ""
                        } ${nft.Claimed ? "opacity-50" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-text-primary font-semibold">
                            #{nft.TokenId}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-mono text-xs text-text-muted">
                            {nft.NftAddr ? (
                              <>
                                {nft.NftAddr.substring(0, 6)}...
                                {nft.NftAddr.slice(-4)}
                              </>
                            ) : (
                              'N/A'
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link href={`/game/history/rounds/${nft.RoundNum}`}>
                            <Badge variant="default">
                              Round {nft.RoundNum}
                            </Badge>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-text-secondary">
                          {formatTimestamp(nft.Tx.TimeStamp)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {nft.Claimed ? (
                            <Badge variant="success">
                              <CheckCircle size={12} className="mr-1" />
                              Claimed
                            </Badge>
                          ) : (
                            <Badge variant="warning">Unclaimed</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {!nft.Claimed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClaimNFT(nft.Index)}
                              disabled={
                                claiming.nft === nft.Index ||
                                prizesWallet.isTransactionPending
                              }
                            >
                              {claiming.nft === nft.Index ? (
                                <>
                                  <Loader2
                                    className="mr-1 animate-spin"
                                    size={14}
                                  />
                                  Claiming...
                                </>
                              ) : (
                                "Claim"
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {nftTotalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNftPage((prev) => Math.max(1, prev - 1))}
                    disabled={nftPage === 1}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: nftTotalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === nftTotalPages ||
                          Math.abs(page - nftPage) <= 1
                        );
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center gap-2">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="text-text-muted">...</span>
                          )}
                          <Button
                            size="sm"
                            variant={nftPage === page ? "primary" : "outline"}
                            onClick={() => setNftPage(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setNftPage((prev) => Math.min(nftTotalPages, prev + 1))
                    }
                    disabled={nftPage === nftTotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </Card>
          </Container>
        </section>
      )}

      {/* Donated ERC20 Tokens */}
      {donatedERC20.length > 0 && (
        <section className="py-12 bg-background-surface/50">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl font-semibold text-text-primary">
                Donated ERC20 Tokens
              </h2>
              {unclaimedERC20.length > 0 && (
                <Button
                  onClick={handleClaimAllERC20}
                  disabled={prizesWallet.isTransactionPending}
                >
                  Claim All ({unclaimedERC20.length})
                </Button>
              )}
            </div>

            <Card glass className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-elevated border-b border-text-muted/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                        Token
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Contract Address
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Round
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDonatedERC20.map((token, index) => (
                      <tr
                        key={`${token.RoundNum}-${token.TokenAddr}`}
                        className={`border-b border-text-muted/5 ${
                          index % 2 === 0 ? "bg-background-surface/30" : ""
                        } ${token.Claimed ? "opacity-50" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-mono text-text-primary font-semibold">
                              {token.TokenSymbol}
                            </span>
                            {token.TokenName && (
                              <div className="text-xs text-text-muted mt-1">
                                {token.TokenName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-mono text-xs text-text-muted">
                            {token.TokenAddr.substring(0, 6)}...
                            {token.TokenAddr.slice(-4)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="default">
                            Round {token.RoundNum}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-text-primary">
                          {(parseFloat(token.AmountEth) / 1e18).toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 6,
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {token.Claimed ? (
                            <Badge variant="success">
                              <CheckCircle size={12} className="mr-1" />
                              Claimed
                            </Badge>
                          ) : (
                            <Badge variant="warning">Unclaimed</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {!token.Claimed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClaimERC20(token)}
                              disabled={
                                claiming.erc20 === token.RoundNum ||
                                prizesWallet.isTransactionPending
                              }
                            >
                              {claiming.erc20 === token.RoundNum ? (
                                <>
                                  <Loader2
                                    className="mr-1 animate-spin"
                                    size={14}
                                  />
                                  Claiming...
                                </>
                              ) : (
                                "Claim"
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {erc20TotalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setErc20Page((prev) => Math.max(1, prev - 1))
                    }
                    disabled={erc20Page === 1}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: erc20TotalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === erc20TotalPages ||
                          Math.abs(page - erc20Page) <= 1
                        );
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center gap-2">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="text-text-muted">...</span>
                          )}
                          <Button
                            size="sm"
                            variant={erc20Page === page ? "primary" : "outline"}
                            onClick={() => setErc20Page(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setErc20Page((prev) =>
                        Math.min(erc20TotalPages, prev + 1)
                      )
                    }
                    disabled={erc20Page === erc20TotalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </Card>
          </Container>
        </section>
      )}

      {/* Navigation to Other Pages */}
      <section className="py-12">
        <Container>
          <Card glass className="p-6 text-center">
            <p className="text-text-secondary mb-4">
              Want to see all your winnings history?
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/account/statistics">View My Statistics →</Link>
              </Button>
            </div>
          </Card>
        </Container>
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { 
  Loader2, 
  ExternalLink, 
  BarChart3,
  Trophy,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import { api } from "@/services/api";
import { usePrizesWallet } from "@/hooks/usePrizesWallet";
import { formatEther } from "viem";
import { safeTimestamp } from "@/lib/utils";

interface Bid {
  EvtLogId: number;
  BidderAddr: string;
  BidType: number;
  BidPriceEth: number;
  RoundNum: number;
  TimeStamp: number;
  TxHash: string;
}

interface ClaimHistory {
  EvtLogId: number;
  TimeStamp: number;
  RoundNum: number;
  Description: string;
  PrizeAmount: number;
}

interface MarketingReward {
  EvtLogId: number;
  TimeStamp: number;
  RoundNum: number;
  AmountEth: number;
}

interface CSTToken {
  TokenId: number;
  TokenName: string;
}

interface StakingAction {
  ActionType: number; // 0 = stake, 1 = unstake
  RecordId: number;
  Tx: {
    EvtLogId: number;
    BlockNum: number;
    TxId: number;
    TxHash: string;
    TimeStamp: number;
    DateTime: string;
  };
  UnstakeDate: string;
  UnstakeTimeStamp: number;
  ActionId: number;
  TokenId: number;
  NumStakedNFTs: number;
  Modulo: string;
  ModuloF64: number;
  Claimed: boolean;
}

interface StakingReward {
  TokenId: number;
  RewardCollectedEth: number;
  RewardToCollectEth: number;
  UserAid: number;
  UserAddr: string;
}

interface CollectedStakingReward {
  RecordId: number;
  DepositId: number;
  RoundNum: number;
  YourTokensStaked: number;
  YourCollectedAmountEth: number;
  DepositTimeStamp: number;
  DepositDate: string;
  NumStakedNFTs: number;
  TotalDepositAmountEth: number;
  DepositAmountPerTokenEth: number;
  NumTokensCollected: number;
  FullyClaimed: boolean;
}

interface RWLKMint {
  TokenId: number;
  RoundNum: number;
  TimeStamp: number;
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
  RecordId: number;
  Tx: {
    EvtLogId: number;
    BlockNum: number;
    TxId: number;
    TxHash: string;
    TimeStamp: number;
    DateTime: string;
  };
  RoundNum: number;
  TokenAid: number;
  TokenAddr: string;
  AmountDonated: string;
  AmountDonatedEth: number;
  AmountClaimed: string;
  AmountClaimedEth: number;
  DonateClaimDiff: string;
  DonateClaimDiffEth: number;
  WinnerAid: number;
  WinnerAddr: string;
  Claimed: boolean;
}

interface DashboardData {
  CurRoundNum: number;
  TsRoundStart: number;
  NumRaffleEthWinnersBidding?: number;
  NumRaffleNFTWinnersBidding?: number;
}

interface UserInfo {
  AddressId?: number;
  Address: string;
  NumBids: number;
  CosmicSignatureNumTransfers: number;
  CosmicTokenNumTransfers?: number;
  MaxBidAmount: number;
  NumPrizes: number;
  MaxWinAmount: number;
  SumRaffleEthWinnings: number;
  SumRaffleEthWithdrawal: number;
  UnclaimedNFTs: number;
  NumRaffleEthWinnings: number;
  RaffleNFTsCount: number;
  RewardNFTsCount: number;
  TotalCSTokensWon: number;
  TotalDonatedCount?: number;
  TotalDonatedAmountEth?: number;
  StakingStatisticsRWalk?: {
    NumActiveStakers: number;
    TotalNumStakeActions: number;
    TotalNumUnstakeActions: number;
    TotalTokensMinted: number;
    TotalTokensStaked: number;
  };
}

interface StatItemProps {
  title: string;
  value: React.ReactNode;
}

const StatItem = ({ title, value }: StatItemProps) => (
  <div className="flex items-start justify-between py-3 border-b border-text-muted/10 last:border-0">
    <span className="text-text-secondary text-sm font-medium min-w-[250px] md:min-w-[400px] mr-4">
      {title}
    </span>
    <div className="font-mono text-text-primary text-sm text-right break-all">
      {value}
    </div>
  </div>
);

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
      </Button>
      
      <span className="text-sm text-text-secondary px-4">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};

export default function UserStatisticsPage() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [balance, setBalance] = useState({ CosmicToken: 0, ETH: 0 });
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [raffleETHProbability, setRaffleETHProbability] = useState(0);
  const [raffleNFTProbability, setRaffleNFTProbability] = useState(0);
  
  // Bid and claim history
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([]);
  const [marketingRewards, setMarketingRewards] = useState<MarketingReward[]>([]);
  
  // CST tokens owned
  const [cstList, setCSTList] = useState<CSTToken[]>([]);
  
  // Staking data
  const [stakingCSTActions, setStakingCSTActions] = useState<StakingAction[]>([]);
  const [stakingRWLKActions, setStakingRWLKActions] = useState<StakingAction[]>([]);
  const [cstStakingRewards, setCstStakingRewards] = useState<StakingReward[]>([]);
  const [collectedCstStakingRewards, setCollectedCstStakingRewards] = useState<CollectedStakingReward[]>([]);
  const [rwlkMints, setRWLKMints] = useState<RWLKMint[]>([]);
  
  // Donated prizes
  const [donatedNFTs, setDonatedNFTs] = useState<DonatedNFT[]>([]);
  const [donatedERC20, setDonatedERC20] = useState<DonatedERC20[]>([]);
  
  // UI state
  const [stakingTab, setStakingTab] = useState<"cst" | "rwlk">("cst");
  const [claimingNFT, setClaimingNFT] = useState<number | null>(null);
  const [claimingERC20, setClaimingERC20] = useState<number | null>(null);
  
  // Pagination state
  const [bidHistoryPage, setBidHistoryPage] = useState(1);
  const [claimHistoryPage, setClaimHistoryPage] = useState(1);
  const [cstStakingActionsPage, setCstStakingActionsPage] = useState(1);
  const [rwlkStakingActionsPage, setRwlkStakingActionsPage] = useState(1);
  const [cstStakingRewardsPage, setCstStakingRewardsPage] = useState(1);
  const [collectedRewardsPage, setCollectedRewardsPage] = useState(1);
  const [rwlkMintsPage, setRwlkMintsPage] = useState(1);
  const [marketingRewardsPage, setMarketingRewardsPage] = useState(1);
  const itemsPerPage = 10;
  
  const prizesWallet = usePrizesWallet();

  // Refresh data without showing loading screen (for background updates)
  const refreshData = useCallback(async (showLoading = false) => {
    if (!address || !isConnected) {
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }

      // Fetch all user data in parallel
      const [
        claimHist,
        userInfoResponse,
        balanceResponse,
        cstActions,
        rwalkActions,
        mRewards,
        userCstList,
        stakingRewards,
        collectedRewards,
        rwalkMinted,
        unclaimedNFTs,
        claimedNFTs,
        erc20Tokens,
        dashData,
      ] = await Promise.all([
        api.getClaimHistoryByUser(address),
        api.getUserInfo(address),
        api.getUserBalance(address),
        api.getStakingCSTActionsByUser(address),
        api.getStakingRWLKActionsByUser(address),
        api.getMarketingRewardsByUser(address),
        api.getCSTTokensByUser(address),
        api.getStakingRewardsByUser(address),
        api.getStakingCSTRewardsCollected(address),
        api.getStakingRWLKMintsByUser(address),
        api.getUnclaimedDonatedNFTsByUser(address),
        api.getClaimedDonatedNFTsByUser(address),
        api.getERC20DonationsByUser(address),
        api.getDashboardInfo(),
      ]);

      // Set user info
      if (userInfoResponse && userInfoResponse.UserInfo) {
        setUserInfo(userInfoResponse.UserInfo);
        setBidHistory(userInfoResponse.Bids || []);
      }

      // Set balances
      if (balanceResponse) {
        setBalance({
          CosmicToken: Number(formatEther(BigInt(balanceResponse.CosmicTokenBalance || "0"))),
          ETH: Number(formatEther(BigInt(balanceResponse.ETH_Balance || "0"))),
        });
      }

      // Set all other data
      setClaimHistory(claimHist);
      setStakingCSTActions(cstActions);
      setStakingRWLKActions(rwalkActions);
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

      setMarketingRewards(mRewards);
      setCSTList(userCstList);
      setCstStakingRewards(stakingRewards);
      setCollectedCstStakingRewards(collectedRewards);
      setRWLKMints(rwalkMinted);
      setDonatedNFTs([...transformedUnclaimedNFTs, ...transformedClaimedNFTs]);
      
      // Extract and sort ERC20 tokens from API response
      const erc20List = erc20Tokens?.DonatedPrizesERC20ByWinner || [];
      setDonatedERC20(erc20List.sort((a: DonatedERC20, b: DonatedERC20) => b.Tx.TimeStamp - a.Tx.TimeStamp));
      
      setDashboardData(dashData);

      // Calculate raffle probabilities
      if (dashData && dashData.CurRoundNum > 0) {
        const bidList = await api.getBidListByRound(dashData.CurRoundNum, "desc");
        const totalBids = bidList.length;
        const userBids = bidList.filter((bid: Bid) => bid.BidderAddr === address).length;

        if (totalBids > 0) {
          const ethProb =
            1 -
            Math.pow(
              (totalBids - userBids) / totalBids,
              dashData.NumRaffleEthWinnersBidding || 3
            );
          const nftProb =
            1 -
            Math.pow(
              (totalBids - userBids) / totalBids,
              dashData.NumRaffleNFTWinnersBidding || 5
            );
          setRaffleETHProbability(ethProb);
          setRaffleNFTProbability(nftProb);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [address, isConnected]);

  // Initial data fetch with loading screen
  const fetchUserData = useCallback(() => {
    return refreshData(true);
  }, [refreshData]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Claim donated NFT
  const handleClaimNFT = async (nftIndex: number) => {
    try {
      setClaimingNFT(nftIndex);
      await prizesWallet.write.claimDonatedNft(BigInt(nftIndex));
      // Refresh data after transaction without triggering full page loading
      setTimeout(() => {
        refreshData(false);
        setClaimingNFT(null);
      }, 3000);
    } catch (error) {
      console.error("Error claiming NFT:", error);
      setClaimingNFT(null);
    }
  };

  // Claim all donated NFTs
  const handleClaimAllNFTs = async () => {
    const unclaimed = donatedNFTs.filter(nft => !nft.Claimed);
    if (unclaimed.length === 0) return;

    try {
      setClaimingNFT(-1); // Use -1 to indicate bulk claim
      const indexes = unclaimed.map(nft => BigInt(nft.Index));
      await prizesWallet.write.claimManyDonatedNfts(indexes);
      setTimeout(() => {
        refreshData(false);
        setClaimingNFT(null);
      }, 3000);
    } catch (error) {
      console.error("Error claiming all NFTs:", error);
      setClaimingNFT(null);
    }
  };

  // Claim ERC20 token
  const handleClaimERC20 = async (token: DonatedERC20) => {
    try {
      setClaimingERC20(token.RoundNum);
      await prizesWallet.write.claimDonatedToken(
        BigInt(token.RoundNum),
        token.TokenAddr as `0x${string}`,
        BigInt(token.DonateClaimDiff)
      );
      // Refresh data after transaction without triggering full page loading
      setTimeout(() => {
        refreshData(false);
        setClaimingERC20(null);
      }, 3000);
    } catch (error) {
      console.error("Error claiming ERC20:", error);
      setClaimingERC20(null);
    }
  };

  // Claim all ERC20 tokens
  const handleClaimAllERC20 = async () => {
    const unclaimed = donatedERC20.filter(t => !t.Claimed);
    if (unclaimed.length === 0) return;

    try {
      setClaimingERC20(-1); // Use -1 to indicate bulk claim
      const tokens = unclaimed.map(token => ({
        roundNum: BigInt(token.RoundNum),
        tokenAddress: token.TokenAddr as `0x${string}`,
        amount: BigInt(token.DonateClaimDiff),
      }));
      
      await prizesWallet.write.claimManyDonatedTokens(tokens);
      setTimeout(() => {
        refreshData(false);
        setClaimingERC20(null);
      }, 3000);
    } catch (error) {
      console.error("Error claiming all ERC20:", error);
      setClaimingERC20(null);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <section className="section-padding bg-background-surface/50">
          <Container>
            <Breadcrumbs
              items={[
                { label: "My Account", href: "/account" },
                { label: "Statistics" },
              ]}
              className="mb-8"
            />
            <Card glass className="p-12 text-center">
              <BarChart3 className="mx-auto mb-4 text-text-muted" size={64} />
              <h1 className="heading-sm mb-4">Connect Your Wallet</h1>
              <p className="text-text-secondary">
                Please connect your wallet to view your detailed statistics
              </p>
            </Card>
          </Container>
        </section>
      </div>
    );
  }

  // Only show full page loader on initial load (when there's no data yet)
  if (loading && !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
            <p className="text-text-secondary">Loading your statistics...</p>
          </Card>
        </Container>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen">
        <section className="section-padding bg-background-surface/50">
          <Container>
            <Breadcrumbs
              items={[
                { label: "My Account", href: "/account" },
                { label: "Statistics" },
              ]}
              className="mb-8"
            />
            <Card glass className="p-12 text-center">
              <Trophy className="mx-auto mb-4 text-text-muted" size={64} />
              <h1 className="heading-sm mb-4">No Data Yet</h1>
              <p className="text-text-secondary mb-6">
                You haven&apos;t participated in Cosmic Signature yet.
              </p>
              <Button asChild>
                <Link href="/game/play">Place Your First Bid</Link>
              </Button>
            </Card>
          </Container>
        </section>
      </div>
    );
  }

  const unclaimedNFTs = donatedNFTs.filter(nft => !nft.Claimed);
  const unclaimedERC20 = donatedERC20.filter(t => !t.Claimed);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <Breadcrumbs
            items={[
              { label: "My Account", href: "/account" },
              { label: "Statistics" },
            ]}
            className="mb-8"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="heading-xl mb-4">My Statistics</h1>
            <p className="body-lg mb-6">
              Comprehensive performance tracking and detailed activity history
            </p>
            <AddressDisplay address={address || ""} showCopy={true} />
          </motion.div>
        </Container>
      </section>

      {/* User Info & Balances */}
      <section className="py-12">
        <Container>
          <h2 className="heading-md mb-6">Account Overview</h2>
          
          {/* Balances */}
          {(balance.ETH > 0 || balance.CosmicToken > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {balance.ETH > 0 && (
                <Card glass className="p-6">
                  <p className="text-sm text-text-secondary mb-2">ETH Balance</p>
                  <p className="font-mono text-3xl font-bold text-primary">
                    {balance.ETH.toFixed(6)} ETH
                  </p>
                </Card>
              )}
              {balance.CosmicToken > 0 && (
                <Card glass className="p-6">
                  <p className="text-sm text-text-secondary mb-2">
                    Cosmic Signature Tokens Balance
                  </p>
                  <p className="font-mono text-3xl font-bold text-status-warning">
                    {balance.CosmicToken.toFixed(2)} CST
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* User Statistics */}
          <Card glass className="p-8">
            <div className="space-y-1">
              <StatItem title="Number of Bids" value={userInfo.NumBids} />
              <StatItem
                title="Number of Cosmic Signature Transfers"
                value={userInfo.CosmicSignatureNumTransfers}
              />
              {userInfo.CosmicTokenNumTransfers !== undefined && (
                <StatItem
                  title="Number of Cosmic Signature Token Transfers"
                  value={userInfo.CosmicTokenNumTransfers}
                />
              )}
              <StatItem
                title="Maximum Bid Amount"
                value={`${userInfo.MaxBidAmount.toFixed(6)} ETH`}
              />
              <StatItem title="Number of Prizes Taken" value={userInfo.NumPrizes} />
              <StatItem
                title="Maximum Amount Gained (in prize winnings)"
                value={`${userInfo.MaxWinAmount.toFixed(6)} ETH`}
              />
              <StatItem
                title="Amount of Winnings in ETH raffles"
                value={`${userInfo.SumRaffleEthWinnings.toFixed(6)} ETH`}
              />
              <StatItem
                title="Amount Withdrawn from ETH raffles"
                value={`${userInfo.SumRaffleEthWithdrawal.toFixed(6)} ETH`}
              />
              <StatItem title="Unclaimed Donated NFTs" value={userInfo.UnclaimedNFTs} />
              <StatItem
                title="Total ETH Won in raffles"
                value={`${(
                  userInfo.SumRaffleEthWinnings + userInfo.SumRaffleEthWithdrawal
                ).toFixed(6)} ETH`}
              />
              <StatItem
                title="Number of (ETH) raffles Participated in"
                value={userInfo.NumRaffleEthWinnings}
              />
              <StatItem
                title="Raffle NFTs Count (Raffle Mints)"
                value={userInfo.RaffleNFTsCount}
              />
              <StatItem
                title="Reward NFTs Count (All Mints)"
                value={userInfo.RewardNFTsCount}
              />
              <StatItem
                title="Number of Cosmic Signature Tokens Won"
                value={userInfo.TotalCSTokensWon}
              />
              
              {/* Raffle Probabilities */}
              {dashboardData && !(dashboardData.CurRoundNum > 0 && dashboardData.TsRoundStart === 0) && (
                <>
                  <StatItem
                    title="Probability of Winning ETH"
                    value={`${(raffleETHProbability * 100).toFixed(2)}%`}
                  />
                  <StatItem
                    title="Probability of Winning NFT"
                    value={`${(raffleNFTProbability * 100).toFixed(2)}%`}
                  />
                </>
              )}
            </div>

            {/* Transfer Links */}
            <div className="mt-6 pt-6 border-t border-text-muted/10 space-y-2 text-sm text-text-secondary">
              {userInfo.CosmicTokenNumTransfers !== undefined && (
                <p>
                  This account has {userInfo.CosmicTokenNumTransfers} CosmicToken (ERC20) transfers.{" "}
                  <Link
                    href={`/cosmic-token-transfer/${address}`}
                    className="text-primary hover:underline"
                  >
                    View all transfers →
                  </Link>
                </p>
              )}
              <p>
                This account has {userInfo.CosmicSignatureNumTransfers} CosmicSignature (ERC721) transfers.{" "}
                <Link
                  href={`/cosmic-signature-transfer/${address}`}
                  className="text-primary hover:underline"
                >
                  View all transfers →
                </Link>
              </p>
            </div>
          </Card>
        </Container>
      </section>

      {/* Staking Statistics */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <h2 className="heading-md mb-6">Staking Statistics</h2>

          {/* Staking Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setStakingTab("cst")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                stakingTab === "cst"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10"
              }`}
            >
              Cosmic Signature Staking
            </button>
            <button
              onClick={() => setStakingTab("rwlk")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                stakingTab === "rwlk"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10"
              }`}
            >
              RandomWalk Staking
            </button>
          </div>

          {/* CST Staking Tab */}
          {stakingTab === "cst" && (
            <div className="space-y-6">
              <Card glass className="p-8">
                <div className="text-center py-12">
                  <p className="text-text-secondary mb-2">CST staking statistics are not available from the API</p>
                  <p className="text-sm text-text-muted">Please check the staking actions table below for details</p>
                </div>
              </Card>

              {/* CST Staking Actions */}
              {stakingCSTActions.length > 0 && (
                <div>
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Stake / Unstake Actions
                  </h3>
                  <Card glass className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-background-elevated border-b border-text-muted/10">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                              Date
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              Action
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              Token ID
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              # NFTs Staked
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stakingCSTActions
                            .slice((cstStakingActionsPage - 1) * itemsPerPage, cstStakingActionsPage * itemsPerPage)
                            .map((action: StakingAction, index: number) => (
                            <tr
                              key={`${action.RecordId}-${action.ActionId}-${index}`}
                              className={`border-b border-text-muted/5 ${
                                index % 2 === 0 ? "bg-background-surface/30" : ""
                              }`}
                            >
                              <td className="px-6 py-4 text-sm text-text-secondary">
                                {formatTimestamp(action.Tx.TimeStamp)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant={action.ActionType === 1 ? "warning" : "success"}>
                                  {action.ActionType === 1 ? "Unstake" : "Stake"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Link href={`/gallery/${action.TokenId}`}>
                                  <span className="font-mono text-primary hover:text-primary/80">
                                    #{action.TokenId}
                                  </span>
                                </Link>
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-text-primary text-sm">
                                {action.NumStakedNFTs}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={cstStakingActionsPage}
                      totalItems={stakingCSTActions.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCstStakingActionsPage}
                    />
                  </Card>
                </div>
              )}

              {/* CST Staking Rewards */}
              {cstStakingRewards.length > 0 && (
                <div>
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Staking Rewards by Token
                  </h3>
                  <Card glass className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-background-elevated border-b border-text-muted/10">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                              Token ID
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                              Total Reward
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                              Claimed
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                              Unclaimed
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {cstStakingRewards
                            .slice((cstStakingRewardsPage - 1) * itemsPerPage, cstStakingRewardsPage * itemsPerPage)
                            .map((reward: StakingReward, index: number) => (
                            <tr
                              key={reward.TokenId}
                              className={`border-b border-text-muted/5 ${
                                index % 2 === 0 ? "bg-background-surface/30" : ""
                              }`}
                            >
                              <td className="px-6 py-4">
                                <Link href={`/gallery/${reward.TokenId}`}>
                                  <span className="font-mono text-primary hover:text-primary/80">
                                    #{reward.TokenId}
                                  </span>
                                </Link>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-text-primary text-sm">
                                {((reward.RewardCollectedEth || 0) + (reward.RewardToCollectEth || 0)).toFixed(6)}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-status-success text-sm">
                                {(reward.RewardCollectedEth || 0).toFixed(6)}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-status-warning text-sm">
                                {(reward.RewardToCollectEth || 0).toFixed(6)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={cstStakingRewardsPage}
                      totalItems={cstStakingRewards.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCstStakingRewardsPage}
                    />
                  </Card>
                </div>
              )}

              {/* Collected Staking Rewards */}
              {collectedCstStakingRewards.length > 0 && (
                <div>
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Collected Staking Rewards
                  </h3>
                  <Card glass className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-background-elevated border-b border-text-muted/10">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                              Date
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              Round
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              Tokens Staked
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              Collected
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                              Reward (ETH)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {collectedCstStakingRewards
                            .slice((collectedRewardsPage - 1) * itemsPerPage, collectedRewardsPage * itemsPerPage)
                            .map((reward: CollectedStakingReward, index: number) => (
                            <tr
                              key={`${reward.DepositId}-${index}`}
                              className={`border-b border-text-muted/5 ${
                                index % 2 === 0 ? "bg-background-surface/30" : ""
                              }`}
                            >
                              <td className="px-6 py-4 text-sm text-text-secondary">
                                {formatTimestamp(reward.DepositTimeStamp)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant="default">Round {reward.RoundNum}</Badge>
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-text-primary">
                                {reward.YourTokensStaked} / {reward.NumStakedNFTs}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {reward.FullyClaimed ? (
                                  <Badge variant="success">Fully Claimed</Badge>
                                ) : (
                                  <Badge variant="info">{reward.NumTokensCollected} tokens</Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-status-success">
                                {reward.YourCollectedAmountEth.toFixed(7)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={collectedRewardsPage}
                      totalItems={collectedCstStakingRewards.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCollectedRewardsPage}
                    />
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* RWLK Staking Tab */}
          {stakingTab === "rwlk" && (
            <div className="space-y-6">
              {userInfo.StakingStatisticsRWalk ? (
                <Card glass className="p-8">
                  <div className="space-y-1">
                    <StatItem
                      title="Number of Active Stakers"
                      value={userInfo.StakingStatisticsRWalk.NumActiveStakers}
                    />
                    <StatItem
                      title="Total Number of Stake Actions"
                      value={userInfo.StakingStatisticsRWalk.TotalNumStakeActions}
                    />
                    <StatItem
                      title="Total Number of Unstake Actions"
                      value={userInfo.StakingStatisticsRWalk.TotalNumUnstakeActions}
                    />
                    <StatItem
                      title="Total Tokens Minted"
                      value={userInfo.StakingStatisticsRWalk.TotalTokensMinted}
                    />
                    <StatItem
                      title="Total Tokens Staked"
                      value={userInfo.StakingStatisticsRWalk.TotalTokensStaked}
                    />
                  </div>
                </Card>
              ) : (
                <Card glass className="p-8">
                  <div className="text-center py-12">
                    <p className="text-text-secondary">No RandomWalk staking statistics available</p>
                  </div>
                </Card>
              )}

              {/* RWLK Staking Actions */}
              {stakingRWLKActions.length > 0 && (
                <div>
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Stake / Unstake Actions
                  </h3>
                  <Card glass className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-background-elevated border-b border-text-muted/10">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                              Date
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              Action
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              Token ID
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              # NFTs Staked
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stakingRWLKActions
                            .slice((rwlkStakingActionsPage - 1) * itemsPerPage, rwlkStakingActionsPage * itemsPerPage)
                            .map((action: StakingAction, index: number) => (
                            <tr
                              key={`${action.RecordId}-${action.ActionId}-${index}`}
                              className={`border-b border-text-muted/5 ${
                                index % 2 === 0 ? "bg-background-surface/30" : ""
                              }`}
                            >
                              <td className="px-6 py-4 text-sm text-text-secondary">
                                {formatTimestamp(action.Tx.TimeStamp)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant={action.ActionType === 1 ? "warning" : "success"}>
                                  {action.ActionType === 1 ? "Unstake" : "Stake"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-text-primary">
                                #{action.TokenId}
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-text-primary text-sm">
                                {action.NumStakedNFTs}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={rwlkStakingActionsPage}
                      totalItems={stakingRWLKActions.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setRwlkStakingActionsPage}
                    />
                  </Card>
                </div>
              )}

              {/* RWLK Minted Rewards */}
              {rwlkMints.length > 0 && (
                <div>
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Staking Reward Tokens
                  </h3>
                  <Card glass className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-background-elevated border-b border-text-muted/10">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                              Date
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              Token ID
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              Round
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rwlkMints
                            .slice((rwlkMintsPage - 1) * itemsPerPage, rwlkMintsPage * itemsPerPage)
                            .map((mint: RWLKMint, index: number) => (
                            <tr
                              key={`${mint.TokenId}-${mint.RoundNum}-${index}`}
                              className={`border-b border-text-muted/5 ${
                                index % 2 === 0 ? "bg-background-surface/30" : ""
                              }`}
                            >
                              <td className="px-6 py-4 text-sm text-text-secondary">
                                {formatTimestamp(mint.TimeStamp)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Link href={`/gallery/${mint.TokenId}`}>
                                  <span className="font-mono text-primary hover:text-primary/80">
                                    #{mint.TokenId}
                                  </span>
                                </Link>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant="default">Round {mint.RoundNum}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={rwlkMintsPage}
                      totalItems={rwlkMints.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setRwlkMintsPage}
                    />
                  </Card>
                </div>
              )}
            </div>
          )}
        </Container>
      </section>

      {/* Bid History */}
      {bidHistory.length > 0 && (
        <section className="py-12">
          <Container>
            <h2 className="heading-md mb-6">Bid History</h2>
            <Card glass className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-elevated border-b border-text-muted/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                        Date
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Round
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Type
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                        Price
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        TX
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bidHistory
                      .slice((bidHistoryPage - 1) * itemsPerPage, bidHistoryPage * itemsPerPage)
                      .map((bid: Bid, index: number) => (
                      <tr
                        key={`${bid.EvtLogId}-${bid.RoundNum}-${index}`}
                        className={`border-b border-text-muted/5 ${
                          index % 2 === 0 ? "bg-background-surface/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {formatTimestamp(bid.TimeStamp)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="default">Round {bid.RoundNum}</Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={bid.BidType === 0 ? "default" : "warning"}>
                            {bid.BidType === 0 ? "ETH" : "CST"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-text-primary text-sm">
                          {bid.BidPriceEth?.toFixed(6)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <a
                            href={`https://sepolia.arbiscan.io/tx/${bid.TxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-primary hover:text-primary/80"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={bidHistoryPage}
                totalItems={bidHistory.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setBidHistoryPage}
              />
            </Card>
          </Container>
        </section>
      )}

      {/* Owned Cosmic Signature Tokens */}
      {cstList.length > 0 && (
        <section className="py-12 bg-background-surface/50">
          <Container>
            <h2 className="heading-md mb-6">
              Cosmic Signature Tokens You Own ({cstList.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cstList.map((token: CSTToken) => (
                <Link
                  key={token.TokenId}
                  href={`/gallery/${token.TokenId}`}
                  className="block"
                >
                  <Card glass hover className="p-4 text-center">
                    <p className="font-mono text-lg font-semibold text-primary">
                      #{token.TokenId}
                    </p>
                    {token.TokenName && (
                      <p className="text-xs text-text-secondary mt-1 truncate">
                        {token.TokenName}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Winning History */}
      {claimHistory.length > 0 && (
        <section className="py-12">
          <Container>
            <h2 className="heading-md mb-6">History of Winnings</h2>
            <Card glass className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-elevated border-b border-text-muted/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                        Date
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Round
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                        Type
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimHistory
                      .slice((claimHistoryPage - 1) * itemsPerPage, claimHistoryPage * itemsPerPage)
                      .map((claim: ClaimHistory, index: number) => (
                      <tr
                        key={`${claim.EvtLogId}-${claim.RoundNum}-${index}`}
                        className={`border-b border-text-muted/5 ${
                          index % 2 === 0 ? "bg-background-surface/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {formatTimestamp(claim.TimeStamp)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="default">Round {claim.RoundNum}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-primary">
                          {claim.Description || "Prize"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-text-primary">
                          {claim.PrizeAmount ? `${(claim.PrizeAmount / 1e18).toFixed(6)} ETH` : "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="success">Claimed</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={claimHistoryPage}
                totalItems={claimHistory.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setClaimHistoryPage}
              />
            </Card>
          </Container>
        </section>
      )}

      {/* Marketing Rewards */}
      {marketingRewards.length > 0 && (
        <section className="py-12 bg-background-surface/50">
          <Container>
            <h2 className="heading-md mb-6">Marketing Rewards</h2>
            <Card glass className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-elevated border-b border-text-muted/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                        Date
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Round
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                        Reward (CST)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketingRewards
                      .slice((marketingRewardsPage - 1) * itemsPerPage, marketingRewardsPage * itemsPerPage)
                      .map((reward: MarketingReward, index: number) => (
                      <tr
                        key={`${reward.EvtLogId}-${reward.RoundNum}-${index}`}
                        className={`border-b border-text-muted/5 ${
                          index % 2 === 0 ? "bg-background-surface/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {formatTimestamp(reward.TimeStamp)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="default">Round {reward.RoundNum}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-status-warning">
                          {(reward.AmountEth / 1e18).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={marketingRewardsPage}
                totalItems={marketingRewards.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setMarketingRewardsPage}
              />
            </Card>
          </Container>
        </section>
      )}

      {/* Donated NFTs */}
      {donatedNFTs.length > 0 && (
        <section className="py-12">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-md">Donated NFTs You Won</h2>
              {unclaimedNFTs.length > 0 && (
                <Button
                  onClick={handleClaimAllNFTs}
                  disabled={prizesWallet.isTransactionPending || claimingNFT === -1}
                >
                  {claimingNFT === -1 ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Claiming...
                    </>
                  ) : (
                    `Claim All (${unclaimedNFTs.length})`
                  )}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {donatedNFTs.map((nft: DonatedNFT, index: number) => (
                <Card 
                  key={`${nft.Index}-${nft.TokenId}-${nft.RoundNum}-${index}`} 
                  glass 
                  className={`p-6 ${nft.Claimed ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono text-lg font-semibold text-text-primary">
                      Token #{nft.TokenId}
                    </h3>
                    {nft.Claimed ? (
                      <Badge variant="success">Claimed</Badge>
                    ) : (
                      <Badge variant="warning">Unclaimed</Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Round</span>
                      <span className="text-text-primary">{nft.RoundNum}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Date</span>
                      <span className="text-text-primary text-xs">
                        {new Date(safeTimestamp(nft)).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {!nft.Claimed && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleClaimNFT(nft.Index)}
                      disabled={prizesWallet.isTransactionPending || claimingNFT === nft.Index}
                    >
                      {claimingNFT === nft.Index ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" size={14} />
                          Claiming...
                        </>
                      ) : (
                        'Claim NFT'
                      )}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Donated ERC20 Tokens */}
      {donatedERC20.length > 0 && (
        <section className="py-12 bg-background-surface/50">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-md">Donated ERC20 Tokens</h2>
              {unclaimedERC20.length > 0 && (
                <Button 
                  onClick={handleClaimAllERC20}
                  disabled={prizesWallet.isTransactionPending || claimingERC20 === -1}
                >
                  {claimingERC20 === -1 ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Claiming...
                    </>
                  ) : (
                    `Claim All (${unclaimedERC20.length})`
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {donatedERC20.map((token: DonatedERC20, index: number) => (
                <Card key={`${token.RoundNum}-${token.TokenAddr}-${index}`} glass className={`p-6 ${token.Claimed ? "opacity-50" : ""}`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-mono text-xl font-semibold text-text-primary">
                          {token.DonateClaimDiffEth.toLocaleString(undefined, { maximumFractionDigits: 6 })} Tokens
                        </h3>
                        {token.Claimed ? (
                          <Badge variant="success">Claimed</Badge>
                        ) : (
                          <Badge variant="warning">Unclaimed</Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">
                        Round {token.RoundNum} • {formatTimestamp(token.Tx.TimeStamp)}
                      </p>
                      <p className="text-xs text-text-muted font-mono mt-1">
                        {token.TokenAddr.substring(0, 10)}...{token.TokenAddr.slice(-8)}
                      </p>
                    </div>
                    {!token.Claimed && (
                      <Button
                        size="sm"
                        onClick={() => handleClaimERC20(token)}
                        disabled={prizesWallet.isTransactionPending || claimingERC20 === token.RoundNum}
                      >
                        {claimingERC20 === token.RoundNum ? (
                          <>
                            <Loader2 className="mr-2 animate-spin" size={14} />
                            Claiming...
                          </>
                        ) : (
                          'Claim'
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}


"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Loader2, 
  ExternalLink, 
  Trophy,
  AlertCircle
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import { api } from "@/services/api";
import { formatEther, isAddress } from "viem";
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
  ActionId: number;
  TokenId: number;
  RoundNum: number;
  TimeStamp: number;
  IsUnstake: boolean;
}

interface StakingReward {
  TokenId: number;
  TotalRewardEth: number;
  ClaimedRewardEth: number;
  UnclaimedRewardEth: number;
}

interface CollectedStakingReward {
  ActionId: number;
  TokenId: number;
  RoundNum: number;
  RewardAmountEth: number;
  TimeStamp: number;
}

interface RWLKMint {
  TokenId: number;
  RoundNum: number;
  TimeStamp: number;
}

interface DonatedNFT {
  Index: number;
  NftAddr: string;
  TokenId: number;
  RoundNum: number;
  TimeStamp: number;
  Claimed: boolean;
}

interface DonatedERC20 {
  RoundNum: number;
  TokenAddr: string;
  TokenSymbol: string;
  AmountEth: string;
  TimeStamp: number;
  Claimed: boolean;
}

interface DashboardData {
  CurRoundNum: number;
  TsRoundStart: number;
  NumRaffleEthWinnersBidding?: number;
  NumRaffleNFTWinnersBidding?: number;
}

interface UserInfo {
  Address: string;
  NumBids: number;
  CosmicSignatureNumTransfers: number;
  CosmicTokenNumTransfers: number;
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
  StakingStatistics: {
    CSTStakingInfo: {
      NumActiveStakers: number;
      NumDeposits: number;
      TotalNumStakeActions: number;
      TotalNumUnstakeActions: number;
      TotalRewardEth: number;
      UnclaimedRewardEth: number;
      TotalTokensMinted: number;
      TotalTokensStaked: number;
    };
    RWalkStakingInfo: {
      NumActiveStakers: number;
      TotalNumStakeActions: number;
      TotalNumUnstakeActions: number;
      TotalTokensMinted: number;
      TotalTokensStaked: number;
    };
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

export default function UserStatisticsPage({ params }: { params: { address: string } }) {
  const userAddress = params.address;
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [balance, setBalance] = useState({ CosmicToken: 0, ETH: 0 });
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [raffleETHProbability, setRaffleETHProbability] = useState(0);
  const [raffleNFTProbability, setRaffleNFTProbability] = useState(0);
  const [invalidAddress, setInvalidAddress] = useState(false);
  
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

  const fetchUserData = useCallback(async () => {
    // Validate address
    if (!userAddress || !isAddress(userAddress)) {
      setInvalidAddress(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setInvalidAddress(false);

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
        api.getClaimHistoryByUser(userAddress),
        api.getUserInfo(userAddress),
        api.getUserBalance(userAddress),
        api.getStakingCSTActionsByUser(userAddress),
        api.getStakingRWLKActionsByUser(userAddress),
        api.getMarketingRewardsByUser(userAddress),
        api.getCSTTokensByUser(userAddress),
        api.getStakingRewardsByUser(userAddress),
        api.getStakingCSTRewardsCollected(userAddress),
        api.getStakingRWLKMintsByUser(userAddress),
        api.getUnclaimedDonatedNFTsByUser(userAddress),
        api.getClaimedDonatedNFTsByUser(userAddress),
        api.getERC20DonationsByUser(userAddress),
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
      setMarketingRewards(mRewards);
      setCSTList(userCstList);
      setCstStakingRewards(stakingRewards);
      setCollectedCstStakingRewards(collectedRewards);
      setRWLKMints(rwalkMinted);
      setDonatedNFTs([...unclaimedNFTs, ...claimedNFTs]);
      setDonatedERC20(erc20Tokens);
      setDashboardData(dashData);

      // Calculate raffle probabilities
      if (dashData && dashData.CurRoundNum > 0) {
        const bidList = await api.getBidListByRound(dashData.CurRoundNum, "desc");
        const totalBids = bidList.length;
        const userBids = bidList.filter((bid: Bid) => bid.BidderAddr === userAddress).length;

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
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (invalidAddress) {
    return (
      <div className="min-h-screen">
        <section className="section-padding bg-background-surface/50">
          <Container>
            <Breadcrumbs
              items={[
                { label: "User Statistics", href: "/game/statistics" },
                { label: "Invalid Address" },
              ]}
              className="mb-8"
            />
            <Card glass className="p-12 text-center">
              <AlertCircle className="mx-auto mb-4 text-status-error" size={64} />
              <h1 className="heading-sm mb-4">Invalid Address</h1>
              <p className="text-text-secondary mb-6">
                The provided address is not a valid Ethereum address.
              </p>
              <Button asChild>
                <Link href="/game/statistics">Back to Game Statistics</Link>
              </Button>
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
            <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
            <p className="text-text-secondary">Loading user statistics...</p>
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
                { label: "User Statistics", href: "/game/statistics" },
                { label: "No Activity" },
              ]}
              className="mb-8"
            />
            <Card glass className="p-12 text-center">
              <Trophy className="mx-auto mb-4 text-text-muted" size={64} />
              <h1 className="heading-sm mb-4">No Activity Yet</h1>
              <p className="text-text-secondary mb-6">
                This address hasn&apos;t participated in Cosmic Signature yet.
              </p>
              <AddressDisplay address={userAddress} showCopy={true} className="mb-6" />
              <Button asChild>
                <Link href="/game/play">View Game</Link>
              </Button>
            </Card>
          </Container>
        </section>
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
              { label: "Game Statistics", href: "/game/statistics" },
              { label: "User Statistics" },
            ]}
            className="mb-8"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="heading-xl mb-4">User Statistics</h1>
            <p className="body-lg mb-6">
              Comprehensive performance tracking and detailed activity history
            </p>
            <AddressDisplay address={userAddress} showCopy={true} />
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
              <StatItem
                title="Number of Cosmic Signature Token Transfers"
                value={userInfo.CosmicTokenNumTransfers}
              />
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
              <p>
                This account has {userInfo.CosmicTokenNumTransfers} CosmicToken (ERC20) transfers.{" "}
                <Link
                  href={`/cosmic-token-transfer/${userAddress}`}
                  className="text-primary hover:underline"
                >
                  View all transfers →
                </Link>
              </p>
              <p>
                This account has {userInfo.CosmicSignatureNumTransfers} CosmicSignature (ERC721) transfers.{" "}
                <Link
                  href={`/cosmic-signature-transfer/${userAddress}`}
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
                <div className="space-y-1">
                  <StatItem
                    title="Number of Active Stakers"
                    value={userInfo.StakingStatistics.CSTStakingInfo.NumActiveStakers}
                  />
                  <StatItem
                    title="Number of Deposits"
                    value={userInfo.StakingStatistics.CSTStakingInfo.NumDeposits}
                  />
                  <StatItem
                    title="Total Number of Stake Actions"
                    value={userInfo.StakingStatistics.CSTStakingInfo.TotalNumStakeActions}
                  />
                  <StatItem
                    title="Total Number of Unstake Actions"
                    value={userInfo.StakingStatistics.CSTStakingInfo.TotalNumUnstakeActions}
                  />
                  <StatItem
                    title="Total Rewards"
                    value={`${userInfo.StakingStatistics.CSTStakingInfo.TotalRewardEth.toFixed(
                      6
                    )} ETH`}
                  />
                  <StatItem
                    title="Unclaimed Rewards"
                    value={`${userInfo.StakingStatistics.CSTStakingInfo.UnclaimedRewardEth.toFixed(
                      6
                    )} ETH`}
                  />
                  <StatItem
                    title="Total Tokens Minted"
                    value={userInfo.StakingStatistics.CSTStakingInfo.TotalTokensMinted}
                  />
                  <StatItem
                    title="Total Tokens Staked"
                    value={userInfo.StakingStatistics.CSTStakingInfo.TotalTokensStaked}
                  />
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
                              Round
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stakingCSTActions.slice(0, 20).map((action: StakingAction, index: number) => (
                            <tr
                              key={action.ActionId}
                              className={`border-b border-text-muted/5 ${
                                index % 2 === 0 ? "bg-background-surface/30" : ""
                              }`}
                            >
                              <td className="px-6 py-4 text-sm text-text-secondary">
                                {formatTimestamp(action.TimeStamp)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant={action.IsUnstake ? "warning" : "success"}>
                                  {action.IsUnstake ? "Unstake" : "Stake"}
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
                                {action.RoundNum}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                          {cstStakingRewards.map((reward: StakingReward, index: number) => (
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
                                {(reward.TotalRewardEth || 0).toFixed(6)}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-status-success text-sm">
                                {(reward.ClaimedRewardEth || 0).toFixed(6)}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-status-warning text-sm">
                                {(reward.UnclaimedRewardEth || 0).toFixed(6)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                              Token ID
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                              Round
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                              Reward (ETH)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {collectedCstStakingRewards.slice(0, 20).map((reward: CollectedStakingReward, index: number) => (
                            <tr
                              key={`${reward.ActionId}-${index}`}
                              className={`border-b border-text-muted/5 ${
                                index % 2 === 0 ? "bg-background-surface/30" : ""
                              }`}
                            >
                              <td className="px-6 py-4 text-sm text-text-secondary">
                                {formatTimestamp(reward.TimeStamp)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Link href={`/gallery/${reward.TokenId}`}>
                                  <span className="font-mono text-primary hover:text-primary/80">
                                    #{reward.TokenId}
                                  </span>
                                </Link>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant="default">Round {reward.RoundNum}</Badge>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-status-success">
                                {reward.RewardAmountEth.toFixed(7)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* RWLK Staking Tab */}
          {stakingTab === "rwlk" && (
            <div className="space-y-6">
              <Card glass className="p-8">
                <div className="space-y-1">
                  <StatItem
                    title="Number of Active Stakers"
                    value={userInfo.StakingStatistics.RWalkStakingInfo.NumActiveStakers}
                  />
                  <StatItem
                    title="Total Number of Stake Actions"
                    value={userInfo.StakingStatistics.RWalkStakingInfo.TotalNumStakeActions}
                  />
                  <StatItem
                    title="Total Number of Unstake Actions"
                    value={userInfo.StakingStatistics.RWalkStakingInfo.TotalNumUnstakeActions}
                  />
                  <StatItem
                    title="Total Tokens Minted"
                    value={userInfo.StakingStatistics.RWalkStakingInfo.TotalTokensMinted}
                  />
                  <StatItem
                    title="Total Tokens Staked"
                    value={userInfo.StakingStatistics.RWalkStakingInfo.TotalTokensStaked}
                  />
                </div>
              </Card>

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
                              Round
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stakingRWLKActions.slice(0, 20).map((action: StakingAction, index: number) => (
                            <tr
                              key={action.ActionId}
                              className={`border-b border-text-muted/5 ${
                                index % 2 === 0 ? "bg-background-surface/30" : ""
                              }`}
                            >
                              <td className="px-6 py-4 text-sm text-text-secondary">
                                {formatTimestamp(action.TimeStamp)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge variant={action.IsUnstake ? "warning" : "success"}>
                                  {action.IsUnstake ? "Unstake" : "Stake"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-text-primary">
                                #{action.TokenId}
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-text-primary text-sm">
                                {action.RoundNum}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                          {rwlkMints.map((mint: RWLKMint, index: number) => (
                            <tr
                              key={mint.TokenId}
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
                    {bidHistory.slice(0, 50).map((bid: Bid, index: number) => (
                      <tr
                        key={bid.EvtLogId}
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
            </Card>
          </Container>
        </section>
      )}

      {/* Owned Cosmic Signature Tokens */}
      {cstList.length > 0 && (
        <section className="py-12 bg-background-surface/50">
          <Container>
            <h2 className="heading-md mb-6">
              Cosmic Signature Tokens Owned ({cstList.length})
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
                    {claimHistory.slice(0, 50).map((claim: ClaimHistory, index: number) => (
                      <tr
                        key={claim.EvtLogId}
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
                    {marketingRewards.map((reward: MarketingReward, index: number) => (
                      <tr
                        key={reward.EvtLogId}
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
            </Card>
          </Container>
        </section>
      )}

      {/* Donated NFTs - View Only */}
      {donatedNFTs.length > 0 && (
        <section className="py-12">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-md">Donated NFTs</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {donatedNFTs.map((nft: DonatedNFT) => (
                <Card 
                  key={nft.Index} 
                  glass 
                  className={`p-6 ${nft.Claimed ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy size={20} className={nft.Claimed ? "text-text-muted" : "text-status-info"} />
                      <h3 className="font-serif text-lg font-semibold text-text-primary">
                        Token #{nft.TokenId}
                      </h3>
                    </div>
                    {nft.Claimed ? (
                      <Badge variant="success">Claimed</Badge>
                    ) : (
                      <Badge variant="warning">Unclaimed</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Round</span>
                      <Link href={`/game/history/rounds/${nft.RoundNum}`}>
                        <span className="text-primary hover:text-primary/80">
                          {nft.RoundNum}
                        </span>
                      </Link>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Date</span>
                      <span className="text-text-primary">
                        {new Date(safeTimestamp(nft)).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Contract</span>
                      <span className="font-mono text-xs text-text-muted">
                        {nft.NftAddr.substring(0, 6)}...{nft.NftAddr.slice(-4)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Donated ERC20 Tokens - View Only */}
      {donatedERC20.length > 0 && (
        <section className="py-12 bg-background-surface/50">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-md">Donated ERC20 Tokens</h2>
            </div>

            <div className="space-y-3">
              {donatedERC20.map((token: DonatedERC20, index: number) => (
                <Card key={index} glass className={`p-6 ${token.Claimed ? "opacity-50" : ""}`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-mono text-xl font-semibold text-text-primary">
                          {(parseFloat(token.AmountEth) / 1e18).toLocaleString()} {token.TokenSymbol}
                        </h3>
                        {token.Claimed ? (
                          <Badge variant="success">Claimed</Badge>
                        ) : (
                          <Badge variant="warning">Unclaimed</Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">
                        Round {token.RoundNum} • {formatTimestamp(token.TimeStamp)}
                      </p>
                    </div>
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


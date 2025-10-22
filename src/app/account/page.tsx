"use client";

import { motion } from "framer-motion";
import { Trophy, Gem, Award, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/game/StatCard";
import { NFTCard } from "@/components/nft/NFTCard";
import { Timeline } from "@/components/data/Timeline";
import { AlertCard } from "@/components/features/AlertCard";
import { MOCK_USER_ACTIVITIES } from "@/lib/mockData/activities";
import { MOCK_NFTS } from "@/lib/constants";
import { formatEth } from "@/lib/utils";
import api from "@/services/api";

// API response type for user winnings
interface UserWinningsAPI {
  DonatedERC20Tokens: Array<{
    TokenAddress: string;
    TokenSymbol: string;
    Amount: string;
  }>;
  ETHRaffleToClaim: number;
  ETHRaffleToClaimWei: string;
  NumDonatedNFTToClaim: number;
  UnclaimedStakingReward: number;
}

// API response type for user info
interface UserInfoAPI {
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
}

// Default winnings data (when not connected or loading)
const DEFAULT_WINNINGS: UserWinningsAPI = {
  DonatedERC20Tokens: [],
  ETHRaffleToClaim: 0,
  ETHRaffleToClaimWei: "0",
  NumDonatedNFTToClaim: 0,
  UnclaimedStakingReward: 0,
};

// Default user info
const DEFAULT_USER_INFO: UserInfoAPI = {
  Address: "",
  NumBids: 0,
  CosmicSignatureNumTransfers: 0,
  CosmicTokenNumTransfers: 0,
  MaxBidAmount: 0,
  NumPrizes: 0,
  MaxWinAmount: 0,
  SumRaffleEthWinnings: 0,
  SumRaffleEthWithdrawal: 0,
  UnclaimedNFTs: 0,
  NumRaffleEthWinnings: 0,
  RaffleNFTsCount: 0,
  RewardNFTsCount: 0,
  TotalCSTokensWon: 0,
};

export default function AccountDashboardPage() {
  const { address, isConnected } = useAccount();
  const [userInfo, setUserInfo] = useState<UserInfoAPI>(DEFAULT_USER_INFO);
  const [winnings, setWinnings] = useState<UserWinningsAPI>(DEFAULT_WINNINGS);
  const [isLoadingWinnings, setIsLoadingWinnings] = useState(false);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);
  const recentActivities = MOCK_USER_ACTIVITIES.slice(0, 5);
  const userNFTs = MOCK_NFTS.slice(0, 6); // Preview of user's NFTs

  // Fetch user info from API when wallet is connected
  useEffect(() => {
    async function fetchUserInfo() {
      if (!address || !isConnected) {
        setUserInfo(DEFAULT_USER_INFO);
        return;
      }

      try {
        setIsLoadingUserInfo(true);
        const data = await api.getUserInfo(address);
        console.log("User info data:", data);
        if (data && data.UserInfo) {
          const userInfoData = data.UserInfo;
          setUserInfo({
            Address: userInfoData.Address || address,
            NumBids: userInfoData.NumBids || 0,
            CosmicSignatureNumTransfers: userInfoData.CosmicSignatureNumTransfers || 0,
            CosmicTokenNumTransfers: userInfoData.CosmicTokenNumTransfers || 0,
            MaxBidAmount: userInfoData.MaxBidAmount || 0,
            NumPrizes: userInfoData.NumPrizes || 0,
            MaxWinAmount: userInfoData.MaxWinAmount || 0,
            SumRaffleEthWinnings: userInfoData.SumRaffleEthWinnings || 0,
            SumRaffleEthWithdrawal: userInfoData.SumRaffleEthWithdrawal || 0,
            UnclaimedNFTs: userInfoData.UnclaimedNFTs || 0,
            NumRaffleEthWinnings: userInfoData.NumRaffleEthWinnings || 0,
            RaffleNFTsCount: userInfoData.RaffleNFTsCount || 0,
            RewardNFTsCount: userInfoData.RewardNFTsCount || 0,
            TotalCSTokensWon: userInfoData.TotalCSTokensWon || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        setUserInfo(DEFAULT_USER_INFO);
      } finally {
        setIsLoadingUserInfo(false);
      }
    }

    fetchUserInfo();
  }, [address, isConnected]);

  // Fetch user winnings from API when wallet is connected
  useEffect(() => {
    async function fetchWinnings() {
      if (!address || !isConnected) {
        setWinnings(DEFAULT_WINNINGS);
        return;
      }

      try {
        setIsLoadingWinnings(true);
        const data = await api.getUserWinnings(address);

        if (data) {
          setWinnings({
            DonatedERC20Tokens: data.DonatedERC20Tokens || [],
            ETHRaffleToClaim: data.ETHRaffleToClaim || 0,
            ETHRaffleToClaimWei: data.ETHRaffleToClaimWei || "0",
            NumDonatedNFTToClaim: data.NumDonatedNFTToClaim || 0,
            UnclaimedStakingReward: data.UnclaimedStakingReward || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user winnings:", error);
        setWinnings(DEFAULT_WINNINGS);
      } finally {
        setIsLoadingWinnings(false);
      }
    }

    fetchWinnings();
  }, [address, isConnected]);

  const hasUnclaimedPrizes =
    winnings.ETHRaffleToClaim > 0 ||
    winnings.UnclaimedStakingReward > 0 ||
    winnings.DonatedERC20Tokens.length > 0 ||
    winnings.NumDonatedNFTToClaim > 0;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h1 className="heading-lg mb-2">
                  Welcome back, {isConnected ? "Collector" : "Guest"}
                </h1>
                <p className="text-text-secondary">
                  {isConnected
                    ? `${userInfo.NumBids} bids placed • ${userInfo.NumPrizes} prizes won`
                    : "Connect your wallet to view your stats"}
                </p>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Alert Section */}
      {hasUnclaimedPrizes && (
        <section className="py-8">
          <Container>
            <AlertCard
              severity="warning"
              title="You have prizes to claim"
              description={`${formatEth(
                winnings.ETHRaffleToClaim + winnings.UnclaimedStakingReward
              )} ETH${
                winnings.DonatedERC20Tokens.length > 0
                  ? ` + ${winnings.DonatedERC20Tokens.length} ERC-20 token${
                      winnings.DonatedERC20Tokens.length > 1 ? "s" : ""
                    }`
                  : ""
              }${
                winnings.NumDonatedNFTToClaim > 0
                  ? ` + ${winnings.NumDonatedNFTToClaim} donated NFT${
                      winnings.NumDonatedNFTToClaim > 1 ? "s" : ""
                    }`
                  : ""
              } waiting for you`}
              action={{
                label: "Claim Now →",
                onClick: () => (window.location.href = "/account/winnings"),
              }}
            />
          </Container>
        </section>
      )}

      {/* Key Metrics */}
      <section className="py-12">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Total NFTs Won"
              value={userInfo.TotalCSTokensWon}
              icon={Gem}
            />
            <StatCard
              label="Raffle NFTs"
              value={userInfo.RaffleNFTsCount}
              icon={Award}
            />
            <StatCard
              label="Total Bids"
              value={userInfo.NumBids}
              icon={Activity}
            />
            <StatCard
              label="Total ETH Won"
              value={`${(
                userInfo.SumRaffleEthWinnings + userInfo.SumRaffleEthWithdrawal
              ).toFixed(6)} ETH`}
              icon={Trophy}
            />
          </div>
        </Container>
      </section>

      {/* Performance Summary */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Raffle Winnings Stats */}
            <Card glass className="p-8">
              <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                Raffle Performance
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm text-text-secondary">
                      Total ETH Won
                    </span>
                    <span className="font-mono text-xl text-primary">
                      {(
                        userInfo.SumRaffleEthWinnings +
                        userInfo.SumRaffleEthWithdrawal
                      ).toFixed(6)}{" "}
                      ETH
                    </span>
                  </div>
                  <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-status-success rounded-full w-[75%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm text-text-secondary">
                      ETH Currently Claimable
                    </span>
                    <span className="font-mono text-xl text-status-warning">
                      {userInfo.SumRaffleEthWinnings.toFixed(6)} ETH
                    </span>
                  </div>
                  <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-status-warning rounded-full"
                      style={{
                        width: `${
                          userInfo.SumRaffleEthWinnings +
                            userInfo.SumRaffleEthWithdrawal >
                          0
                            ? (userInfo.SumRaffleEthWinnings /
                                (userInfo.SumRaffleEthWinnings +
                                  userInfo.SumRaffleEthWithdrawal)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm text-text-secondary">
                      ETH Withdrawn
                    </span>
                    <span className="font-mono text-xl text-text-primary">
                      {userInfo.SumRaffleEthWithdrawal.toFixed(6)} ETH
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-text-muted/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">
                      Raffles Participated
                    </span>
                    <span className="font-mono text-2xl font-semibold text-primary">
                      {userInfo.NumRaffleEthWinnings}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* NFT & Prize Stats */}
            <Card glass className="p-8">
              <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                NFT & Prize Stats
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center space-x-3">
                    <Gem size={20} className="text-primary" />
                    <span className="text-text-primary">
                      Total Cosmic Signature NFTs
                    </span>
                  </div>
                  <span className="font-mono text-lg font-semibold text-primary">
                    {userInfo.TotalCSTokensWon}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-status-info/5 border border-status-info/10">
                  <div className="flex items-center space-x-3">
                    <Trophy size={20} className="text-status-info" />
                    <span className="text-text-primary">Raffle NFTs</span>
                  </div>
                  <span className="font-mono text-lg font-semibold text-status-info">
                    {userInfo.RaffleNFTsCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-status-success/5 border border-status-success/10">
                  <div className="flex items-center space-x-3">
                    <Award size={20} className="text-status-success" />
                    <span className="text-text-primary">Reward NFTs</span>
                  </div>
                  <span className="font-mono text-lg font-semibold text-status-success">
                    {userInfo.RewardNFTsCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-status-warning/5 border border-status-warning/10">
                  <div className="flex items-center space-x-3">
                    <TrendingUp size={20} className="text-status-warning" />
                    <span className="text-text-primary">Total Prizes Won</span>
                  </div>
                  <span className="font-mono text-lg font-semibold text-status-warning">
                    {userInfo.NumPrizes}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-text-secondary">
                      Max Single Prize Won
                    </span>
                    <span className="font-mono text-lg font-semibold text-text-primary">
                      {userInfo.MaxWinAmount.toFixed(6)} ETH
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* Quick Actions */}
      <section className="py-12">
        <Container>
          <Card glass className="p-8">
            <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
              Quick Actions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button size="lg" className="w-full" asChild>
                <Link href="/game/play">
                  <Trophy className="mr-2" size={20} />
                  Place a Bid
                </Link>
              </Button>

              {hasUnclaimedPrizes && (
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full"
                  asChild
                >
                  <Link href="/account/winnings">
                    <TrendingUp className="mr-2" size={20} />
                    Claim Prizes
                  </Link>
                </Button>
              )}

              <Button size="lg" variant="outline" className="w-full" asChild>
                <Link href="/account/nfts">
                  <Gem className="mr-2" size={20} />
                  Manage NFTs
                </Link>
              </Button>
            </div>
          </Card>
        </Container>
      </section>

      {/* Recent Activity */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-3xl font-semibold text-text-primary">
              Recent Activity
            </h2>
            <Button variant="ghost" asChild>
              <Link href="/account/activity">View All →</Link>
            </Button>
          </div>

          <Timeline
            items={recentActivities.map((activity) => ({
              id: activity.id,
              title: activity.title,
              description: activity.description,
              timestamp: activity.timestamp,
              type: activity.type,
              metadata: activity.metadata,
              link:
                activity.type === "bid"
                  ? `/game/history/bids/${activity.id}`
                  : undefined,
            }))}
          />
        </Container>
      </section>

      {/* Your NFTs Preview */}
      <section className="py-12">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-3xl font-semibold text-text-primary">
              Your Collection
            </h2>
            <Button variant="ghost" asChild>
              <Link href="/account/nfts">
                View All {userInfo.TotalCSTokensWon} NFTs →
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userNFTs.map((nft, index) => (
              <NFTCard key={nft.id} nft={nft} delay={index * 0.1} />
            ))}
          </div>
        </Container>
      </section>

      {/* Additional Stats */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <Card glass className="p-8">
            <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
              Transfer History
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                <p className="text-sm text-text-secondary mb-2">
                  Cosmic Signature Transfers
                </p>
                <p className="font-mono text-2xl font-bold text-primary">
                  {userInfo.CosmicSignatureNumTransfers}
                </p>
                {isConnected && userInfo.Address && (
                  <Link
                    href={`/cosmic-signature-transfer/${userInfo.Address}`}
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    View All Transfers →
                  </Link>
                )}
              </div>

              <div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                <p className="text-sm text-text-secondary mb-2">
                  Cosmic Token Transfers
                </p>
                <p className="font-mono text-2xl font-bold text-primary">
                  {userInfo.CosmicTokenNumTransfers}
                </p>
                {isConnected && userInfo.Address && (
                  <Link
                    href={`/cosmic-token-transfer/${userInfo.Address}`}
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    View All Transfers →
                  </Link>
                )}
              </div>

              <div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                <p className="text-sm text-text-secondary mb-2">
                  Maximum Bid Amount
                </p>
                <p className="font-mono text-2xl font-bold text-status-warning">
                  {userInfo.MaxBidAmount.toFixed(6)} ETH
                </p>
              </div>

              <div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                <p className="text-sm text-text-secondary mb-2">
                  Unclaimed Donated NFTs
                </p>
                <p className="font-mono text-2xl font-bold text-status-info">
                  {userInfo.UnclaimedNFTs}
                </p>
                {isConnected && userInfo.UnclaimedNFTs > 0 && (
                  <Link
                    href="/account/winnings"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    Claim NFTs →
                  </Link>
                )}
              </div>
            </div>
          </Card>
        </Container>
      </section>
    </div>
  );
}

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
import { MOCK_CURRENT_USER } from "@/lib/mockData/users";
import { MOCK_USER_ACTIVITIES } from "@/lib/mockData/activities";
import { MOCK_NFTS } from "@/lib/constants";
import { formatEth, formatCst } from "@/lib/utils";
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

// Default winnings data (when not connected or loading)
const DEFAULT_WINNINGS: UserWinningsAPI = {
  DonatedERC20Tokens: [],
  ETHRaffleToClaim: 0,
  ETHRaffleToClaimWei: "0",
  NumDonatedNFTToClaim: 0,
  UnclaimedStakingReward: 0,
};

export default function AccountDashboardPage() {
  const { address, isConnected } = useAccount();
  const user = MOCK_CURRENT_USER;
  const [winnings, setWinnings] = useState<UserWinningsAPI>(DEFAULT_WINNINGS);
  const [isLoadingWinnings, setIsLoadingWinnings] = useState(false);
  const recentActivities = MOCK_USER_ACTIVITIES.slice(0, 5);
  const userNFTs = MOCK_NFTS.slice(0, 6); // Preview of user's NFTs

  // Fetch user winnings from API when wallet is connected
  useEffect(() => {
    async function fetchWinnings() {
      if (!address || !isConnected) {
        // Use default data when wallet is not connected
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
        // Fall back to default data on error
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
                  Welcome back, {user.ensName || "Collector"}
                </h1>
                <p className="text-text-secondary">
                  Member since {user.joinedDate} • Last active recently
                </p>
              </div>

              <div className="flex space-x-2">
                {user.isChronoWarrior && (
                  <div className="px-4 py-2 rounded-lg bg-status-info/10 border border-status-info/20">
                    <span className="text-sm font-medium text-status-info">
                      ⚡ Chrono-Warrior
                    </span>
                  </div>
                )}
                {user.isEnduranceChampion && (
                  <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-sm font-medium text-primary">
                      🏆 Endurance Champion
                    </span>
                  </div>
                )}
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
            <StatCard label="NFTs Owned" value={user.nftsOwned} icon={Gem} />
            <StatCard
              label="NFTs Staked"
              value={user.nftsStaked}
              icon={Award}
            />
            <StatCard
              label="Total Bids"
              value={user.totalBids}
              icon={Activity}
            />
            <StatCard
              label="Total Won"
              value={`${formatEth(user.totalETHWon)} ETH`}
              icon={Trophy}
              trend={{
                value: 68,
                isPositive: true,
              }}
            />
          </div>
        </Container>
      </section>

      {/* Performance Summary */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Spending vs Winnings */}
            <Card glass className="p-8">
              <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                Your Performance
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm text-text-secondary">
                      Total Spent
                    </span>
                    <span className="font-mono text-xl text-text-primary">
                      {formatEth(user.totalETHSpent)} ETH
                    </span>
                  </div>
                  <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-status-error/40 rounded-full w-[40%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm text-text-secondary">
                      Total Won
                    </span>
                    <span className="font-mono text-xl text-primary">
                      {formatEth(user.totalETHWon)} ETH
                    </span>
                  </div>
                  <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-status-success rounded-full w-[67%]" />
                  </div>
                </div>

                <div className="pt-4 border-t border-text-muted/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">
                      Return on Investment
                    </span>
                    <span className="font-mono text-2xl font-semibold text-status-success">
                      +68%
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Prize Breakdown */}
            <Card glass className="p-8">
              <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                Prize Wins
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center space-x-3">
                    <Trophy size={20} className="text-primary" />
                    <span className="text-text-primary">Main Prize</span>
                  </div>
                  <span className="font-mono text-lg font-semibold text-primary">
                    {user.mainPrizesWon}x
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-status-info/5 border border-status-info/10">
                  <div className="flex items-center space-x-3">
                    <Award size={20} className="text-status-info" />
                    <span className="text-text-primary">Champion</span>
                  </div>
                  <span className="font-mono text-lg font-semibold text-status-info">
                    {user.championPrizesWon}x
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-status-warning/5 border border-status-warning/10">
                  <div className="flex items-center space-x-3">
                    <TrendingUp size={20} className="text-status-warning" />
                    <span className="text-text-primary">Raffle</span>
                  </div>
                  <span className="font-mono text-lg font-semibold text-status-warning">
                    {user.rafflePrizesWon}x
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/account/stats">View Detailed Statistics →</Link>
                </Button>
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
              <Link href="/account/nfts">View All {user.nftsOwned} NFTs →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userNFTs.map((nft, index) => (
              <NFTCard key={nft.id} nft={nft} delay={index * 0.1} />
            ))}
          </div>
        </Container>
      </section>

      {/* CST Token Balance */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <Card glass className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                  CST Token Balance
                </h3>
                <p className="text-sm text-text-secondary">
                  Earned from {user.totalBids} bids • Use for future bidding
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-4xl font-bold text-primary mb-2">
                  {formatCst(
                    parseFloat(user.totalCSTWon) -
                      parseFloat(user.totalCSTSpent)
                  )}
                </div>
                <div className="text-sm text-text-muted">CST</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-text-muted/10 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-text-secondary mb-1 uppercase tracking-wide">
                  Earned
                </p>
                <p className="font-mono text-lg text-status-success">
                  {formatCst(user.totalCSTWon)} CST
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-1 uppercase tracking-wide">
                  Spent
                </p>
                <p className="font-mono text-lg text-text-primary">
                  {formatCst(user.totalCSTSpent)} CST
                </p>
              </div>
            </div>
          </Card>
        </Container>
      </section>
    </div>
  );
}

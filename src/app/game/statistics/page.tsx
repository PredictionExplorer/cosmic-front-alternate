"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Trophy,
  Gem,
  DollarSign,
  Clock,
  Target,
  Award,
  Activity,
  Heart,
  Zap,
  BarChart3,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { StatCard } from "@/components/game/StatCard";
import { ElegantTable } from "@/components/data/ElegantTable";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import { useApiData } from "@/contexts/ApiDataContext";
import api from "@/services/api";
import { formatEth, formatCst } from "@/lib/utils";

interface GlobalStats {
  totalRounds: number;
  totalBids: number;
  totalETHCollected: number;
  totalCSTDistributed: number;
  totalNFTsMinted: number;
  uniqueBidders: number;
  uniqueWinners: number;
  totalCharityDonations: number;
  totalStakingRewards: number;
  totalVoluntaryDonations: number;
}

interface TopBidder {
  address: string;
  totalBids: number;
}

interface TopWinner {
  address: string;
  totalWon: number;
}

export default function StatisticsPage() {
  const { dashboardData } = useApiData();
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalRounds: 0,
    totalBids: 0,
    totalETHCollected: 0,
    totalCSTDistributed: 0,
    totalNFTsMinted: 0,
    uniqueBidders: 0,
    uniqueWinners: 0,
    totalCharityDonations: 0,
    totalStakingRewards: 0,
    totalVoluntaryDonations: 0,
  });
  const [topBidders, setTopBidders] = useState<TopBidder[]>([]);
  const [topWinners, setTopWinners] = useState<TopWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all statistics data
  useEffect(() => {
    async function fetchStatistics() {
      try {
        setIsLoading(true);

        // Fetch multiple data sources in parallel
        const [
          roundsData,
          bidsData,
          nftsData,
          uniqueBiddersData,
          uniqueWinnersData,
          charityDepositsData,
          charityCGData,
          voluntaryCharityData,
        ] = await Promise.all([
          api.getRoundList(),
          api.getBidList(),
          api.getCSTList(),
          api.getUniqueBidders(),
          api.getUniqueWinners(),
          api.getCharityDeposits(),
          api.getCharityCGDeposits(),
          api.getCharityVoluntary(),
        ]);

        // Calculate total ETH collected from rounds
        const totalETH = roundsData.reduce(
          (sum: number, round: Record<string, unknown>) =>
            sum + (parseFloat((round.EthAmount as string) || "0") / 1e18 || 0),
          0
        );

        // Calculate total charity donations
        const charityDepositsSum = charityDepositsData.reduce(
          (sum: number, donation: Record<string, unknown>) =>
            sum + (parseFloat((donation.Amount as string) || "0") / 1e18 || 0),
          0
        );
        const charityCGSum = charityCGData.reduce(
          (sum: number, donation: Record<string, unknown>) =>
            sum + (parseFloat((donation.Amount as string) || "0") / 1e18 || 0),
          0
        );
        const voluntarySum = voluntaryCharityData.reduce(
          (sum: number, donation: Record<string, unknown>) =>
            sum + (parseFloat((donation.Amount as string) || "0") / 1e18 || 0),
          0
        );

        // Count total bids and calculate bidder stats
        const bidderCounts: Record<string, number> = {};
        bidsData.forEach((bid: Record<string, unknown>) => {
          const bidder = (bid.BidderAddr as string) || "";
          bidderCounts[bidder] = (bidderCounts[bidder] || 0) + 1;
        });

        // Get top 10 bidders
        const topBiddersData = Object.entries(bidderCounts)
          .map(([address, count]) => ({ address, totalBids: count }))
          .sort((a, b) => b.totalBids - a.totalBids)
          .slice(0, 10);

        // Calculate winner stats from claim history
        const claimHistory = await api.getClaimHistory();
        const winnerTotals: Record<string, number> = {};
        claimHistory.forEach((claim: Record<string, unknown>) => {
          const winner = (claim.WinnerAddr as string) || "";
          const amount =
            parseFloat((claim.PrizeAmount as string) || "0") / 1e18 || 0;
          winnerTotals[winner] = (winnerTotals[winner] || 0) + amount;
        });

        const topWinnersData = Object.entries(winnerTotals)
          .map(([address, totalWon]) => ({ address, totalWon }))
          .sort((a, b) => b.totalWon - a.totalWon)
          .slice(0, 10);

        setGlobalStats({
          totalRounds: roundsData.length,
          totalBids: bidsData.length,
          totalETHCollected: totalETH,
          totalCSTDistributed: bidsData.length * 100, // 100 CST per bid
          totalNFTsMinted: nftsData.length,
          uniqueBidders: uniqueBiddersData.length,
          uniqueWinners: uniqueWinnersData.length,
          totalCharityDonations: charityDepositsSum + charityCGSum,
          totalStakingRewards: 0, // Would need to calculate from staking data
          totalVoluntaryDonations: voluntarySum,
        });

        setTopBidders(topBiddersData);
        setTopWinners(topWinnersData);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatistics();
  }, []);

  // Current round stats from dashboard
  const currentRound = {
    roundNumber: dashboardData?.CurRoundNum || 0,
    prizePool: (dashboardData?.PrizeAmountEth as number) || 0,
    totalBids: (dashboardData?.CurNumBids as number) || 0,
    contractBalance: (dashboardData?.CosmicGameBalanceEth as number) || 0,
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Game", href: "/game/play" },
              { label: "Statistics" },
            ]}
            className="mb-8"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center space-x-2 mb-6">
              <BarChart3 size={32} className="text-primary" />
              <h1 className="heading-xl">Game Statistics</h1>
            </div>
            <p className="body-lg max-w-2xl mx-auto text-balance">
              Comprehensive metrics and insights into Cosmic Signature&apos;s
              performance, community, and impact
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Current Round Overview */}
      <section className="py-12">
        <Container>
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-2">
              Current Round Status
            </h2>
            <p className="text-text-secondary">Live metrics for Round {currentRound.roundNumber}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Round Number"
              value={currentRound.roundNumber.toString()}
              icon={Target}
            />
            <StatCard
              label="Prize Pool"
              value={`${currentRound.prizePool.toFixed(2)} ETH`}
              icon={Trophy}
            />
            <StatCard
              label="Total Bids"
              value={currentRound.totalBids.toString()}
              icon={Activity}
            />
            <StatCard
              label="Contract Balance"
              value={`${currentRound.contractBalance.toFixed(2)} ETH`}
              icon={DollarSign}
            />
          </div>
        </Container>
      </section>

      {/* All-Time Statistics */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-2">
              All-Time Statistics
            </h2>
            <p className="text-text-secondary">
              Cumulative metrics since inception
            </p>
          </div>

          {isLoading ? (
            <Card glass className="p-12 text-center">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-text-secondary">Loading statistics...</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                label="Total Rounds Played"
                value={globalStats.totalRounds.toLocaleString()}
                icon={Clock}
              />
              <StatCard
                label="Total Bids Placed"
                value={globalStats.totalBids.toLocaleString()}
                icon={Zap}
              />
              <StatCard
                label="Total ETH Collected"
                value={`${formatEth(globalStats.totalETHCollected)} ETH`}
                icon={DollarSign}
              />
              <StatCard
                label="Total NFTs Minted"
                value={globalStats.totalNFTsMinted.toLocaleString()}
                icon={Gem}
              />
              <StatCard
                label="CST Tokens Distributed"
                value={formatCst(globalStats.totalCSTDistributed)}
                icon={Award}
              />
              <StatCard
                label="Unique Players"
                value={globalStats.uniqueBidders.toLocaleString()}
                icon={Users}
              />
              <StatCard
                label="Unique Winners"
                value={globalStats.uniqueWinners.toLocaleString()}
                icon={Trophy}
              />
              <StatCard
                label="Charity Donations"
                value={`${formatEth(globalStats.totalCharityDonations)} ETH`}
                icon={Heart}
              />
              <StatCard
                label="Voluntary Contributions"
                value={`${formatEth(globalStats.totalVoluntaryDonations)} ETH`}
                icon={TrendingUp}
              />
            </div>
          )}
        </Container>
      </section>

      {/* Community Insights */}
      <section className="py-12">
        <Container>
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-2">
              Community Insights
            </h2>
            <p className="text-text-secondary">
              Top participants and key metrics
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Bidders */}
            <div>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                Top 10 Bidders (All-Time)
              </h3>
              {isLoading ? (
                <Card glass className="p-8 text-center">
                  <div className="animate-pulse">
                    <div className="h-4 bg-background-elevated rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-background-elevated rounded w-1/2"></div>
                  </div>
                </Card>
              ) : topBidders.length > 0 ? (
                <ElegantTable
                  data={topBidders.map((bidder, index) => ({
                    rank: index + 1,
                    address: bidder.address,
                    totalBids: bidder.totalBids,
                  }))}
                  mode="table"
                  columns={[
                    {
                      key: "rank",
                      label: "Rank",
                      render: (value) => (
                        <span className="font-mono font-semibold text-primary">
                          #{String(value)}
                        </span>
                      ),
                    },
                    {
                      key: "address",
                      label: "Player",
                      render: (_value, item) => (
                        <AddressDisplay
                          address={item.address as string}
                          showCopy={false}
                        />
                      ),
                    },
                    {
                      key: "totalBids",
                      label: "Total Bids",
                      sortable: true,
                      render: (value) => (
                        <span className="font-mono text-text-primary font-semibold">
                          {(value as number).toLocaleString()}
                        </span>
                      ),
                    },
                  ]}
                  emptyMessage="No bidders data available"
                />
              ) : (
                <Card glass className="p-8 text-center">
                  <p className="text-text-secondary">
                    No bidders data available
                  </p>
                </Card>
              )}
            </div>

            {/* Top Winners */}
            <div>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                Top 10 Winners (All-Time)
              </h3>
              {isLoading ? (
                <Card glass className="p-8 text-center">
                  <div className="animate-pulse">
                    <div className="h-4 bg-background-elevated rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-background-elevated rounded w-1/2"></div>
                  </div>
                </Card>
              ) : topWinners.length > 0 ? (
                <ElegantTable
                  data={topWinners.map((winner, index) => ({
                    rank: index + 1,
                    address: winner.address,
                    totalWon: winner.totalWon,
                  }))}
                  mode="table"
                  columns={[
                    {
                      key: "rank",
                      label: "Rank",
                      render: (value) => (
                        <span className="font-mono font-semibold text-primary">
                          #{String(value)}
                        </span>
                      ),
                    },
                    {
                      key: "address",
                      label: "Winner",
                      render: (_value, item) => (
                        <AddressDisplay
                          address={item.address as string}
                          showCopy={false}
                        />
                      ),
                    },
                    {
                      key: "totalWon",
                      label: "Total Won",
                      sortable: true,
                      render: (value) => (
                        <span className="font-mono text-primary font-semibold">
                          {formatEth(value as number)} ETH
                        </span>
                      ),
                    },
                  ]}
                  emptyMessage="No winners data available"
                />
              ) : (
                <Card glass className="p-8 text-center">
                  <p className="text-text-secondary">
                    No winners data available
                  </p>
                </Card>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Key Metrics Cards */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-2">
              Key Performance Indicators
            </h2>
            <p className="text-text-secondary">
              Important metrics at a glance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card glass className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users size={24} className="text-primary" />
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                Player Participation
              </h3>
              <p className="font-mono text-3xl font-bold text-primary mb-1">
                {globalStats.uniqueBidders.toLocaleString()}
              </p>
              <p className="text-sm text-text-secondary">
                Unique players have participated
              </p>
            </Card>

            <Card glass className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-status-success/10">
                  <Trophy size={24} className="text-status-success" />
                </div>
                <Badge variant="success">Winners</Badge>
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                Prize Distribution
              </h3>
              <p className="font-mono text-3xl font-bold text-status-success mb-1">
                {((globalStats.uniqueWinners / Math.max(globalStats.uniqueBidders, 1)) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-text-secondary">
                Of players have won prizes
              </p>
            </Card>

            <Card glass className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-status-info/10">
                  <Activity size={24} className="text-status-info" />
                </div>
                <Badge variant="info">Average</Badge>
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                Avg. Bids per Round
              </h3>
              <p className="font-mono text-3xl font-bold text-status-info mb-1">
                {Math.round(
                  globalStats.totalBids / Math.max(globalStats.totalRounds, 1)
                )}
              </p>
              <p className="text-sm text-text-secondary">
                Average participation per round
              </p>
            </Card>
          </div>
        </Container>
      </section>
    </div>
  );
}


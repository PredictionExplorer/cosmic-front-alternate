"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Clock, TrendingUp, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import { ElegantTable } from "@/components/data/ElegantTable";
import { formatEth, formatCst, formatDate, formatDuration } from "@/lib/utils";
import api from "@/services/api";

// API Response Interfaces
interface RoundStats {
  RoundNum: number;
  TotalBids: number;
  TotalDonatedNFTs: number;
  NumERC20Donations: number;
  TotalRaffleEthDeposits: string;
  TotalRaffleEthDepositsEth: number;
  TotalRaffleNFTs: number;
  TotalDonatedCount: number;
  TotalDonatedAmount: string;
  TotalDonatedAmountEth: number;
}

interface RaffleNFTWinner {
  RecordId: number;
  EvtLogId: number;
  BlockNum: number;
  TxId: number;
  TxHash: string;
  TimeStamp: number;
  DateTime: string;
  WinnerAddr: string;
  WinnerAid: number;
  RoundNum: number;
  TokenId: number;
  CstAmount: string;
  CstAmountEth: number;
  WinnerIndex: number;
  IsRWalk: boolean;
  IsStaker: boolean;
}

interface RaffleETHDeposit {
  RecordId: number;
  EvtLogId: number;
  BlockNum: number;
  TxId: number;
  TxHash: string;
  TimeStamp: number;
  DateTime: string;
  RecordType: number;
  WinnerAddr: string;
  WinnerAid: number;
  WinnerIndex: number;
  RoundNum: number;
  Amount: number;
  Claimed: boolean;
  ClaimTimeStamp: number;
  ClaimDateTime: string;
}

interface ApiRoundInfo {
  EvtLogId: number;
  BlockNum: number;
  TxId: number;
  TxHash: string;
  TimeStamp: number;
  DateTime: string;
  WinnerAid: number;
  WinnerAddr: string;
  TimeoutTs: number;
  Amount: string;
  AmountEth: number;
  RoundNum: number;
  TokenId: number;
  Seed: string;
  CharityAddress: string;
  CharityAmount: string;
  CharityAmountETH: number;
  StakingDepositId: number;
  StakingDepositAmount: string;
  StakingDepositAmountEth: number;
  StakingPerToken: string;
  StakingPerTokenEth: number;
  StakingNumStakedTokens: number;
  MainPrizeCstAmount: string;
  MainPrizeCstAmountEth: number;
  EnduranceWinnerAddr: string;
  EnduranceERC721TokenId: number;
  LastCstBidderAddr: string;
  LastCstBidderERC721TokenId: number;
  EnduranceERC20Amount: string;
  EnduranceERC20AmountEth: number;
  LastCstBidderERC20Amount: string;
  LastCstBidderERC20AmountEth: number;
  ChronoWarriorAddr: string;
  ChronoWarriorEthAmount: string;
  ChronoWarriorEthAmountEth: number;
  ChronoWarriorCstAmount: string;
  ChronoWarriorCstAmountEth: number;
  ChronoWarriorNftId: number;
  RoundStats: RoundStats;
  RaffleNFTWinners: RaffleNFTWinner[] | null;
  StakingNFTWinners: RaffleNFTWinner[] | null;
  RaffleETHDeposits: RaffleETHDeposit[] | null;
  AllPrizes: any[] | null;
}

export default function RoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const roundNum = parseInt(id);
  
  const [round, setRound] = useState<ApiRoundInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "winners" | "stats" | "bids" | "donations"
  >("overview");

  // Bids state
  const [bids, setBids] = useState<
    Array<{
      id: number;
      bidder: string;
      bidType: string;
      amount: number;
      timestamp: number;
      message?: string;
    }>
  >([]);
  const [isLoadingBids, setIsLoadingBids] = useState(true);

  // Donations state
  const [ethDonations, setEthDonations] = useState<
    Array<{
      id: number;
      donor: string;
      amount: number;
      timestamp: number;
      message?: string;
    }>
  >([]);
  const [nftDonations, setNftDonations] = useState<
    Array<{
      id: number;
      donor: string;
      tokenId: number;
      contractAddress: string;
      timestamp: number;
    }>
  >([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);

  // Fetch round data from API
  useEffect(() => {
    async function fetchRoundData() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getRoundInfo(roundNum);
        setRound(response);
      } catch (err) {
        console.error("Error fetching round data:", err);
        setError("Failed to load round data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchRoundData();
  }, [roundNum]);

  // Fetch bids for this round
  useEffect(() => {
    async function fetchBids() {
      if (!round) return;
      try {
        const bidsData = await api.getBidListByRound(round.RoundNum, "desc");
        const formattedBids = bidsData.map((bid: Record<string, unknown>) => ({
          id: (bid.EvtLogId as number) || 0,
          bidder: (bid.BidderAddr as string) || "0x0",
          bidType: (bid.BidType as string) || "ETH",
          amount: parseFloat((bid.BidPrice as string) || "0") / 1e18,
          timestamp: (bid.TimeStamp as number) || 0,
          message: (bid.Message as string) || undefined,
        }));
        setBids(formattedBids);
      } catch (error) {
        console.error("Failed to fetch bids:", error);
        setBids([]);
      } finally {
        setIsLoadingBids(false);
      }
    }
    fetchBids();
  }, [round]);

  // Fetch donations for this round
  useEffect(() => {
    async function fetchDonations() {
      if (!round) return;
      try {
        const [ethDonationsData, nftDonationsData] = await Promise.all([
          api.getETHDonationsByRound(round.RoundNum),
          api.getNFTDonationsByRound(round.RoundNum),
        ]);

        // Format ETH donations
        const formattedEthDonations = ethDonationsData.map(
          (donation: Record<string, unknown>) => ({
            id: (donation.EvtLogId as number) || 0,
            donor: (donation.DonorAddr as string) || "0x0",
            amount: parseFloat((donation.Amount as string) || "0") / 1e18,
            timestamp: (donation.TimeStamp as number) || 0,
            message: (donation.Message as string) || undefined,
          })
        );
        setEthDonations(formattedEthDonations);

        // Format NFT donations
        const formattedNftDonations = nftDonationsData.map(
          (donation: Record<string, unknown>) => ({
            id: (donation.EvtLogId as number) || 0,
            donor: (donation.DonorAddr as string) || "0x0",
            tokenId: (donation.TokenId as number) || 0,
            contractAddress: (donation.NftAddr as string) || "0x0",
            timestamp: (donation.TimeStamp as number) || 0,
          })
        );
        setNftDonations(formattedNftDonations);
      } catch (error) {
        console.error("Failed to fetch donations:", error);
        setEthDonations([]);
        setNftDonations([]);
      } finally {
        setIsLoadingDonations(false);
      }
    }
    fetchDonations();
  }, [round]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-text-secondary">Loading round data...</p>
          </Card>
        </Container>
      </div>
    );
  }

  // Error state
  if (error || !round) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="heading-sm mb-4">
              {error ? "Error Loading Round" : "Round Not Found"}
            </h1>
            <p className="text-text-secondary mb-6">
              {error || "This round doesn't exist or hasn't been played yet."}
            </p>
            <Button asChild>
              <Link href="/game/history/rounds">
                <ArrowLeft className="mr-2" size={20} />
                Back to Archive
              </Link>
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  // Calculate derived values
  const duration = round.TimeoutTs - round.TimeStamp;
  const totalPool = round.AmountEth + round.StakingDepositAmountEth + round.RoundStats.TotalRaffleEthDepositsEth;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Game", href: "/game/play" },
              { label: "History" },
              { label: "Rounds", href: "/game/history/rounds" },
              { label: `Round ${round.RoundNum}` },
            ]}
            className="mb-8"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h1 className="heading-xl mb-2">Round {round.RoundNum}</h1>
                <p className="text-text-secondary">
                  Completed on {formatDate(new Date(round.TimeStamp * 1000))} •
                  Duration: {formatDuration(duration * 1000)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-text-secondary mb-1">
                  Total Prize Pool
                </p>
                <p className="font-mono text-4xl font-bold text-primary">
                  {totalPool.toFixed(4)} ETH
                </p>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-background-elevated/30">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <Users size={24} className="text-primary mx-auto mb-2" />
              <p className="font-mono text-2xl font-semibold text-text-primary">
                {round.RoundStats.TotalBids}
              </p>
              <p className="text-sm text-text-secondary">Total Bids</p>
            </div>
            <div className="text-center">
              <Trophy size={24} className="text-primary mx-auto mb-2" />
              <p className="font-mono text-2xl font-semibold text-text-primary">
                {round.RoundStats.TotalRaffleNFTs + 3}
              </p>
              <p className="text-sm text-text-secondary">Prize Winners</p>
            </div>
            <div className="text-center">
              <TrendingUp size={24} className="text-primary mx-auto mb-2" />
              <p className="font-mono text-2xl font-semibold text-text-primary">
                {round.RoundStats.TotalDonatedCount}
              </p>
              <p className="text-sm text-text-secondary">Donations</p>
            </div>
            <div className="text-center">
              <Clock size={24} className="text-primary mx-auto mb-2" />
              <p className="font-mono text-2xl font-semibold text-text-primary">
                {Math.floor(duration / 3600)}h
              </p>
              <p className="text-sm text-text-secondary">Duration</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Tabs */}
      <section className="py-6 sticky top-[160px] lg:top-[176px] z-30 bg-background/95 backdrop-blur-xl border-b border-text-muted/10">
        <Container>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("winners")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "winners"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              Winners
            </button>
            <button
              onClick={() => setActiveTab("bids")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "bids"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              Bids ({bids.length})
            </button>
            <button
              onClick={() => setActiveTab("donations")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "donations"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              Donations ({ethDonations.length + nftDonations.length})
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "stats"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              Statistics
            </button>
          </div>
        </Container>
      </section>

      {/* Tab Content */}
      <section className="section-padding">
        <Container>
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Main Prize */}
              <Card glass className="p-8 border-primary/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-4 rounded-lg bg-primary/10">
                      <Trophy size={32} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                        Main Prize Winner
                      </h3>
                      <AddressDisplay address={round.WinnerAddr} />
                      <p className="text-sm text-text-secondary mt-2">
                        NFT #{round.TokenId} awarded
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary mb-1">
                      Prize Amount
                    </p>
                    <p className="font-mono text-4xl font-bold text-primary">
                      {round.AmountEth.toFixed(4)}
                    </p>
                    <p className="text-sm text-text-muted">ETH</p>
                  </div>
                </div>
              </Card>

              {/* Champions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card glass className="p-6">
                  <h4 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Endurance Champion
                  </h4>
                  <AddressDisplay
                    address={round.EnduranceWinnerAddr}
                    className="mb-4"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Prize:</span>
                    <span className="font-mono text-lg text-primary">
                      {round.EnduranceERC20AmountEth.toFixed(0)} CST
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-text-secondary">NFT:</span>
                    <span className="font-mono text-sm text-text-primary">
                      #{round.EnduranceERC721TokenId}
                    </span>
                  </div>
                </Card>

                <Card glass className="p-6">
                  <h4 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Chrono-Warrior
                  </h4>
                  <AddressDisplay
                    address={round.ChronoWarriorAddr}
                    className="mb-4"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">ETH Prize:</span>
                    <span className="font-mono text-lg text-primary">
                      {round.ChronoWarriorEthAmountEth.toFixed(4)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-text-secondary">CST Prize:</span>
                    <span className="font-mono text-sm text-text-primary">
                      {round.ChronoWarriorCstAmountEth.toFixed(0)} CST
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-text-secondary">NFT:</span>
                    <span className="font-mono text-sm text-text-primary">
                      #{round.ChronoWarriorNftId}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Raffle & Staking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card glass className="p-6">
                  <h4 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Raffle Prizes
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">
                        ETH Winners:
                      </span>
                      <span className="text-text-primary">
                        {round.RaffleETHDeposits?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">
                        NFT Winners:
                      </span>
                      <span className="text-text-primary">
                        {round.RaffleNFTWinners?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-text-muted/10">
                      <span className="text-sm text-text-secondary">
                        Total ETH:
                      </span>
                      <span className="font-mono text-primary">
                        {round.RoundStats.TotalRaffleEthDepositsEth.toFixed(4)} ETH
                      </span>
                    </div>
                  </div>
                </Card>

                <Card glass className="p-6">
                  <h4 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Staking & Charity
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">
                        To Stakers:
                      </span>
                      <span className="font-mono text-status-success">
                        {round.StakingDepositAmountEth.toFixed(4)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">
                        To Charity:
                      </span>
                      <span className="font-mono text-status-error">
                        {round.CharityAmountETH.toFixed(4)} ETH
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "winners" && (
            <Card glass className="p-8">
              <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                All Prize Winners
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Main Prize
                      </p>
                      <AddressDisplay address={round.WinnerAddr} />
                    </div>
                    <span className="font-mono text-xl text-primary">
                      {round.AmountEth.toFixed(4)} ETH
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background-elevated">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Endurance Champion
                      </p>
                      <AddressDisplay address={round.EnduranceWinnerAddr} />
                    </div>
                    <span className="font-mono text-xl text-primary">
                      {round.EnduranceERC20AmountEth.toFixed(0)} CST
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background-elevated">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Chrono-Warrior
                      </p>
                      <AddressDisplay address={round.ChronoWarriorAddr} />
                    </div>
                    <span className="font-mono text-xl text-primary">
                      {round.ChronoWarriorEthAmountEth.toFixed(4)} ETH
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background-elevated">
                  <p className="text-sm text-text-secondary mb-2">
                    Raffle Winners
                  </p>
                  <p className="text-text-primary">
                    {round.RaffleETHDeposits?.length || 0} ETH winners +{" "}
                    {round.RaffleNFTWinners?.length || 0} NFT winners
                  </p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "stats" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card glass className="p-8">
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                  Round Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-3 border-b border-text-muted/10">
                    <span className="text-text-secondary">Total Bids</span>
                    <span className="font-mono text-text-primary font-semibold">
                      {round.RoundStats.TotalBids}
                    </span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-text-muted/10">
                    <span className="text-text-secondary">Duration</span>
                    <span className="font-mono text-text-primary font-semibold">
                      {formatDuration(duration * 1000)}
                    </span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-text-muted/10">
                    <span className="text-text-secondary">
                      Total ETH Collected
                    </span>
                    <span className="font-mono text-primary font-semibold">
                      {totalPool.toFixed(4)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      Main Prize CST
                    </span>
                    <span className="font-mono text-primary font-semibold">
                      {round.MainPrizeCstAmountEth.toFixed(0)} CST
                    </span>
                  </div>
                </div>
              </Card>

              <Card glass className="p-8">
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                  Prize Distribution
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Main Prize", value: round.AmountEth },
                    {
                      label: "Chrono-Warrior",
                      value: round.ChronoWarriorEthAmountEth,
                    },
                    { label: "Raffle", value: round.RoundStats.TotalRaffleEthDepositsEth },
                    { label: "Staking", value: round.StakingDepositAmountEth },
                    { label: "Charity", value: round.CharityAmountETH },
                  ].map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">
                          {item.label}
                        </span>
                        <span className="font-mono text-primary">
                          {item.value.toFixed(4)} ETH
                        </span>
                      </div>
                      <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-gold rounded-full transition-all duration-1000"
                          style={{
                            width: `${(item.value / totalPool) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "bids" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                  All Bids for Round {round.RoundNum}
                </h3>
                <p className="text-text-secondary mb-6">
                  Complete bidding history for this round ({bids.length} total
                  bids)
                </p>
              </div>

              {isLoadingBids ? (
                <Card glass className="p-12 text-center">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-text-secondary">Loading bids...</p>
                  </div>
                </Card>
              ) : bids.length > 0 ? (
                <ElegantTable
                  data={bids}
                  mode="table"
                  columns={[
                    {
                      key: "bidder",
                      label: "Bidder",
                      render: (_value, item) => (
                        <AddressDisplay
                          address={item.bidder as string}
                          showCopy={false}
                        />
                      ),
                    },
                    {
                      key: "bidType",
                      label: "Type",
                      render: (value) => (
                        <Badge
                          variant={
                            value === "ETH"
                              ? "default"
                              : value === "CST"
                              ? "info"
                              : "success"
                          }
                        >
                          {String(value)}
                        </Badge>
                      ),
                    },
                    {
                      key: "amount",
                      label: "Amount",
                      sortable: true,
                      render: (value, item) => (
                        <span className="font-mono text-primary font-semibold">
                          {typeof value === "number"
                            ? value.toFixed(6)
                            : "0.000000"}{" "}
                          {item.bidType === "CST" ? "CST" : "ETH"}
                        </span>
                      ),
                    },
                    {
                      key: "timestamp",
                      label: "Time",
                      sortable: true,
                      render: (value) => (
                        <span className="text-text-secondary text-sm">
                          {typeof value === "number"
                            ? formatDate(new Date(value * 1000))
                            : "Unknown"}
                        </span>
                      ),
                    },
                    {
                      key: "message",
                      label: "Message",
                      render: (value) => (
                        <span className="text-text-secondary italic text-sm truncate max-w-xs block">
                          {value ? String(value) : "—"}
                        </span>
                      ),
                    },
                  ]}
                  emptyMessage="No bids found for this round."
                />
              ) : (
                <Card glass className="p-12 text-center">
                  <p className="text-text-secondary">
                    No bids found for this round.
                  </p>
                </Card>
              )}
            </div>
          )}

          {activeTab === "donations" && (
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                  Donations for Round {round.RoundNum}
                </h3>
                <p className="text-text-secondary mb-6">
                  All ETH and NFT donations received during this round
                </p>
              </div>

              {/* ETH Donations */}
              <div>
                <h4 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  ETH Donations ({ethDonations.length})
                </h4>
                {isLoadingDonations ? (
                  <Card glass className="p-12 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-text-secondary">
                        Loading donations...
                      </p>
                    </div>
                  </Card>
                ) : ethDonations.length > 0 ? (
                  <ElegantTable
                    data={ethDonations}
                    mode="table"
                    columns={[
                      {
                        key: "donor",
                        label: "Donor",
                        render: (_value, item) => (
                          <AddressDisplay
                            address={item.donor as string}
                            showCopy={false}
                          />
                        ),
                      },
                      {
                        key: "amount",
                        label: "Amount",
                        sortable: true,
                        render: (value) => (
                          <span className="font-mono text-primary font-semibold">
                            {typeof value === "number"
                              ? value.toFixed(6)
                              : "0.000000"}{" "}
                            ETH
                          </span>
                        ),
                      },
                      {
                        key: "timestamp",
                        label: "Time",
                        sortable: true,
                        render: (value) => (
                          <span className="text-text-secondary text-sm">
                            {typeof value === "number"
                              ? formatDate(new Date(value * 1000))
                              : "Unknown"}
                          </span>
                        ),
                      },
                      {
                        key: "message",
                        label: "Message",
                        render: (value) => (
                          <span className="text-text-secondary italic text-sm truncate max-w-xs block">
                            {value ? String(value) : "—"}
                          </span>
                        ),
                      },
                    ]}
                    emptyMessage="No ETH donations for this round."
                  />
                ) : (
                  <Card glass className="p-8 text-center">
                    <p className="text-text-secondary">
                      No ETH donations for this round.
                    </p>
                  </Card>
                )}
              </div>

              {/* NFT Donations */}
              <div>
                <h4 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  NFT Donations ({nftDonations.length})
                </h4>
                {isLoadingDonations ? (
                  <Card glass className="p-12 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-text-secondary">
                        Loading donations...
                      </p>
                    </div>
                  </Card>
                ) : nftDonations.length > 0 ? (
                  <ElegantTable
                    data={nftDonations}
                    mode="table"
                    columns={[
                      {
                        key: "donor",
                        label: "Donor",
                        render: (_value, item) => (
                          <AddressDisplay
                            address={item.donor as string}
                            showCopy={false}
                          />
                        ),
                      },
                      {
                        key: "tokenId",
                        label: "Token ID",
                        render: (value) => (
                          <span className="font-mono text-primary">
                            #{String(value)}
                          </span>
                        ),
                      },
                      {
                        key: "contractAddress",
                        label: "NFT Contract",
                        render: (_value, item) => (
                          <AddressDisplay
                            address={item.contractAddress as string}
                            showCopy={false}
                            shorten={true}
                            chars={4}
                          />
                        ),
                      },
                      {
                        key: "timestamp",
                        label: "Time",
                        sortable: true,
                        render: (value) => (
                          <span className="text-text-secondary text-sm">
                            {typeof value === "number"
                              ? formatDate(new Date(value * 1000))
                              : "Unknown"}
                          </span>
                        ),
                      },
                    ]}
                    emptyMessage="No NFT donations for this round."
                  />
                ) : (
                  <Card glass className="p-8 text-center">
                    <p className="text-text-secondary">
                      No NFT donations for this round.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}

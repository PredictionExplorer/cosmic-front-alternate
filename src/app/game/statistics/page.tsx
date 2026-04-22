"use client";

import { useState, useMemo } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useApiData } from "@/contexts/ApiDataContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { BarChart3, Loader2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import { SystemModesTable } from "@/components/game/SystemModesTable";
import { BidHistoryTable } from "@/components/game/BidHistoryTable";
import { api } from "@/services/api";
import type {
  ApiDashboardData,
  ApiUniqueBidder,
  ApiUniqueWinner,
  ApiUniqueDonor,
  ApiUniqueStaker,
  ApiCSTDistribution,
  ApiCTBalanceDistribution,
  ApiDonatedTokenDistribution,
  ApiCSTBidData,
  ApiUniqueStakerRWalk,
  ApiStakedRWLKToken,
} from "@/services/apiTypes";
import type { ComponentBidData } from "@/lib/apiTransforms";
import type { SystemModeChange } from "@/contexts/SystemModeContext";
import { useTimeOffset } from "@/contexts/TimeOffsetContext";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type Bid = ComponentBidData;

type UniqueBidder = ApiUniqueBidder;
type UniqueWinner = ApiUniqueWinner;
type UniqueDonor = ApiUniqueDonor;
type UniqueStaker = ApiUniqueStaker;
type CSTDistribution = ApiCSTDistribution;
type CTBalanceDistribution = ApiCTBalanceDistribution;
type DonatedTokenDistribution = ApiDonatedTokenDistribution;
type CSTBidData = ApiCSTBidData;

/** Dashboard `MainStats.DonatedTokenDistribution` uses `ContractAddr` / `NumDonatedTokens` (Go `CGDonatedTokenDistrRec`). */
function donatedTokenDistrRow(item: DonatedTokenDistribution): {
  contractAddr: string;
  numDonated: number;
} {
  const contractAddr = item.ContractAddr ?? item.NftAddr ?? "";
  const numDonated = Number(item.NumDonatedTokens ?? item.NumDonations ?? 0);
  return { contractAddr, numDonated };
}

interface DashboardData extends ApiDashboardData {
  TsRoundStart: number;
  PrizeClaimTs: number;
  CosmicGameBalanceEth: number;
  TotalPrizes: number;
  TotalPrizesPaidAmountEth: number;
  NumRwalkTokensUsed: number;
  CharityBalanceEth: number;
  NumDonatedNFTs: number;
  NumVoluntaryDonations: number;
  SumVoluntaryDonationsEth: number;
  MainStats: {
    NumCSTokenMints: number;
    TotalRaffleEthDeposits: number;
    TotalCSTConsumedEth: number;
    TotalMktRewardsEth: number;
    NumMktRewards: number;
    TotalRaffleEthWithdrawn: number;
    NumBidsCST: number;
    NumUniqueBidders: number;
    NumUniqueWinners: number;
    NumUniqueDonors: number;
    TotalNamedTokens: number;
    NumUniqueStakersCST: number;
    NumUniqueStakersRWalk: number;
    TotalBids: number;
    NumCosmicGameDonations: number;
    SumCosmicGameDonationsEth: number;
    NumWithdrawals: number;
    SumWithdrawals: number;
    TotalEthDonatedAmountEth: number;
    NumWinnersWithPendingRaffleWithdrawal: number;
    DonatedTokenDistribution: ApiDonatedTokenDistribution[];
    StakeStatisticsCST: {
      NumActiveStakers: number;
      NumDeposits: number;
      TotalRewardEth: number;
      UnclaimedRewardEth: number;
      TotalTokensMinted: number;
      TotalTokensStaked: number;
    };
    StakeStatisticsRWalk: {
      NumActiveStakers: number;
      TotalTokensMinted: number;
      TotalTokensStaked: number;
    };
  };
}

// Helper function to format seconds
const formatSeconds = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
};

// Helper function to format CST value
const formatCSTValue = (value: number): string => {
  return `${value.toFixed(2)} CST`;
};

// Helper function to format ETH value
const formatEthValue = (value: number): string => {
  return `${value.toFixed(6)} ETH`;
};

// Helper function to convert timestamp
const convertTimestampToDateTime = (
  timestamp: number,
  includeTime = false
): string => {
  if (timestamp === 0) return "N/A";
  const date = new Date(timestamp * 1000);
  if (includeTime) {
    return date.toLocaleString();
  }
  return date.toLocaleDateString();
};

/**
 * @param prizeTimeSec Main prize time in seconds, comparable to `Date.now()/1000`
 *   (use `applyOffset(CurRoundPrizeTime)` from `getPrizeTime()` for local testnet).
 */
function formatPrizeClaimStatus(prizeTimeSec: number): string {
  if (prizeTimeSec === 0) {
    return "Not set yet";
  }
  const nowSec = Date.now() / 1000;
  if (prizeTimeSec > nowSec) {
    return convertTimestampToDateTime(prizeTimeSec, true);
  }
  return "Bidding exhausted, waiting for last bidder to claimPrize()";
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

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<"cst" | "rwlk">("cst");
  const { applyOffset } = useTimeOffset();

  // Dashboard data from global context
  const { dashboardData, isLoading: loading } = useApiData();
  const data = dashboardData as unknown as DashboardData | null;

  /** Same source as game/play: contract main prize time (`rounds/current/time` → CurRoundPrizeTime). */
  const { data: curRoundPrizeTimeRaw } = useApiQuery<number | null>(
    "prize-time",
    () => api.getPrizeTime(),
    { refetchInterval: 10000 },
  );

  // Fetch current round bids (depends on dashboard data)
  const { data: currentRoundBidsRaw } = useApiQuery(
    "stats-current-bids-" + (data?.CurRoundNum ?? ""),
    () => api.getBidListByRound(data!.CurRoundNum, "desc"),
    { enabled: data != null },
  );
  const currentRoundBids = (currentRoundBidsRaw ?? []) as Bid[];

  const { data: uniqueBiddersRaw } = useApiQuery(
    "stats-unique-bidders",
    async () => {
      const bidders = await api.getUniqueBidders();
      return (bidders as unknown as UniqueBidder[]).sort((a, b) => b.NumBids - a.NumBids);
    },
  );
  const uniqueBidders = uniqueBiddersRaw ?? [];

  const { data: uniqueWinnersRaw } = useApiQuery(
    "stats-unique-winners",
    async () => {
      const winners = await api.getUniqueWinners();
      return (winners as unknown as UniqueWinner[]).sort((a, b) => b.PrizesCount - a.PrizesCount);
    },
  );
  const uniqueWinners = uniqueWinnersRaw ?? [];

  const { data: uniqueCSTStakersRaw } = useApiQuery(
    "stats-unique-cst-stakers",
    async () => {
      const stakers = await api.getUniqueStakersCST();
      return (stakers as unknown as UniqueStaker[]).sort((a, b) => b.TotalRewardEth - a.TotalRewardEth);
    },
  );
  const uniqueCSTStakers = uniqueCSTStakersRaw ?? [];

  const { data: uniqueRWLKStakersRaw } = useApiQuery(
    "stats-unique-rwlk-stakers",
    async () => {
      const stakers = await api.getUniqueStakersRWLK();
      return (stakers as unknown as ApiUniqueStakerRWalk[]).sort(
        (a, b) => (b.TotalTokensMinted ?? 0) - (a.TotalTokensMinted ?? 0),
      );
    },
  );
  const uniqueRWLKStakers = uniqueRWLKStakersRaw ?? [];

  /** Live list — distinct stakers; dashboard `NumActiveStakers` can lag `cg_stake_stats_rwalk`. */
  const { data: rwlkStakedAllRaw, isLoading: rwlkStakedAllLoading } = useApiQuery(
    "stats-rwlk-staked-all",
    () => api.getStakedRWLKTokens(),
    { refetchInterval: 60_000 },
  );
  const rwlkDistinctStakerCount = useMemo(() => {
    const list = rwlkStakedAllRaw as ApiStakedRWLKToken[] | null | undefined;
    if (list === undefined || list === null) return null;
    return new Set(
      list.map((t) => (t.UserAddr || "").toLowerCase()).filter(Boolean),
    ).size;
  }, [rwlkStakedAllRaw]);

  const { data: uniqueDonorsRaw } = useApiQuery(
    "stats-unique-donors",
    async () => {
      const donors = await api.getUniqueDonors();
      return donors as unknown as UniqueDonor[];
    },
  );
  const uniqueDonors = uniqueDonorsRaw ?? [];

  const { data: cstDistributionRaw } = useApiQuery(
    "stats-cst-distribution",
    async () => {
      const dist = await api.getCSTDistribution();
      return dist as unknown as CSTDistribution[];
    },
  );
  const cstDistribution = cstDistributionRaw ?? [];

  const { data: ctBalanceDistributionRaw } = useApiQuery(
    "stats-ct-balance-distribution",
    async () => {
      const dist = await api.getCTBalanceDistribution();
      return dist as unknown as CTBalanceDistribution[];
    },
  );
  const ctBalanceDistribution = ctBalanceDistributionRaw ?? [];

  const { data: systemModeChanges } = useApiQuery(
    "stats-system-modes",
    async () => {
      const list = await api.getSystemModeList();
      return Array.isArray(list) ? (list as unknown as SystemModeChange[]) : [];
    },
  );

  // CST bid data (live updating, refreshes every 5 seconds)
  const { data: cstBidDataRaw } = useApiQuery<CSTBidData>(
    "stats-cst-price",
    async () => {
      const ctData = await api.getCSTPrice();
      if (ctData) {
        return {
          CSTPrice: (ctData.CSTPrice as string) || "0",
          SecondsElapsed: parseInt((ctData.SecondsElapsed as string) || "0", 10),
          AuctionDuration: parseInt((ctData.AuctionDuration as string) || "0", 10),
        };
      }
      return { CSTPrice: "0", SecondsElapsed: 0, AuctionDuration: 0 };
    },
    { refetchInterval: 5000 },
  );
  const cstBidData = cstBidDataRaw ?? { CSTPrice: "0", SecondsElapsed: 0, AuctionDuration: 0 };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
            <p className="text-text-secondary">Loading statistics...</p>
          </Card>
        </Container>
      </div>
    );
  }

  // Main prize time: dashboard PrizeClaimTs is often unset; use rounds/current/time (matches cginfo MainPrizeTime).
  const prizeTimeFromRoundEndpoint =
    curRoundPrizeTimeRaw != null &&
    !Number.isNaN(Number(curRoundPrizeTimeRaw)) &&
    Number(curRoundPrizeTimeRaw) > 0
      ? applyOffset(Number(curRoundPrizeTimeRaw))
      : 0;
  const prizeClaimSeconds =
    prizeTimeFromRoundEndpoint > 0
      ? prizeTimeFromRoundEndpoint
      : data.PrizeClaimTs > 0
        ? data.PrizeClaimTs
        : 0;
  const prizeClaimDisplay = formatPrizeClaimStatus(prizeClaimSeconds);

  // Current Round Statistics
  const currentRoundStats = [
    { title: "Current Round", value: data.CurRoundNum },
    {
      title: "Round Start Date",
      value:
        data.LastBidderAddr === ZERO_ADDRESS
          ? "Round isn't started yet."
          : convertTimestampToDateTime(data.TsRoundStart, true),
    },
    { title: "Current Bid Price", value: formatEthValue(data.BidPriceEth) },
    {
      title: "Current Bid Price using RandomWalk",
      value: formatEthValue(data.BidPriceEth / 2),
    },
    {
      title: "Current Bid Price using CST",
      value:
        parseFloat(cstBidData.CSTPrice) > 0
          ? formatCSTValue(parseFloat(cstBidData.CSTPrice) / 1e18)
          : "FREE",
    },
    {
      title: "CST Auction Elapsed Time",
      value: formatSeconds(cstBidData.SecondsElapsed),
    },
    {
      title: "CST Auction Duration",
      value: formatSeconds(cstBidData.AuctionDuration),
    },
    {
      title: "Number of Bids Since Round Start",
      value: data.CurNumBids,
    },
    {
      title: "Total Donated NFTs",
      value: data.CurRoundStats.TotalDonatedNFTs,
    },
    {
      title: "Total Donated ETH",
      value: formatEthValue(data.CurRoundStats.TotalDonatedAmountEth),
    },
    { title: "Prize Amount", value: formatEthValue(data.PrizeAmountEth) },
    {
      title: "Prize Claim Date",
      value: prizeClaimDisplay,
    },
    {
      title: "Last Bidder",
      value:
        data.LastBidderAddr === ZERO_ADDRESS
          ? "Round isn't started yet."
          : data.LastBidderAddr,
    },
  ];

  // Overall Statistics
  const overallStats = [
    {
      title: "CosmicGame contract balance",
      value: formatEthValue(data.CosmicGameBalanceEth),
    },
    {
      title: "Num Prizes Given",
      value: data.TotalPrizes,
    },
    {
      title: "Total Cosmic Signature Tokens minted",
      value: data.MainStats.NumCSTokenMints,
    },
    {
      title: "Total Amount Paid in Main Prizes",
      value: formatEthValue(data.TotalPrizesPaidAmountEth),
    },
    {
      title: "Total Amount Paid in ETH Raffles",
      value: formatEthValue(data.MainStats.TotalRaffleEthDeposits),
    },
    {
      title: "Total CST Consumed",
      value: formatCSTValue(data.MainStats.TotalCSTConsumedEth),
    },
    {
      title: "Total Reward Paid to Marketing Agents with CST",
      value: formatCSTValue(data.MainStats.TotalMktRewardsEth),
    },
    {
      title: "Number of Marketing Reward Transactions",
      value: data.MainStats.NumMktRewards,
    },
    {
      title: "Amount of ETH collected by the winners from raffles",
      value: formatEthValue(data.MainStats.TotalRaffleEthWithdrawn),
    },
    {
      title: "RandomWalk Tokens Used",
      value: data.NumRwalkTokensUsed,
    },
    {
      title: "Charity Balance",
      value: formatEthValue(data.CharityBalanceEth),
    },
    {
      title: "Number of Bids with CST",
      value: data.MainStats.NumBidsCST,
    },
    {
      title: "Number of Unique Bidders",
      value: data.MainStats.NumUniqueBidders,
    },
    {
      title: "Number of Unique Winners",
      value: data.MainStats.NumUniqueWinners,
    },
    {
      title: "Number of Unique ETH Donors",
      value: data.MainStats.NumUniqueDonors,
    },
    {
      title: "Number of Donated NFTs",
      value: data.NumDonatedNFTs,
    },
    {
      title: "Amount of Cosmic Signature Tokens with assigned name",
      value: data.MainStats.TotalNamedTokens,
    },
    {
      title: "Number of Unique CST Stakers",
      value: data.MainStats.NumUniqueStakersCST,
    },
    {
      title: "Number of Unique Random Walk Stakers",
      value: data.MainStats.NumUniqueStakersRWalk,
    },
    {
      title: "Total Bids",
      value: data.MainStats.TotalBids,
    },
  ];

  // Add conditional stats
  if (data.MainStats.NumWinnersWithPendingRaffleWithdrawal > 0) {
    overallStats.push({
      title: "Winners with Pending Raffle Withdrawal",
      value: `${data.MainStats.NumWinnersWithPendingRaffleWithdrawal} winners (${formatEthValue(
        data.MainStats.TotalRaffleEthDeposits - data.MainStats.TotalRaffleEthWithdrawn
      )})`,
    });
  }

  if (data.MainStats.NumCosmicGameDonations > 0) {
    overallStats.push({
      title: "Number of Cosmic Game Donations",
      value: data.MainStats.NumCosmicGameDonations,
    });
    overallStats.push({
      title: "Sum of Cosmic Game Donations",
      value: formatEthValue(data.MainStats.SumCosmicGameDonationsEth),
    });
  }

  if (data.SumVoluntaryDonationsEth > 0) {
    overallStats.push({
      title: "Voluntary Donations Received",
      value: `${data.NumVoluntaryDonations} donations totaling ${formatEthValue(
        data.SumVoluntaryDonationsEth
      )}`,
    });
  }

  if (data.MainStats.NumWithdrawals > 0) {
    overallStats.push({
      title: "Withdrawals from Charity Wallet",
      value: data.MainStats.NumWithdrawals,
    });
  }

  overallStats.push({
    title: "Total amount withdrawn from Charity Wallet",
    value: formatEthValue(data.MainStats.SumWithdrawals),
  });

  overallStats.push({
    title: "Total Donated ETH",
    value: formatEthValue(data.MainStats.TotalEthDonatedAmountEth),
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
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

      {/* Current Round Statistics */}
      <section className="py-12">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="heading-md mb-2">Current Round Statistics</h2>
            <p className="text-text-secondary">
              Live metrics for Round {data.CurRoundNum}
            </p>
          </motion.div>

          <Card glass className="p-8">
            <div className="space-y-1">
              {currentRoundStats.map((stat) => (
                <StatItem key={stat.title} title={stat.title} value={stat.value} />
              ))}
            </div>
          </Card>
        </Container>
      </section>

      {/* Current Round Bid History */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-md">Bid History for Current Round</h2>
            {currentRoundBids.length > 0 && (
              <p className="text-sm text-text-secondary">
                Total: {currentRoundBids.length} bids
              </p>
            )}
          </div>
          <BidHistoryTable
            key={data?.CurRoundNum ?? 0}
            bids={currentRoundBids}
            emptyMessage="No bids in current round yet"
          />
        </Container>
      </section>

      {/* Overall Statistics */}
      <section className="py-12">
        <Container>
          <h2 className="heading-md mb-6">Overall Statistics</h2>
          <Card glass className="p-8">
            <div className="space-y-1">
              {overallStats.map((stat) => (
                <StatItem key={stat.title} title={stat.title} value={stat.value} />
              ))}
            </div>
          </Card>
        </Container>
      </section>

      {/* Community Tables */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <h2 className="heading-md mb-8">Community Leaders</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Unique Bidders */}
            <div>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                Unique Bidders ({uniqueBidders.length})
              </h3>
              <Card glass className="overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full">
                    <thead className="bg-background-elevated border-b border-text-muted/10 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                          Address
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                          Bids
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueBidders.slice(0, 50).map((bidder: UniqueBidder, index: number) => (
                        <tr
                          key={bidder.BidderAddr}
                          className={`border-b border-text-muted/5 ${
                            index % 2 === 0 ? "bg-background-surface/30" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <Link 
                              href={`/user/${bidder.BidderAddr}`}
                              className="hover:underline"
                            >
                              <AddressDisplay
                                address={bidder.BidderAddr}
                                shorten={true}
                                chars={8}
                                showCopy={false}
                                showLink={false}
                              />
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-text-primary">
                            {bidder.NumBids.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Unique Winners */}
            <div>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                Unique Winners ({uniqueWinners.length})
              </h3>
              <Card glass className="overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full">
                    <thead className="bg-background-elevated border-b border-text-muted/10 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                          Address
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                          Wins
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                          Total Won
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                          Max Win
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueWinners.slice(0, 50).map((winner: UniqueWinner, index: number) => (
                        <tr
                          key={winner.WinnerAddr}
                          className={`border-b border-text-muted/5 ${
                            index % 2 === 0 ? "bg-background-surface/30" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <Link 
                              href={`/user/${winner.WinnerAddr}`}
                              className="hover:underline"
                            >
                              <AddressDisplay
                                address={winner.WinnerAddr}
                                shorten={true}
                                chars={8}
                                showCopy={false}
                                showLink={false}
                              />
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-text-primary">
                            {winner.PrizesCount}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-text-primary">
                            {winner.WinnerStats.PrizesSumEth.toFixed(4)} ETH
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-text-primary">
                            {winner.WinnerStats.MaxWinAmountEth.toFixed(4)} ETH
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Unique Donors */}
            <div>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                Unique ETH Donors ({uniqueDonors.length})
              </h3>
              <Card glass className="overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full">
                    <thead className="bg-background-elevated border-b border-text-muted/10 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                          Address
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                          Donations
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueDonors.slice(0, 50).map((donor: UniqueDonor, index: number) => (
                        <tr
                          key={donor.DonorAddr}
                          className={`border-b border-text-muted/5 ${
                            index % 2 === 0 ? "bg-background-surface/30" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <Link 
                              href={`/user/${donor.DonorAddr}`}
                              className="hover:underline"
                            >
                              <AddressDisplay
                                address={donor.DonorAddr}
                                shorten={true}
                                chars={8}
                                showCopy={false}
                                showLink={false}
                              />
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-text-primary">
                            {donor.NumDonations}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Token Distribution */}
      <section className="py-12">
        <Container>
          <div className="space-y-8">
            {/* Donated NFT Distribution */}
            {data.MainStats.DonatedTokenDistribution &&
              data.MainStats.DonatedTokenDistribution.length > 0 && (
                <div>
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Donated Token Distribution per Contract Address
                  </h3>
                  <Card glass className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-background-elevated border-b border-text-muted/10">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                              Contract Address
                            </th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                              Number of Donations
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.MainStats.DonatedTokenDistribution.map(
                            (item: DonatedTokenDistribution, index: number) => {
                              const { contractAddr, numDonated } = donatedTokenDistrRow(item);
                              return (
                                <tr
                                  key={`${contractAddr}-${index}`}
                                  className={`border-b border-text-muted/5 ${
                                    index % 2 === 0 ? "bg-background-surface/30" : ""
                                  }`}
                                >
                                  <td className="px-6 py-4">
                                    {contractAddr ? (
                                      <AddressDisplay
                                        address={contractAddr}
                                        shorten={true}
                                        chars={10}
                                      />
                                    ) : (
                                      <span className="text-text-muted">—</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono text-text-primary">
                                    {numDonated}
                                  </td>
                                </tr>
                              );
                            },
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

            {/* CST Distribution */}
            {cstDistribution.length > 0 && (
              <div>
                <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  Cosmic Signature Token (ERC721) Distribution (Top 50)
                </h3>
                <Card glass className="overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full">
                      <thead className="bg-background-elevated border-b border-text-muted/10 sticky top-0">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                            Owner Address
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                            Tokens Owned
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cstDistribution.slice(0, 50).map((item: CSTDistribution, index: number) => (
                          <tr
                            key={item.OwnerAddr}
                            className={`border-b border-text-muted/5 ${
                              index % 2 === 0 ? "bg-background-surface/30" : ""
                            }`}
                          >
                            <td className="px-6 py-4">
                              <Link 
                                href={`/user/${item.OwnerAddr}`}
                                className="hover:underline"
                              >
                                <AddressDisplay
                                  address={item.OwnerAddr}
                                  shorten={true}
                                  chars={8}
                                  showCopy={false}
                                  showLink={false}
                                />
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-text-primary">
                              {item.NumTokens}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* CT Balance Distribution */}
            {ctBalanceDistribution.length > 0 && (
              <div>
                <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  Cosmic Signature Token (ERC20) Balance Distribution (Top 20)
                </h3>
                <Card glass className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-background-elevated border-b border-text-muted/10">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                            Holder Address
                          </th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                            Balance (CST)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ctBalanceDistribution.slice(0, 20).map((item: CTBalanceDistribution, index: number) => (
                          <tr
                            key={item.OwnerAddr}
                            className={`border-b border-text-muted/5 ${
                              index % 2 === 0 ? "bg-background-surface/30" : ""
                            }`}
                          >
                            <td className="px-6 py-4">
                              <Link 
                                href={`/user/${item.OwnerAddr}`}
                                className="hover:underline"
                              >
                                <AddressDisplay
                                  address={item.OwnerAddr}
                                  shorten={true}
                                  chars={8}
                                  showCopy={false}
                                  showLink={false}
                                />
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-text-primary">
                              {item.BalanceFloat.toFixed(2)}
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
        </Container>
      </section>

      {/* Staking Statistics */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <h2 className="heading-md mb-6">Staking Statistics</h2>

          {/* Staking Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("cst")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "cst"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10"
              }`}
            >
              Cosmic Signature Staking
            </button>
            <button
              onClick={() => setActiveTab("rwlk")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "rwlk"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10"
              }`}
            >
              RandomWalk Staking
            </button>
          </div>

          {/* CST Staking Tab */}
          {activeTab === "cst" && (
            <Card glass className="p-8">
              <div className="space-y-4 mb-8">
                <StatItem
                  title="Number of Active Stakers"
                  value={data.MainStats.StakeStatisticsCST.NumActiveStakers}
                />
                <StatItem
                  title="Number of Staking Rewards Deposits"
                  value={data.MainStats.StakeStatisticsCST.NumDeposits}
                />
                <StatItem
                  title="Total Staking Rewards"
                  value={formatEthValue(data.MainStats.StakeStatisticsCST.TotalRewardEth)}
                />
                <StatItem
                  title="Total Tokens Minted"
                  value={data.MainStats.StakeStatisticsCST.TotalTokensMinted}
                />
                <StatItem
                  title="Total Tokens Staked"
                  value={
                    <Link
                      href="/game/statistics/cst-staked-tokens"
                      className="text-primary hover:underline"
                    >
                      {data.MainStats.StakeStatisticsCST.TotalTokensStaked}
                    </Link>
                  }
                />
                <StatItem
                  title="Unclaimed Staking Rewards"
                  value={formatEthValue(data.MainStats.StakeStatisticsCST.UnclaimedRewardEth)}
                />
              </div>

              {/* Unique CST Stakers Table */}
              {uniqueCSTStakers.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-serif text-lg font-semibold text-text-primary mb-4">
                    Unique Stakers ({uniqueCSTStakers.length})
                  </h4>
                  <div className="overflow-x-auto max-h-[400px] rounded-lg border border-text-muted/10">
                    <table className="w-full">
                      <thead className="bg-background-elevated border-b border-text-muted/10 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                            Address
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">
                            Total Reward
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueCSTStakers.slice(0, 50).map((staker: UniqueStaker, index: number) => (
                          <tr
                            key={staker.StakerAddr}
                            className={`border-b border-text-muted/5 ${
                              index % 2 === 0 ? "bg-background-surface/30" : ""
                            }`}
                          >
                            <td className="px-6 py-3">
                              <Link 
                                href={`/user/${staker.StakerAddr}`}
                                className="hover:underline"
                              >
                                <AddressDisplay
                                  address={staker.StakerAddr}
                                  shorten={true}
                                  chars={8}
                                  showCopy={false}
                                  showLink={false}
                                />
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-text-primary text-sm">
                              {(Number(staker.TotalRewardEth) || 0).toFixed(4)} ETH
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* RWLK Staking Tab */}
          {activeTab === "rwlk" && (
            <Card glass className="p-8">
              <div className="space-y-4 mb-8">
                <StatItem
                  title="Number of Active Stakers"
                  value={
                    rwlkStakedAllLoading && rwlkStakedAllRaw === undefined
                      ? "…"
                      : rwlkDistinctStakerCount !== null
                        ? rwlkDistinctStakerCount
                        : data.MainStats.StakeStatisticsRWalk.NumActiveStakers
                  }
                />
                <StatItem
                  title="Total Tokens Minted"
                  value={data.MainStats.StakeStatisticsRWalk.TotalTokensMinted}
                />
                <StatItem
                  title="Total Tokens Staked"
                  value={data.MainStats.StakeStatisticsRWalk.TotalTokensStaked}
                />
              </div>

              {/* Unique RWLK Stakers Table */}
              {uniqueRWLKStakers.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-serif text-lg font-semibold text-text-primary mb-4">
                    Unique Stakers ({uniqueRWLKStakers.length})
                  </h4>
                  <div className="overflow-x-auto max-h-[400px] rounded-lg border border-text-muted/10">
                    <table className="w-full">
                      <thead className="bg-background-elevated border-b border-text-muted/10 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">
                            Address
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">
                            Token rewards
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueRWLKStakers.slice(0, 50).map((staker: ApiUniqueStakerRWalk, index: number) => (
                          <tr
                            key={staker.StakerAddr}
                            className={`border-b border-text-muted/5 ${
                              index % 2 === 0 ? "bg-background-surface/30" : ""
                            }`}
                          >
                            <td className="px-6 py-3">
                              <Link 
                                href={`/user/${staker.StakerAddr}`}
                                className="hover:underline"
                              >
                                <AddressDisplay
                                  address={staker.StakerAddr}
                                  shorten={true}
                                  chars={8}
                                  showCopy={false}
                                  showLink={false}
                                />
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-text-primary text-sm">
                              {Number(staker.TotalTokensMinted ?? 0).toLocaleString()} NFT
                              {Number(staker.TotalTokensMinted ?? 0) !== 1 ? "s" : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}
        </Container>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Round Activations (System Mode Changes)                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-12">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-text-primary mb-2">
                Round Activations
              </h2>
              <p className="text-text-secondary text-sm">
                History of system mode changes and round activation events.
              </p>
            </div>

            {systemModeChanges === null ? (
              <Card glass className="p-8 text-center">
                <Loader2 className="animate-spin mx-auto mb-3 text-primary" size={28} />
                <p className="text-text-secondary text-sm">Loading round activations...</p>
              </Card>
            ) : (
              <SystemModesTable list={systemModeChanges} />
            )}
          </motion.div>
        </Container>
      </section>
    </div>
  );
}

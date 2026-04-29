"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Clock, TrendingUp, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import { ElegantTable } from "@/components/data/ElegantTable";
import { BidHistoryTable } from "@/components/game/BidHistoryTable";
import { formatDate, formatDuration, safeTimestamp } from "@/lib/utils";
import api from "@/services/api";
import type { ApiRaffleNFTWinner, ApiRaffleDepositResponse, ApiRoundDetail } from "@/services/apiTypes";
import type { ComponentBidData } from "@/lib/apiTransforms";

type RaffleNFTWinner = ApiRaffleNFTWinner;
type RaffleETHDeposit = ApiRaffleDepositResponse;
type RoundDetail = ApiRoundDetail;

/**
 * True round length in seconds. Prefers `cg_round_stats.round_duration_seconds` from the API.
 * The old UI used `TimeoutTs - claimTxTime`, which is “time from claim to timeout” and is often ~0
 * when the winner claimed at the deadline — not the length of the round.
 */
function getRoundDurationSeconds(round: ApiRoundDetail): number {
  const rs = round.RoundStats;
  if (typeof rs?.RoundDurationSeconds === "number" && rs.RoundDurationSeconds > 0) {
    return Number(rs.RoundDurationSeconds);
  }
  const start = rs?.RoundStartTime ? Date.parse(String(rs.RoundStartTime)) : NaN;
  const end = rs?.RoundEndTime ? Date.parse(String(rs.RoundEndTime)) : NaN;
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    return Math.floor((end - start) / 1000);
  }
  const timeoutTs = round.MainPrize?.TimeoutTs ?? 0;
  const claimTs = round.ClaimPrizeTx?.Tx?.TimeStamp ?? 0;
  if (timeoutTs > 0 && claimTs > 0 && timeoutTs >= claimTs) {
    return timeoutTs - claimTs;
  }
  return 0;
}

function formatRaffleEthAmount(eth: RaffleETHDeposit): string {
  const raw = eth.Amount;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return `${raw.toFixed(4)} ETH`;
  }
  return "—";
}

function raffleNftPrizeDescription(w: RaffleNFTWinner): string {
  const id = w.TokenId ?? 0;
  const cst = w.CstAmountEth;
  if (typeof cst === "number" && cst > 0) {
    return `Cosmic Signature #${id} · ${cst.toFixed(2)} CST`;
  }
  return `Cosmic Signature #${id}`;
}

export default function RoundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const roundNum = parseInt(id);
  
  const [activeTab, setActiveTab] = useState<
    "overview" | "recipients" | "stats" | "gestures" | "contributions"
  >("overview");

  const { data: round, isLoading: loading, error: roundError } = useApiQuery<RoundDetail>(
    "cycle-info-" + roundNum,
    () => api.getRoundInfo(roundNum) as Promise<unknown> as Promise<RoundDetail>,
  );
  const error = roundError?.message ?? null;

  const { data: gesturesData, isLoading: isLoadingGestures } = useApiQuery(
    "gestures-cycle-" + roundNum,
    () => api.getBidListByRound(round!.RoundNum, "desc"),
    { enabled: !!round },
  );
  const gestures = (gesturesData ?? []) as ComponentBidData[];

  const { data: donationsData, isLoading: isLoadingDonations } = useApiQuery(
    "contributions-cycle-" + roundNum,
    async () => {
      const [ethDonationsData, nftDonationsData] = await Promise.all([
        api.getETHDonationsByRound(round!.RoundNum),
        api.getNFTDonationsByRound(round!.RoundNum),
      ]);

      const eth = ethDonationsData.map(
        (donation: Record<string, unknown>) => ({
          id: (donation.EvtLogId as number) || 0,
          donor: (donation.DonorAddr as string) || "0x0",
          amount: parseFloat((donation.Amount as string) || "0") / 1e18,
          timestamp: (donation.TimeStamp as number) || 0,
          message: (donation.Message as string) || undefined,
        })
      );

      const nft = nftDonationsData.map(
        (donation: Record<string, unknown>) => ({
          id: (donation.EvtLogId as number) || 0,
          donor: (donation.DonorAddr as string) || "0x0",
          tokenId: (donation.TokenId as number) || 0,
          contractAddress: (donation.NftAddr as string) || "0x0",
          timestamp: (donation.TimeStamp as number) || 0,
        })
      );

      return { eth, nft };
    },
    { enabled: !!round },
  );
  const ethDonations = donationsData?.eth ?? [];
  const nftDonations = donationsData?.nft ?? [];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-text-secondary">Loading cycle data...</p>
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
              {error ? "Error Loading Cycle" : "Cycle Not Found"}
            </h1>
            <p className="text-text-secondary mb-6">
              {error || "This cycle doesn't exist or hasn't been played yet."}
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
  const durationSeconds = getRoundDurationSeconds(round);
  const totalPool = round.MainPrize.EthAmountEth + round.StakingDeposit.StakingDepositAmountEth + round.RoundStats.TotalRaffleEthDepositsEth;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Game", href: "/game/play" },
              { label: "History" },
              { label: "Cycles", href: "/game/history/rounds" },
              { label: `Cycle ${round.RoundNum}` },
            ]}
            className="mb-8"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div>
                <h1 className="heading-xl mb-2">Cycle {round.RoundNum}</h1>
                <p className="text-text-secondary">
                  Completed on {formatDate(new Date(safeTimestamp(round)))} •
                  Duration: {formatDuration(durationSeconds * 1000)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-text-secondary mb-1">
                  Total Allocation Pool
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
              <p className="text-sm text-text-secondary">Total Gestures</p>
            </div>
            <div className="text-center">
              <Trophy size={24} className="text-primary mx-auto mb-2" />
              <p className="font-mono text-2xl font-semibold text-text-primary">
                {round.RoundStats.TotalRaffleNFTs + 3}
              </p>
              <p className="text-sm text-text-secondary">Allocation Recipients</p>
            </div>
            <div className="text-center">
              <TrendingUp size={24} className="text-primary mx-auto mb-2" />
              <p className="font-mono text-2xl font-semibold text-text-primary">
                {round.RoundStats.TotalDonatedCount}
              </p>
              <p className="text-sm text-text-secondary">Contributions</p>
            </div>
            <div className="text-center">
              <Clock size={24} className="text-primary mx-auto mb-2" />
              <p className="text-lg font-semibold text-text-primary px-1 leading-tight">
                {formatDuration(durationSeconds * 1000)}
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
              onClick={() => setActiveTab("recipients")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "recipients"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              Recipients
            </button>
            <button
              onClick={() => setActiveTab("gestures")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "gestures"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              Gestures ({gestures.length})
            </button>
            <button
              onClick={() => setActiveTab("contributions")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "contributions"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              Contributions ({ethDonations.length + nftDonations.length})
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
                        Main Allocation Recipient
                      </h3>
                      <AddressDisplay address={round.MainPrize.WinnerAddr} />
                      <p className="text-sm text-text-secondary mt-2">
                        NFT #{round.MainPrize.NftTokenId} awarded
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary mb-1">
                      Allocation Amount
                    </p>
                    <p className="font-mono text-4xl font-bold text-primary">
                      {round.MainPrize.EthAmountEth.toFixed(4)}
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
                    address={round.EnduranceChampion.WinnerAddr}
                    className="mb-4"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Allocation:</span>
                    <span className="font-mono text-lg text-primary">
                      {round.EnduranceChampion.CstAmountEth.toFixed(0)} CST
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-text-secondary">NFT:</span>
                    <span className="font-mono text-sm text-text-primary">
                      #{round.EnduranceChampion.NftTokenId}
                    </span>
                  </div>
                </Card>

                <Card glass className="p-6">
                  <h4 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Chrono-Warrior
                  </h4>
                  <AddressDisplay
                    address={round.ChronoWarrior.WinnerAddr}
                    className="mb-4"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">ETH Allocation:</span>
                    <span className="font-mono text-lg text-primary">
                      {round.ChronoWarrior.EthAmountEth.toFixed(4)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-text-secondary">CST Allocation:</span>
                    <span className="font-mono text-sm text-text-primary">
                      {round.ChronoWarrior.CstAmountEth.toFixed(0)} CST
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-text-secondary">NFT:</span>
                    <span className="font-mono text-sm text-text-primary">
                      #{round.ChronoWarrior.NftTokenId}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Raffle & Staking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card glass className="p-6">
                  <h4 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Stellar Selection Allocations
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">
                        ETH Recipients:
                      </span>
                      <span className="text-text-primary">
                        {round.RaffleETHDeposits?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">
                        NFT Recipients:
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
                    Anchoring & Public Goods
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">
                        To Anchor-holders:
                      </span>
                      <span className="font-mono text-status-success">
                        {round.StakingDeposit.StakingDepositAmountEth.toFixed(4)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">
                        To Public Goods:
                      </span>
                      <span className="font-mono text-status-error">
                        {(round.CharityDeposit?.CharityAmountETH ?? 0).toFixed(4)} ETH
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "recipients" && (
            <Card glass className="p-8">
              <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                All Allocation Recipients
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Main Allocation
                      </p>
                      <AddressDisplay address={round.MainPrize.WinnerAddr} />
                    </div>
                    <span className="font-mono text-xl text-primary">
                      {round.MainPrize.EthAmountEth.toFixed(4)} ETH
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background-elevated">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Endurance Champion
                      </p>
                      <AddressDisplay address={round.EnduranceChampion.WinnerAddr} />
                    </div>
                    <span className="font-mono text-xl text-primary">
                      {round.EnduranceChampion.CstAmountEth.toFixed(0)} CST
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background-elevated">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">
                        Chrono-Warrior
                      </p>
                      <AddressDisplay address={round.ChronoWarrior.WinnerAddr} />
                    </div>
                    <span className="font-mono text-xl text-primary">
                      {round.ChronoWarrior.EthAmountEth.toFixed(4)} ETH
                    </span>
                  </div>
                </div>

                <div className="space-y-8 rounded-lg bg-background-elevated p-4 border border-text-muted/10">
                  <div>
                    <p className="text-sm font-semibold text-text-primary mb-3">
                      Stellar Selection recipients
                    </p>
                    <p className="text-xs text-text-secondary mb-4">
                      ETH stellar selections, participant-pool NFT stellar selections, and anchoring (Random Walk) NFT stellar selections for this cycle.
                    </p>

                    {(round.RaffleETHDeposits?.length ?? 0) > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-text-secondary mb-2">
                          ETH raffle ({round.RaffleETHDeposits!.length})
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-text-muted/10">
                          <table className="w-full text-sm">
                            <thead className="bg-background-surface border-b border-text-muted/10">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                  Recipient
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                  Allocation
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                  Slot
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-text-muted/10">
                              {round.RaffleETHDeposits!.map((row, i) => (
                                <tr key={`eth-${row.RecordId ?? i}-${row.WinnerIndex ?? i}`}>
                                  <td className="px-3 py-2">
                                    {row.WinnerAddr ? (
                                      <Link
                                        href={`/user/${row.WinnerAddr}`}
                                        className="hover:underline"
                                      >
                                        <AddressDisplay
                                          address={row.WinnerAddr}
                                          shorten
                                          chars={8}
                                          showCopy={false}
                                          showLink={false}
                                        />
                                      </Link>
                                    ) : (
                                      <span className="text-text-muted">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-text-primary">
                                    {formatRaffleEthAmount(row)}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-text-secondary">
                                    {row.WinnerIndex ?? "—"}
                                  </td>
                                  <td className="px-3 py-2">
                                    {row.Claimed ? (
                                      <Badge variant="success">Claimed</Badge>
                                    ) : (
                                      <Badge variant="default">Unclaimed</Badge>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {(round.RaffleNFTWinners?.length ?? 0) > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-text-secondary mb-2">
                          NFT raffle — bidders ({round.RaffleNFTWinners!.length})
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-text-muted/10">
                          <table className="w-full text-sm">
                            <thead className="bg-background-surface border-b border-text-muted/10">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                  Recipient
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                  Allocation
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                  Slot
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-text-muted/10">
                              {round.RaffleNFTWinners!.map((w, i) => (
                                <tr key={`nft-gesture-${w.RecordId ?? i}-${w.WinnerIndex ?? i}`}>
                                  <td className="px-3 py-2">
                                    {w.WinnerAddr ? (
                                      <Link
                                        href={`/user/${w.WinnerAddr}`}
                                        className="hover:underline"
                                      >
                                        <AddressDisplay
                                          address={w.WinnerAddr}
                                          shorten
                                          chars={8}
                                          showCopy={false}
                                          showLink={false}
                                        />
                                      </Link>
                                    ) : (
                                      <span className="text-text-muted">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-text-primary">
                                    <Link
                                      href={`/gallery/${w.TokenId}`}
                                      className="font-mono text-primary hover:underline"
                                    >
                                      {raffleNftPrizeDescription(w)}
                                    </Link>
                                  </td>
                                  <td className="px-3 py-2 font-mono text-text-secondary">
                                    {w.WinnerIndex ?? "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {(round.StakingNFTWinners?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-2">
                          NFT raffle — staking (Random Walk) ({round.StakingNFTWinners!.length})
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-text-muted/10">
                          <table className="w-full text-sm">
                            <thead className="bg-background-surface border-b border-text-muted/10">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                  Recipient
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                  Allocation
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-text-primary">
                                  Slot
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-text-muted/10">
                              {round.StakingNFTWinners!.map((w, i) => (
                                <tr key={`nft-stk-${w.RecordId ?? i}-${w.WinnerIndex ?? i}`}>
                                  <td className="px-3 py-2">
                                    {w.WinnerAddr ? (
                                      <Link
                                        href={`/user/${w.WinnerAddr}`}
                                        className="hover:underline"
                                      >
                                        <AddressDisplay
                                          address={w.WinnerAddr}
                                          shorten
                                          chars={8}
                                          showCopy={false}
                                          showLink={false}
                                        />
                                      </Link>
                                    ) : (
                                      <span className="text-text-muted">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-text-primary">
                                    <span className="font-mono">
                                      Random Walk #{w.TokenId}
                                      {typeof w.CstAmountEth === "number" && w.CstAmountEth > 0
                                        ? ` · ${w.CstAmountEth.toFixed(2)} CST`
                                        : ""}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 font-mono text-text-secondary">
                                    {w.WinnerIndex ?? "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {(round.RaffleETHDeposits?.length ?? 0) === 0 &&
                      (round.RaffleNFTWinners?.length ?? 0) === 0 &&
                      (round.StakingNFTWinners?.length ?? 0) === 0 && (
                        <p className="text-sm text-text-muted">
                          No stellar selection allocations recorded for this cycle.
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "stats" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card glass className="p-8">
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                  Cycle Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between pb-3 border-b border-text-muted/10">
                    <span className="text-text-secondary">Total Gestures</span>
                    <span className="font-mono text-text-primary font-semibold">
                      {round.RoundStats.TotalBids}
                    </span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-text-muted/10">
                    <span className="text-text-secondary">Duration</span>
                    <span className="font-mono text-text-primary font-semibold">
                      {formatDuration(durationSeconds * 1000)}
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
                      Main Allocation CST
                    </span>
                    <span className="font-mono text-primary font-semibold">
                      {round.MainPrize.CstAmountEth.toFixed(0)} CST
                    </span>
                  </div>
                </div>
              </Card>

              <Card glass className="p-8">
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                  Allocation Distribution
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Main Allocation", value: round.MainPrize.EthAmountEth },
                    {
                      label: "Chrono-Warrior",
                      value: round.ChronoWarrior.EthAmountEth,
                    },
                    { label: "Stellar Selection", value: round.RoundStats.TotalRaffleEthDepositsEth },
                    { label: "Staking", value: round.StakingDeposit.StakingDepositAmountEth },
                    { label: "Public Goods", value: round.CharityDeposit?.CharityAmountETH ?? 0 },
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

          {activeTab === "gestures" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                  All gestures for cycle {round.RoundNum}
                </h3>
                <p className="text-text-secondary mb-6">
                  Complete gesture history for this cycle ({gestures.length} total
                  gestures)
                </p>
              </div>

              {isLoadingGestures ? (
                <Card glass className="p-12 text-center">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-text-secondary">Loading gestures...</p>
                  </div>
                </Card>
              ) : (
                <BidHistoryTable
                  key={round.RoundNum}
                  gestures={gestures}
                  emptyMessage="No gestures found for this cycle."
                />
              )}
            </div>
          )}

          {activeTab === "contributions" && (
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                  Contributions for cycle {round.RoundNum}
                </h3>
                <p className="text-text-secondary mb-6">
                  All ETH and NFT contributions received during this cycle
                </p>
              </div>

              {/* ETH contributions */}
              <div>
                <h4 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  ETH contributions ({ethDonations.length})
                </h4>
                {isLoadingDonations ? (
                  <Card glass className="p-12 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-text-secondary">
                        Loading contributions...
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
                        label: "Contributor",
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
                    emptyMessage="No ETH contributions for this cycle."
                  />
                ) : (
                  <Card glass className="p-8 text-center">
                    <p className="text-text-secondary">
                      No ETH contributions for this cycle.
                    </p>
                  </Card>
                )}
              </div>

              {/* NFT contributions */}
              <div>
                <h4 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  NFT contributions ({nftDonations.length})
                </h4>
                {isLoadingDonations ? (
                  <Card glass className="p-12 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-text-secondary">
                        Loading contributions...
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
                        label: "Contributor",
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
                    emptyMessage="No NFT contributions for this cycle."
                  />
                ) : (
                  <Card glass className="p-8 text-center">
                    <p className="text-text-secondary">
                      No NFT contributions for this cycle.
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

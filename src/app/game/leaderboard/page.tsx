"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatEth, shortenAddress } from "@/lib/utils";
import api from "@/services/api";

interface LeaderboardEntry {
  rank: number;
  address: string;
  ensName?: string;
  value: number;
  nftsWon?: number;
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<"all-time" | "current">("current");
  const [category, setCategory] = useState<"prizes" | "bids" | "spending">(
    "prizes"
  );
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaderboard data
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setIsLoading(true);

        let data: LeaderboardEntry[] = [];

        if (category === "prizes") {
          // Get top prize winners
          const winners = await api.getUniqueWinners();
          data = winners
            .slice(0, 50)
            .map((winner: Record<string, unknown>, index: number) => ({
              rank: index + 1,
              address: (winner.Address as string) || "0x0",
              value: (winner.TotalWinningsEth as number) || 0,
              nftsWon: (winner.NumWinnings as number) || 0,
            }));
        } else if (category === "bids") {
          // Get top bidders
          const bidders = await api.getUniqueBidders();
          data = bidders
            .slice(0, 50)
            .map((bidder: Record<string, unknown>, index: number) => ({
              rank: index + 1,
              address: (bidder.Address as string) || "0x0",
              value: (bidder.NumBids as number) || 0,
              nftsWon: (bidder.NumWinnings as number) || 0,
            }));
        } else {
          // Get top spenders
          const bidders = await api.getUniqueBidders();
          // Sort by total spent
          const sorted = [...bidders].sort(
            (a: Record<string, unknown>, b: Record<string, unknown>) =>
              ((b.TotalSpentEth as number) || 0) -
              ((a.TotalSpentEth as number) || 0)
          );
          data = sorted
            .slice(0, 50)
            .map((bidder: Record<string, unknown>, index: number) => ({
              rank: index + 1,
              address: (bidder.Address as string) || "0x0",
              value: (bidder.TotalSpentEth as number) || 0,
              nftsWon: (bidder.NumWinnings as number) || 0,
            }));
        }

        setLeaderboardData(data);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [category, timeframe]);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-primary";
    if (rank === 2) return "text-accent-platinum";
    if (rank === 3) return "text-status-warning";
    return "text-text-muted";
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="heading-xl text-balance mb-6">Leaderboard</h1>
            <p className="body-xl">
              Discover the top players, biggest winners, and most active
              participants in Cosmic Signature
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Controls */}
      <section className="py-6 bg-background-surface/30 sticky top-[72px] lg:top-[88px] z-40 backdrop-blur-xl border-b border-text-muted/10">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {/* Timeframe Selector */}
            <div className="flex p-1 rounded-lg bg-background-elevated border border-text-muted/10">
              <button
                onClick={() => setTimeframe("current")}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  timeframe === "current"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Current Round
              </button>
              <button
                onClick={() => setTimeframe("all-time")}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  timeframe === "all-time"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                All-Time
              </button>
            </div>

            {/* Category Selector */}
            <div className="flex p-1 rounded-lg bg-background-elevated border border-text-muted/10">
              <button
                onClick={() => setCategory("prizes")}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  category === "prizes"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Prizes Won
              </button>
              <button
                onClick={() => setCategory("bids")}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  category === "bids"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Most Bids
              </button>
              <button
                onClick={() => setCategory("spending")}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  category === "spending"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Highest Spending
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* Top 3 Podium */}
      <section className="py-12">
        <Container>
          {!isLoading && leaderboardData.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="md:order-1"
              >
                <Card
                  glass
                  className="p-6 text-center border-accent-platinum/20"
                >
                  <Medal
                    size={32}
                    className="text-accent-platinum mx-auto mb-3"
                  />
                  <div className="font-mono text-sm text-text-secondary mb-2">
                    #2
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-1">
                    {leaderboardData[1]?.ensName ||
                      shortenAddress(leaderboardData[1]?.address)}
                  </h3>
                  <p className="font-mono text-2xl font-bold text-accent-platinum mb-2">
                    {category === "bids"
                      ? Math.floor(leaderboardData[1]?.value)
                      : formatEth(leaderboardData[1]?.value) + " ETH"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {leaderboardData[1]?.nftsWon} NFTs Won
                  </p>
                </Card>
              </motion.div>

              {/* 1st Place (Taller) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:order-2"
              >
                <Card
                  glass
                  className="p-8 text-center border-primary/30 shadow-luxury-lg"
                >
                  <Trophy size={40} className="text-primary mx-auto mb-4" />
                  <div className="font-mono text-sm text-text-secondary mb-2">
                    #1
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                    {leaderboardData[0]?.ensName ||
                      shortenAddress(leaderboardData[0]?.address)}
                  </h3>
                  <p className="font-mono text-3xl font-bold text-primary mb-3">
                    {category === "bids"
                      ? Math.floor(leaderboardData[0]?.value)
                      : formatEth(leaderboardData[0]?.value) + " ETH"}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {leaderboardData[0]?.nftsWon} NFTs Won
                  </p>
                </Card>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="md:order-3"
              >
                <Card
                  glass
                  className="p-6 text-center border-status-warning/20"
                >
                  <Medal
                    size={32}
                    className="text-status-warning mx-auto mb-3"
                  />
                  <div className="font-mono text-sm text-text-secondary mb-2">
                    #3
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-1">
                    {leaderboardData[2]?.ensName ||
                      shortenAddress(leaderboardData[2]?.address)}
                  </h3>
                  <p className="font-mono text-2xl font-bold text-status-warning mb-2">
                    {category === "bids"
                      ? Math.floor(leaderboardData[2]?.value)
                      : formatEth(leaderboardData[2]?.value) + " ETH"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {leaderboardData[2]?.nftsWon} NFTs Won
                  </p>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Full Leaderboard */}
          <Card glass>
            <CardHeader>
              <CardTitle>
                {category === "prizes"
                  ? "Top Prize Winners"
                  : category === "bids"
                  ? "Most Active Bidders"
                  : "Highest Spenders"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-text-muted/10 bg-background-elevated/50">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium text-text-secondary">
                        Rank
                      </th>
                      <th className="p-4 text-left text-sm font-medium text-text-secondary">
                        Player
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-text-secondary">
                        {category === "prizes"
                          ? "Prizes Won"
                          : category === "bids"
                          ? "Total Bids"
                          : "Total Spent"}
                      </th>
                      <th className="p-4 text-right text-sm font-medium text-text-secondary">
                        NFTs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-text-muted/10">
                    {isLoading
                      ? [...Array(10)].map((_, index) => (
                          <tr key={index} className="animate-pulse">
                            <td className="p-4">
                              <div className="h-6 bg-background-elevated rounded w-12" />
                            </td>
                            <td className="p-4">
                              <div className="h-6 bg-background-elevated rounded w-32" />
                            </td>
                            <td className="p-4 text-right">
                              <div className="h-6 bg-background-elevated rounded w-24 ml-auto" />
                            </td>
                            <td className="p-4 text-right">
                              <div className="h-6 bg-background-elevated rounded w-12 ml-auto" />
                            </td>
                          </tr>
                        ))
                      : leaderboardData.slice(0, 20).map((entry, index) => (
                          <motion.tr
                            key={entry.address}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="hover:bg-background-elevated/50 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`font-mono font-semibold ${getMedalColor(
                                    entry.rank
                                  )}`}
                                >
                                  {entry.rank}
                                </span>
                                {entry.rank <= 3 && (
                                  <Medal
                                    size={16}
                                    className={getMedalColor(entry.rank)}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-mono text-text-primary">
                                {entry.ensName ||
                                  shortenAddress(entry.address, 6)}
                              </p>
                            </td>
                            <td className="p-4 text-right">
                              <p className="font-mono font-semibold text-primary">
                                {category === "bids"
                                  ? Math.floor(entry.value)
                                  : formatEth(entry.value) + " ETH"}
                              </p>
                            </td>
                            <td className="p-4 text-right">
                              <Badge variant="outline">{entry.nftsWon}</Badge>
                            </td>
                          </motion.tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    </div>
  );
}

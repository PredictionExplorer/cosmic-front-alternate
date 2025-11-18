"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, Trophy, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";

interface BidData {
  EvtLogId: number;
  RoundNum: number;
  BidderAddr: string;
  BidType: number;
  BidPrice: string;
  BidPriceEth: number;
  RWalkNFTId: number;
  NumCSTTokens: string;
  TimeStamp: number;
  TxHash: string;
  Message: string;
}

export default function MyActivityPage() {
  const { address, isConnected } = useAccount();
  const [filterType, setFilterType] = useState<"all" | "eth" | "cst">("all");
  const [loading, setLoading] = useState(true);
  const [bidHistory, setBidHistory] = useState<BidData[]>([]);

  // Fetch user's bid history
  useEffect(() => {
    async function fetchActivity() {
      if (!address || !isConnected) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userInfoResponse = await api.getUserInfo(address);
        
        if (userInfoResponse && userInfoResponse.Bids) {
          // Sort by timestamp descending (most recent first)
          const sortedBids = userInfoResponse.Bids.sort((a: BidData, b: BidData) => 
            b.TimeStamp - a.TimeStamp
          );
          setBidHistory(sortedBids);
        }
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, [address, isConnected]);

  const filteredBids = bidHistory.filter((bid) => {
    if (filterType === "all") return true;
    if (filterType === "eth") return bid.BidType === 0; // ETH bids
    if (filterType === "cst") return bid.BidType === 1; // CST bids
    return true;
  });

  const activityCounts = {
    all: bidHistory.length,
    eth: bidHistory.filter((b) => b.BidType === 0).length,
    cst: bidHistory.filter((b) => b.BidType === 1).length,
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <section className="section-padding bg-background-surface/50">
          <Container>
            <Breadcrumbs
              items={[
                { label: "My Account", href: "/account" },
                { label: "Activity" },
              ]}
              className="mb-8"
            />
            <Card glass className="p-12 text-center">
              <h1 className="heading-sm mb-4">Connect Your Wallet</h1>
              <p className="text-text-secondary">
                Please connect your wallet to view your activity history
              </p>
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
              { label: "My Account", href: "/account" },
              { label: "Activity" },
            ]}
            className="mb-8"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="heading-xl mb-4">Activity Timeline</h1>
            <p className="body-lg">
              {loading
                ? "Loading your activity..."
                : `${bidHistory.length} total bid${
                    bidHistory.length !== 1 ? "s" : ""
                  } placed`}
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-[72px] lg:top-[88px] z-40 py-6 bg-background/95 backdrop-blur-xl border-b border-text-muted/10">
        <Container>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filterType === "all"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10"
              }`}
            >
              All Bids ({activityCounts.all})
            </button>
            <button
              onClick={() => setFilterType("eth")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filterType === "eth"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10"
              }`}
            >
              ETH Bids ({activityCounts.eth})
            </button>
            <button
              onClick={() => setFilterType("cst")}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filterType === "cst"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-background-elevated text-text-secondary hover:text-primary border border-text-muted/10"
              }`}
            >
              CST Bids ({activityCounts.cst})
            </button>
          </div>
        </Container>
      </section>

      {/* Activity Timeline */}
      <section className="section-padding">
        <Container size="lg">
          {loading ? (
            <Card glass className="p-12 text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
              <p className="text-text-secondary">Loading your activity...</p>
            </Card>
          ) : filteredBids.length === 0 ? (
            <Card glass className="p-12 text-center">
              <Trophy className="mx-auto mb-4 text-text-muted" size={64} />
              <h2 className="heading-sm mb-4">No Activity Yet</h2>
              <p className="text-text-secondary mb-6">
                {bidHistory.length === 0
                  ? "You haven't placed any bids yet. Start playing to see your activity here!"
                  : "No bids found for the selected filter."}
              </p>
              {bidHistory.length === 0 && (
                <Link
                  href="/game/play"
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Place Your First Bid
                </Link>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBids.map((bid, index) => (
                <motion.div
                  key={bid.EvtLogId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                >
                  <Card glass hover className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      {/* Icon & Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        <div
                          className={`flex-shrink-0 p-3 rounded-lg ${
                            bid.BidType === 0
                              ? "bg-primary/10"
                              : "bg-status-warning/10"
                          }`}
                        >
                          <Coins
                            size={24}
                            className={
                              bid.BidType === 0 ? "text-primary" : "text-status-warning"
                            }
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-serif text-lg font-semibold text-text-primary">
                              {bid.BidType === 0 ? "ETH Bid" : "CST Bid"}
                            </h3>
                            <Badge variant="default">Round {bid.RoundNum}</Badge>
                            {bid.RWalkNFTId > 0 && (
                              <Badge variant="info">
                                RandomWalk #{bid.RWalkNFTId}
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-text-secondary mb-3">
                            {formatTimestamp(bid.TimeStamp)}
                          </p>

                          {bid.Message && (
                            <div className="p-3 rounded-lg bg-background-elevated border border-text-muted/10 mb-3">
                              <p className="text-sm text-text-primary italic">
                                &ldquo;{bid.Message}&rdquo;
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-text-secondary">Bid Price: </span>
                              <span className="font-mono font-semibold text-text-primary">
                                {bid.BidType === 0
                                  ? `${bid.BidPriceEth.toFixed(6)} ETH`
                                  : `${bid.BidPriceEth.toFixed(2)} CST`}
                              </span>
                            </div>
                            {Number(bid.NumCSTTokens) > 0 && (
                              <div>
                                <span className="text-text-secondary">Earned: </span>
                                <span className="font-mono font-semibold text-status-success">
                                  {Number(bid.NumCSTTokens)} CST
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Transaction Link */}
                      <div className="flex-shrink-0">
                        <a
                          href={`https://sepolia.arbiscan.io/tx/${bid.TxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          <span className="hidden sm:inline">View TX</span>
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Load More / Stats */}
          {filteredBids.length > 0 && (
            <div className="mt-12">
              <Card glass className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">Total Bids</p>
                    <p className="text-2xl font-bold text-primary font-mono">
                      {bidHistory.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary mb-1">ETH Bids</p>
                    <p className="text-2xl font-bold text-primary font-mono">
                      {activityCounts.eth}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary mb-1">CST Bids</p>
                    <p className="text-2xl font-bold text-status-warning font-mono">
                      {activityCounts.cst}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary mb-1">Total CST Earned</p>
                    <p className="text-2xl font-bold text-status-success font-mono">
                      {bidHistory.reduce((sum, bid) => sum + Math.max(0, Number(bid.NumCSTTokens)), 0)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}

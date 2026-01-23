"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Timer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Gem,
  Users,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NFTCard } from "@/components/nft/NFTCard";
import { CountdownTimer } from "@/components/game/CountdownTimer";
import { StatCard } from "@/components/game/StatCard";
import { ElegantTable } from "@/components/data/ElegantTable";
import { ProbabilityDisplay } from "@/components/game/ProbabilityDisplay";
import { Badge } from "@/components/ui/Badge";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import { useApiData } from "@/contexts/ApiDataContext";
import { useTimeOffset } from "@/contexts/TimeOffsetContext";
import { useCosmicGameRead } from "@/hooks/useCosmicGameContract";
import api, { getAssetsUrl } from "@/services/api";
import type { ComponentBidData } from "@/lib/apiTransforms";
import { safeTimestamp } from "@/lib/utils";
import { shortenAddress } from "@/lib/web3/utils";
import { formatDate } from "@/lib/utils";

export default function Home() {
  const { dashboardData } = useApiData();
  const { applyOffset } = useTimeOffset();
  const { useCurrentChampions, useCstRewardPerBid } =
    useCosmicGameRead();
  const { data: cstRewardPerBid } = useCstRewardPerBid();
  const [featuredNFTs, setFeaturedNFTs] = useState<
    Array<{
      id: number;
      tokenId: number;
      name: string;
      customName?: string;
      seed: string;
      imageUrl: string;
      owner: string;
      round: number;
      mintedAt: string;
      attributes: unknown[];
    }>
  >([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(true);
  const [currentBids, setCurrentBids] = useState<
    Array<{
      id: number;
      bidder: string;
      bidType: string;
      bidTypeNum: number;
      amount: number;
      timestamp: number;
      message?: string;
      roundNum?: number;
      rwalkNftId?: number;
      duration?: number;
      nftDonationAddr?: string;
      nftDonationId?: number;
      erc20DonationAddr?: string;
      erc20DonationAmount?: string;
    }>
  >([]);
  const [isLoadingBids, setIsLoadingBids] = useState(true);
  const [bannedBids, setBannedBids] = useState<number[]>([]);

  // Helper function to map bid type numbers to labels
  const getBidTypeLabel = (bidType: number | string): string => {
    const typeNum = typeof bidType === "string" ? parseInt(bidType) : bidType;
    switch (typeNum) {
      case 0:
        return "ETH Bid";
      case 1:
        return "RWLK Token Bid";
      case 2:
        return "CST Bid";
      default:
        return "ETH Bid"; // Default fallback
    }
  };

  // Helper function to format bid duration
  const formatDuration = (seconds: number): string => {
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

  // Get data from dashboard API and blockchain
  const roundNum = dashboardData?.CurRoundNum;
  const lastBidder = dashboardData?.LastBidderAddr;
  const { data: championsData } = useCurrentChampions();

  // CST reward amount per bid (from contract)
  const cstRewardAmount = cstRewardPerBid 
    ? Number(cstRewardPerBid) / 1e18 
    : 100; // Fallback to 100 if not loaded yet

  // Get prize time from API
  const [mainPrizeTime, setMainPrizeTime] = useState<number | null>(null);

  // Calculate time remaining (in seconds)
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Fetch prize time from API
  useEffect(() => {
    async function fetchPrizeTime() {
      try {
        const prizeTime = await api.getPrizeTime();
        setMainPrizeTime(prizeTime);
      } catch (error) {
        console.error("Failed to fetch prize time:", error);
      }
    }
    fetchPrizeTime();
    // Refresh every 10 seconds
    const interval = setInterval(fetchPrizeTime, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mainPrizeTime) {
      const updateTime = () => {
        // Apply offset to the prize time to sync with blockchain time
        const adjustedPrizeTime = applyOffset(Number(mainPrizeTime));
        const remaining = adjustedPrizeTime - Math.floor(Date.now() / 1000);
        setTimeRemaining(Math.max(0, remaining));
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [mainPrizeTime, applyOffset]);

  // Fetch featured NFTs
  useEffect(() => {
    async function fetchNFTs() {
      try {
        const nfts = await api.getCSTList();
        // Check if nfts is null or not an array
        if (!nfts || !Array.isArray(nfts)) {
          setFeaturedNFTs([]);
          return;
        }
        // Get the 6 most recent NFTs
        const recent = nfts
          .sort(
            (a: Record<string, unknown>, b: Record<string, unknown>) =>
              ((b.TokenId as number) || 0) - ((a.TokenId as number) || 0)
          )
          .slice(0, 6)
          .map((nft: Record<string, unknown>) => ({
            id: (nft.TokenId as number) || 0,
            tokenId: (nft.TokenId as number) || 0,
            name: `Cosmic Signature #${nft.TokenId}`,
            customName: (nft.TokenName as string) || undefined,
            seed: `0x${nft.Seed}`,
            imageUrl: getAssetsUrl(`images/new/cosmicsignature/0x${nft.Seed}.png`),
            owner: (nft.WinnerAddr as string) || "0x0",
            round: (nft.RoundNum as number) || 0,
            mintedAt: safeTimestamp(nft),
            attributes: [],
          }));
        setFeaturedNFTs(recent);
      } catch (error) {
        console.error("Failed to fetch NFTs:", error);
        setFeaturedNFTs([]);
      } finally {
        setIsLoadingNFTs(false);
      }
    }
    fetchNFTs();
  }, []);

  // Fetch banned bids list
  useEffect(() => {
    async function fetchBannedBids() {
      try {
        const bids = await api.getBannedBids();
        // Check if bids is null or not an array
        if (!bids || !Array.isArray(bids)) {
          setBannedBids([]);
          return;
        }
        const bannedIds = bids.map(
          (x: Record<string, unknown>) => x.bid_id as number
        );
        setBannedBids(bannedIds);
      } catch (error) {
        console.error("Failed to fetch banned bids:", error);
      }
    }
    fetchBannedBids();
  }, []);

  // Fetch current round bids
  useEffect(() => {
    async function fetchCurrentBids() {
      try {
        const currentRoundNumber =
          roundNum?.toString() || dashboardData?.CurRoundNum?.toString();
        
        // Round 0 is valid, so check if we have a valid number (including 0)
        if (currentRoundNumber !== undefined && currentRoundNumber !== null && currentRoundNumber !== '') {
          const bids = await api.getBidListByRound(
            parseInt(currentRoundNumber),
            "desc"
          );
          // Check if bids is null or not an array
          if (!bids || !Array.isArray(bids)) {
            setCurrentBids([]);
            return;
          }

          // Get the 10 most recent bids and calculate durations
          const recentBids = bids
            .slice(0, 10)
            .map((bid: ComponentBidData, index: number) => {
              const bidTypeNum = bid.BidType || 0;
              const timestamp = bid.TimeStamp || 0;

              // Calculate duration (time between this bid and the previous one, or now for the most recent)
              let duration = 0;
              if (index === 0) {
                // Most recent bid - duration is from bid time to now
                duration = Date.now() / 1000 - timestamp;
              } else {
                // Duration is from this bid to the previous bid
                const prevTimestamp = bids[index - 1].TimeStamp || 0;
                duration = prevTimestamp - timestamp;
              }

              // For CST bids, use NumCSTTokensEth field; for ETH/RWLK bids, use BidPrice
              const amount = bidTypeNum === 2
                ? (bid.NumCSTTokensEth || 0)
                : (bid.BidPriceEth || 0);

              const processedBid = {
                id: bid.EvtLogId || 0,
                bidder: bid.BidderAddr || "0x0",
                bidType: getBidTypeLabel(bidTypeNum),
                bidTypeNum,
                amount,
                timestamp,
                message: bid.Message || undefined,
                roundNum: bid.RoundNum || undefined,
                rwalkNftId:
                  bid.RWalkNFTId !== null && bid.RWalkNFTId !== undefined
                    ? bid.RWalkNFTId
                    : undefined,
                duration,
                nftDonationAddr: bid.NFTDonationTokenAddr || undefined,
                nftDonationId:
                  bid.NFTDonationTokenId !== null &&
                  bid.NFTDonationTokenId !== undefined
                    ? bid.NFTDonationTokenId
                    : undefined,
                erc20DonationAddr: bid.DonatedERC20TokenAddr || undefined,
                erc20DonationAmount: bid.DonatedERC20TokenAmount || undefined,
              };

              return processedBid;
            });

          setCurrentBids(recentBids);
        }
      } catch (error) {
        console.error("Failed to fetch bids:", error);
        setCurrentBids([]);
      } finally {
        setIsLoadingBids(false);
      }
    }
    fetchCurrentBids();
    // Refresh bids every 10 seconds
    const interval = setInterval(fetchCurrentBids, 10000);
    return () => clearInterval(interval);
  }, [roundNum, dashboardData]);

  // Prepare display data with safe defaults
  const currentRound = {
    roundNumber: roundNum?.toString() || "0",
    prizePool: (dashboardData?.PrizeAmountEth as number) || 0,
    totalBids: (dashboardData?.CurNumBids as number) || 0,
    lastBidder: lastBidder
      ? shortenAddress(lastBidder as string, 6)
      : "No bids yet",
    totalNFTs:
      ((dashboardData?.MainStats as Record<string, unknown>)
        ?.NumCSTokenMints as number) || 0,
    contractBalance: (dashboardData?.CosmicGameBalanceEth as number) || 0,
  };

  // Extract champion addresses safely
  const championsArray = championsData as unknown as
    | [string, bigint, string, bigint]
    | undefined;
  const enduranceChampion = championsArray?.[0]
    ? shortenAddress(championsArray[0], 6)
    : "None yet";
  const chronoWarrior = championsArray?.[2]
    ? shortenAddress(championsArray[2], 6)
    : "None yet";

  // ETH bid price from API
  const [ethBidPrice, setEthBidPrice] = useState<number>(0);
  useEffect(() => {
    async function fetchPrice() {
      try {
        const priceData = await api.getETHBidPrice();
        setEthBidPrice(
          priceData?.ETHPrice ? parseFloat(priceData.ETHPrice) / 1e18 : 0
        );
      } catch (error) {
        console.error("Failed to fetch ETH price:", error);
      }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent-platinum/5 blur-3xl animate-pulse-slow animation-delay-400" />
        </div>

        <Container className="relative z-10">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="heading-xl text-balance mb-6">
                Where Strategy Meets
                <span className="block text-gradient mt-2">
                  Exceptional Art
                </span>
              </h1>
              <p className="body-xl max-w-3xl mx-auto text-balance">
                Experience the intersection of sophisticated blockchain gaming
                and premium NFT collecting. Compete in strategic auctions to win
                substantial prizes and unique digital art.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="xl" asChild>
                <Link href="/game/play">
                  Enter Game
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/gallery">View Gallery</Link>
              </Button>
            </motion.div>

            {/* Key Stats - Real Data with Fixed Height */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto"
              style={{ minHeight: "80px" }}
            >
              <div className="text-center">
                <div className="font-mono text-3xl font-semibold text-primary mb-1">
                  {currentRound.roundNumber}
                </div>
                <div className="text-sm text-text-secondary">Current Round</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-3xl font-semibold text-primary mb-1">
                  {currentRound.prizePool.toFixed(2)} ETH
                </div>
                <div className="text-sm text-text-secondary">Prize Pool</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-3xl font-semibold text-primary mb-1">
                  {currentRound.totalNFTs}+
                </div>
                <div className="text-sm text-text-secondary">NFTs Minted</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-3xl font-semibold text-primary mb-1">
                  {currentRound.totalBids}
                </div>
                <div className="text-sm text-text-secondary">Total Bids</div>
              </div>
            </motion.div>
          </div>
        </Container>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center space-y-2">
            <span className="text-xs text-text-secondary uppercase tracking-wider">
              Scroll to explore
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-6 w-px bg-gradient-to-b from-primary to-transparent"
            />
          </div>
        </motion.div>
      </section>

      {/* Current Round Status */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="heading-md text-balance mb-4"
            >
              Round {currentRound.roundNumber} is Live
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="body-lg max-w-2xl mx-auto"
            >
              Be the last bidder when the timer expires to claim the main prize
            </motion.p>
          </div>

          {/* Timer and Prize Pool - Fixed Height Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card
              glass
              className="p-8 md:p-12 text-center"
              style={{ minHeight: "400px" }}
            >
              <div className="mb-8">
                <p className="text-sm text-text-secondary mb-4 uppercase tracking-wider">
                  Time Remaining
                </p>
                <CountdownTimer
                  targetSeconds={timeRemaining}
                  size="lg"
                  showIcon={false}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div>
                  <div className="font-mono text-4xl font-semibold text-primary mb-2">
                    {currentRound.prizePool.toFixed(2)}
                  </div>
                  <div className="text-sm text-text-secondary">
                    ETH Prize Pool
                  </div>
                </div>
                <div>
                  <div className="font-mono text-4xl font-semibold text-primary mb-2">
                    {currentRound.totalBids}
                  </div>
                  <div className="text-sm text-text-secondary">Bids Placed</div>
                </div>
                <div>
                  <div className="text-2xl font-medium text-text-primary mb-2">
                    {currentRound.lastBidder}
                  </div>
                  <div className="text-sm text-text-secondary">Last Bidder</div>
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-4 text-sm text-text-secondary">
                  Current ETH Bid Price:{" "}
                  <span className="text-primary font-mono">
                    {ethBidPrice.toFixed(6)} ETH
                  </span>
                </div>
                <Button size="lg" asChild>
                  <Link href="/game/play">
                    Place Your Bid
                    <ArrowRight className="ml-2" size={20} />
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Current Champions - Real Data */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              label="Endurance Champion"
              value={enduranceChampion}
              icon={Award}
              delay={0.3}
            />
            <StatCard
              label="Chrono-Warrior"
              value={chronoWarrior}
              icon={Timer}
              delay={0.4}
            />
          </div>

          {/* Probability Display - Shows winning chances when user has placed bids */}
          <div className="mt-8">
            <ProbabilityDisplay />
          </div>
        </Container>
      </section>

      {/* Current Bids List */}
      <section className="section-padding">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-md text-balance mb-4">Recent Bids</h2>
            <p className="body-lg max-w-2xl mx-auto">
              Live view of the latest bids in Round {currentRound.roundNumber}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {isLoadingBids ? (
              <Card glass className="p-12 text-center">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-text-secondary">Loading bids...</p>
                </div>
              </Card>
            ) : Array.isArray(currentBids) && currentBids.length > 0 ? (
              <ElegantTable
                data={currentBids}
                mode="table"
                columns={[
                  {
                    key: "timestamp",
                    label: "Time",
                    sortable: true,
                    render: (value) => (
                      <span className="text-text-secondary text-sm whitespace-nowrap">
                        {typeof value === "number"
                          ? formatDate(new Date(value * 1000))
                          : "Unknown"}
                      </span>
                    ),
                  },
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
                    render: (value) => {
                      const bidTypeStr = String(value);
                      let variant: "default" | "info" | "success" = "default";

                      if (bidTypeStr.includes("ETH")) {
                        variant = "default";
                      } else if (bidTypeStr.includes("CST")) {
                        variant = "info";
                      } else if (bidTypeStr.includes("RWLK")) {
                        variant = "success";
                      }

                      return <Badge variant={variant}>{bidTypeStr}</Badge>;
                    },
                  },
                  {
                    key: "amount",
                    label: "Price",
                    sortable: true,
                    render: (value, item) => {
                      const bidTypeStr = String(item.bidType || "");
                      const amount = typeof value === "number" ? value : 0;
                      let tokenSymbol = "ETH";

                      if (bidTypeStr.includes("CST")) {
                        tokenSymbol = "CST";
                      } else if (bidTypeStr.includes("RWLK")) {
                        tokenSymbol = "ETH";
                      } else if (bidTypeStr.includes("ETH")) {
                        tokenSymbol = "ETH";
                      }

                      // Dynamic precision: 7 decimals for small amounts, 4 for larger
                      const formatted =
                        amount < 1 ? amount.toFixed(7) : amount.toFixed(4);

                      return (
                        <span className="font-mono text-primary font-semibold whitespace-nowrap">
                          {formatted} {tokenSymbol}
                        </span>
                      );
                    },
                  },
                  {
                    key: "duration",
                    label: "Duration",
                    render: (value) => (
                      <span className="text-text-secondary text-sm whitespace-nowrap">
                        {typeof value === "number"
                          ? formatDuration(value)
                          : "-"}
                      </span>
                    ),
                  },
                  {
                    key: "bidInfo",
                    label: "Bid Info",
                    render: (_value, item) => {
                      const hasRWLK =
                        item.bidTypeNum === 1 &&
                        item.rwalkNftId !== undefined &&
                        item.rwalkNftId !== null;
                      const hasNFTDonation = !!item.nftDonationAddr;
                      const hasERC20Donation = !!item.erc20DonationAddr;
                      const hasDonations = hasNFTDonation || hasERC20Donation;

                      // If no special info, return dash
                      if (!hasRWLK && !hasDonations) {
                        return (
                          <span className="text-text-secondary text-sm">-</span>
                        );
                      }

                      return (
                        <div className="text-text-secondary text-sm break-words max-w-xs">
                          {/* RWLK Token Info */}
                          {hasRWLK && (
                            <div className="mb-1">
                              Bid was made using RandomWalk Token (ID ={" "}
                              {item.rwalkNftId})
                            </div>
                          )}

                          {/* Donations Info */}
                          {hasDonations && (
                            <span>
                              {/* Bid type description */}
                              {item.bidTypeNum === 2 &&
                                "Bid was made using Cosmic Signature Tokens"}
                              {item.bidTypeNum === 0 &&
                                "Bid was made using ETH"}

                              {/* NFT Donation */}
                              {hasNFTDonation && (
                                <span>
                                  {" and a token ("}
                                  <span className="font-mono">
                                    {(item.nftDonationAddr as string).slice(
                                      0,
                                      6
                                    )}
                                    ...
                                    {(item.nftDonationAddr as string).slice(-4)}
                                  </span>
                                  {") with ID "}
                                  {item.nftDonationId}
                                  {" was donated"}
                                </span>
                              )}

                              {/* ERC20 Donation */}
                              {hasERC20Donation && (
                                <span>
                                  {" and "}
                                  <span className="font-mono">
                                    {(item.erc20DonationAddr as string).slice(
                                      0,
                                      6
                                    )}
                                    ...
                                    {(item.erc20DonationAddr as string).slice(
                                      -4
                                    )}
                                  </span>
                                  {" tokens were donated"}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    key: "message",
                    label: "Message",
                    render: (value, item) => {
                      const isBanned = bannedBids.includes(item.id as number);
                      const message = value ? String(value) : "";

                      if (isBanned || !message) {
                        return (
                          <span className="text-text-muted text-sm">-</span>
                        );
                      }

                      return (
                        <span
                          className="text-text-secondary italic text-sm truncate max-w-xs block"
                          title={message}
                        >
                          &quot;{message}&quot;
                        </span>
                      );
                    },
                  },
                ]}
                emptyMessage="No bids yet. Be the first to place a bid!"
              />
            ) : (
              <Card glass className="p-12 text-center">
                <p className="text-text-secondary mb-6">
                  No bids yet. Be the first to place a bid!
                </p>
                <Button size="lg" asChild>
                  <Link href="/game/play">
                    Place First Bid
                    <ArrowRight className="ml-2" size={20} />
                  </Link>
                </Button>
              </Card>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8"
          >
            <Button size="lg" variant="outline" asChild>
              <Link href="/game/play">
                Place Your Bid
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* Three Pillars */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="heading-md text-balance mb-4">Three Ways to Win</h2>
            <p className="body-lg max-w-2xl mx-auto">
              Multiple paths to victory ensure every player has a chance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Trophy,
                title: "Collect",
                description:
                  "Acquire premium Cosmic Signature NFTs through gameplay. Each NFT is uniquely generated with a verifiable seed.",
                features: [
                  "Unique artwork",
                  "Verifiable rarity",
                  "Stakeable assets",
                ],
              },
              {
                icon: Sparkles,
                title: "Compete",
                description:
                  "Strategic bidding across multiple prize categories. Time your bids perfectly to maximize winning chances.",
                features: [
                  "Main Prize: 25% ETH",
                  "Champion Prizes",
                  "Raffle Rewards",
                ],
              },
              {
                icon: TrendingUp,
                title: "Earn",
                description:
                  "Stake your NFTs to earn passive rewards. Every bid earns you CST tokens you can reinvest.",
                features: [
                  "6% to stakers",
                  `${cstRewardAmount} CST per bid`,
                  "Compound gains",
                ],
              },
            ].map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card glass hover className="p-8 h-full">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-4 mb-4">
                      <pillar.icon size={32} className="text-primary" />
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-text-primary mb-3">
                      {pillar.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {pillar.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center text-sm text-text-secondary"
                      >
                        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured NFTs */}
      <section className="section-padding">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="heading-md text-balance mb-4">
              Featured Collection
            </h2>
            <p className="body-lg max-w-2xl mx-auto mb-8">
              Each NFT is a unique piece of generative art, created from
              verifiable on-chain seeds
            </p>
          </motion.div>

          {/* Fixed height container to prevent layout shift */}
          <div style={{ minHeight: "600px" }}>
            {isLoadingNFTs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={`skeleton-${index}`} className="animate-pulse">
                    <Card glass className="overflow-hidden">
                      <div className="aspect-square bg-background-elevated" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-background-elevated rounded w-3/4" />
                        <div className="h-3 bg-background-elevated rounded w-1/2" />
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            ) : Array.isArray(featuredNFTs) && featuredNFTs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredNFTs.map((nft, index) => (
                  <NFTCard
                    key={`nft-${nft.id}`}
                    nft={nft}
                    delay={index * 0.1}
                    priority={index < 3}
                  />
                ))}
              </div>
            ) : (
              <Card glass className="p-12 text-center">
                <p className="text-text-secondary">
                  No NFTs have been minted yet. Be the first to win one!
                </p>
              </Card>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-center mt-12"
          >
            <Button size="lg" variant="outline" asChild>
              <Link href="/gallery">
                View Full Gallery
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* How It Works Preview */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="heading-md text-balance mb-4">
              How Sophisticated Players Win
            </h2>
            <p className="body-lg max-w-2xl mx-auto">
              Master the mechanics to maximize your winning potential
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Steps */}
            <div className="space-y-6">
              {[
                {
                  number: "01",
                  title: "Place Your Bid",
                  description:
                    `Bid with ETH or CST tokens. Each bid extends the countdown timer and earns you ${cstRewardAmount} CST tokens as a reward.`,
                },
                {
                  number: "02",
                  title: "Watch the Timer",
                  description:
                    "Be strategic. Prices decrease over time (Dutch auction), but waiting means others can outbid you. Timing is everything.",
                },
                {
                  number: "03",
                  title: "Become Last Bidder",
                  description:
                    "Stay competitive. The timer extends with each bid. Hold your position until time expires to win the main prize.",
                },
                {
                  number: "04",
                  title: "Claim Your Prizes",
                  description:
                    "Multiple ways to win: Main Prize, Endurance Champion, Chrono-Warrior, or Raffle. Even unsuccessful bidders can win.",
                },
              ].map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex space-x-4"
                >
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                      <span className="font-mono text-lg font-semibold text-primary">
                        {step.number}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-text-primary mb-2">
                      {step.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Visual Stats */}
            <div className="space-y-6">
              <Card glass className="p-8">
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                  Prize Distribution
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Main Prize", value: "25%", color: "bg-primary" },
                    {
                      label: "Chrono-Warrior",
                      value: "8%",
                      color: "bg-status-info",
                    },
                    {
                      label: "Staking Rewards",
                      value: "6%",
                      color: "bg-status-success",
                    },
                    { label: "Charity", value: "7%", color: "bg-status-error" },
                    {
                      label: "Raffle Prizes",
                      value: "4%",
                      color: "bg-status-warning",
                    },
                  ].map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">
                          {item.label}
                        </span>
                        <span className="font-mono text-primary font-semibold">
                          {item.value}
                        </span>
                      </div>
                      <div className="h-2 bg-background-elevated rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                          style={{ width: item.value }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card glass className="p-6">
                  <Gem className="text-primary mb-3" size={28} />
                  <div className="font-mono text-2xl font-semibold text-primary mb-1">
                    {cstRewardPerBid ? Number(cstRewardPerBid) / 1e18 : '--'}
                  </div>
                  <div className="text-sm text-text-secondary">CST Per Bid</div>
                </Card>
                <Card glass className="p-6">
                  <Users className="text-primary mb-3" size={28} />
                  <div className="font-mono text-2xl font-semibold text-primary mb-1">
                    15+
                  </div>
                  <div className="text-sm text-text-secondary">
                    Prize Winners
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12"
          >
            <Button size="lg" variant="secondary" asChild>
              <Link href="/game/how-it-works">
                Learn More About Game Mechanics
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Card glass className="p-12 md:p-16">
              <h2 className="heading-lg text-balance mb-6">
                Ready to Compete?
              </h2>
              <p className="body-xl max-w-3xl mx-auto mb-10">
                Join the most sophisticated NFT auction game on the blockchain.
                Every bid earns rewards. Every round creates opportunities.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="xl" asChild>
                  <Link href="/game/play">Start Playing Now</Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/game/how-it-works">Watch Tutorial</Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="text-sm text-text-secondary">
                    Audited Smart Contracts
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-sm text-text-secondary">
                    Built on Arbitrum
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="text-sm text-text-secondary">
                    Unique Generative Art
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}

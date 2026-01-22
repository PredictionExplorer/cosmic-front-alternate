"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BarChart3,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import { api } from "@/services/api";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface Bid {
  EvtLogId: number;
  BidderAddr: string;
  BidType: number;
  BidPriceEth: number;
  CstPriceEth?: number;
  RoundNum: number;
  TimeStamp: number;
  TxHash: string;
}

interface UniqueBidder {
  BidderAddr: string;
  NumBids: number;
}

interface UniqueWinner {
  WinnerAid: number;
  WinnerAddr: string;
  PrizesCount: number;
  MaxWinAmount: string;
  MaxWinAmountEth: number;
  PrizesSum: number;
  NumWins?: number; // For backward compatibility
}

interface UniqueDonor {
  DonorAddr: string;
  NumDonations: number;
}

interface UniqueStaker {
  StakerAid: number;
  StakerAddr: string;
  TotalTokensStaked: number;
  NumStakeActions: number;
  NumUnstakeActions: number;
  TotalReward: string;
  TotalRewardEth: number;
  UnclaimedReward: string;
  UnclaimedRewardEth: number;
  TotalTokensMinted: number;
}

interface CSTDistribution {
  OwnerAddr: string;
  NumTokens: number;
}

interface CTBalanceDistribution {
  OwnerAid: number;
  OwnerAddr: string;
  Balance: string;
  BalanceFloat: number;
}

interface DonatedTokenDistribution {
  NftAddr: string;
  NumDonations: number;
}

interface CSTBidData {
  CSTPrice: string;
  SecondsElapsed: number;
  AuctionDuration: number;
}

interface DashboardData {
  CurRoundNum: number;
  TsRoundStart: number;
  BidPriceEth: number;
  CurNumBids: number;
  PrizeAmountEth: number;
  PrizeClaimTs: number;
  LastBidderAddr: string;
  CosmicGameBalanceEth: number;
  TotalPrizes: number;
  TotalPrizesPaidAmountEth: number;
  NumRwalkTokensUsed: number;
  CharityBalanceEth: number;
  NumDonatedNFTs: number;
  NumVoluntaryDonations: number;
  SumVoluntaryDonationsEth: number;
  CurRoundStats: {
    TotalDonatedNFTs: number;
    TotalDonatedAmountEth: number;
  };
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
    DonatedTokenDistribution: Array<{
      NftAddr: string;
      NumDonations: number;
    }>;
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"cst" | "rwlk">("cst");
  
  // Additional data states
  const [currentRoundBids, setCurrentRoundBids] = useState<Bid[]>([]);
  const [uniqueBidders, setUniqueBidders] = useState<UniqueBidder[]>([]);
  const [uniqueWinners, setUniqueWinners] = useState<UniqueWinner[]>([]);
  const [uniqueCSTStakers, setUniqueCSTStakers] = useState<UniqueStaker[]>([]);
  const [uniqueRWLKStakers, setUniqueRWLKStakers] = useState<UniqueStaker[]>([]);
  const [uniqueDonors, setUniqueDonors] = useState<UniqueDonor[]>([]);
  const [cstDistribution, setCSTDistribution] = useState<CSTDistribution[]>([]);
  const [ctBalanceDistribution, setCTBalanceDistribution] = useState<CTBalanceDistribution[]>([]);
  
  // Pagination for bid history
  const [bidHistoryPage, setBidHistoryPage] = useState(1);
  const bidsPerPage = 20;
  
  // CST bid data (live updating)
  const [cstBidData, setCstBidData] = useState<CSTBidData>({
    CSTPrice: "0",
    SecondsElapsed: 0,
    AuctionDuration: 0,
  });

  // Fetch main dashboard data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const dashboardData = await api.getDashboardInfo();
        setData(dashboardData);

        // Fetch additional parallel data
        const [
          currentBids,
          bidders,
          winners,
          cstStakers,
          rwlkStakers,
          donors,
          cstDist,
          ctBalance,
        ] = await Promise.all([
          api.getBidListByRound(dashboardData.CurRoundNum, "desc"),
          api.getUniqueBidders(),
          api.getUniqueWinners(),
          api.getUniqueStakersCST(),
          api.getUniqueStakersRWLK(),
          api.getUniqueDonors(),
          api.getCSTDistribution(),
          api.getCTBalanceDistribution(),
        ]);

        setCurrentRoundBids(currentBids);
        setUniqueBidders(bidders.sort((a: UniqueBidder, b: UniqueBidder) => b.NumBids - a.NumBids));
        setUniqueWinners(winners.sort((a: UniqueWinner, b: UniqueWinner) => b.PrizesCount - a.PrizesCount));
        setUniqueCSTStakers(cstStakers.sort((a: UniqueStaker, b: UniqueStaker) => b.TotalRewardEth - a.TotalRewardEth));
        setUniqueRWLKStakers(rwlkStakers.sort((a: UniqueStaker, b: UniqueStaker) => b.TotalRewardEth - a.TotalRewardEth));
        setUniqueDonors(donors);
        setCSTDistribution(cstDist);
        setCTBalanceDistribution(ctBalance);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fetch CST bid price (updates every 5 seconds)
  useEffect(() => {
    async function fetchCSTPrice() {
      try {
        const ctData = await api.getCSTPrice();
        if (ctData) {
          setCstBidData({
            CSTPrice: ctData.CSTPrice || "0",
            SecondsElapsed: parseInt(ctData.SecondsElapsed || "0", 10),
            AuctionDuration: parseInt(ctData.AuctionDuration || "0", 10),
          });
        }
      } catch (error) {
        console.error("Error fetching CST price:", error);
      }
    }

    fetchCSTPrice();
    const interval = setInterval(fetchCSTPrice, 5000);
    return () => clearInterval(interval);
  }, []);

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
      value:
        data.PrizeClaimTs === 0
          ? "Round isn't started yet."
          : convertTimestampToDateTime(data.PrizeClaimTs, true),
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
          {currentRoundBids.length > 0 ? (
            <>
              <Card glass className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background-elevated border-b border-text-muted/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                          Date & Time
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                          Bidder
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
                      {currentRoundBids
                        .slice((bidHistoryPage - 1) * bidsPerPage, bidHistoryPage * bidsPerPage)
                        .map((bid: Bid, index: number) => (
                        <tr
                          key={bid.EvtLogId}
                          className={`border-b border-text-muted/5 ${
                            index % 2 === 0 ? "bg-background-surface/30" : ""
                          }`}
                        >
                          <td className="px-6 py-4 text-sm text-text-secondary">
                            {convertTimestampToDateTime(bid.TimeStamp, true)}
                          </td>
                          <td className="px-6 py-4">
                            <Link 
                              href={`/user/${bid.BidderAddr}`}
                              className="hover:underline"
                            >
                              <AddressDisplay
                                address={bid.BidderAddr}
                                shorten={true}
                                chars={6}
                                showCopy={false}
                              />
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-text-primary text-sm">
                            {bid.BidType === 0 
                              ? `${bid.BidPriceEth?.toFixed(6)} ETH`
                              : `${(bid.CstPriceEth || 0).toFixed(2)} CST`
                            }
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
              
              {/* Pagination Controls */}
              {currentRoundBids.length > bidsPerPage && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setBidHistoryPage(prev => Math.max(1, prev - 1))}
                    disabled={bidHistoryPage === 1}
                    className="px-4 py-2 rounded-lg border border-text-muted/20 bg-background-elevated hover:bg-background-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.ceil(currentRoundBids.length / bidsPerPage) },
                      (_, i) => i + 1
                    )
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        const totalPages = Math.ceil(currentRoundBids.length / bidsPerPage);
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - bidHistoryPage) <= 1
                        );
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center gap-1">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-text-muted">...</span>
                          )}
                          <button
                            onClick={() => setBidHistoryPage(page)}
                            className={`min-w-[40px] px-3 py-2 rounded-lg border transition-colors ${
                              bidHistoryPage === page
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-text-muted/20 bg-background-elevated hover:bg-background-surface"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))}
                  </div>
                  
                  <button
                    onClick={() => setBidHistoryPage(prev => 
                      Math.min(Math.ceil(currentRoundBids.length / bidsPerPage), prev + 1)
                    )}
                    disabled={bidHistoryPage >= Math.ceil(currentRoundBids.length / bidsPerPage)}
                    className="px-4 py-2 rounded-lg border border-text-muted/20 bg-background-elevated hover:bg-background-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <Card glass className="p-8 text-center">
              <p className="text-text-secondary">No bids in current round yet</p>
            </Card>
          )}
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
                              />
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-text-primary">
                            {winner.PrizesCount}
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
                            (item: DonatedTokenDistribution, index: number) => (
                              <tr
                                key={item.NftAddr}
                                className={`border-b border-text-muted/5 ${
                                  index % 2 === 0 ? "bg-background-surface/30" : ""
                                }`}
                              >
                                <td className="px-6 py-4">
                                  <AddressDisplay
                                    address={item.NftAddr}
                                    shorten={true}
                                    chars={10}
                                  />
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-text-primary">
                                  {item.NumDonations}
                                </td>
                              </tr>
                            )
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
                  value={data.MainStats.StakeStatisticsCST.TotalTokensStaked}
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
                                />
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-text-primary text-sm">
                              {staker.TotalRewardEth.toFixed(4)} ETH
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
                  value={data.MainStats.StakeStatisticsRWalk.NumActiveStakers}
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
                            Total Reward
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueRWLKStakers.slice(0, 50).map((staker: UniqueStaker, index: number) => (
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
                                />
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-right font-mono text-text-primary text-sm">
                              {staker.TotalRewardEth.toFixed(4)} ETH
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
    </div>
  );
}

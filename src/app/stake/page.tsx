"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Gem, TrendingUp, AlertCircle, Award, Zap, ChevronDown, X, HelpCircle } from "lucide-react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/game/StatCard";
import { formatEth } from "@/lib/utils";
import { api } from "@/services/api";
import { CONTRACTS } from "@/lib/web3/contracts";
import { useApiData } from "@/contexts/ApiDataContext";
import { wagmiConfig } from "@/lib/web3/config";
import { useCSTStaking } from "@/hooks/useCSTStaking";
import { useRWLKStaking } from "@/hooks/useRWLKStaking";
import { useStakingRewards } from "@/hooks/useStakingRewards";
import { useEffect } from "react";

const PLACEHOLDER_IMAGE = "/nfts/placeholder.svg";

function getCSTImageUrl(seed: string): string {
  if (!seed) return PLACEHOLDER_IMAGE;
  const hex = seed.startsWith("0x") ? seed : `0x${seed}`;
  return `https://nfts.cosmicsignature.com/images/new/cosmicsignature/${hex}.png`;
}

function getRWLKImageUrl(tokenId: number, thumb = true): string {
  const padded = tokenId.toString().padStart(6, "0");
  const suffix = thumb ? "_black_thumb.jpg" : "_black.jpg";
  return `https://nfts.cosmicsignature.com/images/randomwalk/${padded}${suffix}`;
}

function RWLKNFTImage({ tokenId, alt, className }: { tokenId: number; alt: string; className?: string }) {
  const [errored, setErrored] = useState(false);
  return (
    <Image
      src={errored ? PLACEHOLDER_IMAGE : getRWLKImageUrl(tokenId)}
      alt={alt}
      fill
      unoptimized
      className={className}
      onError={() => setErrored(true)}
    />
  );
}

export default function StakePage() {
  const { address, isConnected } = useAccount();
  const { dashboardData: apiDashboardData } = useApiData();

  // ── Tabs & UI state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"cosmic" | "randomwalk">("cosmic");
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showRWalkHowItWorks, setShowRWalkHowItWorks] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  // ── CST Staking Hook ────────────────────────────────────────────────
  const cst = useCSTStaking();

  // ── RWLK Staking Hook ──────────────────────────────────────────────
  const rwlk = useRWLKStaking();

  // ── Staking Rewards ─────────────────────────────────────────────────
  const stakingRewards = useStakingRewards(cst.stakedTokens.length);

  // ── CST Pagination & Selection ──────────────────────────────────────
  const itemsPerPage = 8;
  const stakedItemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [stakedCurrentPage, setStakedCurrentPage] = useState(1);
  const [selectedTokenIds, setSelectedTokenIds] = useState<Set<number>>(new Set());
  const [selectedStakedIds, setSelectedStakedIds] = useState<Set<number>>(new Set());

  // ── RWLK Pagination & Selection ─────────────────────────────────────
  const [rwlkCurrentPage, setRwlkCurrentPage] = useState(1);
  const [stakedRwlkCurrentPage, setStakedRwlkCurrentPage] = useState(1);
  const [selectedRWLKTokenIds, setSelectedRWLKTokenIds] = useState<Set<number>>(new Set());
  const [selectedStakedRWLKIds, setSelectedStakedRWLKIds] = useState<Set<number>>(new Set());

  // ── Dashboard data ──────────────────────────────────────────────────
  const [dashboardData, setDashboardData] = useState<{
    CosmicSignatureTokenStakingTotalSupply?: number;
    RandomWalkNFTStakingTotalSupply?: number;
    MainStats?: {
      StakeStatisticsCST?: {
        TotalTokensStaked?: number;
        TotalRewardEth?: number;
      };
      StakeStatisticsRWalk?: {
        TotalTokensStaked?: number;
        NumActiveStakers?: number;
        TotalNumStakeActions?: number;
        TotalNumUnstakeActions?: number;
      };
    };
  } | null>(null);

  // ── Staking percentage ──────────────────────────────────────────────
  const [stakingPercentage, setStakingPercentage] = useState<number>(
    Number(
      apiDashboardData?.StakingPercentage ||
      (apiDashboardData as Record<string, unknown>)?.CosmicSignatureNftStakingTotalEthRewardAmountPercentage ||
      0
    )
  );

  useEffect(() => {
    async function fetchStakingPercent() {
      try {
        const raw = await readContract(wagmiConfig, {
          address: CONTRACTS.COSMIC_GAME,
          abi: [{ name: 'cosmicSignatureNftStakingTotalEthRewardAmountPercentage', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }],
          functionName: 'cosmicSignatureNftStakingTotalEthRewardAmountPercentage',
        });
        if (raw != null) setStakingPercentage(Number(raw));
      } catch {
        const fromApi = Number(
          apiDashboardData?.StakingPercentage ||
          (apiDashboardData as Record<string, unknown>)?.CosmicSignatureNftStakingTotalEthRewardAmountPercentage ||
          0
        );
        if (fromApi > 0) setStakingPercentage(fromApi);
      }
    }
    fetchStakingPercent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await api.getDashboardInfo();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    fetchDashboardData();
  }, []);

  // Reset pages when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [cst.availableTokens.length]);

  useEffect(() => {
    setRwlkCurrentPage(1);
  }, [rwlk.availableTokens.length]);

  // ── Image helpers ───────────────────────────────────────────────────
  const handleImageError = (tokenId: number) => {
    setFailedImages((prev) => new Set(prev).add(tokenId));
  };

  const getImageUrl = (tokenId: number, seed: string) => {
    return failedImages.has(tokenId) ? PLACEHOLDER_IMAGE : getCSTImageUrl(seed);
  };

  // ── CST selection helpers ───────────────────────────────────────────
  const toggleTokenSelection = (tokenId: number) => {
    setSelectedTokenIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) newSet.delete(tokenId);
      else newSet.add(tokenId);
      return newSet;
    });
  };

  const selectAllTokens = () => {
    setSelectedTokenIds(new Set(cst.availableTokens.map((t) => t.TokenId)));
  };

  const deselectAllTokens = () => setSelectedTokenIds(new Set());

  const toggleStakedTokenSelection = (stakeActionId: number) => {
    setSelectedStakedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stakeActionId)) newSet.delete(stakeActionId);
      else newSet.add(stakeActionId);
      return newSet;
    });
  };

  const selectAllStakedTokens = () => {
    const allIds = new Set(
      cst.stakedTokens.map((t) => t.StakeActionId ?? t.TokenInfo.StakeActionId)
    );
    setSelectedStakedIds(allIds);
  };

  const selectCurrentPageStakedTokens = () => {
    const startIdx = (stakedCurrentPage - 1) * stakedItemsPerPage;
    const endIdx = startIdx + stakedItemsPerPage;
    const pageTokens = cst.stakedTokens.slice(startIdx, endIdx);
    setSelectedStakedIds(
      new Set(pageTokens.map((t) => t.StakeActionId ?? t.TokenInfo.StakeActionId))
    );
  };

  const deselectAllStakedTokens = () => setSelectedStakedIds(new Set());

  const handleUnstakeSelected = async () => {
    await cst.unstakeMany(Array.from(selectedStakedIds));
    setSelectedStakedIds(new Set());
  };

  // ── CST Pagination ─────────────────────────────────────────────────
  const totalPages = Math.ceil(cst.availableTokens.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTokens = cst.availableTokens.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const nftSection = document.getElementById("available-nfts-section");
    if (nftSection) nftSection.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const stakedTotalPages = Math.ceil(cst.stakedTokens.length / stakedItemsPerPage);
  const stakedStartIndex = (stakedCurrentPage - 1) * stakedItemsPerPage;
  const stakedEndIndex = stakedStartIndex + stakedItemsPerPage;
  const paginatedStakedTokens = useMemo(() => {
    const sorted = [...cst.stakedTokens].sort(
      (a, b) => a.StakeTimeStamp - b.StakeTimeStamp
    );
    return sorted.slice(stakedStartIndex, stakedEndIndex);
  }, [cst.stakedTokens, stakedStartIndex, stakedEndIndex]);

  const handleStakedPageChange = (page: number) => {
    setStakedCurrentPage(page);
    const section = document.getElementById("staked-nfts-section");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Computed stats ──────────────────────────────────────────────────
  const yourNFTCount = isConnected ? cst.availableTokens.length + cst.stakedTokens.length : 0;
  const yourStakedCount = isConnected ? cst.stakedTokens.length : 0;
  const yourAvailableCount = isConnected ? cst.availableTokens.length : 0;

  const totalStaked = dashboardData?.MainStats?.StakeStatisticsCST?.TotalTokensStaked || 0;
  const stakingAmountEth = dashboardData?.MainStats?.StakeStatisticsCST?.TotalRewardEth || 0;
  const rewardPerNFT = totalStaked > 0 ? stakingAmountEth / totalStaked : 0;

  const rwlkStatsGlobal = dashboardData?.MainStats?.StakeStatisticsRWalk;
  const totalRwlkStaked = rwlkStatsGlobal?.TotalTokensStaked || 0;
  const totalRwlkActiveStakers = rwlkStatsGlobal?.NumActiveStakers || 0;

  return (
    <div className="min-h-screen">
      {/* Compact Tab Selector */}
      <section className="py-4 bg-background-surface/50 sticky top-[72px] lg:top-[88px] z-40 backdrop-blur-xl border-b border-text-muted/10">
        <Container>
          <div className="flex justify-center">
            <div className="inline-flex p-1 rounded-lg bg-background-elevated border border-text-muted/10">
              <button
                onClick={() => setActiveTab("cosmic")}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === "cosmic"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Cosmic Signature NFTs
              </button>
              <button
                onClick={() => setActiveTab("randomwalk")}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === "randomwalk"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Random Walk NFTs
              </button>
            </div>
          </div>
        </Container>
      </section>

      {activeTab === "cosmic" && (
        <>
          {/* Staking Header */}
          <section className="py-12 bg-background-surface/50 border-b border-text-muted/10">
            <Container>
              <div className="max-w-3xl">
                <h1 className="text-4xl font-serif font-bold text-text-primary mb-4">
                  Stake NFTs,
                  <span className="text-gradient block">Earn Rewards</span>
                </h1>
                <p className="text-lg text-text-secondary leading-relaxed">
                  Lock your NFTs to earn a share of {stakingPercentage}% of each round&apos;s prize pool. Withdraw anytime with accumulated rewards.
                </p>
              </div>
            </Container>
          </section>

          {/* Overview Stats */}
          <section className="py-12">
            <Container>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="Your NFTs"
                  value={cst.isLoading ? "..." : yourNFTCount}
                  icon={Gem}
                  className="h-full"
                />
                <StatCard
                  label="Currently Staked"
                  value={cst.isLoading ? "..." : yourStakedCount}
                  icon={Award}
                  className="h-full"
                />
                <StatCard
                  label="Total Rewards (Global)"
                  value={cst.isLoading ? "..." : `${formatEth(stakingAmountEth)} ETH`}
                  valueClassName="text-xl md:text-2xl"
                  icon={TrendingUp}
                  className="h-full"
                />
                <StatCard
                  label="Reward Per NFT"
                  value={`${formatEth(rewardPerNFT)} ETH`}
                  valueClassName="text-xl md:text-2xl"
                  icon={Zap}
                  className="h-full"
                />
              </div>
            </Container>
          </section>

          {/* How It Works - Collapsible */}
          <section className="py-6">
            <Container size="lg">
              <div className="flex justify-center mb-4">
                <Button
                  variant="outline"
                  onClick={() => setShowHowItWorks(!showHowItWorks)}
                  className="gap-2"
                >
                  <HelpCircle size={18} />
                  {showHowItWorks ? 'Hide' : 'Show'} How Staking Works
                  <ChevronDown 
                    size={18} 
                    className={`transition-transform ${showHowItWorks ? 'rotate-180' : ''}`}
                  />
                </Button>
              </div>

              {showHowItWorks && (
                <Card glass className="p-8 md:p-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl font-semibold text-text-primary">
                      How Staking Works
                    </h2>
                    <button
                      onClick={() => setShowHowItWorks(false)}
                      className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
                      aria-label="Close"
                    >
                      <X size={20} className="text-text-secondary hover:text-text-primary" />
                    </button>
                  </div>
                  <p className="text-center text-text-secondary mb-8">Follow these simple steps</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    {
                      step: "1",
                      title: "Stake Your NFTs",
                      description:
                        "Transfer your Cosmic Signature NFTs to the staking contract. They remain your property.",
                    },
                    {
                      step: "2",
                      title: "Earn Every Round",
                      description:
                        `${stakingPercentage}% of each round's prize pool is distributed proportionally among all staked NFTs.`,
                    },
                    {
                      step: "3",
                      title: "Unstake Anytime",
                      description:
                        "Withdraw your NFTs and claim accumulated rewards whenever you want. No lock period.",
                    },
                  ].map((item, index) => (
                    <div key={item.step} className="relative">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="font-mono text-xl font-semibold text-primary">
                            #{item.step}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      {index < 2 && (
                        <div className="hidden md:block absolute top-6 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-lg bg-background-elevated border border-text-muted/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Award className="text-primary" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          Total NFTs Staked (Globally)
                        </p>
                        <p className="font-mono text-2xl font-semibold text-primary">
                          {totalStaked}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted">
                      Total number of NFTs staked by all users across the network
                    </p>
                  </div>

                  <div className="p-6 rounded-lg bg-background-elevated border border-text-muted/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-status-success/10 flex items-center justify-center">
                        <Zap className="text-status-success" size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">
                          Reward Per NFT (Current)
                        </p>
                        <p className="font-mono text-2xl font-semibold text-status-success">
                          {formatEth(rewardPerNFT)} ETH
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted">
                      Estimated reward per staked NFT based on current round
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-text-secondary">
                    💡 <strong>How rewards work:</strong> Rewards update after each round ends. 
                    The more rounds that pass while you&apos;re staked, the more you earn. 
                    Rewards are distributed proportionally - if you stake 10 NFTs out of 
                    {totalStaked > 0 ? ` ${totalStaked}` : ' 100'} total staked, you earn 
                    {totalStaked > 0 ? ` ${((10 / totalStaked) * 100).toFixed(1)}%` : ' 10%'} of 
                    the staking pool each round.
                  </p>
                </div>
              </Card>
              )}
            </Container>
          </section>

          {/* Your Unstaked NFTs */}
          {!isConnected && (
            <section className="py-12">
              <Container>
                <Card glass className="p-8">
                  <div className="text-center py-12">
                    <Gem size={48} className="text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary mb-6">
                      Connect your wallet to view and stake your Cosmic
                      Signature NFTs
                    </p>
                  </div>
                </Card>
              </Container>
            </section>
          )}

          {isConnected && yourAvailableCount > 0 && (
            <section id="available-nfts-section" className="py-12">
              <Container>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-semibold text-text-primary">
                    Your Available NFTs
                  </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary">
                        Showing {startIndex + 1}-
                        {Math.min(endIndex, yourAvailableCount)} of{" "}
                        {yourAvailableCount}
                      </span>
                    </div>
                  </div>

                  {/* Selection Controls */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                    <div className="flex items-center gap-4">
                      {selectedTokenIds.size > 0 ? (
                        <>
                          <span className="text-sm font-medium text-text-primary">
                            {selectedTokenIds.size} NFT
                            {selectedTokenIds.size > 1 ? "s" : ""} selected
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={deselectAllTokens}
                          >
                            Deselect All
                  </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={selectAllTokens}
                        >
                          Select All ({yourAvailableCount})
                        </Button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        cst.stakeMany(Array.from(selectedTokenIds))
                      }
                      disabled={
                        selectedTokenIds.size === 0 ||
                        cst.isSubmitting
                      }
                    >
                      {cst.isStakingMultiple
                        ? "Staking..."
                        : `Stake Selected ${
                            selectedTokenIds.size > 0
                              ? `(${selectedTokenIds.size})`
                              : ""
                          }`}
                    </Button>
                  </div>
                </div>

                {cst.isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-text-secondary">Loading your NFTs...</p>
                  </div>
                ) : (
                  <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {paginatedTokens.map((token) => {
                        const isSelected = selectedTokenIds.has(token.TokenId);
                        return (
                          <Card
                            key={token.TokenId}
                            glass
                            hover
                            className={`overflow-hidden transition-all ${
                              isSelected ? "ring-2 ring-primary" : ""
                            }`}
                          >
                      <div className="aspect-square bg-background-elevated relative">
                        <Image
                                src={getImageUrl(token.TokenId, token.Seed)}
                                alt={
                                  token.TokenName || `Token #${token.TokenId}`
                                }
                          fill
                          unoptimized
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                onError={() => handleImageError(token.TokenId)}
                        />
                              <div className="absolute top-3 left-3 flex items-center gap-2">
                                <Badge variant="default">
                                  #{token.TokenId}
                                </Badge>
                              </div>
                              <div className="absolute top-3 right-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleTokenSelection(token.TokenId)
                                  }
                                  className="w-5 h-5 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                                  onClick={(e) => e.stopPropagation()}
                                />
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="font-serif font-semibold text-text-primary mb-2 truncate">
                                {token.TokenName || `Token #${token.TokenId}`}
                              </p>
                              <p className="text-xs text-text-secondary mb-3">
                                Round {token.RoundNum}
                              </p>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => cst.stake(token.TokenId)}
                                disabled={
                                  cst.stakingTokenId === token.TokenId ||
                                  cst.isSubmitting
                                }
                              >
                                {cst.stakingTokenId === token.TokenId
                                  ? "Staking..."
                                  : "Stake NFT"}
                        </Button>
                      </div>
                    </Card>
                        );
                      })}
                </div>

                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-8">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>

                        <div className="flex gap-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => {
                            const showPage =
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 &&
                                page <= currentPage + 1);

                            const showEllipsisBefore =
                              page === currentPage - 2 && currentPage > 3;
                            const showEllipsisAfter =
                              page === currentPage + 2 &&
                              currentPage < totalPages - 2;

                            if (showEllipsisBefore || showEllipsisAfter) {
                              return (
                                <span
                                  key={page}
                                  className="px-3 py-2 text-text-muted"
                                >
                                  ...
                                </span>
                              );
                            }

                            if (!showPage) return null;

                            return (
                              <Button
                                key={page}
                                size="sm"
                                variant={
                                  currentPage === page ? "primary" : "outline"
                                }
                                onClick={() => handlePageChange(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Container>
            </section>
          )}

          {/* Staked NFTs */}
          {isConnected && yourStakedCount > 0 && (
            <section
              id="staked-nfts-section"
              className="py-12 bg-background-surface/50"
            >
              <Container>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-semibold text-text-primary">
                    Your Staked NFTs
                  </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary">
                        Showing {stakedStartIndex + 1}-
                        {Math.min(stakedEndIndex, yourStakedCount)} of{" "}
                        {yourStakedCount}
                      </span>
                    </div>
                  </div>

                  {/* Rewards Summary */}
                  <div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-secondary mb-1">
                          Total Claimable Rewards
                        </p>
                        {stakingRewards.isLoading ? (
                          <p className="text-sm text-text-muted">Loading...</p>
                        ) : (
                          <p className="font-mono text-2xl font-semibold text-primary">
                            {formatEth(stakingRewards.totalUncollected)} ETH
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary mb-1">
                          NFTs Staked
                        </p>
                        <p className="font-mono text-2xl font-semibold text-text-primary">
                          {yourStakedCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selection Controls */}
                  {yourStakedCount > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                      <div className="flex items-center gap-4">
                        {selectedStakedIds.size > 0 ? (
                          <>
                            <span className="text-sm font-medium text-text-primary">
                              {selectedStakedIds.size} NFT
                              {selectedStakedIds.size > 1 ? "s" : ""} selected
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={deselectAllStakedTokens}
                            >
                              Deselect All
                  </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={selectAllStakedTokens}
                            >
                              Select All ({yourStakedCount})
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={selectCurrentPageStakedTokens}
                            >
                              Select Current Page
                            </Button>
                          </>
                        )}
                      </div>
                      {selectedStakedIds.size > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleUnstakeSelected}
                          disabled={cst.isSubmitting}
                        >
                          {cst.isStakingMultiple
                            ? "Unstaking..."
                            : `Unstake Selected & Claim (${selectedStakedIds.size})`}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <Card glass>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-text-muted/10">
                          <tr className="text-left">
                            <th className="p-4 text-sm font-medium text-text-secondary w-12">
                              <input
                                type="checkbox"
                                checked={
                                  cst.stakedTokens.length > 0 &&
                                  selectedStakedIds.size === cst.stakedTokens.length
                                }
                                ref={(input) => {
                                  if (input) {
                                    input.indeterminate =
                                      selectedStakedIds.size > 0 &&
                                      selectedStakedIds.size <
                                        cst.stakedTokens.length;
                                  }
                                }}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    selectAllStakedTokens();
                                  } else {
                                    deselectAllStakedTokens();
                                  }
                                }}
                                className="w-4 h-4 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                              />
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              NFT
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Token ID
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Stake Action ID
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Staked On
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Rewards Earned
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-text-muted/10">
                          {paginatedStakedTokens.map((stakedToken) => {
                            const token = stakedToken.TokenInfo;
                            const actionId = stakedToken.StakeActionId ?? token.StakeActionId;
                            const isSelected = selectedStakedIds.has(actionId);
                            
                            return (
                              <tr
                                key={`staked-${actionId}-${token.TokenId}`}
                                className={`hover:bg-background-elevated/50 transition-colors ${
                                  isSelected ? "bg-primary/5" : ""
                                }`}
                              >
                                <td className="p-4">
                                  <input
                                    type="checkbox"
                                    id={`checkbox-${actionId}`}
                                    checked={isSelected}
                                    onChange={() => toggleStakedTokenSelection(actionId)}
                                    className="w-4 h-4 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                                  />
                                </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="h-12 w-12 rounded bg-background-elevated overflow-hidden relative">
                                    <Image
                                        src={getImageUrl(token.TokenId, token.Seed)}
                                        alt={
                                          token.TokenName ||
                                          `Token #${token.TokenId}`
                                        }
                                      fill
                                      unoptimized
                                      className="object-contain"
                                      sizes="48px"
                                        onError={() => handleImageError(token.TokenId)}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-serif font-semibold text-text-primary">
                                        {token.TokenName ||
                                          `Token #${token.TokenId}`}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        Round {token.RoundNum}
                                    </p>
                                  </div>
                                </div>
                              </td>
                                <td className="p-4 text-center">
                                  <p className="font-mono text-text-primary">
                                    #{token.TokenId}
                                  </p>
                                </td>
                                <td className="p-4 text-center">
                                  <p className="font-mono text-text-primary">
                                    {actionId}
                                  </p>
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-text-primary">
                                    {stakedToken.StakeDateTime
                                      ? new Date(
                                          stakedToken.StakeDateTime
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                  {stakedToken.StakeDateTime && (
                                    <p className="text-xs text-text-muted">
                                      {Math.floor(
                                        (Date.now() -
                                          new Date(
                                            stakedToken.StakeDateTime
                                          ).getTime()) /
                                          (1000 * 60 * 60 * 24)
                                      )}{" "}
                                      days ago
                                    </p>
                                  )}
                              </td>
                              <td className="p-4">
                                  {stakingRewards.isLoading ? (
                                    <p className="text-sm text-text-muted">
                                      Loading...
                                    </p>
                                  ) : (
                                    <>
                                <p className="font-mono text-primary font-semibold">
                                        {formatEth(
                                          stakingRewards.getTokenReward(token.TokenId)
                                        )}{" "}
                                  ETH
                                </p>
                                      <p className="text-xs text-text-muted">
                                        Claimable
                                      </p>
                                    </>
                                  )}
                              </td>
                              <td className="p-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      cst.unstake(actionId, token.TokenId)
                                    }
                                    disabled={
                                      cst.unstakingActionId === actionId ||
                                      cst.isSubmitting
                                    }
                                  >
                                    {cst.unstakingActionId === actionId
                                      ? "Unstaking..."
                                      : "Unstake"}
                                </Button>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {stakedTotalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 p-4 border-t border-text-muted/10">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStakedPageChange(stakedCurrentPage - 1)
                          }
                          disabled={stakedCurrentPage === 1}
                        >
                          Previous
                        </Button>

                        <div className="flex gap-1">
                          {Array.from(
                            { length: stakedTotalPages },
                            (_, i) => i + 1
                          ).map((page) => {
                            const showPage =
                              page === 1 ||
                              page === stakedTotalPages ||
                              (page >= stakedCurrentPage - 1 &&
                                page <= stakedCurrentPage + 1);

                            if (!showPage) {
                              if (
                                page === stakedCurrentPage - 2 ||
                                page === stakedCurrentPage + 2
                              ) {
                                return (
                                  <span
                                    key={page}
                                    className="px-3 py-2 text-text-muted"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }

                            return (
                              <Button
                                key={page}
                                size="sm"
                                variant={
                                  stakedCurrentPage === page
                                    ? "primary"
                                    : "outline"
                                }
                                onClick={() => handleStakedPageChange(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStakedPageChange(stakedCurrentPage + 1)
                          }
                          disabled={stakedCurrentPage === stakedTotalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Container>
            </section>
          )}
        </>
      )}

      {activeTab === "randomwalk" && (
        <>
          {/* Random Walk Header */}
          <section className="py-12 bg-background-surface/50 border-b border-text-muted/10">
            <Container>
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="max-w-3xl">
                  <h1 className="text-4xl font-serif font-bold text-text-primary mb-4">
                    Random Walk
                    <span className="text-gradient block">NFT Staking</span>
                  </h1>
                  <p className="text-lg text-text-secondary leading-relaxed">
                    Stake Random Walk NFTs to become eligible for raffle prize drawings each round.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 lg:flex-shrink-0">
                  <div className="px-5 py-3 rounded-xl bg-background-elevated border border-text-muted/10 text-center min-w-[110px]">
                    <p className="text-2xl font-mono font-bold text-primary">{totalRwlkStaked}</p>
                    <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">Globally Staked</p>
                  </div>
                  <div className="px-5 py-3 rounded-xl bg-background-elevated border border-text-muted/10 text-center min-w-[110px]">
                    <p className="text-2xl font-mono font-bold text-primary">{totalRwlkActiveStakers}</p>
                    <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">Active Stakers</p>
                  </div>
                  {isConnected && (
                    <div className="px-5 py-3 rounded-xl bg-primary/10 border border-primary/20 text-center min-w-[110px]">
                      <p className="text-2xl font-mono font-bold text-primary">{rwlk.stakedTokens.length}</p>
                      <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">Your Staked</p>
                    </div>
                  )}
                  {isConnected && rwlk.availableTokens.length > 0 && (
                    <div className="px-5 py-3 rounded-xl bg-background-elevated border border-text-muted/10 text-center min-w-[110px]">
                      <p className="text-2xl font-mono font-bold text-text-primary">{rwlk.availableTokens.length}</p>
                      <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">Available</p>
                    </div>
                  )}
                </div>
              </div>
            </Container>
          </section>

          {/* Random Walk NFT Staking */}
          <section className="py-12">
            <Container size="lg">
              {!rwlk.isLoading && isConnected && rwlk.availableTokens.length === 0 && rwlk.stakedTokens.length === 0 && (
                <Card glass className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <Gem className="mx-auto mb-4 text-text-muted" size={64} />
                    <h3 className="font-serif text-2xl font-semibold text-text-primary mb-3">
                      No Random Walk NFTs
                    </h3>
                    <p className="text-text-secondary mb-6">
                      You don&apos;t have anything staked at the moment. You need to own Random Walk NFTs to stake them for raffle eligibility.
                    </p>
                  </div>
                </Card>
              )}

              {!isConnected && (
                <Card glass className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <AlertCircle className="mx-auto mb-4 text-text-muted" size={64} />
                    <h3 className="font-serif text-2xl font-semibold text-text-primary mb-3">
                      Connect Your Wallet
                    </h3>
                    <p className="text-text-secondary">
                      Connect your wallet to view and stake your Random Walk NFTs.
                    </p>
                  </div>
                </Card>
              )}

              {(rwlk.isLoading || rwlk.availableTokens.length > 0 || rwlk.stakedTokens.length > 0) && (
                <>
                  <div className="flex justify-center mb-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowRWalkHowItWorks(!showRWalkHowItWorks)}
                      className="gap-2"
                    >
                      <HelpCircle size={18} />
                      {showRWalkHowItWorks ? 'Hide' : 'Show'} How Random Walk Staking Works
                      <ChevronDown 
                        size={18} 
                        className={`transition-transform ${showRWalkHowItWorks ? 'rotate-180' : ''}`}
                      />
                    </Button>
                  </div>

                  {showRWalkHowItWorks && (
                    <Card glass className="p-8 md:p-12 mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif text-2xl font-semibold text-text-primary">
                          Random Walk NFT Staking
                        </h2>
                        <button
                          onClick={() => setShowRWalkHowItWorks(false)}
                          className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
                          aria-label="Close"
                        >
                          <X size={20} className="text-text-secondary hover:text-text-primary" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h3 className="font-serif text-xl font-semibold text-text-primary">
                            How It Works
                          </h3>
                    <ul className="space-y-3 text-text-secondary">
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                        <span className="text-sm leading-relaxed">
                          Stake your Random Walk NFTs to enter the raffle pool
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                        <span className="text-sm leading-relaxed">
                          Each round, 4 Cosmic Signature NFTs are randomly
                          awarded to stakers
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                        <span className="text-sm leading-relaxed">
                          The more NFTs you stake, the higher your odds of
                          winning
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                        <span className="text-sm leading-relaxed">
                          Unstake anytime - no ETH rewards, just raffle
                          eligibility
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-serif text-xl font-semibold text-text-primary">
                      Important Notes
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/20">
                        <div className="flex items-start space-x-2">
                          <AlertCircle
                            size={16}
                            className="text-status-warning mt-0.5 flex-shrink-0"
                          />
                          <div className="text-sm text-text-secondary">
                            <p className="font-semibold text-text-primary mb-1">
                              One-Time Staking Only
                            </p>
                            <p>
                              Once a Random Walk NFT is staked, it can NEVER be
                              staked again, even after unstaking. This is
                              permanent.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/20">
                        <div className="flex items-start space-x-2">
                          <AlertCircle
                            size={16}
                            className="text-status-info mt-0.5 flex-shrink-0"
                          />
                          <div className="text-sm text-text-secondary">
                            <p className="font-semibold text-text-primary mb-1">
                              No ETH Rewards
                            </p>
                            <p>
                              Unlike Cosmic Signature NFT staking, Random Walk
                              staking does not earn ETH rewards. The benefit is
                              raffle eligibility only.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-status-error/10 border border-status-error/20">
                        <div className="flex items-start space-x-2">
                          <AlertCircle
                            size={16}
                            className="text-status-error mt-0.5 flex-shrink-0"
                          />
                          <div className="text-sm text-text-secondary">
                            <p className="font-semibold text-text-primary mb-1">
                              Cannot Stake After Bidding
                            </p>
                            <p>
                              If you&apos;ve used a Random Walk NFT for bidding
                              (to get the 50% discount), you cannot stake it.
                              Used NFTs are permanently consumed.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                    </Card>
                  )}
                </>
              )}
            </Container>
          </section>

          {/* Your Available Random Walk NFTs */}
          {isConnected && rwlk.availableTokens.length > 0 && (
            <section id="available-rwlk-nfts-section" className="py-12">
              <Container>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-semibold text-text-primary">
                      Your Available Random Walk NFTs
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary">
                        Showing {(rwlkCurrentPage - 1) * itemsPerPage + 1}-
                        {Math.min(
                          rwlkCurrentPage * itemsPerPage,
                          rwlk.availableTokens.length
                        )}{" "}
                        of {rwlk.availableTokens.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                    <div className="flex items-center gap-4">
                      {selectedRWLKTokenIds.size > 0 ? (
                        <>
                          <span className="text-sm font-medium text-text-primary">
                            {selectedRWLKTokenIds.size} NFT
                            {selectedRWLKTokenIds.size > 1 ? "s" : ""} selected
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRWLKTokenIds(new Set())}
                          >
                            Deselect All
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSelectedRWLKTokenIds(
                              new Set(rwlk.availableTokens.map((t) => t.TokenId))
                            )
                          }
                        >
                          Select All ({rwlk.availableTokens.length})
                        </Button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        rwlk.stakeMany(Array.from(selectedRWLKTokenIds))
                      }
                      disabled={
                        selectedRWLKTokenIds.size === 0 ||
                        rwlk.isSubmitting
                      }
                    >
                      {rwlk.isStakingMultiple
                        ? "Staking..."
                        : `Stake Selected ${
                            selectedRWLKTokenIds.size > 0
                              ? `(${selectedRWLKTokenIds.size})`
                              : ""
                          }`}
                    </Button>
                  </div>
                </div>

                {rwlk.isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-text-secondary">Loading your NFTs...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {rwlk.availableTokens
                        .slice(
                          (rwlkCurrentPage - 1) * itemsPerPage,
                          rwlkCurrentPage * itemsPerPage
                        )
                        .map((token) => {
                          const isSelected = selectedRWLKTokenIds.has(
                            token.TokenId
                          );
                          return (
                            <Card
                              key={token.TokenId}
                              glass
                              hover
                              className={`overflow-hidden transition-all ${
                                isSelected ? "ring-2 ring-primary" : ""
                              }`}
                            >
                              <div className="aspect-square bg-background-elevated relative overflow-hidden">
                                <RWLKNFTImage
                                  tokenId={token.TokenId}
                                  alt={token.TokenName || `Random Walk #${token.TokenId}`}
                                  className="object-contain"
                                />
                                <div className="absolute top-3 left-3 flex items-center gap-2">
                                  <Badge variant="default">
                                    #{token.TokenId}
                                  </Badge>
                                </div>
                                <div className="absolute top-3 right-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      const newSet = new Set(
                                        selectedRWLKTokenIds
                                      );
                                      if (newSet.has(token.TokenId)) {
                                        newSet.delete(token.TokenId);
                                      } else {
                                        newSet.add(token.TokenId);
                                      }
                                      setSelectedRWLKTokenIds(newSet);
                                    }}
                                    className="w-5 h-5 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              <div className="p-4">
                                <p className="font-serif font-semibold text-text-primary mb-2 truncate">
                                  {token.TokenName ||
                                    `Random Walk #${token.TokenId}`}
                                </p>
                                <Button
                                  size="sm"
                                  className="w-full"
                                  onClick={() => rwlk.stake(token.TokenId)}
                                  disabled={
                                    rwlk.stakingTokenId === token.TokenId ||
                                    rwlk.isSubmitting
                                  }
                                >
                                  {rwlk.stakingTokenId === token.TokenId
                                    ? "Staking..."
                                    : "Stake NFT"}
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                    </div>

                    {Math.ceil(rwlk.availableTokens.length / itemsPerPage) >
                      1 && (
                      <div className="flex justify-center items-center gap-2 mt-8">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setRwlkCurrentPage(rwlkCurrentPage - 1)
                          }
                          disabled={rwlkCurrentPage === 1}
                        >
                          Previous
                        </Button>

                        <div className="flex gap-1">
                          {Array.from(
                            {
                              length: Math.ceil(
                                rwlk.availableTokens.length / itemsPerPage
                              ),
                            },
                            (_, i) => i + 1
                          ).map((page) => {
                            const rwlkTotalPages = Math.ceil(
                              rwlk.availableTokens.length / itemsPerPage
                            );
                            const showPage =
                              page === 1 ||
                              page === rwlkTotalPages ||
                              (page >= rwlkCurrentPage - 1 &&
                                page <= rwlkCurrentPage + 1);

                            if (!showPage) {
                              if (
                                page === rwlkCurrentPage - 2 ||
                                page === rwlkCurrentPage + 2
                              ) {
                                return (
                                  <span
                                    key={page}
                                    className="px-3 py-2 text-text-muted"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }

                            return (
                              <Button
                                key={page}
                                size="sm"
                                variant={
                                  rwlkCurrentPage === page
                                    ? "primary"
                                    : "outline"
                                }
                                onClick={() => setRwlkCurrentPage(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setRwlkCurrentPage(rwlkCurrentPage + 1)
                          }
                          disabled={
                            rwlkCurrentPage ===
                            Math.ceil(rwlk.availableTokens.length / itemsPerPage)
                          }
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Container>
            </section>
          )}

          {/* Staked Random Walk NFTs */}
          {isConnected && rwlk.stakedTokens.length > 0 && (
            <section
              id="staked-rwlk-nfts-section"
              className="py-12 bg-background-surface/50"
            >
              <Container>
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-semibold text-text-primary">
                      Your Staked Random Walk NFTs
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary">
                        Showing{" "}
                        {(stakedRwlkCurrentPage - 1) * stakedItemsPerPage + 1}-
                        {Math.min(
                          stakedRwlkCurrentPage * stakedItemsPerPage,
                          rwlk.stakedTokens.length
                        )}{" "}
                        of {rwlk.stakedTokens.length}
                      </span>
                    </div>
                  </div>

                  {rwlk.stakedTokens.length > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                      <div className="flex items-center gap-4">
                        {selectedStakedRWLKIds.size > 0 ? (
                          <>
                            <span className="text-sm font-medium text-text-primary">
                              {selectedStakedRWLKIds.size} NFT
                              {selectedStakedRWLKIds.size > 1 ? "s" : ""}{" "}
                              selected
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSelectedStakedRWLKIds(new Set())
                              }
                            >
                              Deselect All
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSelectedStakedRWLKIds(
                                  new Set(
                                    rwlk.stakedTokens.map((t) => t.StakeActionId)
                                  )
                                )
                              }
                            >
                              Select All ({rwlk.stakedTokens.length})
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const startIdx =
                                  (stakedRwlkCurrentPage - 1) *
                                  stakedItemsPerPage;
                                const endIdx = startIdx + stakedItemsPerPage;
                                const pageTokens = rwlk.stakedTokens.slice(
                                  startIdx,
                                  endIdx
                                );
                                setSelectedStakedRWLKIds(
                                  new Set(
                                    pageTokens.map((t) => t.StakeActionId)
                                  )
                                );
                              }}
                            >
                              Select Current Page
                            </Button>
                          </>
                        )}
                      </div>
                      {selectedStakedRWLKIds.size > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => rwlk.unstakeMany(Array.from(selectedStakedRWLKIds))}
                          disabled={rwlk.isSubmitting}
                        >
                          {rwlk.isStakingMultiple
                            ? "Unstaking..."
                            : `Unstake Selected (${selectedStakedRWLKIds.size})`}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <Card glass>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-text-muted/10">
                          <tr className="text-left">
                            <th className="p-4 text-sm font-medium text-text-secondary w-12">
                              <input
                                type="checkbox"
                                checked={
                                  rwlk.stakedTokens.length > 0 &&
                                  selectedStakedRWLKIds.size ===
                                    rwlk.stakedTokens.length
                                }
                                ref={(input) => {
                                  if (input) {
                                    input.indeterminate =
                                      selectedStakedRWLKIds.size > 0 &&
                                      selectedStakedRWLKIds.size <
                                        rwlk.stakedTokens.length;
                                  }
                                }}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStakedRWLKIds(
                                      new Set(
                                        rwlk.stakedTokens.map(
                                          (t) => t.StakeActionId
                                        )
                                      )
                                    );
                                  } else {
                                    setSelectedStakedRWLKIds(new Set());
                                  }
                                }}
                                className="w-4 h-4 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                              />
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              NFT
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Token ID
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Stake Action ID
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Staked On
                            </th>
                            <th className="p-4 text-sm font-medium text-text-secondary">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-text-muted/10">
                          {rwlk.stakedTokens
                            .slice(
                              (stakedRwlkCurrentPage - 1) * stakedItemsPerPage,
                              stakedRwlkCurrentPage * stakedItemsPerPage
                            )
                            .map((stakedToken) => {
                              const actionId = stakedToken.StakeActionId;
                              const isSelected =
                                selectedStakedRWLKIds.has(actionId);

                              return (
                                <tr
                                  key={`staked-rwlk-${actionId}-${stakedToken.TokenId}`}
                                  className={`hover:bg-background-elevated/50 transition-colors ${
                                    isSelected ? "bg-primary/5" : ""
                                  }`}
                                >
                                  <td className="p-4">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {
                                        const newSet = new Set(
                                          selectedStakedRWLKIds
                                        );
                                        if (newSet.has(actionId)) {
                                          newSet.delete(actionId);
                                        } else {
                                          newSet.add(actionId);
                                        }
                                        setSelectedStakedRWLKIds(newSet);
                                      }}
                                      className="w-4 h-4 rounded border-2 border-text-muted bg-background-elevated cursor-pointer accent-primary"
                                    />
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="h-12 w-12 rounded bg-background-elevated overflow-hidden relative">
                                        <RWLKNFTImage
                                          tokenId={stakedToken.TokenId}
                                          alt={stakedToken.TokenName || `Random Walk #${stakedToken.TokenId}`}
                                          className="object-contain"
                                        />
                                      </div>
                                      <div>
                                        <p className="font-serif font-semibold text-text-primary">
                                          {stakedToken.TokenName ||
                                            `Random Walk #${stakedToken.TokenId}`}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-center">
                                    <p className="font-mono text-text-primary">
                                      #{stakedToken.TokenId}
                                    </p>
                                  </td>
                                  <td className="p-4 text-center">
                                    <p className="font-mono text-text-primary">
                                      {actionId}
                                    </p>
                                  </td>
                                  <td className="p-4">
                                    <p className="text-sm text-text-primary">
                                      {stakedToken.StakeDateTime
                                        ? new Date(
                                            stakedToken.StakeDateTime
                                          ).toLocaleDateString()
                                        : "N/A"}
                                    </p>
                                    {stakedToken.StakeDateTime && (
                                      <p className="text-xs text-text-muted">
                                        {Math.floor(
                                          (Date.now() -
                                            new Date(
                                              stakedToken.StakeDateTime
                                            ).getTime()) /
                                            (1000 * 60 * 60 * 24)
                                        )}{" "}
                                        days ago
                                      </p>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        rwlk.unstake(
                                          actionId,
                                          stakedToken.TokenId
                                        )
                                      }
                                      disabled={
                                        rwlk.unstakingActionId === actionId ||
                                        rwlk.isSubmitting
                                      }
                                    >
                                      {rwlk.unstakingActionId === actionId
                                        ? "Unstaking..."
                                        : "Unstake"}
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {Math.ceil(rwlk.stakedTokens.length / stakedItemsPerPage) >
                      1 && (
                      <div className="flex justify-center items-center gap-2 p-4 border-t border-text-muted/10">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setStakedRwlkCurrentPage(stakedRwlkCurrentPage - 1)
                          }
                          disabled={stakedRwlkCurrentPage === 1}
                        >
                          Previous
                        </Button>

                        <div className="flex gap-1">
                          {Array.from(
                            {
                              length: Math.ceil(
                                rwlk.stakedTokens.length / stakedItemsPerPage
                              ),
                            },
                            (_, i) => i + 1
                          ).map((page) => {
                            const rwlkStakedTotalPages = Math.ceil(
                              rwlk.stakedTokens.length / stakedItemsPerPage
                            );
                            const showPage =
                              page === 1 ||
                              page === rwlkStakedTotalPages ||
                              (page >= stakedRwlkCurrentPage - 1 &&
                                page <= stakedRwlkCurrentPage + 1);

                            if (!showPage) {
                              if (
                                page === stakedRwlkCurrentPage - 2 ||
                                page === stakedRwlkCurrentPage + 2
                              ) {
                                return (
                                  <span
                                    key={page}
                                    className="px-3 py-2 text-text-muted"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }

                            return (
                              <Button
                                key={page}
                                size="sm"
                                variant={
                                  stakedRwlkCurrentPage === page
                                    ? "primary"
                                    : "outline"
                                }
                                onClick={() => setStakedRwlkCurrentPage(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setStakedRwlkCurrentPage(stakedRwlkCurrentPage + 1)
                          }
                          disabled={
                            stakedRwlkCurrentPage ===
                            Math.ceil(
                              rwlk.stakedTokens.length / stakedItemsPerPage
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Container>
            </section>
          )}
        </>
      )}

      {/* FAQ Section - Collapsible */}
      <section className="py-6 bg-background-surface/50">
        <Container size="lg">
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFAQ(!showFAQ)}
              className="gap-2"
            >
              <HelpCircle size={18} />
              {showFAQ ? 'Hide' : 'Show'} Staking FAQ
              <ChevronDown 
                size={18} 
                className={`transition-transform ${showFAQ ? 'rotate-180' : ''}`}
              />
            </Button>
          </div>

          {showFAQ && (
            <Card glass className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="heading-md">Staking FAQ</h2>
                <button
                  onClick={() => setShowFAQ(false)}
                  className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-text-secondary hover:text-text-primary" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "When do I receive staking rewards?",
                a: "Rewards accumulate automatically after each round ends. You can claim them whenever you unstake your NFTs.",
              },
              {
                q: "Can I stake and unstake multiple times?",
                a: "No, each NFT can only be staked once, ever.",
              },
              {
                q: "How are rewards calculated?",
                a: "Rewards are distributed proportionally. If you have 10 staked NFTs out of 100 total staked, you earn 10% of the staking reward pool each round.",
              },
              {
                q: "Is there a minimum staking period?",
                a: "No. You can unstake at any time and claim your accumulated rewards. There are no lock periods or penalties.",
              },
              {
                q: "What happens if no one stakes?",
                a: `If there are no Cosmic Signature NFTs staked when a round ends, the ${stakingPercentage}% staking allocation is added to the charity donation instead.`,
              },
              {
                q: "Can staked NFTs be traded?",
                a: "No. While your NFTs are staked, they are held by the staking contract and cannot be transferred or sold. You must unstake first.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card glass className="p-6 h-full">
                  <h3 className="font-serif text-lg font-semibold text-text-primary mb-3">
                    {faq.q}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {faq.a}
                  </p>
                </Card>
              </motion.div>
            ))}
              </div>
            </Card>
          )}
        </Container>
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Grid3x3, List, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAccount } from "wagmi";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NFTCard } from "@/components/nft/NFTCard";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { api, getAssetsUrl } from "@/services/api";

interface NFTData {
  TokenId: number;
  Seed: string;
  TimeStamp: number;
  TokenName?: string;
  RoundNum: number;
  Staked: boolean;
  WasUnstaked: boolean;
}

interface StakedToken {
  TokenId: number;
}

export default function MyNFTsPage() {
  const { address, isConnected } = useAccount();
  const [filter, setFilter] = useState<"all" | "staked" | "unstaked">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [stakedNFTs, setStakedNFTs] = useState<number[]>([]);

  // Fetch user's NFTs
  useEffect(() => {
    async function fetchNFTs() {
      if (!address || !isConnected) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch user's NFTs and staked NFTs
        const [userNFTs, stakedTokens] = await Promise.all([
          api.getCSTTokensByUser(address),
          api.getStakedCSTTokensByUser(address),
        ]);

        setNfts(userNFTs);
        setStakedNFTs(stakedTokens.map((token: StakedToken) => token.TokenId));
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, [address, isConnected]);

  // Transform API data to component format
  const transformedNFTs = nfts.map((nft) => ({
    id: nft.TokenId,
    tokenId: nft.TokenId,
    name: `Cosmic Signature #${nft.TokenId}`,
    customName: nft.TokenName || undefined,
    owner: address || "",
    round: nft.RoundNum,
    seed: `0x${nft.Seed}`,
    imageUrl: getAssetsUrl(`cosmicsignature/0x${nft.Seed}.png`),
    videoUrl: getAssetsUrl(`cosmicsignature/0x${nft.Seed}.mp4`),
    mintedAt: new Date(nft.TimeStamp * 1000).toISOString(),
    attributes: [],
  }));

  const filteredNFTs = transformedNFTs.filter((nft) => {
    // Filter by staking status
    if (filter === "staked" && !stakedNFTs.includes(nft.tokenId)) return false;
    if (filter === "unstaked" && stakedNFTs.includes(nft.tokenId)) return false;

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        nft.name.toLowerCase().includes(q) ||
        nft.tokenId.toString().includes(q) ||
        (nft.customName && nft.customName.toLowerCase().includes(q))
      );
    }

    return true;
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <section className="section-padding bg-background-surface/50">
          <Container>
            <Breadcrumbs
              items={[
                { label: "My Account", href: "/account" },
                { label: "My NFTs" },
              ]}
              className="mb-8"
            />
            <Card glass className="p-12 text-center">
              <h1 className="heading-sm mb-4">Connect Your Wallet</h1>
              <p className="text-text-secondary">
                Please connect your wallet to view your NFT collection
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
              { label: "My NFTs" },
            ]}
            className="mb-8"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="heading-xl mb-4">My Collection</h1>
            <p className="body-lg">
              {loading
                ? "Loading your NFTs..."
                : `You own ${nfts.length} Cosmic Signature NFT${
                    nfts.length !== 1 ? "s" : ""
                  } • ${stakedNFTs.length} currently staked`}
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Filters and Controls */}
      <section className="sticky top-[72px] lg:top-[88px] z-40 bg-background/95 backdrop-blur-xl border-b border-text-muted/10">
        <Container>
          <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex p-1 rounded-lg bg-background-elevated border border-text-muted/10">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  filter === "all"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                All ({nfts.length})
              </button>
              <button
                onClick={() => setFilter("staked")}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  filter === "staked"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Staked ({stakedNFTs.length})
              </button>
              <button
                onClick={() => setFilter("unstaked")}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  filter === "unstaked"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Unstaked ({nfts.length - stakedNFTs.length})
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-background-surface border border-text-muted/10 text-text-primary text-sm placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 p-1 rounded-lg bg-background-surface border border-text-muted/10">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:text-primary"
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:text-primary"
                  }`}
                  aria-label="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* NFT Grid/List */}
      <section className="section-padding">
        <Container>
          {loading ? (
            <Card glass className="p-12 text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
              <p className="text-text-secondary">Loading your NFTs...</p>
            </Card>
          ) : filteredNFTs.length === 0 ? (
            <Card glass className="p-12 text-center">
              <p className="text-text-secondary">
                {nfts.length === 0
                  ? "You don't own any Cosmic Signature NFTs yet. Start playing to win!"
                  : "No NFTs found matching your criteria."}
              </p>
              {nfts.length === 0 && (
                <Button className="mt-6" asChild>
                  <Link href="/game/play">Place Your First Bid</Link>
                </Button>
              )}
            </Card>
          ) : (
            <>
              <div className="mb-6 text-sm text-text-secondary">
                Showing {filteredNFTs.length} NFT
                {filteredNFTs.length !== 1 ? "s" : ""}
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredNFTs.map((nft, index) => {
                    const isStaked = stakedNFTs.includes(nft.tokenId);

                    return (
                      <div key={nft.id} className="relative">
                        {/* Staking Status Badge */}
                        {isStaked && (
                          <div className="absolute top-6 left-6 z-10">
                            <StatusBadge status="staked" />
                          </div>
                        )}

                        <NFTCard nft={nft} delay={index * 0.05} />

                        {/* Quick Actions */}
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" asChild>
                            <Link href={`/gallery/${nft.tokenId}`}>View Details</Link>
                          </Button>
                          <Button size="sm" className="flex-1" asChild>
                            <Link href="/stake">
                              {isStaked ? "Manage" : "Stake"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNFTs.map((nft) => {
                    const isStaked = stakedNFTs.includes(nft.tokenId);

                    return (
                      <Card key={nft.id} glass hover className="p-6">
                        <div className="flex items-center space-x-6">
                          {/* Thumbnail */}
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-background-elevated">
                            <Image
                              src={nft.imageUrl}
                              alt={nft.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-serif text-xl font-semibold text-text-primary truncate">
                                {nft.customName || nft.name}
                              </h3>
                              {isStaked && <StatusBadge status="staked" />}
                            </div>
                            <p className="text-sm text-text-secondary">
                              Token ID: #{nft.tokenId} • Round {nft.round}
                            </p>
                            {isStaked && (
                              <p className="text-xs text-status-success mt-1">
                                Earning staking rewards
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/gallery/${nft.tokenId}`}>View</Link>
                            </Button>
                            <Button size="sm" asChild>
                              <Link href="/stake">
                                {isStaked ? "Manage" : "Stake"}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </div>
  );
}

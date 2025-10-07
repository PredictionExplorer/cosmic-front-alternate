"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Grid3x3, List } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { NFTCard } from "@/components/nft/NFTCard";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { MOCK_CURRENT_USER } from "@/lib/mockData/users";
import { MOCK_NFTS } from "@/lib/constants";

export default function MyNFTsPage() {
  const [filter, setFilter] = useState<"all" | "staked" | "unstaked">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const user = MOCK_CURRENT_USER;

  // Mock: First 12 NFTs belong to user, first 5 are staked
  const userNFTs = MOCK_NFTS.slice(0, user.nftsOwned);
  const stakedNFTIds = userNFTs
    .slice(0, user.nftsStaked)
    .map((nft) => nft.tokenId);

  const filteredNFTs = userNFTs.filter((nft) => {
    // Filter by staking status
    if (filter === "staked" && !stakedNFTIds.includes(nft.tokenId))
      return false;
    if (filter === "unstaked" && stakedNFTIds.includes(nft.tokenId))
      return false;

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

  const handleBatchStake = () => {
    console.log("Staking NFTs:", selected);
    // Will connect to blockchain later
  };

  const handleBatchUnstake = () => {
    console.log("Unstaking NFTs:", selected);
    // Will connect to blockchain later
  };

  const toggleSelect = (tokenId: number) => {
    setSelected((prev) =>
      prev.includes(tokenId)
        ? prev.filter((id) => id !== tokenId)
        : [...prev, tokenId]
    );
  };

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
              You own {user.nftsOwned} Cosmic Signature NFT
              {user.nftsOwned !== 1 ? "s" : ""} • {user.nftsStaked} currently
              staked
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
                All ({userNFTs.length})
              </button>
              <button
                onClick={() => setFilter("staked")}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  filter === "staked"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Staked ({stakedNFTIds.length})
              </button>
              <button
                onClick={() => setFilter("unstaked")}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  filter === "unstaked"
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-primary"
                }`}
              >
                Unstaked ({userNFTs.length - stakedNFTIds.length})
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Batch Actions */}
              {selected.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{selected.length} selected</Badge>
                  <Button size="sm" onClick={handleBatchStake}>
                    Stake Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchUnstake}
                  >
                    Unstake Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelected([])}
                  >
                    Clear
                  </Button>
                </div>
              )}

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
          {filteredNFTs.length === 0 ? (
            <Card glass className="p-12 text-center">
              <p className="text-text-secondary">
                No NFTs found matching your criteria.
              </p>
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
                    const isStaked = stakedNFTIds.includes(nft.tokenId);
                    const isSelected = selected.includes(nft.tokenId);

                    return (
                      <div key={nft.id} className="relative">
                        {/* Selection Checkbox */}
                        <div className="absolute top-6 right-6 z-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(nft.tokenId)}
                            className="w-5 h-5 rounded border-text-muted/30 bg-background-elevated/80 backdrop-blur-sm text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                          />
                        </div>

                        {/* Staking Status Badge */}
                        {isStaked && (
                          <div className="absolute top-6 left-6 z-10">
                            <StatusBadge status="staked" />
                          </div>
                        )}

                        <NFTCard nft={nft} delay={index * 0.05} />

                        {/* Quick Actions */}
                        <div className="mt-3 flex gap-2">
                          {isStaked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              Unstake
                            </Button>
                          ) : (
                            <Button size="sm" className="flex-1">
                              Stake
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/gallery/${nft.tokenId}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNFTs.map((nft) => {
                    const isStaked = stakedNFTIds.includes(nft.tokenId);
                    const isSelected = selected.includes(nft.tokenId);

                    return (
                      <Card key={nft.id} glass hover className="p-6">
                        <div className="flex items-center space-x-6">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(nft.tokenId)}
                            className="w-5 h-5 rounded border-text-muted/30 bg-background-elevated text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                          />

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
                                Earning rewards
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {isStaked ? (
                              <Button size="sm" variant="outline">
                                Unstake & Claim
                              </Button>
                            ) : (
                              <Button size="sm">Stake</Button>
                            )}
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/gallery/${nft.tokenId}`}>View</Link>
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

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Grid3x3, List, Search } from "lucide-react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NFTCard } from "@/components/nft/NFTCard";
import api from "@/services/api";

export default function GalleryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "id">("newest");
  const [allNFTs, setAllNFTs] = useState<
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
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all NFTs from API
  useEffect(() => {
    async function fetchNFTs() {
      try {
        setIsLoading(true);
        const nfts = await api.getCSTList();

        // Transform API data to component format
        const transformed = nfts.map((nft: Record<string, unknown>) => ({
          id: (nft.TokenId as number) || 0,
          tokenId: (nft.TokenId as number) || 0,
          name: `Cosmic Signature #${nft.TokenId}`,
          customName: (nft.TokenName as string | null) || undefined,
          seed: `0x${nft.Seed}`,
          imageUrl: `https://nfts.cosmicsignature.com/cosmicsignature/0x${nft.Seed}.png`,
          owner: (nft.WinnerAddr as string) || "0x0",
          round: (nft.RoundNum as number) || 0,
          mintedAt: new Date((nft.TimeStamp as number) * 1000).toISOString(),
          attributes: [],
        }));

        setAllNFTs(transformed);
      } catch (error) {
        console.error("Failed to fetch NFTs:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNFTs();
  }, []);

  // Filter and sort NFTs
  const filteredNFTs = allNFTs
    .filter((nft) => {
      const search = searchQuery.toLowerCase();
      const name = nft.customName || nft.name;
      return (
        name.toLowerCase().includes(search) ||
        nft.tokenId.toString().includes(search) ||
        nft.owner.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime();
      if (sortBy === "oldest")
        return new Date(a.mintedAt).getTime() - new Date(b.mintedAt).getTime();
      return a.tokenId - b.tokenId;
    });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="heading-xl text-balance mb-6">The Gallery</h1>
            <p className="body-xl max-w-3xl mx-auto">
              Explore the complete collection of Cosmic Signature NFTs. Each
              piece is a unique work of generative art, created through a
              deterministic algorithm with a verifiable seed.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Filters and Controls */}
      <section className="sticky top-[72px] lg:top-[88px] z-40 bg-background/95 backdrop-blur-xl border-b border-text-muted/10">
        <Container>
          <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                placeholder="Search by token ID, name, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-background-surface border border-text-muted/10 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="flex items-center space-x-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "newest" | "oldest" | "id")
                }
                className="px-4 py-3 rounded-lg bg-background-surface border border-text-muted/10 text-text-primary focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="id">Token ID</option>
              </select>

              {/* View Mode */}
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
                  <Grid3x3 size={20} />
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
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* NFT Grid/List */}
      <section className="section-padding">
        <Container>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="animate-pulse">
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
          ) : filteredNFTs.length === 0 ? (
            <Card glass className="p-12 text-center">
              <p className="text-text-secondary">
                {allNFTs.length === 0
                  ? "No NFTs have been minted yet."
                  : "No NFTs found matching your search."}
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
                  {filteredNFTs.map((nft, index) => (
                    <NFTCard
                      key={nft.id}
                      nft={nft}
                      delay={Math.min(index * 0.05, 0.4)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: Math.min(index * 0.05, 0.3),
                      }}
                    >
                      <Card glass hover className="p-6">
                        <div className="flex items-center space-x-6">
                          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-background-elevated">
                            <Image
                              src={nft.imageUrl}
                              alt={nft.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif text-xl font-semibold text-text-primary mb-1 truncate">
                              {nft.customName || nft.name}
                            </h3>
                            <p className="text-sm text-text-secondary mb-2">
                              Token ID: #{nft.tokenId} • Round {nft.round}
                            </p>
                            <p className="text-xs text-text-muted">
                              Owner: {nft.owner}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/gallery/${nft.tokenId}`}>View</a>
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </Container>
      </section>
    </div>
  );
}

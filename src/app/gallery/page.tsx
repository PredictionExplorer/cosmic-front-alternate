"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Grid3x3, List, Search } from "lucide-react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NFTCard } from "@/components/nft/NFTCard";
import api, { getAssetsUrl } from "@/services/api";
import { safeTimestamp } from "@/lib/utils";

export default function GalleryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "id">("id");
  const [currentPage, setCurrentPage] = useState(1);
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
  const itemsPerPage = viewMode === "grid" ? 20 : 10; // 20 for grid view, 10 for list view

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
          imageUrl: getAssetsUrl(`images/new/cosmicsignature/0x${nft.Seed}.png`),
          owner: (nft.CurOwnerAddr as string) || "0x0",
          round: (nft.RoundNum as number) || 0,
          mintedAt: safeTimestamp(nft),
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, viewMode]);

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
      // Sort by TokenId descending (highest first) like the old project
      return b.tokenId - a.tokenId;
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNFTs = filteredNFTs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to the NFT grid section
    const nftSection = document.getElementById("nft-gallery-section");
    if (nftSection) {
      nftSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Compact Filters and Controls Bar */}
      <section className="sticky top-[72px] lg:top-[88px] z-40 bg-background/95 backdrop-blur-xl border-b border-text-muted/10">
        <Container>
          <div className="py-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
                <option value="id">Token ID (Desc)</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
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
      <section className="section-padding relative" id="nft-gallery-section">
        {/* Floating Info Card - Positioned over NFT grid (hidden on mobile) */}
        <div className="hidden lg:block absolute top-8 left-8 z-10 pointer-events-none">
          <Card glass className="w-80 p-6 shadow-2xl border-2 border-text-muted/20 backdrop-blur-md">
            <h1 className="text-2xl font-serif font-semibold text-text-primary mb-2">
              The Gallery
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              Explore the complete collection of Cosmic Signature NFTs. Each piece is unique generative art.
            </p>
          </Card>
        </div>

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
                Showing {startIndex + 1}-{Math.min(endIndex, filteredNFTs.length)} of {filteredNFTs.length} NFT
                {filteredNFTs.length !== 1 ? "s" : ""}
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedNFTs.map((nft, index) => (
                    <NFTCard
                      key={nft.id}
                      nft={nft}
                      delay={Math.min(index * 0.05, 0.4)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedNFTs.map((nft, index) => (
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
                              Token ID: #{nft.tokenId} • Round {nft.round} minted
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

              {/* Pagination Controls */}
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
                      // Show first page, last page, current page, and pages around current
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
    </div>
  );
}

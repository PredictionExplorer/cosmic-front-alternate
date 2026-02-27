"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Image as ImageIcon,
  Loader2,
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  Coins,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import { formatDate } from "@/lib/utils";
import api from "@/services/api";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface DonatedNFT {
  RecordId: number;
  Tx: {
    EvtLogId: number;
    BlockNum: number;
    TxId: number;
    TxHash: string;
    TimeStamp: number;
    DateTime: string;
  };
  Index: number;
  RoundNum: number;
  DonorAid: number;
  DonorAddr: string;
  TokenAddr: string;
  NFTTokenId: number;
  NFTTokenURI: string;
  ImageURL?: string;
  WinnerAid?: number;
  WinnerAddr?: string;
  Claimed?: boolean;
}

interface DonatedERC20 {
  RecordId: number;
  Tx: {
    EvtLogId: number;
    BlockNum: number;
    TxId: number;
    TxHash: string;
    TimeStamp: number;
    DateTime: string;
  };
  RoundNum: number;
  TokenAid: number;
  TokenAddr: string;
  AmountDonated: string;
  AmountDonatedEth: number;
  AmountClaimed: string;
  AmountClaimedEth: number;
  DonateClaimDiff: string;
  DonateClaimDiffEth: number;
  WinnerAid: number;
  WinnerAddr: string;
  Claimed: boolean;
}

// ─── NFT Image Card Component ─────────────────────────────────────────────────

function resolveIpfsUrl(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  return uri;
}

function NFTDonationCard({ nft }: { nft: DonatedNFT }) {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function resolve() {
      // 1. Direct image URL from API
      if (nft.ImageURL) {
        setImgSrc(resolveIpfsUrl(nft.ImageURL));
        return;
      }
      // 2. Fetch token URI metadata
      if (!nft.NFTTokenURI) return;
      try {
        setImgLoading(true);
        const res = await fetch(resolveIpfsUrl(nft.NFTTokenURI));
        if (!res.ok) throw new Error("metadata fetch failed");
        const meta = await res.json();
        const image = meta?.image || meta?.image_url || "";
        if (image) setImgSrc(resolveIpfsUrl(image));
      } catch {
        // no image available
      } finally {
        setImgLoading(false);
      }
    }

    resolve();
  }, [nft]);

  const bidEvtLogId = nft.Tx?.EvtLogId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card glass className="overflow-hidden hover:border-primary/30 transition-colors">
        {/* NFT Image */}
        <div className="relative aspect-square bg-background-elevated flex items-center justify-center">
          {imgLoading ? (
            <Loader2 className="animate-spin text-text-muted" size={36} />
          ) : imgSrc && !imgError ? (
            <Image
              src={imgSrc}
              alt={`NFT #${nft.NFTTokenId}`}
              fill
              className="object-cover"
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-text-muted">
              <ImageIcon size={40} />
              <p className="text-xs">No image</p>
            </div>
          )}

          {/* Claimed badge overlay */}
          <div className="absolute top-2 right-2">
            {nft.Claimed ? (
              <Badge variant="success" className="flex items-center gap-1 shadow-lg">
                <CheckCircle size={11} />
                Claimed
              </Badge>
            ) : (
              <Badge variant="warning" className="flex items-center gap-1 shadow-lg">
                <XCircle size={11} />
                Unclaimed
              </Badge>
            )}
          </div>

          {/* Round badge overlay */}
          <div className="absolute top-2 left-2">
            <Badge variant="default" className="shadow-lg">
              Round {nft.RoundNum}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-semibold text-primary">
              #{nft.NFTTokenId}
            </span>
            <a
              href={`https://arbiscan.io/token/${nft.TokenAddr}?a=${nft.NFTTokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-primary transition-colors"
              title="View on Arbiscan"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          <div>
            <p className="text-xs text-text-secondary mb-1">Contract</p>
            <AddressDisplay address={nft.TokenAddr} shorten showCopy={false} />
          </div>

          <div>
            <p className="text-xs text-text-secondary mb-1">Donor</p>
            <AddressDisplay address={nft.DonorAddr} shorten showCopy={false} />
          </div>

          {nft.WinnerAddr && (
            <div>
              <p className="text-xs text-text-secondary mb-1">Winner</p>
              <AddressDisplay address={nft.WinnerAddr} shorten showCopy={false} />
            </div>
          )}

          <div className="text-xs text-text-muted">
            {nft.Tx?.TimeStamp
              ? formatDate(new Date(nft.Tx.TimeStamp * 1000))
              : "—"}
          </div>

          {bidEvtLogId && (
            <Link href={`/game/history/bids/${bidEvtLogId}`}>
              <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                View bid <ExternalLink size={11} />
              </span>
            </Link>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Stats Interface ──────────────────────────────────────────────────────────

interface NFTDonationStats {
  TotalDonated?: number;
  TotalClaimed?: number;
  TotalUnclaimed?: number;
  NumDonations?: number;
  NumClaimed?: number;
  NumUnclaimed?: number;
  // catch-all for other numeric fields the API may return
  [key: string]: number | string | undefined;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "nfts" | "erc20";
type ClaimFilter = "all" | "unclaimed" | "claimed";

export default function DonationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("nfts");

  // NFT state
  const [nfts, setNfts] = useState<DonatedNFT[]>([]);
  const [nftsLoading, setNftsLoading] = useState(true);
  const [nftsError, setNftsError] = useState<string | null>(null);

  // NFT statistics from dedicated endpoint
  const [nftStats, setNftStats] = useState<NFTDonationStats | null>(null);

  // ERC-20 state
  const [erc20s, setErc20s] = useState<DonatedERC20[]>([]);
  const [erc20Loading, setErc20Loading] = useState(true);
  const [erc20Error, setErc20Error] = useState<string | null>(null);

  // Filters
  const [roundFilter, setRoundFilter] = useState("");
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>("all");

  // Fetch all data in parallel
  useEffect(() => {
    async function fetchNFTs() {
      try {
        setNftsLoading(true);
        setNftsError(null);
        const listData = await api.getNFTDonationsList();
        const rawNfts: DonatedNFT[] = Array.isArray(listData) ? listData : [];

        if (rawNfts.length === 0) {
          setNfts([]);
          return;
        }

        // The list endpoint doesn't JOIN the claims table, so Claimed is always
        // undefined. Enrich it by fetching unclaimed NFTs per unique round.
        const uniqueRounds = [...new Set(rawNfts.map((n) => n.RoundNum))];
        const unclaimedResults = await Promise.all(
          uniqueRounds.map((roundNum) =>
            api.getUnclaimedDonatedNFTsByRound(roundNum).catch(() => [])
          )
        );

        // Build a set of "round-index" keys that are still unclaimed
        const unclaimedKeys = new Set<string>();
        unclaimedResults.forEach((items, i) => {
          const roundNum = uniqueRounds[i];
          (items as DonatedNFT[]).forEach((item) => {
            unclaimedKeys.add(`${roundNum}-${item.Index}`);
          });
        });

        const enriched = rawNfts.map((nft) => ({
          ...nft,
          Claimed: !unclaimedKeys.has(`${nft.RoundNum}-${nft.Index}`),
        }));

        setNfts(enriched);
      } catch {
        setNftsError("Failed to load donated NFTs");
      } finally {
        setNftsLoading(false);
      }
    }

    async function fetchNFTStats() {
      try {
        const data = await api.getNFTDonationStatistics();
        if (data && typeof data === "object") setNftStats(data as NFTDonationStats);
      } catch {
        // stats are non-critical, fail silently
      }
    }

    async function fetchERC20() {
      try {
        setErc20Loading(true);
        setErc20Error(null);
        const data = await api.getERC20DonationsList();
        setErc20s(Array.isArray(data) ? data : []);
      } catch {
        setErc20Error("Failed to load donated ERC-20 tokens");
      } finally {
        setErc20Loading(false);
      }
    }

    fetchNFTs();
    fetchNFTStats();
    fetchERC20();
  }, []);

  // Filter helpers
  const filteredNFTs = nfts.filter((n) => {
    const roundOk = roundFilter ? String(n.RoundNum) === roundFilter : true;
    const claimOk =
      claimFilter === "all"
        ? true
        : claimFilter === "claimed"
        ? n.Claimed
        : !n.Claimed;
    return roundOk && claimOk;
  });

  const filteredERC20s = erc20s.filter((t) => {
    const roundOk = roundFilter ? String(t.RoundNum) === roundFilter : true;
    const claimOk =
      claimFilter === "all"
        ? true
        : claimFilter === "claimed"
        ? t.Claimed
        : !t.Claimed;
    return roundOk && claimOk;
  });

  const clearFilters = useCallback(() => {
    setRoundFilter("");
    setClaimFilter("all");
  }, []);

  const hasFilters = roundFilter !== "" || claimFilter !== "all";

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Donations" },
            ]}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <Gift className="text-primary" size={40} />
              <div>
                <h1 className="heading-lg">Donations</h1>
                <p className="body-lg text-text-secondary">
                  All NFTs and ERC-20 tokens donated during bids
                </p>
              </div>
            </div>

            {/* Summary stats */}
            <div className="flex flex-wrap gap-3 mt-4">
              {/* NFT total — prefer API stats, fall back to list length */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background-elevated border border-text-muted/10">
                <Gift size={16} className="text-primary" />
                <span className="text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">
                    {nftStats?.TotalDonated ?? nftStats?.NumDonations ?? nfts.length}
                  </span>{" "}
                  Donated NFTs
                </span>
              </div>

              {/* Claimed NFTs */}
              {(nftStats?.TotalClaimed != null || nftStats?.NumClaimed != null) && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-status-success/10 border border-status-success/20">
                  <CheckCircle size={16} className="text-status-success" />
                  <span className="text-sm text-text-secondary">
                    <span className="font-semibold text-status-success">
                      {nftStats.TotalClaimed ?? nftStats.NumClaimed}
                    </span>{" "}
                    Claimed
                  </span>
                </div>
              )}

              {/* Unclaimed NFTs */}
              {(nftStats?.TotalUnclaimed != null || nftStats?.NumUnclaimed != null) && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-status-warning/10 border border-status-warning/20">
                  <XCircle size={16} className="text-status-warning" />
                  <span className="text-sm text-text-secondary">
                    <span className="font-semibold text-status-warning">
                      {nftStats.TotalUnclaimed ?? nftStats.NumUnclaimed}
                    </span>{" "}
                    Unclaimed
                  </span>
                </div>
              )}

              {/* ERC-20 count */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background-elevated border border-text-muted/10">
                <Coins size={16} className="text-primary" />
                <span className="text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">{erc20s.length}</span>{" "}
                  ERC-20 Donations
                </span>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Content */}
      <section className="section-padding">
        <Container>
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab("nfts")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === "nfts"
                  ? "bg-primary text-white"
                  : "bg-background-elevated text-text-secondary hover:text-primary"
              }`}
            >
              <Gift size={14} className="inline mr-2" />
              Donated NFTs ({nfts.length})
            </button>
            <button
              onClick={() => setActiveTab("erc20")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === "erc20"
                  ? "bg-primary text-white"
                  : "bg-background-elevated text-text-secondary hover:text-primary"
              }`}
            >
              <Coins size={14} className="inline mr-2" />
              ERC-20 Tokens ({erc20s.length})
            </button>
          </div>

          {/* Filters */}
          <Card glass className="mb-6 p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Round search */}
              <div className="flex items-center gap-2 flex-1 min-w-[140px] max-w-[220px]">
                <Search size={16} className="text-text-muted flex-shrink-0" />
                <input
                  type="number"
                  placeholder="Filter by round…"
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
                  min={0}
                />
              </div>

              {/* Claim filter */}
              <div className="flex items-center gap-2">
                {(["all", "unclaimed", "claimed"] as ClaimFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setClaimFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      claimFilter === f
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-background-elevated text-text-secondary hover:text-primary"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-text-muted hover:text-primary transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </Card>

          {/* ── NFT Tab ───────────────────────────────────────────────── */}
          {activeTab === "nfts" && (
            <>
              {nftsLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="animate-spin text-primary mr-3" size={28} />
                  <span className="text-text-secondary">Loading donated NFTs…</span>
                </div>
              ) : nftsError ? (
                <Card glass className="p-12 text-center">
                  <p className="text-status-error">{nftsError}</p>
                </Card>
              ) : filteredNFTs.length === 0 ? (
                <Card glass className="p-12 text-center">
                  <Gift className="mx-auto mb-4 text-text-muted" size={48} />
                  <p className="text-text-secondary">
                    {hasFilters
                      ? "No donated NFTs match the current filters."
                      : "No donated NFTs found."}
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredNFTs.map((nft) => (
                    <NFTDonationCard key={nft.RecordId ?? `${nft.TokenAddr}-${nft.NFTTokenId}`} nft={nft} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── ERC-20 Tab ────────────────────────────────────────────── */}
          {activeTab === "erc20" && (
            <>
              {erc20Loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="animate-spin text-primary mr-3" size={28} />
                  <span className="text-text-secondary">Loading ERC-20 donations…</span>
                </div>
              ) : erc20Error ? (
                <Card glass className="p-12 text-center">
                  <p className="text-status-error">{erc20Error}</p>
                </Card>
              ) : filteredERC20s.length === 0 ? (
                <Card glass className="p-12 text-center">
                  <Coins className="mx-auto mb-4 text-text-muted" size={48} />
                  <p className="text-text-secondary">
                    {hasFilters
                      ? "No ERC-20 donations match the current filters."
                      : "No ERC-20 donations found."}
                  </p>
                </Card>
              ) : (
                <Card glass>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="text-primary" size={20} />
                      ERC-20 Token Donations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-text-muted/10">
                          <th className="text-left py-3 px-3 text-text-secondary font-medium">Round</th>
                          <th className="text-left py-3 px-3 text-text-secondary font-medium">Token</th>
                          <th className="text-right py-3 px-3 text-text-secondary font-medium">Donated</th>
                          <th className="text-right py-3 px-3 text-text-secondary font-medium">Claimed</th>
                          <th className="text-left py-3 px-3 text-text-secondary font-medium">Winner</th>
                          <th className="text-left py-3 px-3 text-text-secondary font-medium">Date</th>
                          <th className="text-center py-3 px-3 text-text-secondary font-medium">Status</th>
                          <th className="py-3 px-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredERC20s.map((token, i) => (
                          <tr
                            key={token.RecordId ?? i}
                            className="border-b border-text-muted/5 hover:bg-background-elevated/50 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <Link
                                href={`/game/history/rounds/${token.RoundNum}`}
                                className="font-mono text-primary hover:underline"
                              >
                                #{token.RoundNum}
                              </Link>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <AddressDisplay
                                  address={token.TokenAddr}
                                  shorten
                                  showCopy={false}
                                />
                                <a
                                  href={`https://arbiscan.io/token/${token.TokenAddr}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-text-muted hover:text-primary"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono">
                              {token.AmountDonatedEth != null
                                ? token.AmountDonatedEth.toLocaleString(undefined, {
                                    maximumFractionDigits: 6,
                                  })
                                : "—"}
                            </td>
                            <td className="py-3 px-3 text-right font-mono">
                              {token.AmountClaimedEth != null
                                ? token.AmountClaimedEth.toLocaleString(undefined, {
                                    maximumFractionDigits: 6,
                                  })
                                : "—"}
                            </td>
                            <td className="py-3 px-3">
                              {token.WinnerAddr ? (
                                <AddressDisplay
                                  address={token.WinnerAddr}
                                  shorten
                                  showCopy={false}
                                />
                              ) : (
                                <span className="text-text-muted text-xs">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-xs text-text-muted whitespace-nowrap">
                              {token.Tx?.TimeStamp
                                ? formatDate(new Date(token.Tx.TimeStamp * 1000))
                                : "—"}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {token.Claimed ? (
                                <Badge variant="success" className="flex items-center gap-1 w-fit mx-auto">
                                  <CheckCircle size={11} />
                                  Claimed
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="flex items-center gap-1 w-fit mx-auto">
                                  <XCircle size={11} />
                                  Unclaimed
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {token.Tx?.EvtLogId && (
                                <Link href={`/game/history/bids/${token.Tx.EvtLogId}`}>
                                  <span className="text-xs text-primary hover:underline whitespace-nowrap">
                                    View bid
                                  </span>
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Container>
      </section>
    </div>
  );
}

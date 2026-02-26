"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowLeft, Clock, User, MessageSquare, Gift, ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import { formatDate, formatEth } from "@/lib/utils";
import api from "@/services/api";

/** Convert ipfs:// and ipfs.io gateway URIs to a reliable HTTP gateway URL */
function resolveIpfsUrl(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

interface BidInfo {
  Tx: {
    EvtLogId: number;
    BlockNum: number;
    TxId: number;
    TxHash: string;
    TimeStamp: number;
    DateTime: string;
  };
  BidderAid: number;
  BidderAddr: string;
  EthPrice: string;
  EthPriceEth: number;
  CstPrice: string;
  CstPriceEth: number;
  RWalkNFTId: number;
  RoundNum: number;
  BidType: number;
  BidPosition: number;
  PrizeTime: number;
  PrizeTimeDate: string;
  TimeUntilPrize: number;
  CSTReward: string;
  CSTRewardEth: number;
  NFTDonationTokenId: number;
  NFTDonationTokenAddr: string;
  NFTTokenURI: string;
  ImageURL: string;
  Message: string;
  DonatedERC20TokenAddr: string;
  DonatedERC20TokenAmount: string;
  DonatedERC20TokenAmountEth: number;
}

export default function BidDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const bidId = parseInt(resolvedParams.id);

  const [bidInfo, setBidInfo] = useState<BidInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nftImageUrl, setNftImageUrl] = useState<string>("");
  const [nftImageLoading, setNftImageLoading] = useState(false);
  const [nftImageError, setNftImageError] = useState(false);

  useEffect(() => {
    async function fetchBidInfo() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getBidInfo(bidId);
        // API returns { BidInfo: {...}, error: "", status: 1 }
        if (response && typeof response === 'object' && 'BidInfo' in response) {
          setBidInfo(response.BidInfo);
        } else {
          setBidInfo(response);
        }
      } catch (err) {
        console.error("Failed to fetch bid info:", err);
        setError("Failed to load bid information");
      } finally {
        setLoading(false);
      }
    }

    fetchBidInfo();
  }, [bidId]);

  // Resolve NFT image: prefer ImageURL from API, then fetch token URI metadata
  useEffect(() => {
    if (!bidInfo?.NFTDonationTokenAddr || bidInfo.NFTDonationTokenId < 0) return;

    async function resolveNftImage() {
      setNftImageError(false);

      // 1. Use ImageURL from the API if available
      if (bidInfo!.ImageURL) {
        setNftImageUrl(resolveIpfsUrl(bidInfo!.ImageURL));
        return;
      }

      // 2. Fetch token URI metadata to extract the image field
      const tokenUri = bidInfo!.NFTTokenURI;
      if (!tokenUri) return;

      try {
        setNftImageLoading(true);
        const metadataUrl = resolveIpfsUrl(tokenUri);
        const res = await fetch(metadataUrl);
        if (!res.ok) throw new Error(`Failed to fetch token URI: ${res.status}`);
        const metadata = await res.json();
        const imageUri = metadata?.image || metadata?.image_url || "";
        if (imageUri) {
          setNftImageUrl(resolveIpfsUrl(imageUri));
        }
      } catch (err) {
        console.error("Failed to resolve NFT image from token URI:", err);
      } finally {
        setNftImageLoading(false);
      }
    }

    resolveNftImage();
  }, [bidInfo]);

  const getBidTypeLabel = (bidType: number): string => {
    switch (bidType) {
      case 0:
        return "ETH Bid";
      case 1:
        return "RandomWalk Token Bid";
      case 2:
        return "CST Bid";
      default:
        return "Unknown";
    }
  };

  const getBidTypeVariant = (bidType: number): "default" | "success" | "info" => {
    switch (bidType) {
      case 0:
        return "default";
      case 1:
        return "success";
      case 2:
        return "info";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <section className="section-padding">
          <Container>
            <Card glass className="p-12 text-center">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-text-secondary">Loading bid details...</p>
              </div>
            </Card>
          </Container>
        </section>
      </div>
    );
  }

  if (error || !bidInfo) {
    return (
      <div className="min-h-screen">
        <section className="section-padding">
          <Container>
            <Card glass className="p-12 text-center">
              <p className="text-status-error mb-4">{error || "Bid not found"}</p>
              <Link href="/game/history/rounds">
                <Button variant="outline">Back to Rounds</Button>
              </Link>
            </Card>
          </Container>
        </section>
      </div>
    );
  }

  const hasNftDonation = !!bidInfo.NFTDonationTokenAddr && bidInfo.NFTDonationTokenId >= 0;
  const hasErc20Donation = !!bidInfo.DonatedERC20TokenAddr && !!bidInfo.DonatedERC20TokenAmount;
  const hasRwalkNft = bidInfo.RWalkNFTId >= 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Game", href: "/game/play" },
              { label: "Round History", href: "/game/history/rounds" },
              { label: `Round ${bidInfo.RoundNum}`, href: `/game/history/rounds/${bidInfo.RoundNum}` },
              { label: `Bid #${bidInfo.Tx.EvtLogId}` },
            ]}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <Link href={`/game/history/rounds/${bidInfo.RoundNum}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Round
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <Trophy className="text-primary" size={40} />
              <div>
                <h1 className="heading-lg">Bid #{bidInfo.Tx.EvtLogId}</h1>
                <p className="body-lg text-text-secondary">
                  Round {bidInfo.RoundNum} • {formatDate(new Date(bidInfo.Tx.TimeStamp * 1000))}
                </p>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Bid Details */}
      <section className="section-padding">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bid Information Card */}
              <Card glass>
                <CardHeader>
                  <CardTitle>Bid Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-text-secondary mb-2">Bid Type</p>
                      <Badge variant={getBidTypeVariant(bidInfo.BidType)}>
                        {getBidTypeLabel(bidInfo.BidType)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary mb-2">Amount</p>
                      <p className="font-mono text-2xl font-semibold text-primary">
                        {bidInfo.BidType === 2
                          ? `${formatEth(bidInfo.CstPriceEth)} CST`
                          : `${formatEth(bidInfo.EthPriceEth)} ETH`}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-text-muted/10 pt-4">
                    <p className="text-sm text-text-secondary mb-2">
                      <User size={16} className="inline mr-2" />
                      Bidder
                    </p>
                    <AddressDisplay address={bidInfo.BidderAddr} showCopy={true} />
                  </div>

                  <div className="border-t border-text-muted/10 pt-4">
                    <p className="text-sm text-text-secondary mb-2">
                      <Clock size={16} className="inline mr-2" />
                      Timestamp
                    </p>
                    <p className="text-text-primary">
                      {formatDate(new Date(bidInfo.Tx.TimeStamp * 1000))}
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      Block #{bidInfo.Tx.BlockNum}
                    </p>
                  </div>

                  {bidInfo.Message && bidInfo.Message.trim() !== "" && (
                    <div className="border-t border-text-muted/10 pt-4">
                      <p className="text-sm text-text-secondary mb-2">
                        <MessageSquare size={16} className="inline mr-2" />
                        Message
                      </p>
                      <p className="text-text-primary italic">
                        &quot;{bidInfo.Message}&quot;
                      </p>
                    </div>
                  )}

                  <div className="border-t border-text-muted/10 pt-4">
                    <p className="text-sm text-text-secondary mb-2">Transaction</p>
                    <a
                      href={`https://arbiscan.io/tx/${bidInfo.Tx.TxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline font-mono text-sm"
                    >
                      {bidInfo.Tx.TxHash.slice(0, 20)}...{bidInfo.Tx.TxHash.slice(-18)}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* CST Reward Card */}
              <Card glass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="text-status-success" size={20} />
                    Bidder Earned CST Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 rounded-lg bg-status-success/10 border border-status-success/20 text-center">
                    <p className="text-sm text-text-secondary mb-2">Total CST Reward</p>
                    <p className="font-mono text-4xl font-bold text-status-success mb-2">
                      {bidInfo.CSTRewardEth} CST
                    </p>
                    <p className="text-xs text-text-muted">
                      Earned from placing this bid
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* RandomWalk NFT Used */}
              {hasRwalkNft && (
                <Card glass>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="text-status-success" size={20} />
                      RandomWalk NFT Used (50% Discount)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/20">
                      <p className="text-text-primary mb-2">
                        This bid used RandomWalk NFT to get a 50% discount on the bid price.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary">Token ID:</span>
                        <span className="font-mono text-lg font-semibold text-status-success">
                          #{bidInfo.RWalkNFTId}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Donated NFT */}
              {hasNftDonation && (
                <Card glass>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="text-primary" size={20} />
                      Donated NFT (ERC-721)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* NFT Image */}
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-background-elevated border border-text-muted/10 flex items-center justify-center">
                        {nftImageLoading ? (
                          <Loader2 className="animate-spin text-text-muted" size={40} />
                        ) : nftImageUrl && !nftImageError ? (
                          <Image
                            src={nftImageUrl}
                            alt={`NFT #${bidInfo.NFTDonationTokenId}`}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={() => setNftImageError(true)}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 text-text-muted">
                            <ImageIcon size={48} />
                            <p className="text-xs">No image available</p>
                          </div>
                        )}
                      </div>

                      {/* NFT Details */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-text-secondary mb-2">Token ID</p>
                          <p className="font-mono text-2xl font-semibold text-primary">
                            #{bidInfo.NFTDonationTokenId}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary mb-2">Contract Address</p>
                          <AddressDisplay 
                            address={bidInfo.NFTDonationTokenAddr} 
                            showCopy={true}
                            shorten={true}
                          />
                        </div>
                        <div>
                          <a
                            href={`https://arbiscan.io/token/${bidInfo.NFTDonationTokenAddr}?a=${bidInfo.NFTDonationTokenId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                          >
                            View on Arbiscan
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Donated ERC20 Token */}
              {hasErc20Donation && (
                <Card glass>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="text-primary" size={20} />
                      Donated ERC-20 Tokens
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-text-secondary mb-2">Amount</p>
                          <p className="font-mono text-2xl font-semibold text-primary">
                            {bidInfo.DonatedERC20TokenAmountEth > 0 
                              ? formatEth(bidInfo.DonatedERC20TokenAmountEth)
                              : bidInfo.DonatedERC20TokenAmount}
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            {bidInfo.DonatedERC20TokenAmountEth > 0 
                              ? "(Formatted with token decimals)"
                              : "(Raw amount - verify token decimals)"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-text-secondary mb-2">Token Contract</p>
                          <AddressDisplay 
                            address={bidInfo.DonatedERC20TokenAddr} 
                            showCopy={true}
                            shorten={true}
                          />
                        </div>
                        <div>
                          <a
                            href={`https://arbiscan.io/token/${bidInfo.DonatedERC20TokenAddr}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                          >
                            View token on Arbiscan
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Donations */}
              {!hasNftDonation && !hasErc20Donation && !hasRwalkNft && (
                <Card glass>
                  <CardContent className="p-8 text-center">
                    <p className="text-text-secondary">
                      No donations or special features were included with this bid.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Quick Stats */}
            <div className="space-y-6">
              <Card glass>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-background-elevated">
                    <p className="text-sm text-text-secondary mb-1">Round Number</p>
                    <Link
                      href={`/game/history/rounds/${bidInfo.RoundNum}`}
                      className="font-mono text-xl font-semibold text-primary hover:underline"
                    >
                      #{bidInfo.RoundNum}
                    </Link>
                  </div>

                  <div className="p-4 rounded-lg bg-background-elevated">
                    <p className="text-sm text-text-secondary mb-1">Event Log ID</p>
                    <p className="font-mono text-xl font-semibold text-text-primary">
                      #{bidInfo.Tx.EvtLogId}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-background-elevated">
                    <p className="text-sm text-text-secondary mb-1">Block Number</p>
                    <a
                      href={`https://arbiscan.io/block/${bidInfo.Tx.BlockNum}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xl font-semibold text-primary hover:underline inline-flex items-center gap-2"
                    >
                      #{bidInfo.Tx.BlockNum}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-background-elevated">
                    <p className="text-sm text-text-secondary mb-1">CST Reward</p>
                    <p className="font-mono text-xl font-semibold text-status-success">
                      {bidInfo.CSTRewardEth} CST
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Donation Summary */}
              {(hasNftDonation || hasErc20Donation || hasRwalkNft) && (
                <Card glass>
                  <CardHeader>
                    <CardTitle>Features Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hasRwalkNft && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-status-success/10 border border-status-success/20">
                        <span className="text-sm text-text-secondary">
                          RandomWalk Discount
                        </span>
                        <Badge variant="success">50% Off</Badge>
                      </div>
                    )}
                    {hasNftDonation && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-sm text-text-secondary">
                          NFT Donated
                        </span>
                        <Badge variant="default">ERC-721</Badge>
                      </div>
                    )}
                    {hasErc20Donation && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-sm text-text-secondary">
                          Tokens Donated
                        </span>
                        <Badge variant="default">ERC-20</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Bidder Info */}
              <Card glass>
                <CardHeader>
                  <CardTitle>Bidder Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <AddressDisplay 
                      address={bidInfo.BidderAddr} 
                      showCopy={true} 
                    />
                    <Link href={`/user/${bidInfo.BidderAddr}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

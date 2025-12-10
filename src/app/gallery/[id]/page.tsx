"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Share2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { shortenAddress } from "@/lib/utils";
import { api, getAssetsUrl } from "@/services/api";

interface NFTData {
  RecordId: number;
  Tx: {
    EvtLogId: number;
    BlockNum: number;
    TxId: number;
    TxHash: string;
    TimeStamp: number;
    DateTime: string;
  };
  ContractAddr: string;
  TokenId: number;
  WinnerAid: number;
  WinnerAddr: string;
  CurOwnerAid: number;
  CurOwnerAddr: string;
  Seed: string;
  RoundNum: number;
  RecordType: number;
  TokenName: string;
  Staked: boolean;
  StakedOwnerAid: number;
  StakedOwnerAddr: string;
  StakeActionId: number;
  StakeTimeStamp: number;
  StakeDateTime: string;
  UnstakeActionId: number;
  WasUnstaked: boolean;
  ActualUnstakeTimeStamp: number;
  ActualUnstakeDateTime: string;
}

export default function NFTDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [showVideo, setShowVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nft, setNft] = useState<NFTData | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchNFTData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch NFT info from API
        const tokenInfo = await api.getCSTInfo(parseInt(id));
        setNft(tokenInfo);

        // Generate image and video URLs from seed
        const fileName = `0x${tokenInfo.Seed}`;
        setImageUrl(getAssetsUrl(`images/new/cosmicsignature/${fileName}.png`));
        setVideoUrl(getAssetsUrl(`images/new/cosmicsignature/${fileName}.mp4`));
      } catch (err) {
        console.error("Error fetching NFT data:", err);
        setError("Failed to load NFT data");
      } finally {
        setLoading(false);
      }
    };

    fetchNFTData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-text-secondary">Loading NFT...</p>
          </Card>
        </Container>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <h1 className="heading-sm mb-4">NFT Not Found</h1>
            <p className="text-text-secondary mb-6">
              {error || "This NFT doesn't exist or hasn't been minted yet."}
            </p>
            <Button asChild>
              <Link href="/gallery">
                <ArrowLeft className="mr-2" size={20} />
                Back to Gallery
              </Link>
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  const getPrizeType = (recordType: number, roundNum: number) => {
    switch (recordType) {
      case 1:
        return "Raffle Winner";
      case 2:
        return "Staking Winner";
      case 3:
        return `Round Winner (Round #${roundNum})`;
      case 4:
        return "Endurance Champion NFT Winner";
      default:
        return "Unknown";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="min-h-screen section-padding">
      <Container>
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" asChild>
            <Link href="/gallery">
              <ArrowLeft className="mr-2" size={20} />
              Back to Gallery
            </Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: NFT Display */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card glass className="overflow-hidden">
              <div className="relative aspect-square bg-background-elevated">
                {showVideo && videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={imageUrl}
                    alt={nft.TokenName || `Cosmic Signature #${id}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
              </div>

              {videoUrl && (
                <div className="p-4 border-t border-text-muted/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVideo(!showVideo)}
                    className="w-full"
                  >
                    {showVideo ? "Show Image" : "Show Video"}
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Right: Metadata */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Title */}
            <div>
              <h1 className="heading-sm mb-2">
                {nft.TokenName || `Cosmic Signature #${id}`}
              </h1>
              <p className="text-text-secondary">
                Minted on {formatTimestamp(nft.Tx.TimeStamp)}
              </p>
            </div>

            {/* Details Card */}
            <Card glass>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Token ID</span>
                  <span className="font-mono text-primary font-semibold">
                    #{id}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Round</span>
                  <Badge variant="default">Round {nft.RoundNum}</Badge>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Prize Type</span>
                  <span className="text-sm text-text-primary">
                    {getPrizeType(nft.RecordType, nft.RoundNum)}
                  </span>
                </div>

                <div className="flex justify-between items-start pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Seed</span>
                  <span className="font-mono text-sm text-text-primary text-right break-all max-w-[200px]">
                    {nft.Seed}
                  </span>
                </div>

                <div className="flex justify-between items-start pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Winner</span>
                  <Link
                    href={`/account?address=${nft.WinnerAddr}`}
                    className="font-mono text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    {shortenAddress(nft.WinnerAddr, 6)}
                  </Link>
                </div>

                <div className="flex justify-between items-start pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Owner</span>
                  <Link
                    href={`/account?address=${nft.CurOwnerAddr}`}
                    className="font-mono text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    {shortenAddress(nft.CurOwnerAddr, 6)}
                  </Link>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Transaction</span>
                  <a
                    href={`https://arbiscan.io/tx/${nft.Tx.TxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="text-sm mr-1">View on Arbiscan</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Staking Status */}
            <Card glass>
              <CardContent className="p-6">
                <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  Staking Status
                </h3>
                <div className="space-y-2">
                  {!nft.Staked && !nft.WasUnstaked ? (
                    <p className="text-sm text-green-400">
                      ✓ This NFT is eligible for staking
                    </p>
                  ) : (
                    <p className="text-sm text-red-400">
                      ✗ This NFT has already been staked and cannot be staked
                      again
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {nft.Staked || nft.WasUnstaked ? (
                <Button
                  className="flex-1"
                  size="lg"
                  disabled
                  title="This NFT has already been staked and cannot be staked again"
                >
                  Stake NFT
                </Button>
              ) : (
                <Button asChild className="flex-1" size="lg">
                  <Link href="/stake">Stake NFT</Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Cosmic Signature #${id}`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  }
                }}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2" size={20} />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2" size={20} />
                    Share
                  </>
                )}
              </Button>
            </div>

            {/* Generation Info */}
            <Card glass>
              <CardContent className="p-6">
                <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  About This NFT
                </h3>
                <div className="space-y-4 text-sm text-text-secondary">
                  <p>
                    This Cosmic Signature NFT was generated using a
                    deterministic algorithm with the seed value shown above. The
                    generation process is fully transparent and verifiable
                    on-chain.
                  </p>
                  <p>
                    Each NFT is unique based on its seed, which is derived from
                    blockchain data including block hashes, timestamps, and
                    Arbitrum-specific entropy sources.
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                    >
                      View Full Resolution Image
                      <ExternalLink className="ml-1" size={14} />
                    </a>
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                    >
                      View Video
                      <ExternalLink className="ml-1" size={14} />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Provenance */}
            <Card glass>
              <CardContent className="p-6">
                <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  Provenance
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-text-primary font-medium">
                        Minted
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatTimestamp(nft.Tx.TimeStamp)} • Round {nft.RoundNum}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-gold mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-text-primary font-medium">
                        Original Winner
                      </p>
                      <Link
                        href={`/account?address=${nft.WinnerAddr}`}
                        className="text-xs text-text-secondary font-mono hover:text-primary transition-colors"
                      >
                        {nft.WinnerAddr}
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-platinum mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-text-primary font-medium">
                        Current Owner
                      </p>
                      <Link
                        href={`/account?address=${nft.CurOwnerAddr}`}
                        className="text-xs text-text-secondary font-mono hover:text-primary transition-colors"
                      >
                        {nft.CurOwnerAddr}
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}

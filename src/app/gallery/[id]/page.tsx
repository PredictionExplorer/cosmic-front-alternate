"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Share2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MOCK_NFTS } from "@/lib/constants";
import { formatDate, shortenAddress } from "@/lib/utils";

export default function NFTDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [showVideo, setShowVideo] = useState(false);

  // Find NFT by token ID
  const nft = MOCK_NFTS.find((n) => n.tokenId === parseInt(id));

  if (!nft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <h1 className="heading-sm mb-4">NFT Not Found</h1>
            <p className="text-text-secondary mb-6">
              This NFT doesn&apos;t exist or hasn&apos;t been minted yet.
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
                {showVideo && nft.videoUrl ? (
                  <video
                    src={nft.videoUrl}
                    controls
                    autoPlay
                    loop
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={nft.imageUrl}
                    alt={nft.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
              </div>

              {nft.videoUrl && (
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
              <h1 className="heading-sm mb-2">{nft.customName || nft.name}</h1>
              <p className="text-text-secondary">
                Minted on {formatDate(nft.mintedAt)}
              </p>
            </div>

            {/* Details Card */}
            <Card glass>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Token ID</span>
                  <span className="font-mono text-primary font-semibold">
                    #{nft.tokenId}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Round</span>
                  <Badge variant="default">Round {nft.round}</Badge>
                </div>

                <div className="flex justify-between items-start pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Seed</span>
                  <span className="font-mono text-sm text-text-primary text-right break-all">
                    {nft.seed}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Owner</span>
                  <span className="font-mono text-primary">
                    {shortenAddress(nft.owner, 6)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Contract</span>
                  <a
                    href="https://arbiscan.io"
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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" size="lg">
                Stake NFT
              </Button>
              <Button variant="outline" className="flex-1" size="lg">
                <Share2 className="mr-2" size={20} />
                Share
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
                  <a
                    href="https://ipfs.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                  >
                    View Generation Script on IPFS
                    <ExternalLink className="ml-1" size={14} />
                  </a>
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
                        {formatDate(nft.mintedAt)} • Round {nft.round}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-platinum mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-text-primary font-medium">
                        Current Owner
                      </p>
                      <p className="text-xs text-text-secondary font-mono">
                        {nft.owner}
                      </p>
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

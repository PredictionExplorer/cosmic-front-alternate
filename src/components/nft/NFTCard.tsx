"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { NFT } from "@/types";
import { shortenAddress } from "@/lib/utils";

interface NFTCardProps {
  nft: NFT;
  delay?: number;
  priority?: boolean;
}

export function NFTCard({ nft, delay = 0 }: NFTCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <Link href={`/gallery/${nft.tokenId}`}>
        <Card
          glass
          hover
          className="group overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* NFT Image/Video */}
          <div className="relative aspect-square overflow-hidden bg-background-elevated">
            {showVideo && nft.videoUrl ? (
              <video
                src={nft.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={nft.imageUrl}
                alt={nft.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
            )}

            {/* Video Play Button Overlay */}
            {nft.videoUrl && !showVideo && isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowVideo(true);
                  }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-background transition-all hover:scale-110 hover:bg-primary"
                  aria-label="Play video"
                >
                  <Play size={28} fill="currentColor" />
                </button>
              </motion.div>
            )}

            {/* Gradient Overlay on Hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent transition-opacity duration-300 ${
                isHovered ? "opacity-90" : "opacity-0"
              }`}
            />

            {/* Metadata Overlay */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-0 left-0 right-0 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-serif text-lg font-semibold text-text-primary mb-1">
                    {nft.customName || nft.name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Round {nft.round} • {shortenAddress(nft.owner)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Token ID Badge */}
          <div className="absolute top-4 left-4">
            <Badge variant="default">#{nft.tokenId}</Badge>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

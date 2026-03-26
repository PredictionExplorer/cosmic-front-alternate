"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { NFT } from "@/types";

interface NFTCardProps {
  nft: NFT;
  delay?: number;
  priority?: boolean;
  size?: "default" | "large";
}

export function NFTCard({ nft, delay = 0, size = "default" }: NFTCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(nft.imageUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
    >
      <Link href={`/gallery/${nft.tokenId}`} className="block group">
        <div
          className="art-frame rounded-sm overflow-hidden bg-background-surface"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Artwork */}
          <div className={`relative overflow-hidden bg-background-elevated ${size === "large" ? "aspect-square" : "aspect-square"}`}>
            {showVideo && nft.videoUrl ? (
              <video
                src={nft.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              <Image
                src={currentImageUrl}
                alt={nft.customName || nft.name}
                fill
                sizes={size === "large"
                  ? "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                }
                unoptimized
                className="object-contain transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                onError={() => {
                  if (!imageError) {
                    setImageError(true);
                    setCurrentImageUrl("/nfts/placeholder.svg");
                  }
                }}
              />
            )}

            {/* Video overlay */}
            {nft.videoUrl && !showVideo && isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowVideo(true);
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/80 text-background transition-all hover:scale-110 hover:bg-primary"
                  aria-label="Play video"
                >
                  <Play size={24} fill="currentColor" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Label — museum wall card style */}
          <div className="px-5 py-4 border-t border-text-muted/5">
            <p className="font-serif text-lg font-semibold text-text-primary leading-tight mb-1">
              {nft.customName || nft.name}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted tracking-wide uppercase">
                #{nft.tokenId}
              </p>
              <p className="text-xs text-text-muted">
                Round {nft.round}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

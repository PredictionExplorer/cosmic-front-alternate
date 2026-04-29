"use client";

import { useState, useEffect, useRef } from "react";
import { Gift, Loader2, Coins } from "lucide-react";
import Link from "next/link";

import type { ComponentBidData } from "@/lib/apiTransforms";
import { explorer } from "@/lib/web3/chains";
import { reportError } from "@/lib/errorReporter";

const ZERO = "0x0000000000000000000000000000000000000000";

function resolveIpfsUrl(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`;
  }
  return uri;
}

/** True when the bid row includes an NFT or ERC-20 donation worth showing a preview for. */
export function bidRowHasDonation(bid: ComponentBidData): boolean {
  const nftAddr = bid.NFTDonationTokenAddr?.trim();
  const hasNft =
    !!nftAddr &&
    nftAddr.toLowerCase() !== ZERO &&
    bid.NFTDonationTokenId != null &&
    bid.NFTDonationTokenId >= 0;

  const ercAddr = bid.DonatedERC20TokenAddr?.trim();
  const ercEth = bid.DonatedERC20TokenAmountEth;
  const ercAmt = bid.DonatedERC20TokenAmount?.trim();
  const hasErc20 =
    !!ercAddr &&
    ercAddr.toLowerCase() !== ZERO &&
    ((typeof ercEth === "number" && ercEth > 0) ||
      (!!ercAmt && ercAmt !== "0"));

  return hasNft || hasErc20;
}

function hasNftDonation(bid: ComponentBidData): boolean {
  const nftAddr = bid.NFTDonationTokenAddr?.trim();
  return (
    !!nftAddr &&
    nftAddr.toLowerCase() !== ZERO &&
    bid.NFTDonationTokenId != null &&
    bid.NFTDonationTokenId >= 0
  );
}

function hasErc20Donation(bid: ComponentBidData): boolean {
  const ercAddr = bid.DonatedERC20TokenAddr?.trim();
  const ercEth = bid.DonatedERC20TokenAmountEth;
  const ercAmt = bid.DonatedERC20TokenAmount?.trim();
  return (
    !!ercAddr &&
    ercAddr.toLowerCase() !== ZERO &&
    ((typeof ercEth === "number" && ercEth > 0) ||
      (!!ercAmt && ercAmt !== "0"))
  );
}

/**
 * Narrow column: flip to preview donated NFT art or ERC-20 summary.
 * Mount only when {@link bidRowHasDonation} is true.
 */
export function BidDonationFlipCell({ bid }: { bid: ComponentBidData }) {
  const [flipped, setFlipped] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  /** Prevents duplicate fetches for the same row + URI fields when flipping open again. */
  const resolvedNftKeyRef = useRef<string | null>(null);

  const nft = hasNftDonation(bid);
  const erc20 = hasErc20Donation(bid);

  const nftResolutionKey = `${bid.EvtLogId}|${bid.ImageURL ?? ""}|${bid.NFTTokenURI ?? ""}`;

  useEffect(() => {
    resolvedNftKeyRef.current = null;
    setStatus("idle");
    setImageUrl(null);
  }, [bid.EvtLogId]);

  useEffect(() => {
    if (!flipped || !nft) return;
    if (resolvedNftKeyRef.current === nftResolutionKey) return;

    const direct = bid.ImageURL?.trim();
    if (direct) {
      setImageUrl(resolveIpfsUrl(direct));
      setStatus("ready");
      resolvedNftKeyRef.current = nftResolutionKey;
      return;
    }

    const tokenUri = bid.NFTTokenURI?.trim();
    if (!tokenUri) {
      setImageUrl(null);
      setStatus("ready");
      resolvedNftKeyRef.current = nftResolutionKey;
      return;
    }

    setStatus("loading");

    let cancelled = false;

    (async () => {
      try {
        const metadataUrl = resolveIpfsUrl(tokenUri);
        const res = await fetch(metadataUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const metadata = (await res.json()) as {
          image?: string;
          image_url?: string;
        };
        const raw = metadata?.image || metadata?.image_url || "";
        if (cancelled) return;
        setImageUrl(raw ? resolveIpfsUrl(raw) : null);
        setStatus("ready");
        resolvedNftKeyRef.current = nftResolutionKey;
      } catch (e) {
        reportError(e, "BidDonationFlipCell NFT metadata");
        if (!cancelled) {
          setImageUrl(null);
          setStatus("error");
          resolvedNftKeyRef.current = nftResolutionKey;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [flipped, nft, nftResolutionKey, bid.ImageURL, bid.NFTTokenURI]);

  const showBack = flipped;

  return (
    <div
      className="mx-auto h-[3.25rem] w-[3.25rem] [perspective:900px]"
      style={{ perspective: "900px" }}
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          showBack ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-text-muted/15 bg-background-elevated/80 [backface-visibility:hidden]">
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="flex h-full w-full items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 hover:text-primary"
            aria-expanded={flipped}
            aria-label="Show contributed token preview"
          >
            <Gift className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg border border-primary/25 bg-background-surface p-1 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          role="presentation"
        >
          <div
            className="absolute inset-0 z-0 cursor-pointer rounded-lg"
            onClick={() => setFlipped(false)}
            aria-hidden
          />
          <div className="relative z-10 flex max-h-full max-w-full flex-col items-center justify-center gap-0.5 px-0.5">
            {nft && (
              <>
                {status === "loading" && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
                {(status === "ready" || status === "error") && imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- dynamic token / IPFS URLs
                  <img
                    src={imageUrl}
                    alt=""
                    className="relative z-10 max-h-11 max-w-11 rounded object-contain"
                  />
                )}
                {(status === "ready" || status === "error") && !imageUrl && (
                  <span className="relative z-10 px-0.5 text-center text-[9px] leading-tight text-text-secondary">
                    No image
                  </span>
                )}
                {bid.NFTDonationTokenAddr && (
                  <Link
                    href={explorer.token(
                      bid.NFTDonationTokenAddr as `0x${string}`,
                      bid.NFTDonationTokenId,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 text-[9px] text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Arbiscan
                  </Link>
                )}
              </>
            )}
            {!nft && erc20 && (
              <div
                className="relative z-10 flex flex-col items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Coins className="h-4 w-4 text-primary" />
                <span className="max-w-[5.5rem] truncate font-mono text-[8px] text-text-secondary">
                  {bid.DonatedERC20TokenAddr?.slice(0, 6)}…
                </span>
                <span className="text-[9px] font-mono text-text-primary tabular-nums">
                  {typeof bid.DonatedERC20TokenAmountEth === "number" &&
                  bid.DonatedERC20TokenAmountEth > 0
                    ? bid.DonatedERC20TokenAmountEth.toFixed(4)
                    : bid.DonatedERC20TokenAmount}
                </span>
                {bid.DonatedERC20TokenAddr && (
                  <Link
                    href={explorer.token(bid.DonatedERC20TokenAddr as `0x${string}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-primary hover:underline"
                  >
                    Token
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

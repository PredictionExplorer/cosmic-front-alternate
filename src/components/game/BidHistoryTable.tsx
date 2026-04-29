"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Gift } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { AddressDisplay } from "@/components/features/AddressDisplay";
import {
  BidDonationFlipCell,
  bidRowHasDonation,
} from "@/components/game/BidDonationFlipCell";
import { explorer } from "@/lib/web3/chains";
import type { ComponentBidData } from "@/lib/apiTransforms";

function formatBidDateTime(timestamp: number): string {
  if (timestamp === 0) return "N/A";
  return new Date(timestamp * 1000).toLocaleString();
}

export interface BidHistoryTableProps {
  gestures: ComponentBidData[];
  /** If set and &gt; 0, paginate; if 0, show all rows. Default 20 (same as statistics). */
  gesturesPerPage?: number;
  emptyMessage?: string;
}

/**
 * Bid list table used on statistics (current round) and round history.
 * Includes optional donation preview column ({@link BidDonationFlipCell}) when any bid has NFT/ERC-20 donations.
 */
export function BidHistoryTable({
  gestures,
  gesturesPerPage = 20,
  emptyMessage = "No gestures found.",
}: BidHistoryTableProps) {
  const showDonationColumn = useMemo(
    () => gestures.some((b) => bidRowHasDonation(b)),
    [gestures],
  );

  const [page, setPage] = useState(1);

  const totalPages =
    gesturesPerPage > 0 ? Math.max(1, Math.ceil(gestures.length / gesturesPerPage)) : 1;

  const visible =
    gesturesPerPage > 0
      ? gestures.slice((page - 1) * gesturesPerPage, page * gesturesPerPage)
      : gestures;

  if (gestures.length === 0) {
    return (
      <Card glass className="p-8 text-center">
        <p className="text-text-secondary">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <>
      <Card glass className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-elevated border-b border-text-muted/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  Date &amp; Time
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  Participant
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                  Price
                </th>
                {showDonationColumn && (
                  <th
                    className="w-14 px-1 py-4 text-center align-middle"
                    title="Contributed token preview"
                  >
                    <span className="sr-only">Contribution</span>
                    <Gift
                      className="mx-auto h-4 w-4 text-text-muted/60"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </th>
                )}
                <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                  TX
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((bid, index) => (
                <tr
                  key={bid.EvtLogId}
                  className={`border-b border-text-muted/5 ${
                    index % 2 === 0 ? "bg-background-surface/30" : ""
                  }`}
                >
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {formatBidDateTime(bid.TimeStamp)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/user/${bid.BidderAddr}`}
                      className="hover:underline"
                    >
                      <AddressDisplay
                        address={bid.BidderAddr}
                        shorten={true}
                        chars={6}
                        showCopy={false}
                        showLink={false}
                      />
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-text-primary text-sm">
                    {bid.BidType === 0
                      ? `${(bid.BidPriceEth || 0).toFixed(6)} ETH`
                      : `${(bid.CstPriceEth || 0).toFixed(2)} CST`}
                  </td>
                  {showDonationColumn && (
                    <td className="w-14 px-1 py-3 align-middle text-center">
                      {bidRowHasDonation(bid) ? (
                        <BidDonationFlipCell bid={bid} />
                      ) : null}
                    </td>
                  )}
                  <td className="px-6 py-4 text-center">
                    <a
                      href={explorer.tx(bid.TxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {gesturesPerPage > 0 && gestures.length > gesturesPerPage && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-text-muted/20 bg-background-elevated hover:bg-background-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                return (
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1
                );
              })
              .map((p, index, array) => (
                <div key={p} className="flex items-center gap-1">
                  {index > 0 && array[index - 1] !== p - 1 && (
                    <span className="px-2 text-text-muted">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={`min-w-[40px] px-3 py-2 rounded-lg border transition-colors ${
                      page === p
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-text-muted/20 bg-background-elevated hover:bg-background-surface"
                    }`}
                  >
                    {p}
                  </button>
                </div>
              ))}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-text-muted/20 bg-background-elevated hover:bg-background-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

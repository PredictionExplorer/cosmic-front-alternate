'use client';

/**
 * System Modes Table
 *
 * Displays the history of system mode changes (round activations).
 * Each row represents a period during which a specific system mode was active.
 * Clicking a row navigates to the detail page showing admin events for that period.
 *
 * Detail route: /game/system-event/[round]/[start]/[end]
 * Data source: API /system/modelist  (getSystemModeList)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { SystemModeChange } from '@/contexts/SystemModeContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(timestamp: number): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleString();
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

interface RowProps {
  row: SystemModeChange;
  prevRow: SystemModeChange | null;
  index: number;
}

function SystemModeRow({ row, prevRow, index }: RowProps) {
  const router = useRouter();

  const handleClick = () => {
    const start = row.EvtLogId;
    // NextEvtLogId marks the end boundary; fall back to a large sentinel if absent
    const end = row.NextEvtLogId ?? 9999999999;
    router.push(`/game/system-event/${row.RoundNum}/${start}/${end}`);
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25) }}
      onClick={handleClick}
      className="border-b border-text-muted/10 hover:bg-background-elevated/40 transition-colors cursor-pointer group"
    >
      {/* Round */}
      <td className="px-6 py-4 text-center">
        <span className="font-mono text-sm text-text-primary">
          {row.RoundNum ? `#${row.RoundNum}` : 'Deployment'}
        </span>
      </td>

      {/* Started */}
      <td className="px-6 py-4 text-center">
        <span className="text-sm text-text-secondary">
          {formatDateTime(row.TimeStamp)}
        </span>
      </td>

      {/* Ended — the previous entry in the list (list sorted newest-first) */}
      <td className="px-6 py-4 text-center">
        {prevRow ? (
          <span className="text-sm text-text-secondary">
            {formatDateTime(prevRow.TimeStamp)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Currently Active
          </span>
        )}
      </td>

      {/* View detail icon */}
      <td className="px-4 py-4 text-center w-10">
        <ExternalLink
          size={14}
          className="text-text-muted group-hover:text-primary transition-colors mx-auto"
        />
      </td>
    </motion.tr>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface SystemModesTableProps {
  list: SystemModeChange[];
  perPage?: number;
  className?: string;
}

export function SystemModesTable({
  list,
  perPage = 10,
  className,
}: SystemModesTableProps) {
  const [page, setPage] = useState(1);

  if (!list || list.length === 0) {
    return (
      <Card glass className={cn('p-8 text-center', className)}>
        <RotateCcw className="mx-auto mb-3 text-text-muted" size={28} />
        <p className="text-text-secondary text-sm">No mode changes recorded yet.</p>
      </Card>
    );
  }

  const totalPages = Math.ceil(list.length / perPage);
  const start = (page - 1) * perPage;
  const pageItems = list.slice(start, start + perPage);

  return (
    <div className={cn('space-y-4', className)}>
      <Card glass className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-text-muted/10 bg-background-elevated/60">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Round
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Started
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Ended
                </th>
                <th className="px-4 py-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-text-muted/5">
              {pageItems.map((row, i) => {
                const globalIndex = start + i;
                const prevRow = globalIndex > 0 ? list[globalIndex - 1] : null;
                return (
                  <SystemModeRow
                    key={String(row.EvtLogId)}
                    row={row}
                    prevRow={prevRow}
                    index={i}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-text-muted">
            Showing {start + 1}&ndash;{Math.min(start + perPage, list.length)} of{' '}
            {list.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-text-muted/20 text-text-secondary hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1
                )
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (
                    i > 0 &&
                    typeof arr[i - 1] === 'number' &&
                    (p as number) - (arr[i - 1] as number) > 1
                  ) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-text-muted text-sm">
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                        page === p
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:text-primary hover:bg-primary/10'
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-text-muted/20 text-text-secondary hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

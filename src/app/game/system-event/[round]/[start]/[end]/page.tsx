"use client";

/**
 * System Event Detail Page
 *
 * Shows all administrative configuration events that occurred during a specific
 * system mode period, identified by the log-ID range [start, end].
 *
 * Route: /game/system-event/[round]/[start]/[end]
 * Data source: API /system/admin_events/:start/:end  (getSystemEvents)
 */

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
  ExternalLink,
  Settings,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import { ADMIN_EVENTS } from "@/lib/adminEvents";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminEvent {
  EvtLogId: string | number;
  RecordType: number;
  TransferType: number;
  TimeStamp: number;
  TxHash: string;
  IntegerValue: number;
  AddressValue: string;
  StringValue: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(timestamp: number): string {
  if (!timestamp) return "N/A";
  return new Date(timestamp * 1000).toLocaleString();
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

function formatValue(event: AdminEvent): string {
  const def = ADMIN_EVENTS[event.RecordType];
  if (!def || event.RecordType === 0) return "Undefined";

  switch (def.type) {
    case "timestamp":
      return formatDateTime(event.IntegerValue);
    case "percentage":
      return `${event.IntegerValue}%`;
    case "number":
      return String(event.IntegerValue);
    case "time":
      return formatSeconds(event.IntegerValue);
    case "address":
      return event.AddressValue;
    case "url":
      return event.StringValue;
    default:
      return String(event.IntegerValue);
  }
}

// ---------------------------------------------------------------------------
// Events Table
// ---------------------------------------------------------------------------

function AdminEventsTable({ list }: { list: AdminEvent[] }) {
  const perPage = 10;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(list.length / perPage);
  const start = (page - 1) * perPage;
  const pageItems = list.slice(start, start + perPage);

  if (list.length === 0) {
    return (
      <Card glass className="p-12 text-center">
        <Settings className="mx-auto mb-4 text-text-muted" size={40} />
        <p className="text-text-secondary">No configuration events found for this period.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card glass className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-text-muted/10 bg-background-elevated/60">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Event
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Datetime
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  New Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-text-muted/5">
              {pageItems.map((event, i) => {
                const def = ADMIN_EVENTS[event.RecordType];
                const isHighlighted = event.TransferType > 0;
                return (
                  <motion.tr
                    key={String(event.EvtLogId)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.2) }}
                    className={cn(
                      "hover:bg-background-elevated/40 transition-colors",
                      isHighlighted && "bg-white/[0.04]"
                    )}
                  >
                    {/* Event name + tooltip */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {def?.name ?? `Unknown (${event.RecordType})`}
                        </span>
                        {def?.description && (
                          <div className="relative group">
                            <Info
                              size={13}
                              className="text-text-muted hover:text-primary cursor-help transition-colors"
                            />
                            <div className="absolute left-5 top-0 z-10 hidden group-hover:block w-64 p-3 rounded-lg bg-background-surface border border-text-muted/20 shadow-luxury text-xs text-text-secondary leading-relaxed">
                              {def.description}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Timestamp linking to tx */}
                    <td className="px-6 py-4">
                      {event.TxHash ? (
                        <Link
                          href={`https://arbiscan.io/tx/${event.TxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
                        >
                          {formatDateTime(event.TimeStamp)}
                          <ExternalLink size={11} className="shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-sm text-text-secondary">
                          {formatDateTime(event.TimeStamp)}
                        </span>
                      )}
                    </td>

                    {/* New value */}
                    <td className="px-6 py-4">
                      {def?.type === "address" ? (
                        <span className="font-mono text-xs text-text-secondary break-all">
                          {event.AddressValue}
                        </span>
                      ) : def?.type === "url" ? (
                        <Link
                          href={event.StringValue}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all inline-flex items-center gap-1"
                        >
                          {event.StringValue}
                          <ExternalLink size={11} className="shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-sm font-mono text-text-primary">
                          {formatValue(event)}
                        </span>
                      )}
                    </td>
                  </motion.tr>
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
            Showing {start + 1}&ndash;{Math.min(start + perPage, list.length)} of{" "}
            {list.length} events
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-text-muted/20 text-text-secondary hover:text-primary hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && typeof arr[i - 1] === "number" && (p as number) - (arr[i - 1] as number) > 1) {
                  acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="px-1 text-text-muted text-sm">&hellip;</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                      page === p ? "bg-primary text-white" : "text-text-secondary hover:text-primary hover:bg-primary/10"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
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

interface PageProps {
  params: Promise<{ round: string; start: string; end: string }>;
}

export default function SystemEventPage({ params }: PageProps) {
  const { round, start, end } = use(params);
  const roundNum = Number(round);
  const startId = Number(start);
  const endId = Number(end);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AdminEvent[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const data = await api.getSystemEvents(startId, endId);
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch system events:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [startId, endId]);

  return (
    <div className="min-h-screen">
      <section className="section-padding bg-background-surface/50">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Game", href: "/game/play" },
              { label: "Statistics", href: "/game/statistics" },
              { label: "System Event" },
            ]}
            className="mb-8"
          />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-8">
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary mb-3">
                {roundNum > 0
                  ? `System Configuration Before Round #${roundNum}`
                  : "System Configuration Before Deployment"}
              </h1>
              <p className="text-text-secondary">Administrative parameter changes made during this system mode period.</p>
            </div>
            {loading ? (
              <Card glass className="p-12 text-center">
                <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={40} />
                <p className="text-text-secondary">Loading configuration events...</p>
              </Card>
            ) : (
              <AdminEventsTable list={events} />
            )}
          </motion.div>
        </Container>
      </section>
    </div>
  );
}

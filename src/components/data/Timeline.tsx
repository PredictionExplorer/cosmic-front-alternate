"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "../ui/Card";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  type:
    | "bid"
    | "claim"
    | "stake"
    | "unstake"
    | "donation"
    | "transfer"
    | "name-change"
    | "other";
  icon?: LucideIcon;
  metadata?: Record<string, unknown>;
  link?: string;
  expandedContent?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  onItemClick?: (item: TimelineItem) => void;
  className?: string;
}

const getTypeColor = (type: TimelineItem["type"]) => {
  switch (type) {
    case "bid":
      return "bg-primary";
    case "claim":
      return "bg-status-success";
    case "stake":
    case "unstake":
      return "bg-status-info";
    case "donation":
      return "bg-status-warning";
    case "transfer":
    case "name-change":
      return "bg-accent-platinum";
    default:
      return "bg-text-muted";
  }
};

export function Timeline({ items, onItemClick, className }: TimelineProps) {
  if (items.length === 0) {
    return (
      <Card glass className="p-12 text-center">
        <p className="text-text-secondary">No activity yet</p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {items.map((item, index) => {
        const IconComponent = item.icon;
        const dotColor = getTypeColor(item.type);

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.4 }}
            className="flex items-start space-x-4"
          >
            {/* Timeline Dot and Line */}
            <div className="flex flex-col items-center flex-shrink-0 pt-2">
              {/* Dot */}
              <div className={cn("w-3 h-3 rounded-full", dotColor)} />

              {/* Connecting Line */}
              {index < items.length - 1 && (
                <div className="w-px flex-1 bg-text-muted/20 mt-2 min-h-[60px]" />
              )}
            </div>

            {/* Timeline Content */}
            <Card
              glass
              hover
              className={cn("flex-1 p-6", onItemClick && "cursor-pointer")}
              onClick={() => onItemClick?.(item)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {IconComponent && (
                      <div className={cn("p-2 rounded-lg", `${dotColor}/10`)}>
                        <IconComponent
                          size={16}
                          className={dotColor.replace("bg-", "text-")}
                        />
                      </div>
                    )}
                    <h3 className="font-serif text-lg font-semibold text-text-primary">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <time className="text-xs text-text-muted whitespace-nowrap ml-4">
                  {formatDate(new Date(item.timestamp * 1000))}
                </time>
              </div>

              {/* Metadata Pills */}
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-text-muted/10">
                  {Object.entries(item.metadata).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-3 py-1 rounded-full text-xs bg-background-elevated text-text-secondary"
                    >
                      {key}:{" "}
                      <span className="font-mono text-text-primary">
                        {String(value)}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {/* Expanded Content (Optional) */}
              {item.expandedContent && (
                <div className="mt-4 pt-4 border-t border-text-muted/10">
                  {item.expandedContent}
                </div>
              )}

              {/* Link */}
              {item.link && (
                <div className="mt-4">
                  <a
                    href={item.link}
                    className="text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Details →
                  </a>
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

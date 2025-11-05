"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown } from "lucide-react";
import { Card } from "../ui/Card";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
  className?: string;
}

interface ElegantTableProps<T> {
  data: T[];
  columns: Column<T>[];
  mode?: "cards" | "table";
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function ElegantTable<T extends Record<string, unknown>>({
  data,
  columns,
  mode = "cards",
  onRowClick,
  emptyMessage = "No items found",
  className,
}: ElegantTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedData = [...safeData].sort((a, b) => {
    if (!sortKey) return 0;

    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortDirection === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  if (safeData.length === 0) {
    return (
      <Card glass className="p-12 text-center">
        <p className="text-text-secondary">{emptyMessage}</p>
      </Card>
    );
  }

  if (mode === "cards") {
    return (
      <div className={cn("space-y-4", className)}>
        {sortedData.map((item, index) => {
          // Try to use id field if available, otherwise fall back to index
          const key = item.id ? `card-${item.id}` : `card-idx-${index}`;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
            >
              <Card
                glass
                hover
                className={cn("p-6", onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(item)}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className={cn("flex-1 min-w-0", col.className)}
                    >
                      <p className="text-xs text-text-secondary mb-1 uppercase tracking-wide">
                        {col.label}
                      </p>
                      <div className="text-text-primary">
                        {col.render
                          ? col.render(item[col.key], item)
                          : String(item[col.key] ?? "")}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Table Mode
  return (
    <Card glass className={className}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-text-muted/10 bg-background-elevated/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="p-4 text-left text-sm font-medium text-text-secondary"
                >
                  <div className="flex items-center space-x-2">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="text-text-muted hover:text-primary transition-colors"
                      >
                        <ArrowUpDown
                          size={14}
                          className={cn(sortKey === col.key && "text-primary")}
                        />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-text-muted/10">
            {sortedData.map((item, index) => {
              // Try to use id field if available, otherwise fall back to index
              const key = item.id ? `row-${item.id}` : `row-idx-${index}`;
              return (
                <motion.tr
                  key={key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(index * 0.02, 0.2) }}
                  className={cn(
                    "hover:bg-background-elevated/50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("p-4", col.className)}>
                      {col.render
                        ? col.render(item[col.key], item)
                        : String(item[col.key] ?? "")}
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

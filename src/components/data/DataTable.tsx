/**
 * DataTable — Sortable table with headers
 * 
 * A glass-styled data table component for displaying
 * tabular data like cost breakdowns, agent stats, etc.
 */

"use client";

import { useState, useMemo, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (row: T, index: number) => ReactNode;
  getValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  stickyHeader?: boolean;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  rowKey?: keyof T | ((row: T) => string);
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends object>({
  data,
  columns,
  className,
  stickyHeader = false,
  onRowClick,
  emptyMessage = "No data available",
  rowKey,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Handle sort click
  const handleSort = (key: string) => {
    if (sortKey === key) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    const column = columns.find((col) => col.key === sortKey);
    if (!column) return data;

    return [...data].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;

      if (column.getValue) {
        aVal = column.getValue(a);
        bVal = column.getValue(b);
      } else {
        aVal = a[sortKey as keyof T];
        bVal = b[sortKey as keyof T];
      }

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === "asc" ? 1 : -1;
      if (bVal == null) return sortDirection === "asc" ? -1 : 1;

      // Compare values
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const comparison = aStr.localeCompare(bStr);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection, columns]);

  // Get row key
  const getRowKey = (row: T, index: number): string => {
    if (!rowKey) return String(index);
    if (typeof rowKey === "function") return rowKey(row);
    return String(row[rowKey]);
  };

  // Render sort icon
  const renderSortIcon = (key: string, sortable?: boolean) => {
    if (!sortable) return null;

    if (sortKey === key) {
      if (sortDirection === "asc") {
        return <ChevronUp className="h-4 w-4" />;
      }
      if (sortDirection === "desc") {
        return <ChevronDown className="h-4 w-4" />;
      }
    }
    return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-iron-800 bg-glass-1",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-iron-800/50">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary",
                    stickyHeader && "sticky top-0 bg-iron-800/90 backdrop-blur-sm",
                    column.sortable && "cursor-pointer select-none hover:text-text-primary",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right"
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      column.align === "center" && "justify-center",
                      column.align === "right" && "justify-end"
                    )}
                  >
                    {column.header}
                    {renderSortIcon(String(column.key), column.sortable)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, rowIndex)}
                  className={cn(
                    "border-t border-iron-800 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-glass-2"
                  )}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        "px-4 py-3 text-sm text-text-primary",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                    >
                      {column.render
                        ? column.render(row, rowIndex)
                        : String(row[column.key as keyof T] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;

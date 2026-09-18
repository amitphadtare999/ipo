import { useMemo, useState } from "react";
import {
  DataGrid as RDataGrid,
  type Column,
  type SortColumn,
} from "react-data-grid";
import { cn } from "@/lib/utils";

export type { Column, SortColumn };

export type SortComparator<R> = (a: R, b: R) => number;

interface DataGridProps<R> {
  columns: readonly Column<R>[];
  rows: readonly R[];
  rowKeyGetter: (row: R) => string | number;
  /** Comparators for sortable columns, keyed by column key */
  sortComparators?: Partial<Record<string, SortComparator<R>>>;
  rowHeight?: number;
  headerRowHeight?: number;
  /** Max grid height in px before it scrolls internally */
  maxHeight?: number;
  className?: string;
  /** Initial sort, e.g. [{ columnKey: "close_date", direction: "DESC" }] */
  defaultSort?: readonly SortColumn[];
}

/**
 * Thin wrapper over react-data-grid:
 * - themed with the app's shadcn tokens (see .app-data-grid in index.css)
 * - auto-height up to maxHeight (react-data-grid needs an explicit height)
 * - client-side multi-column sorting via sortComparators
 */
export function DataGrid<R>({
  columns,
  rows,
  rowKeyGetter,
  sortComparators = {},
  rowHeight = 44,
  headerRowHeight = 42,
  maxHeight = 640,
  className,
  defaultSort = [],
}: DataGridProps<R>) {
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>(defaultSort);

  const gridColumns = useMemo(
    () =>
      columns.map((c) =>
        sortComparators[c.key] ? { ...c, sortable: c.sortable ?? true } : c
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns]
  );

  const sortedRows = useMemo(() => {
    if (sortColumns.length === 0) return rows;
    return [...rows].sort((a, b) => {
      for (const sort of sortColumns) {
        const cmp = sortComparators[sort.columnKey];
        if (!cmp) continue;
        const result = cmp(a, b);
        if (result !== 0) return sort.direction === "ASC" ? result : -result;
      }
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortColumns]);

  // header + rows + border; capped so large lists scroll inside the grid (virtualized)
  const height = Math.min(headerRowHeight + rows.length * rowHeight + 2, maxHeight);

  return (
    <RDataGrid
      className={cn("app-data-grid", className)}
      style={{ blockSize: height }}
      columns={gridColumns}
      rows={sortedRows}
      rowKeyGetter={rowKeyGetter}
      rowHeight={rowHeight}
      headerRowHeight={headerRowHeight}
      rowClass={() => "group"}
      defaultColumnOptions={{ resizable: true, minWidth: 60 }}
      sortColumns={sortColumns}
      onSortColumnsChange={setSortColumns}
    />
  );
}

/** Null-safe comparators */
export const compareText = <R,>(get: (r: R) => string | null | undefined): SortComparator<R> =>
  (a, b) => (get(a) ?? "").localeCompare(get(b) ?? "");

export const compareNumber = <R,>(get: (r: R) => number | null | undefined): SortComparator<R> =>
  (a, b) => {
    const x = get(a), y = get(b);
    if (x == null && y == null) return 0;
    if (x == null) return 1; // nulls last
    if (y == null) return -1;
    return x - y;
  };

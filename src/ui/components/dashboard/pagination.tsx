import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";

/**
 * Pagination dashboard.
 *
 * Tautan biasa, bukan tombol JavaScript, sehingga paginasi tetap berfungsi
 * tanpa JavaScript dan URL halaman dapat dibagikan.
 */
export function DashboardPagination({
  page,
  pages,
  total,
  size,
  buildHref,
  className,
}: {
  page: number;
  pages: number;
  total: number;
  size: number;
  /** Bangun URL untuk nomor halaman. */
  buildHref: (page: number) => string;
  className?: string;
}) {
  if (pages <= 1) {
    return (
      <p className={cn("text-xs text-dashboard-text-muted", className)}>
        Menampilkan {total} data
      </p>
    );
  }

  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 text-xs text-dashboard-text-muted",
        className,
      )}
    >
      <p>
        Menampilkan {from}–{to} dari {total} data
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            aria-label="Halaman sebelumnya"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-dashboard-border bg-white transition-colors hover:bg-dashboard-canvas"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
        <span className="px-2 tabular-nums">
          {page} / {pages}
        </span>
        {page < pages ? (
          <Link
            href={buildHref(page + 1)}
            aria-label="Halaman berikutnya"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-dashboard-border bg-white transition-colors hover:bg-dashboard-canvas"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

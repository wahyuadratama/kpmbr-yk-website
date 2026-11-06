import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

/**
 * Kartu statistik untuk dashboard.
 *
 * Ikon berada di wadah kecil berwarna lembut; angka utama berukuran besar dan
 * tebal; keterangan di bawahnya memakai warna sekunder. Indikator tren
 * HANYA ditampilkan bila data pembanding benar-benar tersedia.
 */
export type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Keterangan tambahan, mis. "3 terbit bulan ini". */
  hint?: string;
  /** Persentase perubahan; `null` berarti tidak ada data pembanding. */
  trend?: number | null;
  className?: string;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashboard-border bg-white p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-dashboard-text-muted">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-dashboard-text">
            {value}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-dashboard-primary/10 text-dashboard-primary"
        >
          <Icon className="size-4.5" />
        </span>
      </div>

      {hint || typeof trend === "number" ? (
        <p className="mt-2 text-xs text-dashboard-text-muted">
          {typeof trend === "number" ? (
            <span
              className={cn(
                "font-medium",
                trend > 0 && "text-dashboard-success",
                trend < 0 && "text-dashboard-danger",
              )}
            >
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          ) : null}
          {typeof trend === "number" && hint ? " · " : null}
          {hint}
        </p>
      ) : null}
    </div>
  );
}

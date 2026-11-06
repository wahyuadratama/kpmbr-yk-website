import * as React from "react";
import { cn } from "cn";

/**
 * Badge status dengan latar lembut.
 *
 * Satu daftar warna untuk semua dashboard, supaya "Terbit", "Draf",
 * "Aktif", dan "Gagal" selalu terbaca sama di seluruh portal.
 */
export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-dashboard-success/12 text-dashboard-success",
  warning: "bg-dashboard-warning/15 text-[#8a5a12]",
  danger: "bg-dashboard-danger/12 text-dashboard-danger",
  info: "bg-dashboard-primary/12 text-dashboard-primary",
  neutral: "bg-dashboard-canvas text-dashboard-text-muted",
  brand: "bg-dashboard-sidebar-active/12 text-dashboard-sidebar-active",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

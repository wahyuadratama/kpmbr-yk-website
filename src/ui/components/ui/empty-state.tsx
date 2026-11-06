import * as React from "react";
import { cn } from "cn";
import { AlertTriangle, Inbox, SearchX } from "lucide-react";
import { Button } from "@/ui/components/ui/button";

type EmptyStateProps = {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
};

/**
 * Empty state seragam untuk seluruh halaman.
 * Halaman yang datanya kosong WAJIB menampilkan komponen ini — tidak boleh
 * menampilkan area kosong tanpa penjelasan.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-full bg-surface text-muted-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button asChild variant="outline" size="lg" className="mt-5 h-10">
          <a href={action.href}>{action.label}</a>
        </Button>
      ) : null}
    </div>
  );
}

/** Empty state khusus hasil pencarian/filter yang tidak menghasilkan apa pun. */
export function NoResultsState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={SearchX}
      title="Tidak ada hasil"
      description={
        query
          ? `Tidak ada item yang cocok dengan "${query}". Coba kata kunci lain.`
          : "Belum ada item yang sesuai filter ini."
      }
    />
  );
}

/** Empty state untuk kesalahan pemuatan data. */
export function ErrorState({
  title = "Gagal memuat data",
  description = "Terjadi kesalahan saat mengambil data. Coba muat ulang halaman.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border border-destructive/25 bg-destructive/5 px-6 py-14 text-center"
    >
      <span className="grid size-11 place-items-center rounded-full bg-surface text-destructive">
        <AlertTriangle aria-hidden="true" className="size-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
import * as React from "react";
import Link from "next/link";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Clock, UserRound } from "lucide-react";
import type { NewsArticle } from "@/types/public";
import { formatTanggal } from "@/lib/utils/format";

type NewsCardProps = {
  article: NewsArticle;
  /** `feature` untuk kartu besar, `compact` untuk daftar pendek. */
  variant?: "default" | "compact";
  className?: string;
};

/**
 * Kartu berita.
 *
 * Cover memakai blok warna (gradient token) sebagai pengganti foto karena
 * aset foto belum tersedia. Saat aset R2 siap, ganti isi `coverSlot` dengan
 * `next/image` tanpa mengubah struktur kartu.
 */
export function NewsCard({
  article,
  variant = "default",
  className,
}: NewsCardProps) {
  if (variant === "compact") {
    return (
      <article
        className={cn(
          "group relative flex gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand/30",
          className,
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "hidden size-20 shrink-0 rounded-md bg-gradient-to-br sm:block",
            article.coverGradient,
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {article.category} · {formatTanggal(article.publishedAt)}
          </p>
          <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold tracking-tight">
            <Link
              href={`/berita/${article.slug}`}
              className="rounded-sm outline-none after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {article.title}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-brand/30",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "aspect-[16/9] w-full bg-gradient-to-br",
          article.coverGradient,
        )}
      />
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-brand/20 bg-brand-muted px-1.5 py-0 text-[0.65rem] text-brand-muted-foreground"
          >
            {article.category}
          </Badge>
        </div>

        <h3 className="mt-3 text-base leading-snug font-semibold tracking-tight sm:text-lg">
          <Link
            href={`/berita/${article.slug}`}
            className="rounded-sm outline-none after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {article.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <UserRound aria-hidden="true" className="size-3.5" />
            {article.authorName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-3.5" />
            {formatTanggal(article.publishedAt)}
          </span>
          <span className="tabular-nums">{article.readingMinutes} menit baca</span>
        </div>
      </div>
    </article>
  );
}

/** Slot cover yang akan diganti `<Image>` saat aset foto tersedia. */
export function NewsCoverSlot({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("bg-muted", className)} />;
}
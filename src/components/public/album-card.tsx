import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { Images } from "lucide-react";
import { formatTanggal } from "@/lib/utils/format";
import type { DocAlbum } from "@/types/public";

type AlbumCardProps = {
  album: DocAlbum;
  className?: string;
};

/**
 * Kartu album dokumentasi.
 *
 * Area foto memakai gambar sampul bila sudah diunggah. Selama belum ada, slot
 * itu diisi blok warna dan ikon sebagai pengganti, sehingga tata letak kartu
 * tidak bergeser.
 */
export function AlbumCard({ album, className }: AlbumCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-brand/30",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {album.coverImageUrl ? (
          <Image
            src={album.coverImageUrl}
            alt={album.coverImageAlt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className={cn("grid size-full place-items-center opacity-90", album.accent)}
          >
            <Images className="size-8 text-white/80" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-base font-semibold tracking-tight">
          <Link
            href={`/dokumentasi/${album.slug}`}
            className="rounded-sm outline-none after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {album.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {album.description}
        </p>
        <p className="mt-3 text-xs text-muted-foreground tabular-nums">
          {formatTanggal(album.eventDate)} · {album.photoCount} foto
        </p>
      </div>
    </article>
  );
}
import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  listPublicAnnouncements,
  type PublicAnnouncementItem,
} from "@/modules/announcements/queries";
import { formatTanggal } from "@/lib/utils/format";
import type { AnnouncementPriority } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Pengumuman",
  description:
    "Pengumuman resmi KPMBR-YK untuk anggota, pengurus, dan masyarakat umum: jadwal kegiatan, informasi penting, dan kabar terkini organisasi.",
  alternates: { canonical: "/pengumuman" },
};

/** Jumlah pengumuman per halaman. */
const PAGE_SIZE = 10;

/** Gaya badge per prioritas. */
const PRIORITY_VARIANT: Record<
  AnnouncementPriority,
  { label: string; className: string }
> = {
  NORMAL: {
    label: "Biasa",
    className: "border-border bg-secondary text-secondary-foreground",
  },
  PENTING: {
    label: "Penting",
    className: "border-warning/30 bg-warning/10 text-warning-foreground",
  },
  MENDESAK: {
    label: "Mendekat",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

function AnnouncementCard({
  item,
}: {
  item: PublicAnnouncementItem;
}) {
  const priority = PRIORITY_VARIANT[item.priority] ?? PRIORITY_VARIANT.NORMAL;

  return (
    <li className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={priority.className}>{priority.label}</Badge>
        <time
          dateTime={new Date(item.publishedAt).toISOString()}
          className="text-xs text-muted-foreground"
        >
          {formatTanggal(item.publishedAt)}
        </time>
        {item.expiresAt ? (
          <span className="text-xs text-muted-foreground">
            Berlaku sampai {formatTanggal(item.expiresAt)}
          </span>
        ) : null}
      </div>

      <h2 className="mt-3 text-lg font-semibold tracking-tight">{item.title}</h2>

      <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
        {item.body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </li>
  );
}

/**
 * Daftar pengumuman publik.
 *
 * Hanya pengumuman dengan `audience = PUBLIC` dan belum kedaluwarsa yang
 * tampil — pensyaratannya ditegakkan di query, bukan dengan menyembunyikan di
 * frontend.
 */
export default async function PengumumanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const parsedPage = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const announcements = await listPublicAnnouncements({ page, size: PAGE_SIZE });
  const { items, total, pages } = announcements;

  return (
    <>
      <PageHeader
        eyebrow="Informasi"
        title="Pengumuman"
        description="Kabar resmi dari pengurus: jadwal kegiatan, informasi penting, dan pengumuman organisasi."
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {items.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Belum ada pengumuman"
            description="Pengumuman pengurus akan tampil di sini begitu diterbitkan."
            action={{ label: "Kembali ke beranda", href: "/" }}
          />
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <AnnouncementCard key={item.id} item={item} />
              ))}
            </ul>

            {pages > 1 ? (
              <nav
                aria-label="Navigasi halaman pengumuman"
                className="mt-10 flex items-center justify-between gap-3"
              >
                <p className="text-sm text-muted-foreground">
                  Menampilkan {items.length} dari {total} pengumuman
                </p>
                <div className="flex gap-2">
                  {page > 1 ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/pengumuman?page=${page - 1}`}>Sebelumnya</Link>
                    </Button>
                  ) : null}
                  {page < pages ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/pengumuman?page=${page + 1}`}>Berikutnya</Link>
                    </Button>
                  ) : null}
                </div>
              </nav>
            ) : (
              <p className="mt-10 text-sm text-muted-foreground">
                Menampilkan {items.length} dari {total} pengumuman
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}

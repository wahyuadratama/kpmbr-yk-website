import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DashboardPagination } from "@/components/dashboard/pagination";
import { Button } from "@/components/ui/button";
import { listPublicAnnouncements } from "@/modules/announcements/queries";
import { formatTanggal } from "@/lib/utils/format";
import { AnnouncementAudience } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Pengumuman",
  description:
    "Pengumuman resmi KPMBR-YK: informasi terbaru dari pengurus untuk masyarakat dan anggota.",
  alternates: { canonical: "/pengumuman" },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

/** Filter audiens yang bisa dipilih pengunjung. */
const AUDIENCE_FILTERS: { key: string; label: string; audience: AnnouncementAudience[] }[] = [
  {
    key: "PUBLIK",
    label: "Publik",
    audience: [AnnouncementAudience.PUBLIC],
  },
  {
    key: "SEMUA",
    label: "Semua pengumuman",
    audience: [
      AnnouncementAudience.PUBLIC,
      AnnouncementAudience.ANGGOTA,
      AnnouncementAudience.ALUMNI,
    ],
  },
];

const AUDIENCE_LABEL: Record<string, string> = {
  PUBLIC: "Publik",
  ANGGOTA: "Anggota",
  ALUMNI: "Alumni",
  PENGURUS: "Pengurus",
};

export default async function PengumumanPage({
  searchParams,
}: {
  searchParams: Promise<{ audiens?: string; page?: string }>;
}) {
  const params = await searchParams;

  const active =
    AUDIENCE_FILTERS.find((item) => item.key === params.audiens) ??
    AUDIENCE_FILTERS[0];
  const page = Math.max(1, Number(params.page) || 1);

  const { items, total, pages } = await listPublicAnnouncements({
    page,
    size: PAGE_SIZE,
    audience: active.audience,
  });

  const buildHref = (target: { page?: number; audiens?: string } = {}) => {
    const query = new URLSearchParams();
    const nextAudience = target.audiens ?? active.key;
    if (nextAudience !== "PUBLIK") query.set("audiens", nextAudience);
    if (target.page && target.page > 1) query.set("page", String(target.page));
    const search = query.toString();
    return search ? `/pengumuman?${search}` : "/pengumuman";
  };

  return (
    <>
      <PageHeader
        eyebrow="Informasi"
        title="Pengumuman"
        description="Kabar resmi dari pengurus untuk masyarakat, anggota, dan alumni KPMBR-YK."
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Saring pengumuman berdasarkan audiens">
          <ul className="flex flex-wrap gap-2">
            {AUDIENCE_FILTERS.map((item) => {
              const isActive = item.key === active.key;
              return (
                <li key={item.key}>
                  <Link
                    href={buildHref({ audiens: item.key, page: 1 })}
                    aria-current={isActive ? "true" : undefined}
                    className={
                      isActive
                        ? "inline-flex h-8 items-center rounded-full border border-brand/30 bg-brand-muted px-3 text-xs font-medium text-brand-muted-foreground"
                        : "inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-brand/30 hover:text-foreground"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {items.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Belum ada pengumuman"
            description="Pengumuman pengurus akan tampil di sini begitu diterbitkan."
            className="mt-8"
          />
        ) : (
          <>
            <ul className="mt-8 flex flex-col gap-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:p-5"
                >
                  {item.coverImageUrl ? (
                    <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-md sm:size-28">
                      <Image
                        src={item.coverImageUrl}
                        alt={item.coverImageAlt}
                        fill
                        sizes="(min-width: 640px) 112px, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="info">
                        {AUDIENCE_LABEL[item.audience] ?? item.audience}
                      </StatusBadge>
                      <span className="text-xs text-muted-foreground">
                        {formatTanggal(item.publishedAt)}
                      </span>
                      {item.expiresAt ? (
                        <span className="text-xs text-muted-foreground">
                          Berlaku sampai {formatTanggal(item.expiresAt)}
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-2 text-lg font-semibold tracking-tight">
                      {item.title}
                    </h2>

                    <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
                      {item.body.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <DashboardPagination
                page={page}
                pages={pages}
                total={total}
                size={PAGE_SIZE}
                buildHref={(target) => buildHref({ page: target })}
              />
            </div>
          </>
        )}

        <p className="mt-10 text-sm text-muted-foreground">
          Ingin membaca pengumuman khusus anggota?{" "}
          <Link
            href="/login"
            className="font-medium underline underline-offset-4"
          >
            Masuk ke portal anggota
          </Link>
          .
        </p>

        <div className="mt-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/berita">Lihat berita terbaru</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

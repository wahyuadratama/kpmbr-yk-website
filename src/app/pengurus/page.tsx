import type { Metadata } from "next";
import Link from "next/link";
import {
  Calendar,
  FolderKanban,
  Image,
  Newspaper,
} from "lucide-react";
import { requirePortalPage } from "@/server/auth/guards";
import { hasPermission } from "@/server/auth/permissions";
import { db } from "@/server/db/prisma";
import { PageHeading } from "@/ui/components/dashboard/page-heading";
import { Panel } from "@/ui/components/dashboard/panel";
import { StatCard } from "@/ui/components/dashboard/stat-card";
import { StatusBadge } from "@/ui/components/dashboard/status-badge";
import { formatTanggalPendek } from "@/shared/utils/format";
import { EventStatus, NewsStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Dasbor Pengurus" };
export const dynamic = "force-dynamic";

/**
 * Dashboard pengurus.
 *
 * Angka dihitung dari database. Menampilkan program kerja, agenda, foto
 * dokumentasi, dan berita yang sudah terbit.
 */
export default async function PengurusDashboardPage() {
  const principal = await requirePortalPage("/pengurus");
  const now = new Date();

  const [programCount, activeAgenda, albumCount, publishedNews, upcoming, programs] =
    await Promise.all([
      hasPermission(principal.role, "program:read")
        ? db.program.count({ where: { deletedAt: null } })
        : Promise.resolve(0),
      hasPermission(principal.role, "event:read")
        ? db.event.count({
            where: {
              deletedAt: null,
              status: { in: [EventStatus.TERJADWAL, EventStatus.BERLANGSUNG] },
            },
          })
        : Promise.resolve(0),
      hasPermission(principal.role, "documentation:read")
        ? db.documentationAlbum.count({ where: { deletedAt: null } })
        : Promise.resolve(0),
      hasPermission(principal.role, "news:read")
        ? db.news.count({ where: { deletedAt: null, status: NewsStatus.PUBLISHED } })
        : Promise.resolve(0),
      hasPermission(principal.role, "event:read")
        ? db.event.findMany({
            where: {
              deletedAt: null,
              status: { in: [EventStatus.TERJADWAL, EventStatus.BERLANGSUNG] },
              startsAt: { gte: now },
            },
            orderBy: { startsAt: "asc" },
            take: 5,
            select: { id: true, slug: true, title: true, startsAt: true, location: true },
          })
        : Promise.resolve([]),
      hasPermission(principal.role, "program:read")
        ? db.program.findMany({
            where: { deletedAt: null },
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
              id: true,
              slug: true,
              name: true,
              progress: true,
              status: true,
              divisionName: true,
            },
          })
        : Promise.resolve([]),
    ]);

  return (
    <div className="space-y-5">
      <PageHeading
        title="Dashboard Pengurus"
        description={`Selamat datang, ${principal.email}. Kelola program kerja, agenda, dan dokumentasi organisasi dari sini.`}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Program Kerja"
          value={programCount}
          icon={FolderKanban}
          hint="Seluruh program"
        />
        <StatCard
          label="Agenda Aktif"
          value={activeAgenda}
          icon={Calendar}
          hint="Terjadwal dan berlangsung"
        />
        <StatCard
          label="Dokumentasi"
          value={albumCount}
          icon={Image}
          hint="Album foto kegiatan"
        />
        <StatCard
          label="Berita Terbit"
          value={publishedNews}
          icon={Newspaper}
          hint="Status terbit"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Agenda Mendatang"
          description="Kegiatan yang sudah terjadwal"
          actions={
            <Link
              href="/pengurus/agenda"
              className="rounded-lg border border-dashboard-border px-2.5 py-1 text-xs font-medium text-dashboard-primary transition-colors hover:bg-dashboard-canvas"
            >
              Kelola agenda
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <p className="py-10 text-center text-sm text-dashboard-text-muted">
              Belum ada agenda mendatang.
            </p>
          ) : (
            <ul className="divide-y divide-dashboard-border">
              {upcoming.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-dashboard-text">
                    {event.title}
                  </span>
                  <StatusBadge tone="info">
                    {formatTanggalPendek(event.startsAt)}
                  </StatusBadge>
                  {event.location ? (
                    <span className="text-xs text-dashboard-text-muted">
                      {event.location}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Progres Program Kerja"
          description="Program yang baru diperbarui"
          actions={
            <Link
              href="/pengurus/proker"
              className="rounded-lg border border-dashboard-border px-2.5 py-1 text-xs font-medium text-dashboard-primary transition-colors hover:bg-dashboard-canvas"
            >
              Kelola program
            </Link>
          }
        >
          {programs.length === 0 ? (
            <p className="py-10 text-center text-sm text-dashboard-text-muted">
              Belum ada program kerja.
            </p>
          ) : (
            <ul className="divide-y divide-dashboard-border">
              {programs.map((program) => (
                <li
                  key={program.id}
                  className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-dashboard-text">
                    {program.name}
                  </span>
                  <span className="text-xs text-dashboard-text-muted">
                    {program.divisionName}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-dashboard-text">
                    {program.progress}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

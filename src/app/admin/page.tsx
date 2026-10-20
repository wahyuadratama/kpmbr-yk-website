import type { Metadata } from "next";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  FolderKanban,
  Newspaper,
  TriangleAlert,
  Users,
  UserRoundCheck,
} from "lucide-react";
import { requirePortalPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";
import { Panel } from "@/components/dashboard/panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { MaintenancePanel } from "@/components/admin/maintenance-panel";
import { setMaintenanceAction } from "@/lib/settings/website-actions";
import { getMaintenanceState } from "@/lib/settings/website";
import { formatTanggalPendek, formatJam, toDatetimeLocal } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Admin Control Center — pusat kendali website.
 *
 * Semua angka berasal dari database. Tidak ada angka ilustrasi: bila data
 * pembanding tidak tersedia, kartu menampilkan keterangan sebenarnya, bukan
 * persentase pertumbuhan palsu.
 */
export default async function AdminDashboardPage() {
  const principal = await requirePortalPage("/admin");

  const canSeeMembers = hasPermission(principal.role, "member:read");
  const canSeeNews = hasPermission(principal.role, "news:read");
  const canSeeAudit = hasPermission(principal.role, "audit_log:read");
  const canSeeWebsite = hasPermission(principal.role, "website:read");

  const now = new Date();

  const [memberCount, alumniCount, publishedNews, upcomingEvents, programCount] =
    await Promise.all([
      canSeeMembers
        ? db.member.count({ where: { deletedAt: null } })
        : Promise.resolve(0),
      canSeeMembers
        ? db.member.count({
            where: {
              deletedAt: null,
              OR: [
                { graduationYear: { not: null } },
                { user: { role: "ALUMNI" } },
              ],
            },
          })
        : Promise.resolve(0),
      canSeeNews
        ? db.news.count({ where: { deletedAt: null, status: "PUBLISHED" } })
        : Promise.resolve(0),
      canSeeNews
        ? db.event.count({
            where: {
              deletedAt: null,
              status: { in: ["TERJADWAL", "BERLANGSUNG"] },
              startsAt: { gte: now },
            },
          })
        : Promise.resolve(0),
      canSeeNews
        ? db.program.count({ where: { deletedAt: null } })
        : Promise.resolve(0),
    ]);

  const [latestNews, latestAnnouncements, recentAudit, maintenance] = await Promise.all([
    canSeeNews
      ? db.news.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            createdAt: true,
            authorName: true,
          },
        })
      : Promise.resolve([]),
    canSeeNews
      ? db.announcement.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 4,
          select: {
            id: true,
            title: true,
            audience: true,
            priority: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    canSeeAudit
      ? db.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            action: true,
            resource: true,
            resourceId: true,
            createdAt: true,
            actor: { select: { email: true, role: true } },
          },
        })
      : Promise.resolve([]),
    canSeeWebsite ? getMaintenanceState() : Promise.resolve(null),
  ]);

  const newsTone = (status: string) =>
    status === "PUBLISHED"
      ? "success"
      : status === "DRAFT"
        ? "warning"
        : "neutral";

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dashboard-text">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            Selamat datang di CMS KPMBR-YK. Kelola seluruh konten, pengguna, dan
            pengaturan website di sini.
          </p>
        </div>
        <p className="text-sm text-dashboard-text-muted">
          {new Intl.DateTimeFormat("id-ID", {
            dateStyle: "long",
            timeZone: "Asia/Jakarta",
          }).format(now)}
        </p>
      </section>

      {/* Kartu statistik */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total Anggota"
          value={memberCount}
          icon={Users}
          hint="Anggota terdaftar"
        />
        <StatCard
          label="Total Alumni"
          value={alumniCount}
          icon={UserRoundCheck}
          hint="Anggota telah lulus"
        />
        <StatCard
          label="Berita Terbit"
          value={publishedNews}
          icon={Newspaper}
          hint="Status terbit"
        />
        <StatCard
          label="Agenda Kegiatan"
          value={upcomingEvents}
          icon={Calendar}
          hint="Agenda mendatang"
        />
        <StatCard
          label="Program Kerja"
          value={programCount}
          icon={FolderKanban}
          hint="Seluruh program"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Aktivitas Website */}
        <Panel
          title="Aktivitas Website"
          description="Statistik kunjungan Landing page"
          className="xl:col-span-2"
          actions={
            <span className="rounded-lg border border-dashboard-border px-2.5 py-1 text-xs text-dashboard-text-muted">
              30 Hari Terakhir
            </span>
          }
        >
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-dashboard-canvas text-dashboard-text-muted">
              <TriangleAlert aria-hidden="true" className="size-4.5" />
            </span>
            <p className="text-sm font-medium text-dashboard-text">
              Data kunjungan belum tersedia
            </p>
            <p className="max-w-sm text-xs text-dashboard-text-muted">
              Sumber data analitik belum dihubungkan ke platform ini. Panel ini
              akan menampilkan grafik begitu sumber tersebut aktif. Tidak ada
              angka yang ditampilkan sampai data sungguhan tersedia.
            </p>
          </div>
        </Panel>

        {/* Status Website */}
        <Panel
          title="Status Website"
          description="Kondisi operasional situs"
        >
          {canSeeWebsite && maintenance ? (
            <MaintenancePanel
              isEnabled={maintenance.enabled}
              message={maintenance.message ?? ""}
              estimateAt={
                maintenance.estimateAt
                  ? toDatetimeLocal(maintenance.estimateAt)
                  : ""
              }
              action={setMaintenanceAction}
            />
          ) : (
            <p className="text-sm text-dashboard-text-muted">
              Anda tidak memiliki izin untuk melihat pengaturan website.
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Konten Terbaru */}
        <Panel
          title="Konten Terbaru"
          description="Berita dan pengumuman yang baru diperbarui"
          className="xl:col-span-2"
          actions={
            canSeeNews ? (
              <Link
                href="/admin/konten"
                className="rounded-lg border border-dashboard-border px-2.5 py-1 text-xs font-medium text-dashboard-primary transition-colors hover:bg-dashboard-canvas"
              >
                Kelola konten
              </Link>
            ) : null
          }
        >
          {latestNews.length === 0 && latestAnnouncements.length === 0 ? (
            <p className="py-8 text-center text-sm text-dashboard-text-muted">
              Belum ada konten. Mulai dengan menulis berita pertama.
            </p>
          ) : (
            <ul className="divide-y divide-dashboard-border">
              {latestNews.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-dashboard-text">
                    {item.title}
                  </span>
                  <StatusBadge tone={newsTone(item.status)}>{item.status}</StatusBadge>
                  <span className="w-full text-xs text-dashboard-text-muted sm:w-auto">
                    Berita · {formatTanggalPendek(item.createdAt)}
                  </span>
                </li>
              ))}
              {latestAnnouncements.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-dashboard-text">
                    {item.title}
                  </span>
                  <StatusBadge tone="info">{item.audience}</StatusBadge>
                  <span className="w-full text-xs text-dashboard-text-muted sm:w-auto">
                    Pengumuman · {formatTanggalPendek(item.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Aktivitas Terbaru */}
        <Panel
          title="Aktivitas Terbaru"
          description="Jejak perubahan penting di sistem"
          actions={
            canSeeAudit ? (
              <Link
                href="/admin/audit-log"
                className="rounded-lg border border-dashboard-border px-2.5 py-1 text-xs font-medium text-dashboard-primary transition-colors hover:bg-dashboard-canvas"
              >
                Log audit
              </Link>
            ) : null
          }
        >
          {recentAudit.length === 0 ? (
            <p className="py-8 text-center text-sm text-dashboard-text-muted">
              Belum ada aktivitas tercatat.
            </p>
          ) : (
            <ul className="divide-y divide-dashboard-border">
              {recentAudit.map((log) => (
                <li key={log.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm text-dashboard-text">
                      <span className="font-medium">{log.action}</span>{" "}
                      <span className="text-dashboard-text-muted">
                        {log.resource}
                      </span>
                    </span>
                    <span className="ml-auto text-xs text-dashboard-text-muted">
                      {formatTanggalPendek(log.createdAt)}{" "}
                      {formatJam(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-dashboard-text-muted">
                    {log.actor?.email ?? "Sistem"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-dashboard-text-muted">
        <CheckCircle2 aria-hidden="true" className="size-3.5" />
        Seluruh angka pada halaman ini dihitung langsung dari database.
      </p>
    </div>
  );
}

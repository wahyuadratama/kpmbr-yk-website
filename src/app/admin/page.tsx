import type { Metadata } from "next";
import { requireSessionPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";
import { isLocked } from "@/lib/auth/lockout";
import { NewsStatus } from "@/generated/prisma/enums";
import { formatTanggalPendek } from "@/lib/utils/format";
import { siteConfig } from "@/lib/site-config";
import { AuditTrail } from "./audit-trail";

export const metadata: Metadata = {
  title: "Dasbor",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dasbor minimal untuk MEMBUKTIKAN bahwa kontrol akses bekerja.
 * Fokus tahap ini backend, jadi UI sengaja dibuat Functional, bukan cantik.
 */
export default async function AdminPage() {
  const principal = await requireSessionPage("/admin");

  const canSeeAudit = hasPermission(principal.role, "audit_log:read");
  const canManageUsers = hasPermission(principal.role, "user:read");
  const canManageNews = hasPermission(principal.role, "news:read");

  const [newsStats, lockedUsers, latestNews] = await Promise.all([
    db.news.groupBy({ by: ["status"], _count: { _all: true } }),
    canManageUsers
      ? db.user.findMany({
          where: { role: { in: ["ADMIN", "PENGURUS"] } },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, email: true, role: true, status: true, lockedUntil: true },
        })
      : Promise.resolve([]),
    canManageNews
      ? db.news.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, title: true, status: true, publishedAt: true, updatedAt: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dasbor</h1>
        <p className="text-sm text-muted-foreground">
          Masuk sebagai <strong>{principal.email}</strong> ({principal.role})
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ringkasan konten</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.values(NewsStatus).map((status) => {
            const count = newsStats.find((row) => row.status === status)?._count._all ?? 0;
            return (
              <div key={status} className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{status}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
              </div>
            );
          })}
        </div>
      </section>

      {canSeeAudit ? <AuditTrail /> : null}

      {canManageUsers ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Akun pengurus</h2>
          <ul className="divide-y rounded-lg border">
            {lockedUsers.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="font-medium">{user.email}</span>
                <span className="rounded border px-1.5 py-0.5 text-xs">{user.role}</span>
                <span className="rounded border px-1.5 py-0.5 text-xs">{user.status}</span>
                {isLocked(user.lockedUntil) ? (
                  <span className="rounded border border-destructive/40 px-1.5 py-0.5 text-xs text-destructive">
                    terkunci
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canManageNews ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Berita terbaru (termasuk draf)</h2>
          <ul className="divide-y rounded-lg border">
            {latestNews.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="font-medium">{item.title}</span>
                <span className="rounded border px-1.5 py-0.5 text-xs">{item.status}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {item.publishedAt
                    ? `Terbit ${formatTanggalPendek(item.publishedAt)}`
                    : "Belum terbit"}
                </span>
              </li>
            ))}
            {latestNews.length === 0 ? (
              <li className="p-3 text-sm text-muted-foreground">Belum ada berita.</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Rujukan: {siteConfig.displayName}
      </p>
    </div>
  );
}
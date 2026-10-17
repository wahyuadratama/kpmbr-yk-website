import type { Metadata } from "next";
import { Newspaper, Calendar, LayoutList, LayoutGrid, Megaphone } from "lucide-react";
import { requirePortalPage } from "@/lib/auth/guards";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Dasbor pengurus",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Stat = { label: string; href: string; icon: React.ElementType };

const MODUL: Stat[] = [
  {
    label: "Berita",
    href: "/pengurus/berita",
    icon: Newspaper,
  },
  {
    label: "Agenda",
    href: "/pengurus/agenda",
    icon: Calendar,
  },
  {
    label: "Program Kerja",
    href: "/pengurus/proker",
    icon: LayoutList,
  },
  {
    label: "Dokumentasi",
    href: "/pengurus/dokumentasi",
    icon: LayoutGrid,
  },
  {
    label: "Pengumuman",
    href: "/pengurus/pengumuman",
    icon: Megaphone,
  },
];

/**
 * Dasbor pengurus — Stage 3.
 *
 * Guard: PENGURUS + ADMIN. Setiap kartu modul dipersembahkan sesuai
 * permission milik role, ditentukan di server (bukan disembunyikan di CSS).
 */
export default async function PengurusPage() {
  const principal = await requirePortalPage("/pengurus");

  const [newsStats, eventStats, programStats, announcements] = await Promise.all([
    hasPermission(principal.role, "news:read")
      ? db.news.groupBy({ by: ["status"], _count: { _all: true } })
      : Promise.resolve([]),
    hasPermission(principal.role, "event:read")
      ? db.event.groupBy({ by: ["status"], _count: { _all: true } })
      : Promise.resolve([]),
    hasPermission(principal.role, "program:read")
      ? db.program.groupBy({ by: ["status"], _count: { _all: true } })
      : Promise.resolve([]),
    hasPermission(principal.role, "announcement:read")
      ? db.announcement.findMany({
          where: { deletedAt: null },
          orderBy: { publishedAt: "desc" },
          take: 5,
          select: { id: true, title: true, priority: true, publishedAt: true },
        })
      : Promise.resolve([]),
  ]);

  const countBy = <T extends { status: string; _count: { _all: number } }>(
    rows: T[],
  ): Record<string, number> =>
    rows.reduce((acc, row) => ({ ...acc, [row.status]: row._count._all }), {});

  return (
    <div className="space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dasbor pengurus</h1>
        <p className="text-sm text-muted-foreground">
          Masuk sebagai <strong>{principal.email}</strong> ({principal.role})
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Modul</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {MODUL.filter((m) => {
            const permMap: Record<string, string> = {
              Berita: "news:read",
              Agenda: "event:read",
              "Program Kerja": "program:read",
              Dokumentasi: "documentation:read",
              Pengumuman: "announcement:read",
            };
            return hasPermission(principal.role, permMap[m.label] as Permission);
          }).map((m) => {
            const Icon = m.icon;
            return (
              <a
                key={m.label}
                href={m.href}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent/50 transition-colors text-decoration-none"
              >
                <Icon className="size-5" />
                <span className="text-sm font-medium">{m.label}</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Ringkasan</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Berita draft", value: (countBy(newsStats)["DRAFT"] ?? 0) },
            { label: "Agenda", value: (countBy(eventStats)["_all"] ?? 0) },
            { label: "Program", value: (countBy(programStats)["_all"] ?? 0) },
            { label: "Pengumuman", value: announcements.length },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {announcements.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pengumuman terbaru</h2>
          <ul className="divide-y rounded-lg border">
            {announcements.map((a) => (
              <li key={a.id} className="flex justify-between items-start p-3 text-sm">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.priority}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {a.publishedAt.toISOString().slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

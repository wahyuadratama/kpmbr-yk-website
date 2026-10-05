import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { requirePortalPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";
import { NewsStatus } from "@/generated/prisma/enums";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Portal pengurus",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dasbor pengurus — placeholder fungsional untuk Stage 3.
 *
 * Yang diuji di halaman ini HANYA batas aksesnya: PENGURUS dan ADMIN boleh
 * masuk, ANGGOTA dan ALUMNI tidak. Modul kelola konten (berita, agenda, proker)
 * menyusul.
 */
export default async function PengurusPage() {
  const principal = await requirePortalPage("/pengurus");

  const [newsStats, memberCount] = await Promise.all([
    hasPermission(principal.role, "news:read")
      ? db.news.groupBy({ by: ["status"], _count: { _all: true } })
      : Promise.resolve([]),
    hasPermission(principal.role, "member:read")
      ? db.member.count({ where: { deletedAt: null } })
      : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Portal pengurus</h1>
        <p className="text-sm text-muted-foreground">
          Masuk sebagai <strong>{principal.email}</strong> ({principal.role})
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ringkasan</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(NewsStatus).map((status) => {
            const count = newsStats.find((row) => row.status === status)?._count._all ?? 0;
            return (
              <div key={status} className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Berita {status.toLowerCase()}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
              </div>
            );
          })}
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Anggota</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{memberCount}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Modul</h2>
        <EmptyState
          icon={Wrench}
          title="Modul kelola konten menyusul"
          description="Kelola berita, agenda, program kerja, dokumentasi, dan pengumuman dibangun pada Stage 3. Sampai saat itu dasbor ini sengaja dibuat minimal."
          action={{ label: "Lihat situs publik", href: "/" }}
        />
      </section>
    </div>
  );
}
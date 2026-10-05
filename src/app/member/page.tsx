import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { requirePortalPage } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { EventStatus } from "@/generated/prisma/enums";
import { formatTanggalPendek } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Portal anggota",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dasbor anggota — placeholder fungsional untuk Stage 3.
 *
 * Yang diuji di halaman ini HANYA batas aksesnya: ANGGOTA, PENGURUS, dan ADMIN
 * boleh masuk, ALUMNI tidak. Profil saya dan kartu digital menyusul.
 */
export default async function MemberPage() {
  const principal = await requirePortalPage("/member");

  const upcomingEvents = await db.event
    .findMany({
      where: { status: EventStatus.TERJADWAL, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 5,
      select: { title: true, slug: true, startsAt: true, location: true },
    })
    .catch(() => []);

  const hasProfile = principal.memberId !== null;

  return (
    <div className="space-y-10">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Portal anggota</h1>
        <p className="text-sm text-muted-foreground">
          Masuk sebagai <strong>{principal.email}</strong> ({principal.role})
        </p>
      </section>

      {!hasProfile ? (
        <EmptyState
          icon={ArrowRight}
          title="Profil anggota belum terhubung"
          description="Akun kamu sudah aktif, tetapi belum terhubung ke data anggota. Hubungi sekretariat untuk mengisi data keanggotaan."
          action={{ label: "Hubungi sekretariat", href: "/kontak" }}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Agenda terdekat</h2>
        {upcomingEvents.length === 0 ? (
          <EmptyState
            title="Belum ada agenda mendatang"
            description="Agenda yang sudah dipublikasikan pengurus akan muncul di sini."
            action={{ label: "Lihat semua agenda", href: "/agenda" }}
          />
        ) : (
          <ul className="divide-y rounded-lg border">
            {upcomingEvents.map((event) => (
              <li key={event.slug} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="font-medium">{event.title}</span>
                {event.location ? (
                  <span className="text-xs text-muted-foreground">{event.location}</span>
                ) : null}
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatTanggalPendek(event.startsAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
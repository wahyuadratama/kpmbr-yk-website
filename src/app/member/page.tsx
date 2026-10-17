import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { requirePortalPage } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { EventStatus } from "@/generated/prisma/enums";
import { formatTanggalPendek } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/empty-state";
import ProfileForm from "@/components/member/profile-form";

export const metadata: Metadata = {
  title: "Portal anggota",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dasbor anggota — Stage 3.
 *
 * Batas akses: ANGGOTA, PENGURUS, dan ADMIN boleh masuk, ALUMNI tidak.
 * Saat profil tersedia, anggota dapat mengubah data sendiri (member:update,
 * hanya record milik sendiri).
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

  const member = principal.memberId
    ? await db.member
        .findUnique({
          where: { id: principal.memberId },
          select: {
            fullName: true,
            nickname: true,
            gender: true,
            phone: true,
            city: true,
            bio: true,
            addressDetail: true,
            isDirectoryVisible: true,
            memberCode: true,
          },
        })
        .catch(() => null)
    : null;

  const hasProfile = !!member;

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
      ) : (
        <>
          {member && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Kartu anggota</h2>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Kode anggota
                </p>
                <p className="font-mono text-sm">{member.memberCode}</p>
              </div>
            </section>
          )}

          <ProfileForm
            initial={{
              fullName: member?.fullName ?? "",
              nickname: member?.nickname ?? "",
              gender: member?.gender ?? null,
              phone: member?.phone ?? null,
              city: member?.city ?? null,
              bio: member?.bio ?? null,
              addressDetail: member?.addressDetail ?? null,
              isDirectoryVisible: member?.isDirectoryVisible ?? false,
            }}
          />
        </>
      )}

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

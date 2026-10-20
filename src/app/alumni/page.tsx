import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Megaphone, UserRoundCheck } from "lucide-react";
import { requirePortalPage } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import ProfileForm from "@/components/member/profile-form";
import { formatTanggalPendek } from "@/lib/utils/format";
import { AnnouncementAudience, EventStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Portal Alumni",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dashboard alumni.
 *
 * Menampilkan informasi milik alumni itu sendiri beserta agenda dan
 * pengumuman. Menu administrasi TIDAK ditampilkan pada portal ini.
 */
export default async function AlumniDashboardPage() {
  const principal = await requirePortalPage("/alumni");
  const now = new Date();

  const [member, upcoming, announcements, memberships] = await Promise.all([
    principal.memberId
      ? db.member.findUnique({
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
            angkatan: true,
            university: true,
            studyProgram: true,
            graduationYear: true,
          },
        })
      : Promise.resolve(null),
    db.event.findMany({
      where: {
        deletedAt: null,
        status: { in: [EventStatus.TERJADWAL, EventStatus.BERLANGSUNG] },
        startsAt: { gte: now },
      },
      orderBy: { startsAt: "asc" },
      take: 3,
      select: { id: true, title: true, startsAt: true },
    }),
    db.announcement.findMany({
      where: {
        deletedAt: null,
        audience: { in: [AnnouncementAudience.PUBLIC, AnnouncementAudience.ALUMNI] },
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
      take: 3,
      select: { id: true, title: true, publishedAt: true },
    }),
    principal.memberId
      ? db.membership.findMany({
          where: { memberId: principal.memberId },
          orderBy: { startDate: "desc" },
          select: {
            status: true,
            cohort: true,
            startDate: true,
            endDate: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-5">
      <PageHeading
        title="Portal Alumni"
        description={`Selamat datang, ${principal.email}. Informasi alumni dan kegiatan organisasi.`}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Status Alumni"
          value={member?.graduationYear ? `Lulus ${member.graduationYear}` : "Alumni"}
          icon={UserRoundCheck}
          hint={member?.memberCode ?? "Belum terhubung"}
        />
        <StatCard
          label="Angkatan"
          value={member?.angkatan ?? "—"}
          icon={UserRoundCheck}
          hint={member?.university ?? "Belum diisi"}
        />
        <StatCard
          label="Agenda"
          value={upcoming.length}
          icon={Calendar}
          hint="Kegiatan terjadwal"
        />
        <StatCard
          label="Pengumuman"
          value={announcements.length}
          icon={Megaphone}
          hint="Pemberitahuan terbaru"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Agenda Mendatang" className="xl:col-span-2">
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
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pengumuman">
          {announcements.length === 0 ? (
            <p className="py-10 text-center text-sm text-dashboard-text-muted">
              Belum ada pengumuman.
            </p>
          ) : (
            <ul className="divide-y divide-dashboard-border">
              {announcements.map((item) => (
                <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                  <p className="truncate text-sm font-medium text-dashboard-text">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-dashboard-text-muted">
                    {formatTanggalPendek(item.publishedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {member ? (
        <Panel title="Profil Alumni" description="Data yang dapat Anda perbarui sendiri.">
          <ProfileForm
            initial={{
              fullName: member.fullName,
              nickname: member.nickname ?? "",
              gender: member.gender,
              phone: member.phone,
              city: member.city,
              bio: member.bio,
              addressDetail: member.addressDetail,
              isDirectoryVisible: member.isDirectoryVisible,
            }}
          />
        </Panel>
      ) : (
        <Panel title="Profil Alumni">
          <p className="text-sm text-dashboard-text-muted">
            Data alumni Anda belum terhubung. Hubungi sekretariat.
          </p>
        </Panel>
      )}

      {memberships.length > 0 ? (
        <Panel title="Riwayat Keanggotaan">
          <ul className="divide-y divide-dashboard-border">
            {memberships.map((item) => (
              <li
                key={`${item.cohort}-${item.startDate.toISOString()}`}
                className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-sm font-medium text-dashboard-text">
                  Angkatan {item.cohort}
                </span>
                <StatusBadge tone="neutral">{item.status}</StatusBadge>
                <span className="text-xs text-dashboard-text-muted">
                  {formatTanggalPendek(item.startDate)}
                  {item.endDate
                    ? ` s.d. ${formatTanggalPendek(item.endDate)}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {principal.role === "ADMIN" ? (
        <p className="text-xs text-dashboard-text-muted">
          Ingin mengelola data alumni?{" "}
          <Link
            href="/admin/alumni"
            className="underline underline-offset-4 hover:text-dashboard-primary"
          >
            Buka menu Alumni di dashboard admin
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}

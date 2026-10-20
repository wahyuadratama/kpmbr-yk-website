import type { Metadata } from "next";
import { Calendar, Megaphone, Receipt, UserCheck } from "lucide-react";
import { requirePortalPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import ProfileForm from "@/components/member/profile-form";
import { formatTanggalPendek } from "@/lib/utils/format";
import {
  AnnouncementAudience,
  EventStatus,
  MembershipStatus,
} from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Portal Anggota",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dashboard anggota.
 *
 * Menampilkan data keanggotaan milik anggota itu sendiri, kegiatan
 * mendatang, pengumuman, dan laporan keuangan yang dipublikasikan untuk
 * anggota. Anggota tidak dapat mengakses data anggota lain.
 */
export default async function MemberDashboardPage() {
  const principal = await requirePortalPage("/member");
  const now = new Date();

  const [membership, upcoming, announcements, publishedReports] = await Promise.all([
    principal.memberId
      ? db.membership.findFirst({
          where: { memberId: principal.memberId },
          orderBy: { startDate: "desc" },
          select: { status: true, cohort: true, startDate: true, endDate: true },
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
      select: { id: true, slug: true, title: true, startsAt: true },
    }),
    db.announcement.findMany({
      where: {
        deletedAt: null,
        audience: { in: [AnnouncementAudience.PUBLIC, AnnouncementAudience.ANGGOTA] },
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
      take: 3,
      select: { id: true, title: true, publishedAt: true, priority: true },
    }),
    hasPermission(principal.role, "finance:read_summary")
      ? db.financialReport.count({
          where: {
            deletedAt: null,
            status: "PUBLISHED",
            visibility: { in: ["PUBLIC", "MEMBER_ONLY"] },
          },
        })
      : Promise.resolve(0),
  ]);

  const member = principal.memberId
    ? await db.member.findUnique({
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
    : null;

  const statusLabel =
    membership?.status === MembershipStatus.AKTIF
      ? "Aktif"
      : membership?.status === MembershipStatus.LULUS
        ? "Lulus"
        : membership?.status === MembershipStatus.PENDAFTARAN
          ? "Pendaftaran"
          : "Belum terdaftar";

  return (
    <div className="space-y-5">
      <PageHeading
        title="Portal Anggota"
        description={`Selamat datang, ${principal.email}. Berikut ringkasan keanggotaan dan informasi organisasi.`}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Status Keanggotaan"
          value={statusLabel}
          icon={UserCheck}
          hint={member ? `Kode ${member.memberCode}` : "Belum terhubung"}
        />
        <StatCard
          label="Agenda Terdekat"
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
        <StatCard
          label="Laporan Keuangan"
          value={publishedReports}
          icon={Receipt}
          hint="Laporan transparansi terbit"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Agenda Mendatang"
          description="Kegiatan yang akan datang"
          className="xl:col-span-2"
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
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pengumuman" description="Pemberitahuan dari pengurus">
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
        <Panel
          title="Profil Saya"
          description="Data yang dapat Anda perbarui sendiri."
        >
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
        <Panel title="Profil Saya">
          <p className="text-sm text-dashboard-text-muted">
            Akun Anda belum terhubung ke data anggota. Hubungi sekretariat untuk
            mengisi data keanggotaan.
          </p>
        </Panel>
      )}
    </div>
  );
}

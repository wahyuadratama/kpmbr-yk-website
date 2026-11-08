import type { Metadata } from "next";
import { requirePortalPage } from "@/server/auth/guards";
import { db } from "@/server/db/prisma";
import { PageHeading } from "@/ui/components/dashboard/page-heading";
import { Panel } from "@/ui/components/dashboard/panel";
import ProfileForm from "@/ui/components/member/profile-form";
import MemberApplicationForm from "@/ui/components/member/member-application-form";
import { MemberApplicationStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Profil Saya" };
export const dynamic = "force-dynamic";

/**
 * Profil anggota.
 * - Terhubung (memberId ada): edit profil sendiri (ProfileForm).
 * - Belum terhubung: form pengajuan self-service ATAU status pengajuan pending/ditolak.
 *   Pengajuan TIDAK mengaktifkan member; persetujuan sekretariat/admin.
 */
export default async function MemberProfilePage() {
  const principal = await requirePortalPage("/member");

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

  const application = !principal.memberId
    ? await db.memberApplication.findFirst({
        where: { userId: principal.userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          fullName: true,
          rejectionNote: true,
          createdAt: true,
          reviewedAt: true,
        },
      })
    : null;

  const pending = application?.status === MemberApplicationStatus.PENDING;
  const rejected = application?.status === MemberApplicationStatus.REJECTED;

  return (
    <div className="space-y-5">
      <PageHeading
        title="Profil Saya"
        description="Perbarui data yang boleh kamu ubah sendiri."
      />

      <Panel
        title={member ? "Data Profil" : "Keanggotaan"}
        description={
          member
            ? "Nomor HP dan alamat tidak ditampilkan di halaman publik."
            : "Hubungkan akunmu ke data anggota melalui pengajuan (persetujuan sekretariat)."
        }
        className="max-w-3xl"
      >
        {member ? (
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
        ) : pending && application ? (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-medium text-amber-900">Pengajuan sedang menunggu persetujuan</p>
            <p className="text-amber-800">
              Nama: <strong>{application.fullName}</strong> — diajukan{" "}
              {application.createdAt.toLocaleString("id-ID")}. Akun belum terhubung ke data anggota
              sampai sekretariat/admin menyetujui.
            </p>
          </div>
        ) : rejected && application ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
              <p className="font-medium text-destructive">Pengajuan ditolak</p>
              {application.rejectionNote ? (
                <p className="mt-1 text-muted-foreground">Alasan: {application.rejectionNote}</p>
              ) : null}
              <p className="mt-1 text-muted-foreground">
                Kamu dapat mengajukan ulang dengan memperbaiki data di bawah.
              </p>
            </div>
            <MemberApplicationForm />
          </div>
        ) : (
          <MemberApplicationForm />
        )}
      </Panel>
    </div>
  );
}

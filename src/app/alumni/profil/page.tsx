import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import ProfileForm from "@/components/member/profile-form";

export const metadata: Metadata = { title: "Profil Alumni" };
export const dynamic = "force-dynamic";

/**
 * Profil alumni.
 *
 * Hanya data milik alumni yang sedang masuk. Tidak ada menu administrasi
 * yang ditampilkan pada portal ini.
 */
export default async function AlumniProfilePage() {
  const principal = await requirePortalPage("/alumni");

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

  return (
    <div className="space-y-5">
      <PageHeading
        title="Profil Alumni"
        description="Perbarui data yang boleh kamu ubah sendiri."
      />

      <Panel
        title="Data Profil"
        description="Nomor HP dan alamat tidak ditampilkan di halaman publik."
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
        ) : (
          <p className="text-sm text-dashboard-text-muted">
            Data alumni Anda belum terhubung. Hubungi sekretariat.
          </p>
        )}
      </Panel>
    </div>
  );
}

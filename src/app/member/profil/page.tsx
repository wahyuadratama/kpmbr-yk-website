import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import ProfileForm from "@/components/member/profile-form";

export const metadata: Metadata = { title: "Profil Saya" };
export const dynamic = "force-dynamic";

/**
 * Profil anggota.
 *
 * Hanya data milik anggota yang sedang masuk. Pembaruan dibatasi pada
 * field yang diizinkan (`member:update` dengan kepemilikan record sendiri).
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

  return (
    <div className="space-y-5">
      <PageHeading
        title="Profil Saya"
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
            Akun Anda belum terhubung ke data anggota. Hubungi sekretariat.
          </p>
        )}
      </Panel>
    </div>
  );
}

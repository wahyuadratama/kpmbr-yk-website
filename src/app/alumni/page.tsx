import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { MembershipStatus } from "@/generated/prisma/enums";
import { formatTanggalPendek } from "@/lib/utils/format";
import ProfileForm from "@/components/member/profile-form";

export const metadata: Metadata = {
  title: "Portal Alumni",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Portal Alumni — Stage 5.
 *
 * Guard: ALUMNI dan ADMIN. Anggota yang belum lulus (role ANGGOTA) tidak
 * boleh masuk ke sini.
 *
 * ALUMNI melihat profil sendiri + edit. ADMIN melihat daftar alumni dan
 * dapat melakukan transisi keanggotaan (AKTIF → LULUS).
 */
export default async function AlumniPage() {
  const principal = await requirePortalPage("/alumni");
  const isAdmin = principal.role === "ADMIN";

  if (isAdmin) {
    const alumni = await db.member.findMany({
      where: {
        deletedAt: null,
        user: { role: "ALUMNI", deletedAt: null },
      },
      orderBy: { fullName: "asc" },
      take: 100,
      select: {
        memberCode: true,
        fullName: true,
        nickname: true,
        angkatan: true,
        university: true,
        studyProgram: true,
        graduationYear: true,
        city: true,
        user: { select: { email: true, status: true } },
      },
    });

    return (
      <div className="space-y-6">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Kelola Alumni</h1>
          <p className="text-sm text-muted-foreground">
            Daftar alumni dan transisi keanggotaan.
          </p>
        </section>

        <section className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Email</th>
                <th className="p-3">Angkatan</th>
                <th className="p-3">Universitas</th>
                <th className="p-3">Prodi</th>
                <th className="p-3 text-right">Lulus</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {alumni.map((a) => (
                <tr key={a.memberCode} className="p-3">
                  <td className="font-mono text-xs">{a.memberCode}</td>
                  <td className="font-medium">{a.fullName}</td>
                  <td className="text-muted-foreground text-sm">
                    {a.user?.email ?? "—"}
                  </td>
                  <td className="text-muted-foreground">{a.angkatan ?? "—"}</td>
                  <td className="text-muted-foreground text-sm">
                    {a.university ?? "—"}
                  </td>
                  <td className="text-muted-foreground text-sm">
                    {a.studyProgram ?? "—"}
                  </td>
                  <td className="text-right text-muted-foreground">
                    {a.graduationYear ?? "—"}
                  </td>
                  <td className="text-right space-x-1"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  // ALUMNI — profil sendiri
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
            angkatan: true,
            university: true,
            studyProgram: true,
            graduationYear: true,
          },
        })
        .catch(() => null)
    : null;

  const memberships = principal.memberId
    ? await db.membership.findMany({
        where: { memberId: principal.memberId },
        orderBy: { startDate: "desc" },
        select: {
          status: true,
          cohort: true,
          startDate: true,
          endDate: true,
          endReason: true,
          notes: true,
        },
      })
    : [];

  return (
    <div className="space-y-10">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Portal Alumni</h1>
        <p className="text-sm text-muted-foreground">
          Masuk sebagai <strong>{principal.email}</strong> ({principal.role})
        </p>
      </section>

      {!member ? (
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Data alumni tidak ditemukan. Hubungi sekretariat.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Profil Alumni</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Kode anggota
                </p>
                <p className="font-mono text-sm">{member.memberCode}</p>
              </div>
              {member.angkatan && (
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Angkatan
                  </p>
                  <p className="text-sm">{member.angkatan}</p>
                </div>
              )}
              {member.graduationYear && (
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Tahun lulus
                  </p>
                  <p className="text-sm">{member.graduationYear}</p>
                </div>
              )}
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Direktori publik
                </p>
                <p className="text-sm">
                  {member.isDirectoryVisible ? "Tampilkan" : "Sembunyi"}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Edit Profil</h2>
            <ProfileForm
              initial={{
                fullName: member.fullName,
                nickname: member.nickname ?? "",
                gender: member.gender ?? null,
                phone: member.phone ?? null,
                city: member.city ?? null,
                bio: member.bio ?? null,
                addressDetail: member.addressDetail ?? null,
                isDirectoryVisible: member.isDirectoryVisible,
              }}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Riwayat Keanggotaan</h2>
            {memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada riwayat keanggotaan.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {memberships.map((m) => (
                  <li key={`${m.cohort}-${m.startDate}`} className="p-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-medium">
                        Angkatan {m.cohort}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                          m.status === MembershipStatus.AKTIF
                            ? "border-emerald/20 bg-emerald/50 text-emerald-700"
                            : m.status === MembershipStatus.LULUS
                            ? "border-amber/20 bg-amber/50 text-amber-700"
                            : "border-slate/20 bg-slate/50 text-slate-700"
                        }`}
                      >
                        {m.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTanggalPendek(m.startDate)}
                      </span>
                      {m.endDate && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          s.d. {formatTanggalPendek(m.endDate)}
                        </span>
                      )}
                    </div>
                    {m.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {m.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { db } from "@/server/db/prisma";
import { Gender, MembershipStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Anggota" };
export const dynamic = "force-dynamic";

const GENDER_LABEL: Record<Gender, string> = {
  LAKI_LAKI: "Laki-laki",
  PEREMPUAN: "Perempuan",
};

export default async function AnggotaPage() {
  const members = await db.member.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, memberCode: true, fullName: true, nickname: true, gender: true,
      angkatan: true, university: true, studyProgram: true, graduationYear: true,
      phone: true, city: true, isDirectoryVisible: true, createdAt: true,
      user: { select: { email: true, status: true, role: true } },
      memberships: {
        where: { endDate: null },
        select: { status: true, cohort: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Data Anggota</h1>
        <p className="text-sm text-muted-foreground">
          Profil anggota dan status keanggotaan aktif.
        </p>
      </div>

      <section className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-3">Kode</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Akun</th>
              <th className="p-3">Angkatan</th>
              <th className="p-3">Prodi</th>
              <th className="p-3 text-center">JK</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m) => {
              const active = m.memberships[0];
              return (
                <tr key={m.id} className="p-3">
                  <td className="font-mono text-xs">{m.memberCode}</td>
                  <td className="font-medium">{m.fullName}</td>
                  <td className="text-muted-foreground text-sm">
                    {m.user?.email ?? "—"}
                  </td>
                  <td className="text-muted-foreground">{m.angkatan ?? "—"}</td>
                  <td className="text-muted-foreground text-sm">
                    {m.studyProgram ?? "—"}
                  </td>
                  <td className="text-center text-xs text-muted-foreground">
                    {m.gender ? GENDER_LABEL[m.gender] : "—"}
                  </td>
                  <td className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                        active?.status === MembershipStatus.AKTIF
                          ? "border-emerald/20 bg-emerald/50 text-emerald-700"
                          : "border-slate/20 bg-slate/50 text-slate-700"
                      }`}
                    >
                      {active?.status ?? "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {members.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Belum ada data anggota.
          </div>
        )}
      </section>
    </div>
  );
}

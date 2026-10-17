import type { Metadata } from "next";
import { db } from "@/lib/db/prisma";
import { transisiKeanggotaanAction } from "@/lib/actions/alumni";
import TransisiForm from "@/components/alumni/transisi-form";

export const metadata: Metadata = { title: "Alumni" };
export const dynamic = "force-dynamic";

export default async function AlumniPage() {
  const alumni = await db.member.findMany({
    where: {
      deletedAt: null,
      OR: [
        { graduationYear: { not: null } },
        { user: { role: "ALUMNI" } },
      ],
    },
    orderBy: { graduationYear: "desc" },
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
      isDirectoryVisible: true,
      user: { select: { email: true, role: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Manajemen Alumni</h1>
        <p className="text-sm text-muted-foreground">
          Transisi keanggotaan AKTIF → LULUS dan direktori alumni.
        </p>
      </div>

      <TransisiForm transisiAction={transisiKeanggotaanAction} />

      <section className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-3">Kode</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Angkatan</th>
              <th className="p-3">Lulus</th>
              <th className="p-3">Perguruan Tinggi</th>
              <th className="p-3">Direktori</th>
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
                <td className="text-xs text-muted-foreground">{a.user?.role}</td>
                <td className="text-muted-foreground">{a.angkatan ?? "—"}</td>
                <td className="text-muted-foreground">{a.graduationYear ?? "—"}</td>
                <td className="text-muted-foreground text-sm">
                  {a.university ?? "—"}
                </td>
                <td className="text-xs text-muted-foreground">
                  {a.isDirectoryVisible ? "Tampil" : "Sembunyi"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {alumni.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Belum ada data alumni.
          </div>
        )}
      </section>
    </div>
  );
}

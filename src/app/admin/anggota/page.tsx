import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db/prisma";
import { Gender, MembershipStatus } from "@/generated/prisma/enums";
import { transisiKeanggotaanAction } from "@/server/actions/alumni";
import { MemberTransitionActions } from "@/ui/components/admin/member-transition-actions";

export const metadata: Metadata = { title: "Anggota" };
export const dynamic = "force-dynamic";

const GENDER_LABEL: Record<Gender, string> = {
  LAKI_LAKI: "Laki-laki",
  PEREMPUAN: "Perempuan",
};

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "AKTIF", label: "AKTIF" },
  { value: "LULUS", label: "LULUS" },
  { value: "PENDAFTARAN", label: "PENDAFTARAN" },
  { value: "KELUAR", label: "KELUAR" },
  { value: "DINONAKTIFKAN", label: "DINONAKTIFKAN" },
  { value: "ALUMNI_ROLE", label: "ALUMNI (role)" },
];

type PageProps = { searchParams: Promise<{ status?: string }> };

export default async function AnggotaPage({ searchParams }: PageProps) {
  const { status: statusFilter } = await searchParams;

  const members = await db.member.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, memberCode: true, fullName: true, nickname: true, gender: true,
      angkatan: true, university: true, studyProgram: true, graduationYear: true,
      phone: true, city: true, isDirectoryVisible: true, createdAt: true,
      user: { select: { id: true, email: true, status: true, role: true } },
      memberships: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, cohort: true, endDate: true, endReason: true },
      },
    },
  });

  const filtered = members.filter((m) => {
    if (!statusFilter) return true;
    if (statusFilter === "ALUMNI_ROLE") return m.user?.role === "ALUMNI";
    const current = m.memberships[0]?.status ?? null;
    return current === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Data Anggota</h1>
        <p className="text-sm text-muted-foreground">
          Profil anggota, status keanggotaan, dan transisi manual AKTIF → LULUS → ALUMNI.
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="status" className="text-muted-foreground">Filter status:</label>
        <select id="status" name="status" defaultValue={statusFilter ?? ""} className="rounded-md border px-2 py-1">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button type="submit" className="rounded-md border px-3 py-1 hover:bg-muted">Terapkan</button>
        {statusFilter ? (
          <Link href="/admin/anggota" className="text-xs text-muted-foreground underline">Reset</Link>
        ) : null}
      </form>

      <section className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-3">Kode</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Akun</th>
              <th className="p-3">Angkatan</th>
              <th className="p-3">Prodi</th>
              <th className="p-3 text-center">JK</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Transisi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((m) => {
              const active = m.memberships[0];
              const status = active?.status ?? null;
              return (
                <tr key={m.id}>
                  <td className="p-3 font-mono text-xs">{m.memberCode}</td>
                  <td className="p-3">
                    <div className="font-medium">{m.fullName}</div>
                    <div className="text-xs text-muted-foreground">ID: {m.id}</div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    <div>{m.user?.email ?? "—"}</div>
                    <div className="text-xs">Role: {m.user?.role ?? "—"}</div>
                  </td>
                  <td className="p-3 text-muted-foreground">{m.angkatan ?? "—"}</td>
                  <td className="p-3 text-sm text-muted-foreground">{m.studyProgram ?? "—"}</td>
                  <td className="p-3 text-center text-xs text-muted-foreground">
                    {m.gender ? GENDER_LABEL[m.gender] : "—"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        status === MembershipStatus.AKTIF
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : status === MembershipStatus.LULUS
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      {status ?? "—"}
                    </span>
                    {m.user?.role === "ALUMNI" ? (
                      <span className="ml-1 inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                        ALUMNI
                      </span>
                    ) : null}
                  </td>
                  <td className="p-3 text-right">
                    <MemberTransitionActions
                      memberId={m.id}
                      memberName={m.fullName}
                      currentStatus={status}
                      action={transisiKeanggotaanAction}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Tidak ada data anggota untuk filter ini.
          </div>
        )}
      </section>
    </div>
  );
}

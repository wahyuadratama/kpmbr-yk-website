import type { Metadata } from "next";
import Link from "next/link";
import { requirePortalPage } from "@/server/auth/guards";
import { db } from "@/server/db/prisma";
import { MemberApplicationStatus } from "@/generated/prisma/enums";
import { MemberApplicationActions } from "@/ui/components/admin/member-application-actions";

export const metadata: Metadata = { title: "Pengajuan Anggota" };
export const dynamic = "force-dynamic";

export default async function MemberApplicationsPage() {
  await requirePortalPage("/admin");

  const apps = await db.memberApplication.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { user: { select: { email: true } }, reviewedBy: { select: { email: true } } },
  });

  const pending = apps.filter((a) => a.status === MemberApplicationStatus.PENDING);
  const processed = apps.filter((a) => a.status !== MemberApplicationStatus.PENDING);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Pengajuan Keanggotaan</h1>
          <p className="text-sm text-muted-foreground">
            Pengajuan self-service dari akun yang belum terhubung. Setujui → buat member AKTIF &amp; hubungkan akun.
            Tolak → akun boleh ajukan ulang. Semua aksi tercatat audit.
          </p>
        </div>
        <Link href="/admin/anggota" className="text-sm underline">← Data Anggota</Link>
      </div>

      <section className="space-y-2">
        <h2 className="font-medium">Menunggu persetujuan ({pending.length})</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-3">Pemohon</th>
                <th className="p-3">Email</th>
                <th className="p-3">Data</th>
                <th className="p-3">Diajukan</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pending.map((a) => (
                <tr key={a.id}>
                  <td className="p-3 font-medium">{a.fullName}</td>
                  <td className="p-3 text-muted-foreground">{a.user.email}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {a.nickname ? `(${a.nickname}) ` : ""}{a.city ?? ""} {a.phone ?? ""}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{a.createdAt.toLocaleString("id-ID")}</td>
                  <td className="p-3 text-right">
                    <MemberApplicationActions id={a.id} applicantName={a.fullName} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pending.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">Tidak ada pengajuan pending.</div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium text-muted-foreground">Riwayat diproses ({processed.length})</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-3">Pemohon</th>
                <th className="p-3">Status</th>
                <th className="p-3">Catatan</th>
                <th className="p-3">Diproses</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {processed.map((a) => (
                <tr key={a.id}>
                  <td className="p-3">{a.fullName} <span className="text-xs text-muted-foreground">({a.user.email})</span></td>
                  <td className="p-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${a.status === "APPROVED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{a.rejectionNote ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {a.reviewedAt?.toLocaleString("id-ID") ?? "—"} {a.reviewedBy?.email ? `(${a.reviewedBy.email})` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

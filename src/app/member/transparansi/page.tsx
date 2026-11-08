import type { Metadata } from "next";
import { requirePortalPage } from "@/server/auth/guards";
import { hasPermission } from "@/server/auth/permissions";
import { db } from "@/server/db/prisma";
import { listTransparencyTransactions } from "@/server/modules/finance/queries";
import { PageHeading } from "@/ui/components/dashboard/page-heading";
import { Panel } from "@/ui/components/dashboard/panel";
import { StatCard } from "@/ui/components/dashboard/stat-card";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";
import { FinancialReportStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Transparansi Keuangan" };
export const dynamic = "force-dynamic";

/**
 * Transparansi keuangan untuk anggota (login required).
 * - Laporan PUBLISHED (PUBLIC/MEMBER_ONLY) — tetap seperti sebelumnya.
 * - Rincian transaksi (transparansi penuh) — HANYA untuk anggota yang sudah login;
 *   pengunjung publik tidak bisa mengakses portal ini (requirePortalPage /member).
 */
export default async function MemberTransparencyPage() {
  const principal = await requirePortalPage("/member");

  if (!hasPermission(principal.role, "finance:read_summary")) {
    return (
      <div className="space-y-5">
        <PageHeading title="Transparansi Keuangan" description="Laporan keuangan yang dipublikasikan untuk anggota." />
        <Panel>
          <p className="text-sm text-dashboard-text-muted">Anda tidak memiliki izin untuk melihat laporan keuangan.</p>
        </Panel>
      </div>
    );
  }

  const [reports, transactions] = await Promise.all([
    db.financialReport.findMany({
      where: {
        deletedAt: null,
        status: FinancialReportStatus.PUBLISHED,
        visibility: { in: ["PUBLIC", "MEMBER_ONLY"] },
      },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      take: 24,
      select: {
        id: true,
        periodYear: true,
        periodMonth: true,
        periodType: true,
        incomeTotal: true,
        expenseTotal: true,
        balance: true,
      },
    }),
    listTransparencyTransactions({ limit: 200 }),
  ]);

  const totalIncome = reports.reduce((sum, item) => sum + item.incomeTotal, BigInt(0));
  const totalExpense = reports.reduce((sum, item) => sum + item.expenseTotal, BigInt(0));

  return (
    <div className="space-y-5">
      <PageHeading
        title="Transparansi Keuangan"
        description="Laporan keuangan yang telah disetujui dan dipublikasikan, beserta rincian transaksi (khusus anggota login)."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Pemasukan" value={formatRupiah(totalIncome)} icon={ArrowUpRight} hint="Akumulasi laporan terbit" />
        <StatCard label="Total Pengeluaran" value={formatRupiah(totalExpense)} icon={ArrowDownRight} hint="Akumulasi laporan terbit" />
        <StatCard label="Saldo" value={formatRupiah(totalIncome - totalExpense)} icon={Wallet} hint="Pemasukan dikurangi pengeluaran" />
      </section>

      <Panel bodyClassName="p-0">
        {reports.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-dashboard-text-muted">Belum ada laporan keuangan yang dipublikasikan untuk anggota.</p>
        ) : (
          <ul className="divide-y divide-dashboard-border">
            {reports.map((report) => {
              const monthName = report.periodMonth
                ? new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(report.periodYear, report.periodMonth - 1, 1))
                : "Tahunan";
              return (
                <li key={report.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
                  <div className="min-w-[160px]">
                    <p className="text-sm font-medium text-dashboard-text">{monthName} {report.periodYear}</p>
                    <p className="text-xs text-dashboard-text-muted">{report.periodType === "YEARLY" ? "Laporan tahunan" : "Laporan bulanan"}</p>
                  </div>
                  <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div><dt className="text-xs text-dashboard-text-muted">Pemasukan</dt><dd className="tabular-nums">{formatRupiah(report.incomeTotal)}</dd></div>
                    <div><dt className="text-xs text-dashboard-text-muted">Pengeluaran</dt><dd className="tabular-nums">{formatRupiah(report.expenseTotal)}</dd></div>
                    <div><dt className="text-xs text-dashboard-text-muted">Saldo</dt><dd className="font-medium tabular-nums">{formatRupiah(report.balance)}</dd></div>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Rincian Transaksi (khusus anggota login)" description="Pemasukan & pengeluaran. Tidak menampilkan bukti/catatan internal. Tidak tersedia untuk pengunjung publik.">
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-dashboard-text-muted">Belum ada transaksi tercatat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Tanggal</th>
                  <th className="py-2 pr-3">Kategori / Jenis</th>
                  <th className="py-2 pr-3">Keterangan</th>
                  <th className="py-2 pr-3 text-right">Pemasukan</th>
                  <th className="py-2 pr-3 text-right">Pengeluaran</th>
                  <th className="py-2 text-right">Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatTanggalPendek(t.date)}</td>
                    <td className="py-2 pr-3">
                      <span className="font-medium">{t.categoryName}</span>
                      <span className={`ml-1 rounded-full border px-1.5 py-0.5 text-[10px] ${t.type === "INCOME" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                        {t.type === "INCOME" ? "Masuk" : "Keluar"}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{t.description || "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-emerald-700">{t.type === "INCOME" ? t.amountFormatted : "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-rose-700">{t.type === "EXPENSE" ? t.amountFormatted : "—"}</td>
                    <td className="py-2 text-right tabular-nums font-medium">{t.runningBalanceFormatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

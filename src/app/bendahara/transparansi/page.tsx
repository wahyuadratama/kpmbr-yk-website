import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";
import { FinancialReportStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Transparansi Keuangan" };
export const dynamic = "force-dynamic";

/**
 * Ringkasan laporan yang sudah dipublikasikan.
 *
 * Yang ditampilkan HANYA ringkasan yang sudah melalui persetujuan dan
 * dipublikasikan. Laporan draf maupun yang masih diajukan tidak pernah
 * tampil di sini, sehingga angka yang belum diperiksa tidak bocor.
 */
export default async function TransparansiPage() {
  await requirePortalPage("/bendahara");

  const published = await db.financialReport.findMany({
    where: { deletedAt: null, status: FinancialReportStatus.PUBLISHED },
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
      visibility: true,
      publishedAt: true,
    },
  });

  const totalIncome = published.reduce((sum, item) => sum + item.incomeTotal, BigInt(0));
  const totalExpense = published.reduce((sum, item) => sum + item.expenseTotal, BigInt(0));

  return (
    <div className="space-y-5">
      <PageHeading
        title="Transparansi Keuangan"
        description="Laporan yang telah disetujui dan dipublikasikan untuk umum."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Pemasukan"
          value={formatRupiah(totalIncome)}
          icon={ArrowUpRight}
          hint="Akumulasi laporan terbit"
        />
        <StatCard
          label="Total Pengeluaran"
          value={formatRupiah(totalExpense)}
          icon={ArrowDownRight}
          hint="Akumulasi laporan terbit"
        />
        <StatCard
          label="Saldo"
          value={formatRupiah(totalIncome - totalExpense)}
          icon={Wallet}
          hint="Pemasukan dikurangi pengeluaran"
        />
      </section>

      <Panel bodyClassName="p-0">
        {published.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-dashboard-text-muted">
            Belum ada laporan yang dipublikasikan. Laporan muncul di sini
            setelah disetujui dan dipublikasikan.
          </p>
        ) : (
          <ul className="divide-y divide-dashboard-border">
            {published.map((report) => {
              const monthName = report.periodMonth
                ? new Intl.DateTimeFormat("id-ID", { month: "long" }).format(
                    new Date(report.periodYear, report.periodMonth - 1, 1),
                  )
                : "Tahunan";
              return (
                <li
                  key={report.id}
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3"
                >
                  <div className="min-w-[160px]">
                    <p className="text-sm font-medium text-dashboard-text">
                      {monthName} {report.periodYear}
                    </p>
                    <p className="text-xs text-dashboard-text-muted">
                      {report.periodType === "YEARLY"
                        ? "Laporan tahunan"
                        : "Laporan bulanan"}
                    </p>
                  </div>
                  <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div>
                      <dt className="text-xs text-dashboard-text-muted">
                        Pemasukan
                      </dt>
                      <dd className="tabular-nums">{formatRupiah(report.incomeTotal)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-dashboard-text-muted">
                        Pengeluaran
                      </dt>
                      <dd className="tabular-nums">
                        {formatRupiah(report.expenseTotal)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-dashboard-text-muted">Saldo</dt>
                      <dd className="font-medium tabular-nums">
                        {formatRupiah(report.balance)}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

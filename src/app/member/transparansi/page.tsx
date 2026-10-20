import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
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
 * Laporan keuangan yang dipublikasikan untuk anggota.
 *
 * Hanya laporan berstatus PUBLISHED dengan audiens PUBLIC atau MEMBER_ONLY
 * yang tampil. Laporan draf dan yang belum disetujui tidak pernah bocor.
 */
export default async function MemberTransparencyPage() {
  const principal = await requirePortalPage("/member");

  if (!hasPermission(principal.role, "finance:read_summary")) {
    return (
      <div className="space-y-5">
        <PageHeading
          title="Transparansi Keuangan"
          description="Laporan keuangan yang dipublikasikan untuk anggota."
        />
        <Panel>
          <p className="text-sm text-dashboard-text-muted">
            Anda tidak memiliki izin untuk melihat laporan keuangan.
          </p>
        </Panel>
      </div>
    );
  }

  const reports = await db.financialReport.findMany({
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
  });

  const totalIncome = reports.reduce((sum, item) => sum + item.incomeTotal, BigInt(0));
  const totalExpense = reports.reduce((sum, item) => sum + item.expenseTotal, BigInt(0));

  return (
    <div className="space-y-5">
      <PageHeading
        title="Transparansi Keuangan"
        description="Laporan keuangan yang telah disetujui dan dipublikasikan untuk anggota."
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
        {reports.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-dashboard-text-muted">
            Belum ada laporan keuangan yang dipublikasikan untuk anggota.
          </p>
        ) : (
          <ul className="divide-y divide-dashboard-border">
            {reports.map((report) => {
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

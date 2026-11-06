import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { requirePortalPage } from "@/server/auth/guards";
import { hasPermission } from "@/server/auth/permissions";
import { db } from "@/server/db/prisma";
import { PageHeading } from "@/ui/components/dashboard/page-heading";
import { Panel } from "@/ui/components/dashboard/panel";
import { StatCard } from "@/ui/components/dashboard/stat-card";
import { StatusBadge } from "@/ui/components/dashboard/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/ui/table";
import { formatRupiah, formatTanggalPendek } from "@/shared/utils/format";
import { FinancialTransactionType } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Dashboard Bendahara" };
export const dynamic = "force-dynamic";

/**
 * Dashboard bendahara.
 *
 * Seluruh angka berasal dari transaksi yang tersimpan. Periode default adalah
 * tahun berjalan dan dapat diganti lewat query `?tahun=`.
 */
export default async function BendaharaDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const principal = await requirePortalPage("/bendahara");
  const params = await searchParams;

  const canRead = hasPermission(principal.role, "finance:read_transaction");
  const now = new Date();
  const year = Number(params.tahun) || now.getFullYear();

  const periodStart = new Date(year, 0, 1);
  const periodEnd = new Date(year + 1, 0, 1);

  const [income, expense, latest, pendingReports] = await Promise.all([
    canRead
      ? db.financialTransaction.aggregate({
          where: {
            deletedAt: null,
            type: FinancialTransactionType.INCOME,
            date: { gte: periodStart, lt: periodEnd },
          },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: null } }),
    canRead
      ? db.financialTransaction.aggregate({
          where: {
            deletedAt: null,
            type: FinancialTransactionType.EXPENSE,
            date: { gte: periodStart, lt: periodEnd },
          },
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: null } }),
    canRead
      ? db.financialTransaction.findMany({
          where: { deletedAt: null },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: 8,
          select: {
            id: true,
            date: true,
            amount: true,
            type: true,
            description: true,
            category: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    hasPermission(principal.role, "finance:read_summary")
      ? db.financialReport.count({
          where: { deletedAt: null, status: { in: ["DRAFT", "SUBMITTED"] } },
        })
      : Promise.resolve(0),
  ]);

  const incomeTotal = income._sum.amount ?? BigInt(0);
  const expenseTotal = expense._sum.amount ?? BigInt(0);
  const balance = incomeTotal - expenseTotal;

  return (
    <div className="space-y-5">
      <PageHeading
        title="Dashboard Bendahara"
        description={`Ringkasan pemasukan, pengeluaran, dan saldo organisasi tahun ${year}.`}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Pemasukan"
          value={formatRupiah(incomeTotal)}
          icon={ArrowUpRight}
          hint={`Periode ${year}`}
        />
        <StatCard
          label="Total Pengeluaran"
          value={formatRupiah(expenseTotal)}
          icon={ArrowDownRight}
          hint={`Periode ${year}`}
        />
        <StatCard
          label="Saldo Saat Ini"
          value={formatRupiah(balance)}
          icon={Wallet}
          hint="Pemasukan dikurangi pengeluaran"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Transaksi Terbaru"
          description="Catatan terakhir yang masuk ke pencatatan keuangan"
          className="xl:col-span-2"
        >
          {latest.length === 0 ? (
            <p className="py-10 text-center text-sm text-dashboard-text-muted">
              Belum ada transaksi tercatat.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latest.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm text-dashboard-text-muted">
                      {formatTanggalPendek(item.date)}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm font-medium">
                      {item.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-dashboard-text-muted">
                      {item.category.name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={
                          item.type === FinancialTransactionType.INCOME
                            ? "success"
                            : "warning"
                        }
                      >
                        {item.type === FinancialTransactionType.INCOME
                          ? "Pemasukan"
                          : "Pengeluaran"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      {formatRupiah(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>

        <Panel
          title="Laporan Keuangan"
          description="Laporan yang menunggu pemeriksaan"
        >
          <p className="text-3xl font-bold tabular-nums text-dashboard-text">
            {pendingReports}
          </p>
          <p className="mt-1 text-xs text-dashboard-text-muted">
            laporan draf atau yang sudah diajukan menunggu pemeriksaan
          </p>
          <p className="mt-4 text-xs leading-relaxed text-dashboard-text-muted">
            Susun laporan pada halaman Laporan, lalu ajukan untuk pemeriksaan.
            Persetujuan dan publikasi dilakukan administrator.
          </p>
        </Panel>
      </div>
    </div>
  );
}

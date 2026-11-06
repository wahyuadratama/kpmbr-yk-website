/**
 * Tampilan CMS laporan keuangan — dipakai bersama oleh portal `/admin`,
 * `/bendahara`, dan `/pengurus`.
 *
 * Satu implementasi; route hanya berbeda pada guard portalnya. Tombol
 * persetujuan hanya muncul bila role MEMILIKI permission-nya, sehingga
 * bendahara tidak mungkin menyetujui laporannya sendiri.
 */
import { hasPermission } from "@/server/auth/permissions";
import type { Principal } from "@/server/auth/principal";
import { db } from "@/server/db/prisma";
import { PageHeading } from "@/ui/components/dashboard/page-heading";
import { Panel } from "@/ui/components/dashboard/panel";
import { StatusBadge, type StatusTone } from "@/ui/components/dashboard/status-badge";
import { ConfirmActionForm } from "@/ui/components/internal/confirm-action-form";
import { ReportForm } from "@/ui/components/bendahara/report-form";
import {
  approveFinancialReportFormAction,
  createFinancialReportFormAction,
  publishFinancialReportFormAction,
  rejectFinancialReportFormAction,
  submitFinancialReportFormAction,
} from "@/server/modules/finance/form-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/ui/table";
import { formatRupiah } from "@/shared/utils/format";
import { FinancialReportStatus } from "@/generated/prisma/enums";

const STATUS_TONE: Record<string, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "warning",
  APPROVED: "info",
  REJECTED: "danger",
  PUBLISHED: "success",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf",
  SUBMITTED: "Diajukan",
  APPROVED: "Disetujui",
  REJECTED: "Dikembalikan",
  PUBLISHED: "Dipublikasikan",
};

const VISIBILITY_LABEL: Record<string, string> = {
  PUBLIC: "Publik",
  MEMBER_ONLY: "Anggota",
  PENGURUS_ONLY: "Pengurus",
  ADMIN_ONLY: "Administrator",
};

/**
 * Daftar laporan keuangan beserta alur pemeriksaan dan publikasinya.
 *
 * Alur: draf -> diajukan -> disetujui -> dipublikasikan, atau
 * dikembalikan untuk diperbaiki.
 */
export async function LaporanKeuanganAdminView({
  principal,
}: {
  principal: Principal;
}) {
  const canCreate = hasPermission(principal.role, "finance:create");
  const canApprove = hasPermission(principal.role, "finance:approve");
  const canPublish = hasPermission(principal.role, "finance:publish");

  const reports = await db.financialReport.findMany({
    where: { deletedAt: null },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    take: 50,
    select: {
      id: true,
      periodYear: true,
      periodMonth: true,
      periodType: true,
      incomeTotal: true,
      expenseTotal: true,
      balance: true,
      status: true,
      visibility: true,
      rejectionNote: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-5">
      <PageHeading
        title="Laporan Keuangan"
        description="Alur laporan: draf, diajukan, disetujui, lalu dipublikasikan untuk transparansi."
      />

      {canCreate ? (
        <Panel
          title="Susun Laporan"
          description="Angka laporan dihitung ulang dari transaksi sumber saat pengajuan."
          className="max-w-4xl"
        >
          <ReportForm
            action={createFinancialReportFormAction}
            currentYear={new Date().getFullYear()}
          />
        </Panel>
      ) : null}

      <Panel bodyClassName="p-0">
        {reports.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-dashboard-text-muted">
            Belum ada laporan keuangan. Susun laporan pertama di atas.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Audiens</TableHead>
                <TableHead className="text-right">Pemasukan</TableHead>
                <TableHead className="text-right">Pengeluaran</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const monthName = report.periodMonth
                  ? new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
                      new Date(report.periodYear, report.periodMonth - 1, 1),
                    )
                  : "Tahunan";
                return (
                  <TableRow key={report.id}>
                    <TableCell className="text-sm font-medium">
                      {monthName} {report.periodYear}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={STATUS_TONE[report.status] ?? "neutral"}>
                        {STATUS_LABEL[report.status] ?? report.status}
                      </StatusBadge>
                      {report.rejectionNote ? (
                        <p className="mt-1 max-w-[220px] text-[11px] text-dashboard-danger">
                          {report.rejectionNote}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-dashboard-text-muted">
                      {VISIBILITY_LABEL[report.visibility] ?? report.visibility}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-dashboard-text-muted">
                      {formatRupiah(report.incomeTotal)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-dashboard-text-muted">
                      {formatRupiah(report.expenseTotal)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      {formatRupiah(report.balance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {canCreate &&
                        report.status === FinancialReportStatus.DRAFT ? (
                          <ConfirmActionForm
                            action={submitFinancialReportFormAction}
                            id={report.id}
                            variant="outline"
                            confirmMessage="Ajukan laporan ini untuk pemeriksaan? Angka akan dihitung ulang dari transaksi sumber."
                          >
                            Ajukan
                          </ConfirmActionForm>
                        ) : null}
                        {canApprove &&
                        report.status === FinancialReportStatus.SUBMITTED ? (
                          <>
                            <ConfirmActionForm
                              action={approveFinancialReportFormAction}
                              id={report.id}
                              variant="outline"
                            >
                              Setujui
                            </ConfirmActionForm>
                            <ConfirmActionForm
                              action={rejectFinancialReportFormAction}
                              id={report.id}
                              confirmMessage="Kembalikan laporan ini untuk diperbaiki?"
                            >
                              Kembalikan
                            </ConfirmActionForm>
                          </>
                        ) : null}
                        {canPublish &&
                        report.status === FinancialReportStatus.APPROVED ? (
                          <ConfirmActionForm
                            action={publishFinancialReportFormAction}
                            id={report.id}
                            variant="outline"
                            confirmMessage="Publikasikan laporan ini untuk transparansi?"
                          >
                            Publikasikan
                          </ConfirmActionForm>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}

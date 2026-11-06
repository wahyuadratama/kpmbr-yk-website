"use server";

/**
 * Server Action untuk CMS keuangan.
 *
 * Alur laporan keuangan:
 *
 *   DRAFT → SUBMITTED → APPROVED → PUBLISHED
 *                ↓
 *             REJECTED (kembali ke DRAFT untuk diperbaiki)
 *
 * Pemisahan wewenang: BENDAHARA boleh menyusun dan ENGGAJUKAN laporan, tetapi
 * TIDAK boleh menyetujui atau mempublikasikannya sendiri. Persetujuan dan
 * publikasi adalah wewenang ADMIN.
 *
 * Lihat penjelasan pemisahan file di `modules/news/form-actions.ts`.
 */
import {
  createFinancialCategoryAction,
  createFinancialReportAction,
  createFinancialTransactionAction,
  deleteFinancialCategoryAction,
  deleteFinancialTransactionAction,
} from "@/modules/finance/actions";
import type { ActionResult } from "@/lib/actions/result";
import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { notFound, conflict, forbidden } from "@/lib/errors";
import {
  FinancialReportStatus,
  FinancialTransactionType,
} from "@/generated/prisma/enums";

/* -------------------------------------------------------------------------- */
/* TRANSAKSI                                                                  */
/* -------------------------------------------------------------------------- */

/** Catat transaksi baru dari form. */
export async function createFinancialTransactionFormAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const categoryId = formData.get("categoryId");
  // Placeholder "Tanpa kategori" bernilai "none". Nilai itu HARUS ditolak
  // di sini: kalau diteruskan, ia lolos pola cuid dan baru gagal saat
  // constraint foreign key database dengan pesan yang membingungkan.
  if (typeof categoryId !== "string" || categoryId === "" || categoryId === "none") {
    throw new Error("Kategori transaksi wajib dipilih.");
  }

  return createFinancialTransactionAction({
    date: formData.get("date"),
    amount: formData.get("amount"),
    type: formData.get("type") ?? FinancialTransactionType.EXPENSE,
    categoryId,
    description: formData.get("description") ?? undefined,
  });
}

/** Hapus transaksi (soft delete). */
export async function deleteFinancialTransactionFormAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;
  await deleteFinancialTransactionAction({ id });
}

/* -------------------------------------------------------------------------- */
/* KATEGORI                                                                   */
/* -------------------------------------------------------------------------- */

/** Buat kategori keuangan baru. */
export async function createFinancialCategoryFormAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return createFinancialCategoryAction({
    name: formData.get("name"),
    slug: formData.get("slug"),
    type: formData.get("type") ?? FinancialTransactionType.EXPENSE,
  });
}

/** Hapus kategori keuangan (soft delete). */
export async function deleteFinancialCategoryFormAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;
  await deleteFinancialCategoryAction({ id });
}

/* -------------------------------------------------------------------------- */
/* LAPORAN                                                                    */
/* -------------------------------------------------------------------------- */

/** Susun laporan keuangan baru (status DRAFT). */
export async function createFinancialReportFormAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const periodYear = formData.get("periodYear");
  const periodMonthRaw = formData.get("periodMonth");
  // Opsi "Tanpa bulan" bernilai "none"; harus diubah menjadi null. Kalau
  // diteruskan apa adanya, `z.coerce.number()` mengubahnya menjadi NaN dan
  // validasi gagal.
  const periodMonth =
    typeof periodMonthRaw === "string" && periodMonthRaw !== "" && periodMonthRaw !== "none"
      ? periodMonthRaw
      : null;

  return createFinancialReportAction({
    periodYear,
    periodMonth,
    periodType: formData.get("periodType") ?? "MONTHLY",
    visibility: formData.get("visibility") ?? "MEMBER_ONLY",
  });
}

/**
 * Hitung ulang angka laporan dari transaksi sumber, lalu ajukan untuk
 * pemeriksaan.
 *
 * Angka laporan SELALU dihitung ulang dari `financial_transactions`, tidak
 * pernah diterima dari form. Dengan begitu laporan tidak mungkin berbeda dari
 * transaksi yang menjadi sumbernya.
 */
export async function submitFinancialReportFormAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;

  const principal = await requirePermission("finance:create");

  const report = await db.financialReport.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      status: true,
      periodYear: true,
      periodMonth: true,
      periodType: true,
    },
  });
  if (!report) throw notFound("Laporan tidak ditemukan.");
  if (report.status !== FinancialReportStatus.DRAFT) {
    throw conflict("Laporan hanya dapat diajukan dari status draf.");
  }

  const from = new Date(
    report.periodYear,
    (report.periodMonth ?? 1) - 1,
    report.periodType === "YEARLY" ? 0 : 1,
  );
  const to = new Date(
    report.periodYear,
    report.periodType === "YEARLY" ? 12 : (report.periodMonth ?? 12),
    report.periodType === "YEARLY" ? 31 : 0,
  );

  const [income, expense] = await Promise.all([
    db.financialTransaction.aggregate({
      where: {
        deletedAt: null,
        type: FinancialTransactionType.INCOME,
        date: { gte: from, lt: to },
      },
      _sum: { amount: true },
    }),
    db.financialTransaction.aggregate({
      where: {
        deletedAt: null,
        type: FinancialTransactionType.EXPENSE,
        date: { gte: from, lt: to },
      },
      _sum: { amount: true },
    }),
  ]);

  const incomeTotal = income._sum.amount ?? BigInt(0);
  const expenseTotal = expense._sum.amount ?? BigInt(0);
  const balance = incomeTotal - expenseTotal;

  await db.$transaction(async (tx) => {
    await tx.financialReport.update({
      where: { id: report.id },
      data: {
        incomeTotal,
        expenseTotal,
        balance,
        status: FinancialReportStatus.SUBMITTED,
        submittedAt: new Date(),
        rejectionNote: null,
      },
    });
    await tx.financialReportApproval.create({
      data: {
        reportId: report.id,
        action: "SUBMIT",
        note: "Laporan diajukan untuk pemeriksaan.",
        actorId: principal.userId,
      },
    });
  });

  await writeAudit({
    action: AuditAction.UPDATE,
    resource: "FinancialReport",
    resourceId: report.id,
    actorUserId: principal.userId,
    metadata: {
      status: FinancialReportStatus.SUBMITTED,
      incomeTotal: incomeTotal.toString(),
      expenseTotal: expenseTotal.toString(),
    },
  });
}

/** Setujui laporan yang sudah diajukan. */
export async function approveFinancialReportFormAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;

  const principal = await requirePermission("finance:approve");

  const report = await db.financialReport.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!report) throw notFound("Laporan tidak ditemukan.");
  if (report.status !== FinancialReportStatus.SUBMITTED) {
    throw conflict("Hanya laporan yang sudah diajukan yang dapat disetujui.");
  }

  await db.$transaction(async (tx) => {
    await tx.financialReport.update({
      where: { id: report.id },
      data: {
        status: FinancialReportStatus.APPROVED,
        approvedAt: new Date(),
        rejectedAt: null,
      },
    });
    await tx.financialReportApproval.create({
      data: {
        reportId: report.id,
        action: "APPROVE",
        note: formData.get("note")?.toString() || null,
        actorId: principal.userId,
      },
    });
  });

  await writeAudit({
    action: AuditAction.UPDATE,
    resource: "FinancialReport",
    resourceId: report.id,
    actorUserId: principal.userId,
    metadata: { status: FinancialReportStatus.APPROVED },
  });
}

/** Kembalikan laporan untuk diperbaiki. */
export async function rejectFinancialReportFormAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;

  const principal = await requirePermission("finance:approve");

  const report = await db.financialReport.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!report) throw notFound("Laporan tidak ditemukan.");
  if (report.status !== FinancialReportStatus.SUBMITTED) {
    throw conflict("Hanya laporan yang sudah diajukan yang dapat dikembalikan.");
  }

  const note = formData.get("note")?.toString().trim();
  if (!note) throw conflict("Alasan pengembalian wajib diisi.");

  await db.$transaction(async (tx) => {
    await tx.financialReport.update({
      where: { id: report.id },
      data: {
        status: FinancialReportStatus.DRAFT,
        rejectedAt: new Date(),
        rejectionNote: note,
        submittedAt: null,
      },
    });
    await tx.financialReportApproval.create({
      data: {
        reportId: report.id,
        action: "REJECT",
        note,
        actorId: principal.userId,
      },
    });
  });

  await writeAudit({
    action: AuditAction.UPDATE,
    resource: "FinancialReport",
    resourceId: report.id,
    actorUserId: principal.userId,
    metadata: { status: FinancialReportStatus.DRAFT, rejected: true },
  });
}

/** Publikasikan laporan yang telah disetujui. */
export async function publishFinancialReportFormAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;

  const principal = await requirePermission("finance:publish");

  const report = await db.financialReport.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!report) throw notFound("Laporan tidak ditemukan.");
  if (report.status !== FinancialReportStatus.APPROVED) {
    throw forbidden("Laporan hanya dapat dipublikasikan setelah disetujui.");
  }

  await db.$transaction(async (tx) => {
    await tx.financialReport.update({
      where: { id: report.id },
      data: { status: FinancialReportStatus.PUBLISHED, publishedAt: new Date() },
    });
    await tx.financialReportApproval.create({
      data: {
        reportId: report.id,
        action: "PUBLISH",
        note: "Laporan dipublikasikan untuk transparansi.",
        actorId: principal.userId,
      },
    });
  });

  await writeAudit({
    action: AuditAction.UPDATE,
    resource: "FinancialReport",
    resourceId: report.id,
    actorUserId: principal.userId,
    metadata: { status: FinancialReportStatus.PUBLISHED },
  });
}

/** Hitung ulang angka laporan dari transaksi (tanpa mengubah status). */
export const recalculateFinancialReportAction = async (formData: FormData): Promise<void> => {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;
  await requirePermission("finance:create");

  const report = await db.financialReport.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, periodYear: true, periodMonth: true, periodType: true },
  });
  if (!report) throw notFound("Laporan tidak ditemukan.");

  const from = new Date(
    report.periodYear,
    (report.periodMonth ?? 1) - 1,
    report.periodType === "YEARLY" ? 0 : 1,
  );
  const to = new Date(
    report.periodYear,
    report.periodType === "YEARLY" ? 12 : (report.periodMonth ?? 12),
    report.periodType === "YEARLY" ? 31 : 0,
  );

  const [income, expense] = await Promise.all([
    db.financialTransaction.aggregate({
      where: {
        deletedAt: null,
        type: FinancialTransactionType.INCOME,
        date: { gte: from, lt: to },
      },
      _sum: { amount: true },
    }),
    db.financialTransaction.aggregate({
      where: {
        deletedAt: null,
        type: FinancialTransactionType.EXPENSE,
        date: { gte: from, lt: to },
      },
      _sum: { amount: true },
    }),
  ]);

  const incomeTotal = income._sum.amount ?? BigInt(0);
  const expenseTotal = expense._sum.amount ?? BigInt(0);

  await db.financialReport.update({
    where: { id: report.id },
    data: {
      incomeTotal,
      expenseTotal,
      balance: incomeTotal - expenseTotal,
    },
  });
};

/**
 * Server action untuk modul keuangan.
 *
 * Prinsip:
 * - Semua mutasi tercatat di `audit_logs` (CREATE / UPDATE / DELETE).
 * - `amount` ditransformasi dari string ke `BigInt` oleh skema validasi,
 *   tidak pernah Float.
 * - `createdById` diambil dari session (principal), TIDAK dari input klien.
 * - Cache tag `finance-*` di-invalidate setelah mutasi supaya dashboard
 *   selalu menunjukkan saldo terbaru.
 */
import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db/prisma";
import { requirePermission } from "@/server/auth/guards";
import { parseOrThrow } from "@/shared/validation/parse";
import {
  financialCategoryCreateSchema,
  financialCategoryUpdateSchema,
  financialTransactionCreateSchema,
  financialTransactionUpdateSchema,
  financialReportCreateSchema,
} from "@/shared/validation/finance";
import { cuidSchema } from "@/shared/validation/common";
import { notFound } from "@/shared/errors";
import { runAction, type ActionResult } from "@/server/actions/result";
import { writeAudit } from "@/server/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { parseLocalDate } from "@/shared/utils/datetime";
import { FINANCE_TAGS } from "@/server/modules/finance/queries";

const idSchema = z.object({ id: cuidSchema });

function refreshCategoriesCache(): void {
  updateTag(FINANCE_TAGS.categories);
}
function refreshTransactionsCache(): void {
  updateTag(FINANCE_TAGS.transactions);
}
function refreshReportsCache(): void {
  updateTag(FINANCE_TAGS.reports);
}

/* -------------------------------------------------------------------------- */
/* KATEGORI                                                                   */
/* -------------------------------------------------------------------------- */

export async function createFinancialCategoryAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("financial-category.create", async () => {
    const principal = await requirePermission("finance:create");
    const input = parseOrThrow(financialCategoryCreateSchema, raw);

    const created = await db.$transaction(async (tx) => {
      return tx.financialCategory.create({
        data: {
          name: input.name,
          slug: input.slug,
          type: input.type,
        },
        select: { id: true },
      });
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "FinancialCategory",
      resourceId: created.id,
      actorUserId: principal.userId,
      metadata: { name: input.name, slug: input.slug, type: input.type },
    });

    refreshCategoriesCache();
    return created;
  });
}

export async function updateFinancialCategoryAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const schema = financialCategoryUpdateSchema;
  return runAction("financial-category.update", async () => {
    const principal = await requirePermission("finance:create");
    const input = parseOrThrow(schema, raw);

    const existing = await db.financialCategory.findUnique({
      where: { id: input.id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Kategori tidak ditemukan.");

    const updated = await db.$transaction(async (tx) => {
      return tx.financialCategory.update({
        where: { id: existing.id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
        },
        select: { id: true },
      });
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "FinancialCategory",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { fields: Object.keys(input).filter((key) => key !== "id") },
    });

    refreshCategoriesCache();
    return updated;
  });
}

export async function deleteFinancialCategoryAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("financial-category.delete", async () => {
    const principal = await requirePermission("finance:delete");
    const { id } = parseOrThrow(idSchema, raw);

    const existing = await db.financialCategory.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Kategori tidak ditemukan.");

    const result = await db.$transaction(async (tx) => {
      return tx.financialCategory.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
    if (result.count === 0) throw notFound("Kategori tidak ditemukan.");

    await writeAudit({
      action: AuditAction.DELETE,
      resource: "FinancialCategory",
      resourceId: id,
      actorUserId: principal.userId,
      metadata: { softDelete: true },
    });

    refreshCategoriesCache();
    return { id };
  });
}

/* -------------------------------------------------------------------------- */
/* TRANSAKSI                                                                  */
/* -------------------------------------------------------------------------- */

export async function createFinancialTransactionAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("financial-transaction.create", async () => {
    const principal = await requirePermission("finance:create");
    const input = parseOrThrow(financialTransactionCreateSchema, raw);

    const created = await db.$transaction(async (tx) => {
      return tx.financialTransaction.create({
        data: {
          date: parseLocalDate(String(input.date)),
          amount: input.amount,
          type: input.type,
          categoryId: input.categoryId,
          description: input.description ?? undefined,
          proofFileId: input.proofFileId ?? undefined,
          createdById: principal.userId,
        },
        select: { id: true },
      });
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "FinancialTransaction",
      resourceId: created.id,
      actorUserId: principal.userId,
      metadata: {
        date: input.date,
        amount: input.amount.toString(),
        type: input.type,
        categoryId: input.categoryId,
      },
    });

    refreshTransactionsCache();
    return created;
  });
}

export async function updateFinancialTransactionAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const schema = financialTransactionUpdateSchema;
  return runAction("financial-transaction.update", async () => {
    const principal = await requirePermission("finance:create");
    const input = parseOrThrow(schema, raw);

    const existing = await db.financialTransaction.findUnique({
      where: { id: input.id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Transaksi tidak ditemukan.");

    const updated = await db.$transaction(async (tx) => {
      return tx.financialTransaction.update({
        where: { id: existing.id },
        data: {
          ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
          ...(input.amount !== undefined ? { amount: input.amount } : {}),
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.proofFileId !== undefined
            ? { proofFileId: input.proofFileId }
            : {}),
        },
        select: { id: true },
      });
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "FinancialTransaction",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: {
        fields: Object.keys(input).filter((key) => key !== "id"),
        amount: input.amount?.toString(),
      },
    });

    refreshTransactionsCache();
    return updated;
  });
}

export async function deleteFinancialTransactionAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("financial-transaction.delete", async () => {
    const principal = await requirePermission("finance:delete");
    const { id } = parseOrThrow(idSchema, raw);

    const existing = await db.financialTransaction.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Transaksi tidak ditemukan.");

    const result = await db.$transaction(async (tx) => {
      return tx.financialTransaction.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
    if (result.count === 0) throw notFound("Transaksi tidak ditemukan.");

    await writeAudit({
      action: AuditAction.DELETE,
      resource: "FinancialTransaction",
      resourceId: id,
      actorUserId: principal.userId,
      metadata: { softDelete: true },
    });

    refreshTransactionsCache();
    return { id };
  });
}

/* -------------------------------------------------------------------------- */
/* LAPORAN                                                                    */
/* -------------------------------------------------------------------------- */

export async function createFinancialReportAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("financial-report.create", async () => {
    const principal = await requirePermission("finance:create");
    const input = parseOrThrow(financialReportCreateSchema, raw);

    const created = await db.$transaction(async (tx) => {
      return tx.financialReport.create({
        data: {
          periodYear: input.periodYear,
          periodMonth: input.periodMonth ?? null,
          periodType: input.periodType,
          visibility: input.visibility,
          documentFileId: input.documentFileId ?? undefined,
          createdById: principal.userId,
        },
        select: { id: true },
      });
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "FinancialReport",
      resourceId: created.id,
      actorUserId: principal.userId,
      metadata: {
        periodYear: input.periodYear,
        periodMonth: input.periodMonth ?? null,
        periodType: input.periodType,
        visibility: input.visibility,
      },
    });

    refreshReportsCache();
    return created;
  });
}

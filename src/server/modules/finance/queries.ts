/**
 * Query keuangan untuk dashboard admin & pengurus.
 *
 * Prinsip:
 * - Semua query menyaring `deleted_at IS NULL` (soft delete).
 * - Jumlah uang pakai `BigInt` (rupiah penuh), tidak pernah Float.
 * - `unstable_cache` dengan tag `finance-*` agar dashboard bisa
 *   `revalidateTag` setelah mutasi.
 */
import { unstable_cache } from "next/cache";
import { db } from "@/server/db/prisma";
import {
  FinancialTransactionType,
} from "@/generated/prisma/enums";
import { formatRupiah } from "@/shared/utils/format";

export const FINANCE_TAGS = {
  categories: "finance-categories",
  transactions: "finance-transactions",
  reports: "finance-reports",
} as const;

/** Daftar kategori keuangan (aktif). */
export const listFinancialCategories = unstable_cache(
  async (): Promise<
    { id: string; name: string; slug: string; type: string }[]
  > => {
    const rows = await db.financialCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, type: true },
    });
    return rows;
  },
  ["public", "finance", "categories"],
  { revalidate: 3600, tags: [FINANCE_TAGS.categories] },
);

type FinancialTransactionWhere = {
  deletedAt: null;
  description?: { contains: string };
  type?: "INCOME" | "EXPENSE";
  categoryId?: string;
  date?: { gte?: Date; lte?: Date };
};

/** Daftar transaksi keuangan dengan pagination & filter. */
export async function listFinancialTransactions({
  page = 1,
  size = 20,
  q,
  type,
  categoryId,
  dateFrom,
  dateTo,
}: {
  page?: number;
  size?: number;
  q?: string;
  type?: FinancialTransactionType;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const skip = (page - 1) * size;

  const where: FinancialTransactionWhere = { deletedAt: null };

  if (q) {
    where.description = { contains: q };
  }
  if (type) {
    where.type = type;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo);
  }

  const [items, total] = await Promise.all([
    db.financialTransaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip,
      take: size,
      select: {
        id: true,
        date: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true,
        category: { select: { id: true, name: true, slug: true, type: true } },
        createdBy: { select: { id: true, email: true } },
      },
    }),
    db.financialTransaction.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      amountFormatted: formatRupiah(item.amount as bigint),
    })),
    total,
    page,
    size,
    pages: Math.ceil(total / size),
  };
}

export type FinancialTransactionListItem = Awaited<
  ReturnType<typeof listFinancialTransactions>
>["items"][number];

/** Satu transaksi lengkap. */
export async function getFinancialTransaction(id: string) {
  return db.financialTransaction.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      date: true,
      amount: true,
      type: true,
      description: true,
      category: { select: { id: true, name: true, slug: true, type: true } },
      proofFile: {
        select: { id: true, fileName: true, mimeType: true, accessLevel: true },
      },
      createdBy: { select: { id: true, email: true } },
      createdAt: true,
    },
  });
}

/** Ringkasan pemasukan / pengeluaran / saldo untuk periode. */
export async function getFinancialSummary({
  year,
  month,
}: { year: number; month?: number }) {
  const where: Record<string, unknown> = {
    deletedAt: null,
    date: {
      gte: new Date(year, (month ?? 1) - 1, 1),
      lt: new Date(year, (month ?? 12), 1),
    },
  };

  const [income, expense] = await Promise.all([
    db.financialTransaction.aggregate({
      where: { ...where, type: FinancialTransactionType.INCOME },
      _sum: { amount: true },
    }),
    db.financialTransaction.aggregate({
      where: { ...where, type: FinancialTransactionType.EXPENSE },
      _sum: { amount: true },
    }),
  ]);

  const incomeTotal = (income._sum.amount as bigint | null) ?? BigInt(0);
  const expenseTotal = (expense._sum.amount as bigint | null) ?? BigInt(0);

  return {
    year,
    month: month ?? null,
    incomeTotal,
    incomeFormatted: formatRupiah(incomeTotal),
    expenseTotal,
    expenseFormatted: formatRupiah(expenseTotal),
    balance: incomeTotal - expenseTotal,
    balanceFormatted: formatRupiah(incomeTotal - expenseTotal),
  };
}

/** Daftar laporan keuangan agregat. */
export const listFinancialReports = unstable_cache(
  async ({
    page = 1,
    size = 20,
  }: { page?: number; size?: number } = {}) => {
    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      db.financialReport.findMany({
        where: { deletedAt: null },
        orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
        skip,
        take: size,
        select: {
          id: true,
          periodYear: true,
          periodMonth: true,
          periodType: true,
          incomeTotal: true,
          expenseTotal: true,
          balance: true,
          visibility: true,
          createdAt: true,
          createdBy: { select: { id: true, email: true } },
        },
      }),
      db.financialReport.count({ where: { deletedAt: null } }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        incomeFormatted: formatRupiah(item.incomeTotal as bigint),
        expenseFormatted: formatRupiah(item.expenseTotal as bigint),
        balanceFormatted: formatRupiah(item.balance as bigint),
      })),
      total,
      page,
      size,
      pages: Math.ceil(total / size),
    };
  },
  ["public", "finance", "reports"],
  { revalidate: 900, tags: [FINANCE_TAGS.reports] },
);

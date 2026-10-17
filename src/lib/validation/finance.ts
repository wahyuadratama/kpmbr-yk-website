/**
 * Skema validasi modul keuangan.
 *
 * Prinsip:
 * - Nilai enum diambil dari enum Prisma sehingga daftar putih selalu sinkron
 *   dengan database.
 * - `amount` disimpan sebagai `BigInt` (rupiah penuh), TIDAK boleh Float.
 * - Setiap transaksi dan laporan WAJIB memiliki `createdById` (dari session,
 *   tidak dari input klien).
 */
import { z } from "zod";
import {
  FinancialReportType,
  FinancialTransactionType,
  FileAccessLevel,
} from "@/generated/prisma/enums";
import {
  cuidSchema,
  isoDateSchema,
  shortText,
} from "./common";

/** Jumlah uang dalam rupiah (bulat, non-negatif). Diterima sebagai string
 *  dari form agar angka besar tidak hilang presisi di JavaScript Number. */
const amountSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Jumlah harus berupa angka bulat tanpa koma atau titik.")
  .transform((v) => BigInt(v));

export const financialCategoryCreateSchema = z.object({
  name: shortText(191),
  slug: z
    .string()
    .trim()
    .min(1, "Slug wajib diisi.")
    .max(96, "Slug terlalu panjang.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug hanya boleh huruf kecil, angka, dan tanda hubung.",
    ),
  type: z.enum(FinancialTransactionType).default(FinancialTransactionType.EXPENSE),
});
export type FinancialCategoryCreateInput = z.infer<
  typeof financialCategoryCreateSchema
>;

export const financialCategoryUpdateSchema = financialCategoryCreateSchema
  .partial()
  .extend({ id: cuidSchema });
export type FinancialCategoryUpdateInput = z.infer<
  typeof financialCategoryUpdateSchema
>;

export const financialTransactionCreateSchema = z.object({
  date: isoDateSchema,
  amount: amountSchema,
  type: z.enum(FinancialTransactionType).default(FinancialTransactionType.EXPENSE),
  categoryId: cuidSchema,
  description: z.string().trim().max(255, "Deskripsi maksimal 255 karakter.").optional().default(""),
  proofFileId: cuidSchema.nullish(),
});
export type FinancialTransactionCreateInput = z.infer<
  typeof financialTransactionCreateSchema
>;

export const financialTransactionUpdateSchema = financialTransactionCreateSchema
  .partial()
  .extend({ id: cuidSchema });
export type FinancialTransactionUpdateInput = z.infer<
  typeof financialTransactionUpdateSchema
>;

export const financialReportCreateSchema = z.object({
  periodYear: z.coerce.number().int().min(1900).max(2100),
  periodMonth: z.coerce.number().int().min(1).max(12).optional().nullish(),
  periodType: z.enum(FinancialReportType).default(FinancialReportType.MONTHLY),
  visibility: z.enum(FileAccessLevel).default(FileAccessLevel.MEMBER_ONLY),
  documentFileId: cuidSchema.nullish(),
});
export type FinancialReportCreateInput = z.infer<
  typeof financialReportCreateSchema
>;

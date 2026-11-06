/**
 * Skema validasi dokumen arsip organisasi (Stage 7).
 *
 * Prinsip:
 * - Nilai enum diambil dari enum Prisma sehingga daftar putih selalu sinkron
 *   dengan database.
 * - `fileId` diambil dari file yang sudah diunggah lewat `/api/files`.
 */
import { z } from "zod";
import { DocumentCategory, FileAccessLevel } from "@/generated/prisma/enums";
import { cuidSchema, shortText } from "./common";

export const organizationDocumentCreateSchema = z.object({
  title: shortText(191),
  slug: z
    .string()
    .trim()
    .min(1, "Slug wajib diisi.")
    .max(96, "Slug terlalu panjang.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug hanya boleh huruf kecil, angka, dan tanda hubung.",
    ),
  category: z.enum(DocumentCategory),
  description: z.string().trim().max(1_000, "Deskripsi maksimal 1.000 karakter.").optional().default(""),
  fileId: cuidSchema,
  accessLevel: z.enum(FileAccessLevel).default(FileAccessLevel.MEMBER_ONLY),
});
export type OrganizationDocumentCreateInput = z.infer<
  typeof organizationDocumentCreateSchema
>;

export const organizationDocumentUpdateSchema = organizationDocumentCreateSchema
  .partial()
  .extend({ id: cuidSchema });
export type OrganizationDocumentUpdateInput = z.infer<
  typeof organizationDocumentUpdateSchema
>;

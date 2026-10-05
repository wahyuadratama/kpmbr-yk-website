/**
 * Skema validasi CMS.
 *
 * Dipakai oleh server action pembuatan/pembaruan konten.
 * Nilai enum diambil dari enum Prisma sehingga daftar putih selalu sinkron
 * dengan database.
 */
import { z } from "zod";
import {
  AnnouncementAudience,
  AnnouncementPriority,
  EventStatus,
  NewsStatus,
  ProgramStatus,
} from "@/generated/prisma/enums";
import {
  accentSchema,
  cuidSchema,
  isoDateSchema,
  isoDateTimeSchema,
  longText,
  shortText,
  slugSchema,
} from "./common";

/** Batas aman untuk `body`: cukup panjang, tidak-Za-bomb. */
const bodySchema = z
  .string()
  .trim()
  .min(20, "Isi berita terlalu pendek.")
  .max(60_000, "Isi berita terlalu panjang (maksimal 60.000 karakter).");

export const newsCreateSchema = z.object({
  title: shortText(191),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().max(255, "Ringkasan maksimal 255 karakter.").optional().default(""),
  body: bodySchema,
  categoryId: cuidSchema.nullish(),
  coverAccent: accentSchema.default("brand"),
  isFeatured: z.coerce.boolean().default(false),
  status: z.enum(NewsStatus).default(NewsStatus.DRAFT),
});
export type NewsCreateInput = z.infer<typeof newsCreateSchema>;

export const newsUpdateSchema = newsCreateSchema.partial().extend({
  id: cuidSchema,
});
export type NewsUpdateInput = z.infer<typeof newsUpdateSchema>;

export const eventCreateSchema = z
  .object({
    title: shortText(191),
    slug: slugSchema.optional(),
    description: longText(5_000),
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema.optional().default(""),
    location: shortText(191),
    organizer: shortText(191),
    status: z.enum(EventStatus).default(EventStatus.TERJADWAL),
  })
  .refine(
    (v) => !v.endsAt || Date.parse(v.endsAt) > Date.parse(v.startsAt),
    "Waktu selesai harus setelah waktu mulai.",
  );
export type EventCreateInput = z.infer<typeof eventCreateSchema>;

/** Progres hanya boleh nilai kelipatan 25 — ditegakkan di server. */
export const PROGRESSION_STEPS = [0, 25, 50, 75, 100] as const;

export const programCreateSchema = z.object({
  name: shortText(191),
  slug: slugSchema.optional(),
  description: longText(5_000),
  objective: longText(5_000),
  divisionName: shortText(191),
  picMemberId: cuidSchema.nullish(),
  status: z.enum(ProgramStatus).default(ProgramStatus.DIRANCANG),
  progress: z
    .number()
    .int("Progres harus bilangan bulat.")
    .refine((v) => PROGRESSION_STEPS.includes(v as (typeof PROGRESSION_STEPS)[number]), {
      message: "Progres hanya boleh 0, 25, 50, 75, atau 100.",
    })
    .default(0),
  startDate: isoDateSchema.optional().default(""),
  endDate: isoDateSchema.optional().default(""),
});
export type ProgramCreateInput = z.infer<typeof programCreateSchema>;

export const announcementCreateSchema = z.object({
  title: shortText(191),
  body: bodySchema,
  priority: z.enum(AnnouncementPriority).default(AnnouncementPriority.NORMAL),
  audience: z.enum(AnnouncementAudience).default(AnnouncementAudience.PUBLIC),
  publishedAt: isoDateTimeSchema.optional().default(""),
  expiresAt: isoDateTimeSchema.optional().default(""),
});
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;

export const contentUpdateSchema = z.object({
  key: z.string().trim().min(1).max(64),
  title: shortText(191),
  body: bodySchema,
  isPublished: z.coerce.boolean().default(false),
});
export type ContentUpdateInput = z.infer<typeof contentUpdateSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(191).pipe(z.email("Format email tidak valid.")),
  password: z.string().min(1, "Password wajib diisi.").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;
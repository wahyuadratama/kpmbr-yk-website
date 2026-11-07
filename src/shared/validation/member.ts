/**
 * Skema validasi untuk pengeditan profil anggota sendiri.
 * Semua input dari klien wajib lewat sini sebelum menyentuh database.
 */
import { z } from "zod";
import { Gender } from "@/generated/prisma/enums";

export const memberProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi.")
    .max(191, "Maksimal 191 karakter."),
  nickname: z
    .string()
    .trim()
    .max(64, "Maksimal 64 karakter.")
    .optional()
    .or(z.literal("")),
  gender: z.nativeEnum(Gender).optional(),
  phone: z
    .string()
    .trim()
    .max(32, "Maksimal 32 karakter.")
    .regex(/^[0-9+\-\s()]*$/, "Format nomor HP tidak valid.")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .max(100, "Maksimal 100 karakter.")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(2000, "Maksimal 2.000 karakter.")
    .optional()
    .or(z.literal("")),
  addressDetail: z
    .string()
    .trim()
    .max(255, "Maksimal 255 karakter.")
    .optional()
    .or(z.literal("")),
  isDirectoryVisible: z.boolean().optional(),
});

/** Schema pengajuan data anggota (self-service, akun belum terhubung). */
export const memberApplicationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi.")
    .max(191, "Maksimal 191 karakter."),
  nickname: z.string().trim().max(64, "Maksimal 64 karakter.").optional().or(z.literal("")),
  gender: z.nativeEnum(Gender).optional(),
  phone: z
    .string()
    .trim()
    .max(32, "Maksimal 32 karakter.")
    .regex(/^[0-9+\-\s()]*$/, "Format nomor HP tidak valid.")
    .optional()
    .or(z.literal("")),
  city: z.string().trim().max(100, "Maksimal 100 karakter.").optional().or(z.literal("")),
  bio: z.string().trim().max(2000, "Maksimal 2.000 karakter.").optional().or(z.literal("")),
  addressDetail: z.string().trim().max(255, "Maksimal 255 karakter.").optional().or(z.literal("")),
});

export type MemberApplicationInput = z.infer<typeof memberApplicationSchema>;

export type MemberProfileInput = z.infer<typeof memberProfileSchema>;

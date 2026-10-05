/**
 * Skema validasi yang dipakai bersama (Zod).
 *
 * Semua input dari klien — form, search params, body route handler — WAJIB
 * lewat skema di sini sebelum menyentuh database. Tidak ada opsi "cukup cek
 * di frontend".
 */
import { z } from "zod";

/** Slug URL. Konsisten dengan `slugify()` di `src/lib/utils/format.ts`. */
export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug wajib diisi.")
  .max(96, "Slug terlalu panjang.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung.");

/** Id Prisma (cuid). Mencegah id acak membanjiri query. */
export const cuidSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+$/i, "Id tidak valid.");

export const emailSchema = z.email("Format email tidak valid.").max(191);

/** Password: panjang minimum realistis, maksimum mencegah payload raksasa. */
export const passwordSchema = z
  .string()
  .min(12, "Password minimal 12 karakter.")
  .max(200, "Password terlalu panjang.");

/** Teks pendek (judul, nama). */
export const shortText = (max = 191) =>
  z.string().trim().min(1, "Wajib diisi.").max(max, `Maksimal ${max} karakter.`);

/** Teks panjang. */
export const longText = (max = 20_000) =>
  z.string().trim().min(1, "Wajib diisi.").max(max, `Maksimal ${max} karakter.`);

/** Tanggal dari `<input type="date">` → `yyyy-mm-dd`. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus format YYYY-MM-DD.");

/** Tanggal dari `<input type="datetime-local">` → ISO tanpa zona. */
export const isoDateTimeSchema = z
  .string()
  .min(1, "Wajib diisi.")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Tanggal tidak valid.");

/**
 * Pagination. `page` mulai dari 1; `size` dibatasi agar klien tidak
 * meminta 100.000 baris dalam satu request.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  size: z.coerce.number().int().min(1).max(50).default(12),
});
export type Pagination = z.infer<typeof paginationSchema>;

export function skipFor(page: number, size: number): number {
  return (page - 1) * size;
}

/** Token warna cover — daftar putih, bukan string bebas. */
export const accentSchema = z.enum(["brand", "terra", "info", "success", "brandInfo", "terraInfo"]);

/**
 * Tolak nilai yang_CONTROL di luar daftar putih.
 * Import/enum Prisma memang dipakai untuk daftar putih pada kasus tertentu,
 * tapi string bebas dari klien tidak pernah diteruskan ke query.
 */
export function oneOfEnum<T extends readonly [string, ...string[]]>(
  values: T,
  fallback: T[number],
): (value: unknown) => T[number] {
  return (value) => (values.includes(value as T[number]) ? (value as T[number]) : fallback);
}
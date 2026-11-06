/**
 * Rate limiting berbasis database (MySQL) sebagai pengganti in-memory Map.
 *
 * Prinsip:
 * - State tersimpan di tabel `rate_limit_buckets`, sehingga tidak hilang saat
 *   restart dan dapat dibagi antar instance (jika perlu di depan).
 * - Fixed window: setiap kunci (`key`) memiliki window waktu; bila window
 *   sudah lewat, buat bucket baru.
 * - Digunakan untuk endpoint sensitif: login dan unduh file.
 */
import { db } from "@/server/db/prisma";
import type { RateLimitResult } from "@/server/rate-limit";

/** Ambil atau buat bucket rate limit untuk `key` dalam window `windowMs`. */
export async function consumeDbRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<RateLimitResult> {
  const resetAt = new Date(now + windowMs);

  // Coba temukan bucket yang masih aktif (resetAt di masa depan).
  const existing = await db.rateLimitBucket.findUnique({
    where: { key },
  });

  if (!existing || existing.resetAt.getTime() <= now) {
    // Buat atau perbarui bucket baru untuk window ini.
    await db.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt },
    });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: 0,
      limit,
    };
  }

  // Masih dalam window aktif: tambah hitungan.
  const updated = await db.rateLimitBucket.update({
    where: { key },
    data: { count: existing.count + 1 },
  });

  const allowed = updated.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - updated.count),
    retryAfterSeconds: allowed
      ? 0
      : Math.ceil((updated.resetAt.getTime() - now) / 1000),
    limit,
  };
}

/** Bersihkan bucket yang telah kedaluwarsa agar tabel tidak tumbuh tanpa batas. */
export async function sweepDbRateLimits(now = Date.now()): Promise<void> {
  await db.rateLimitBucket.deleteMany({
    where: { resetAt: { lte: new Date(now) } },
  });
}

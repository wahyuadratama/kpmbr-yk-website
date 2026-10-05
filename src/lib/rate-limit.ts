/**
 * Rate limiting in-memory (fixed window) untuk endpoint rawan abuse.
 *
 * Keterbatasan yang DISENGAJA dan terdokumentasi:
 * - State disimpan di `globalThis`, jadi **hilang saat restart** dan
 *   **tidak dibagi antar instance**. Untuk KPMBR-YK (satu instance, traffic
 *   kecil) ini cukup. Kalau nanti multi-instance, ganti ke tabel MySQL
 *   `rate_limit_buckets` atau Redis — JANGAN menambah Redis hanya untuk ini.
 * - Limit per-IP_FROM header proxy bisa dilewati bila aplikasi dibuka tanpa
 *   reverse proxy. Karena itu endpoint login juga dilindungi lockout
 *   per-akun di `src/lib/auth/lockout.ts` yang tidak bergantung pada IP.
 */

type Bucket = { count: number; resetAt: number };

const globalForLimit = globalThis as unknown as {
  __kpmbrRateBuckets?: Map<string, Bucket>;
};

const buckets: Map<string, Bucket> =
  globalForLimit.__kpmbrRateBuckets ?? (globalForLimit.__kpmbrRateBuckets = new Map());

/** Buang bucket kedaluwarsa agar Map tidak tumbuh tanpa batas. */
function sweep(now: number): void {
  if (buckets.size < 512) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Detik sampai jendela berikutnya terbuka. */
  retryAfterSeconds: number;
  limit: number;
};

/**
 * KunciACDUA lapis: IP **dan** email. Satu penyerang tidak bisa melewati
 * limit dengan mengacak email, dan sebaliknya (spray attack ke banyak email
 * dari satu IP tetap tertahan).
 */
export function checkLoginRateLimit(
  ip: string | null,
  email: string,
  now = Date.now(),
): RateLimitResult {
  const emailKey = email.trim().toLowerCase().slice(0, 191);
  const ipResult = consume(`login:ip:${ip ?? "unknown"}`, 10, 15 * 60_000, now);
  const emailResult = consume(`login:email:${emailKey}`, 5, 15 * 60_000, now);
  const allowed = ipResult.allowed && emailResult.allowed;
  const retryAfterSeconds = Math.max(
    ipResult.allowed ? 0 : ipResult.retryAfterSeconds,
    emailResult.allowed ? 0 : emailResult.retryAfterSeconds,
  );
  const remaining = Math.min(ipResult.remaining, emailResult.remaining);
  if (!allowed) return { allowed, remaining, retryAfterSeconds, limit: 5 };
  return { allowed, remaining, retryAfterSeconds: 0, limit: 5 };
}

/** Limit umum untuk mutasi sensitif (upload, publish, dsb). */
export function checkRateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
  key: string,
  now = Date.now(),
): RateLimitResult {
  return consume(`${bucket}:${key}`, limit, windowMs, now);
}

function consume(
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): RateLimitResult {
  sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterSeconds: 0,
      limit,
    };
  }
  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
    limit,
  };
}

/** Hanya untuk tes — memastikan state tidak bocor antar test. */
export function __resetRateLimits(): void {
  buckets.clear();
}
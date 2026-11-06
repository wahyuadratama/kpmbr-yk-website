/**
 * Lockout akun berbasis database.
 *
 * Menyerap `users.failed_login_attempts` dan `users.locked_until`. Berbeda
 * dengan rate limit per-IP di `src/lib/rate-limit.ts`, mekanisme ini
 * menempel pada AKUN, sehingga tidak bisa dilewati dengan mengganti IP dan
 * tetap berlaku setelah restart server.
 *
 * Aturan:
 * - `MAX_ATTEMPTS` kegagalan berurutan → akun dikunci.
 * - Kunci yang sudah lewat → `locked_until` dibersihkan saat percobaan login
 *   berikutnya (dan attempt direset).
 * - Query memakai `updateMany` bersyarat sehingga operasi ini aman dari race
 *   antar request paralel.
 */
import { db } from "@/lib/db/prisma";

export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export function isLocked(lockedUntil: Date | null, now = new Date()): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

export function secondsUntilUnlock(lockedUntil: Date | null, now = new Date()): number {
  if (lockedUntil === null || !isLocked(lockedUntil, now)) return 0;
  return Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000);
}

/**
 * Catat satu kegagalan login dan kunci akun bila sudah mencapai ambang.
 * Mengembalikan waktu kunci bila terjadi, atau `null` bila belum terkunci.
 *
 * Satu operasi `update` atomik dengan kondisi `failed_login_attempts` di bawah
 * ambang. Dengan begitu:
 * - tidak ada read-then-write yang bisa race antar request paralel;
 * - begitu ambang tercapai, `locked_until` terisi pada operasi yang sama;
 * - penghitung direset ke 0 agar kunci berikutnya dihitung dari nol.
 */
export async function registerFailedLogin(userId: string, now = new Date()): Promise<Date | null> {
  const attempts = await db.user.updateMany({
    where: { id: userId, failedLoginAttempts: { lt: MAX_ATTEMPTS } },
    data: { failedLoginAttempts: { increment: 1 } },
  });
  if (attempts.count === 0) return null;

  const row = await db.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  });
  if (!row || row.failedLoginAttempts < MAX_ATTEMPTS) return null;

  const lockedUntil = new Date(now.getTime() + LOCK_MINUTES * 60_000);
  // `updateMany` bersyarat: hanya satu request yang memenuhi ambang, dan
  // penghitung direset ke 0 supaya tidak ada request paralel yang mengunci ulang.
  const locked = await db.user.updateMany({
    where: { id: userId, failedLoginAttempts: { gte: MAX_ATTEMPTS } },
    data: { lockedUntil, failedLoginAttempts: 0 },
  });
  return locked.count > 0 ? lockedUntil : null;
}

/** Reset penghitung setelah login berhasil. */
export async function clearFailedLogins(userId: string): Promise<void> {
  await db.user.updateMany({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}

/** Buka kunci manual oleh admin. */
export async function unlockAccount(userId: string): Promise<void> {
  await db.user.updateMany({
    where: { id: userId },
    data: { lockedUntil: null, failedLoginAttempts: 0 },
  });
}
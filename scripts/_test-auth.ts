import { db } from "@/lib/db/prisma";
import { checkLoginRateLimit, __resetRateLimits } from "@/lib/rate-limit";
import { isLocked, secondsUntilUnlock } from "@/lib/auth/lockout";

/**
 * Tes integrasi backend: db, lockout, dan rate-limit (memory).
 *
 * Menguji bahwa batasan dan logika di luar Next.js request life cycle
 * bekerja semestinya.
 */
async function testAuthRules() {
  const email = "anggota@kpmbr-yk.local";
  const ip = "127.0.0.1";

  // 1. Dapatkan userId.
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, lockedUntil: true, failedLoginAttempts: true },
  });
  if (!user) throw new Error("Akun dev tidak ditemukan — pastikan db:seed sudah jalan");

  // 2. Pastikan akun tidak terkunci.
  if (isLocked(user.lockedUntil)) {
    await db.user.update({
      where: { id: user.id },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    });
  }

  // 3. Test Rate Limiter per-IP (5 percobaan per menit).
  __resetRateLimits();
  for (let i = 1; i <= 5; i++) {
    const res = checkLoginRateLimit(ip, "does.not.exist@kpmbr-yk.local");
    if (!res.allowed) throw new Error(`Limit terpicu terlalu cepat pada percobaan ${i}`);
  }
  const blocked = checkLoginRateLimit(ip, "does.not.exist@kpmbr-yk.local");
  if (blocked.allowed) throw new Error("Rate limit gagal memblokir IP setelah batas terlampaui.");

  // 4. Rate limit email juga jalan walau IP berbeda.
  __resetRateLimits();
  for (let i = 1; i <= 5; i++) {
    checkLoginRateLimit(`10.0.0.${i}`, email);
  }
  const emailBlocked = checkLoginRateLimit("10.0.0.99", email);
  if (emailBlocked.allowed) throw new Error("Rate limit email gagal memblokir.");

  // 5. Database Lockout (5 kali salah sandi berturut-turut pada akun yang ADA).
  const { registerFailedLogin, clearFailedLogins } = await import("@/lib/auth/lockout");

  await clearFailedLogins(user.id);
  for (let i = 1; i <= 4; i++) {
    const lockedUntil = await registerFailedLogin(user.id);
    if (lockedUntil !== null) throw new Error(`Akun terkunci terlalu cepat pada kegagalan ${i}`);
  }
  const lockedUntil = await registerFailedLogin(user.id);
  if (lockedUntil === null) throw new Error("Akun gagal terkunci setelah batas kegagalan dicapai.");

  const lockedAfter = await db.user.findUnique({
    where: { id: user.id },
    select: { lockedUntil: true, failedLoginAttempts: true },
  });
  if (!isLocked(lockedAfter?.lockedUntil ?? null)) throw new Error("Kunci DB tidak tersimpan.");

  console.log("PASS: Integrasi auth/limit/lockout DB lulus uji.");
}

testAuthRules().catch(async (e) => {
  console.error("FAIL:", e);
  await db.$disconnect();
  process.exit(1);
}).then(() => db.$disconnect());
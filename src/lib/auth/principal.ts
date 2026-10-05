/**
 * Pembacaan identitas pemanggil dari database.
 *
 * File ini TIDAK memakai `server-only` dengan sengaja: logika ini adalah inti
 * dari keputusan otorisasi, jadi harus bisa dipanggil langsung oleh
 * `scripts/test-authorization.ts` di luar HTTP server React. Yang diproteksi
 * `guards.ts` — pemanggilan `auth()` dan `redirect()` — tidak ikut di sini.
 *
 * Prinsip yang dijaga:
 * - Role SELALU dibaca dari baris `users`, tidak pernah dari cookie, JWT,
 *   query string, atau body form.
 * - Akun yang dihapus (soft), dinonaktifkan, atau tidak ada TIDAK punya akses.
 *   Mengganti role atau menonaktifkan akun langsung berlaku pada request
 *   berikutnya tanpa perlu menunggu cookie kedaluwarsa.
 */
import { db } from "@/lib/db/prisma";
import { UserStatus } from "@/generated/prisma/enums";
import type { Role } from "@/lib/auth/permissions";

export type Principal = {
  userId: string;
  email: string;
  role: Role;
  status: UserStatus;
  /** `member.id` milik user ini, atau null bila akun belum punya profil. */
  memberId: string | null;
};

/**
 * Baca principal berdasarkan `user.id`.
 *
 * Mengembalikan `null` bila `userId` kosong, akun tidak ada, sudah soft-delete,
 * atau statusnya bukan `ACTIVE`. Tidak ada nilai default yang "mengizinkan":
 * kondisi yang tidak dikenali selalu berarti tanpa akses.
 */
export async function readPrincipal(userId: string | null | undefined): Promise<Principal | null> {
  if (typeof userId !== "string" || userId.length === 0) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      deletedAt: true,
      member: { select: { id: true } },
    },
  });

  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role as Role,
    status: user.status,
    memberId: user.member?.id ?? null,
  };
}

/** Daftar user id yang sedang terkunci — dipakai tes dan operasi pemeliharaan. */
export async function isUserLocked(userId: string, at: Date = new Date()): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });
  return (user?.lockedUntil?.getTime() ?? 0) > at.getTime();
}

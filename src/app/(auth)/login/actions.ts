"use server";

/**
 * Aksi login & logout.
 *
 * Login memakai `signIn(..., { redirect: false })` lalu redirect manual,
 * supaya kegagalan bisa ditangkap dan pesan generik ditampilkan tanpa
 * membocorkan apakah sebuah email terdaftar. Kriteria suksesnya dijelaskan di
 * `loginAction`.
 */
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/server/auth/config";
import { db } from "@/server/db/prisma";
import { runAction, type ActionResult } from "@/server/actions/result";
import { parseOrThrow } from "@/shared/validation/parse";
import { loginSchema } from "@/shared/validation/cms";
import { isLocked, secondsUntilUnlock } from "@/server/auth/lockout";
import { safeNextPath } from "@/server/auth/portals";
import type { Role } from "@/server/auth/permissions";
import { UserStatus } from "@/generated/prisma/enums";
import { AppError } from "@/shared/errors";

/** Pesan sengaja sama untuk semua kegagalan agar tidak jadi oracle akun. */
const GENERIC = "Email atau password salah, atau akun tidak aktif.";

/**
 * Login.
 *
 * Dua hal yang mudah salah di sini, keduanya sudah pernah terjadi:
 *
 * 1. Nilai balik `signIn()` BUKAN objek `{ ok }`. Auth.js v5 mengembalikan
 *    string URL tujuan redirect. Membaca `result.ok` selalu menghasilkan
 *    `undefined`, sehingga login yang sukses tetap dianggap gagal.
 *
 * 2. `auth()` TIDAK bisa dipakai untuk mengecek hasil login di aksi yang sama.
 *    `signIn()` menuliskan cookie lewat `cookies().set()`, dan cookie itu baru
 *    berlaku pada request BERIKUTNYA. `auth()` pada request yang sama membaca
 *    cookie lama, jadi selalu melihat sesi kosong meski login berhasil.
 *
 * Karena itu kriteria suksesnya adalah `signIn()` tidak melempar. Auth.js melempar
 * `CredentialsSignin` atau `AccessDenied` saat kredensial ditolak
 * (`@auth/core/lib/index.js`: `if (isAuthError && isRaw && !isRedirect) throw`).
 *
 * Role dibaca langsung dari baris `users`, bukan dari cookie — sesuai prinsip
 * bahwa keputusan otorisasi selalu bersumber dari database.
 */
export async function loginAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ next: string }>> {
  const outcome = await runAction("auth.login", async () => {
    const input = parseOrThrow(loginSchema, {
      email: formData.get("email"),
      password: formData.get("password"),
    });

    try {
      await signIn("credentials", {
        email: input.email,
        password: input.password,
        redirect: false,
      });
    } catch {
      // Kredensial ditolak. Pesan tentang akun terkunci hanya ditampilkan
      // bila akun itu memang sedang terkunci; email yang dikunci sudah
      // diketahui pemiliknya, untuk email lain pesannya tetap generik.
      const locked = await db.user.findUnique({
        where: { email: input.email },
        select: { lockedUntil: true },
      });
      if (locked && isLocked(locked.lockedUntil)) {
        const minutes = Math.max(1, Math.ceil(secondsUntilUnlock(locked.lockedUntil) / 60));
        throw new AppError("RATE_LIMITED", `AKUN_TERKUNCI:${minutes}`);
      }
      throw new AppError("UNAUTHORIZED", GENERIC);
    }

    const user = await db.user.findUnique({
      where: { email: input.email },
      select: { role: true, status: true },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AppError("UNAUTHORIZED", GENERIC);
    }

    // ANGGOTA, PENGURUS, dan ALUMNI tidak boleh diarahkan ke `/admin`.
    return { next: safeNextPath(formData.get("next"), user.role as Role) };
  });

  if (!outcome.ok) {
    if (
      outcome.error.code === "RATE_LIMITED" &&
      outcome.error.message.startsWith("AKUN_TERKUNCI:")
    ) {
      const minutes = outcome.error.message.split(":")[1] ?? "15";
      return {
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: `Akun terkunci sementara. Coba lagi dalam ${minutes} menit.`,
        },
      };
    }
    if (outcome.error.code === "VALIDATION_ERROR") return outcome;
    return { ok: false, error: { code: outcome.error.code, message: GENERIC } };
  }

  redirect(outcome.data.next);
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
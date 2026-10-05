"use server";

/**
 * Aksi login & logout.
 *
 * Login memakai `signIn(..., { redirect: false })` lalu redirect manual,
 * supaya kegagalan bisa ditangkap dan pesan generik ditampilkan tanpa
 * membocorkan apakah sebuah email terdaftar.
 */
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db/prisma";
import { runAction, type ActionResult } from "@/lib/actions/result";
import { parseOrThrow } from "@/lib/validation/parse";
import { loginSchema } from "@/lib/validation/cms";
import { isLocked, secondsUntilUnlock } from "@/lib/auth/lockout";
import { AppError } from "@/lib/errors";

/** Pesan sengaja sama untuk semua kegagalan agar tidak jadi oracle akun. */
const GENERIC = "Email atau password salah, atau akun tidak aktif.";

export async function loginAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ next: string }>> {
  const outcome = await runAction("auth.login", async () => {
    const input = parseOrThrow(loginSchema, {
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const nextRaw = formData.get("next");
    const next =
      typeof nextRaw === "string" && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
        ? nextRaw
        : "/admin";

    const result = await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirect: false,
    });

    if (!result?.ok) {
      // Pesan tentang akun terkunci hanya ditampilkan bila akun itu
      // memang sedang terkunci. Email yang dikunci sudah diketahui pemilik
      // akun; untuk email lain pesannya tetap generik.
      const user = await db.user.findUnique({
        where: { email: input.email },
        select: { lockedUntil: true },
      });
      if (user && isLocked(user.lockedUntil)) {
        const minutes = Math.max(1, Math.ceil(secondsUntilUnlock(user.lockedUntil) / 60));
        throw new AppError("RATE_LIMITED", `AKUN_TERKUNCI:${minutes}`);
      }
      throw new AppError("UNAUTHORIZED", GENERIC);
    }

    return { next };
  });

  if (!outcome.ok) {
    if (outcome.error.code === "RATE_LIMITED" && outcome.error.message.startsWith("AKUN_TERKUNCI:")) {
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
/**
 * Konfigurasi Auth.js v5.
 *
 * Keputusan penting:
 * - **JWT minimal.** Token hanya memuat `user.id` (`sub`). TIDAK memuat role,
 *   permission, atau data profil. Otorisasi selalu membaca ulang dari
 *   `getCurrentPrincipal()` (lihat `src/lib/auth/guards.ts`), yang tiap
 *   request query ke tabel `users`, sehingga:
 *     - perubahan role berlaku pada request berikutnya;
 *     - akun yang dinonaktifkan langsung kehilangan akses.
 * - Sesi database (`Session` model) TIDAK dipakai untuk kredensial, karena
 *   Auth.js hanya bisa membuat sesi DB untuk provider non-credentials.
 *   Tabel `sessions` tetap tersedia untuk lokalisasi logout.
 * - Login diverifikasi di `authorize()`: password di-hash bandingkan, status
 *   akun diperiksa, dan lockout ditegakkan.
 */
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { verifyPassword, fakeVerifyDelay } from "@/lib/auth/password";
import { isLocked, registerFailedLogin, clearFailedLogins } from "@/lib/auth/lockout";
import { consumeDbRateLimit } from "@/lib/rate-limit-db";
import { clientIpFrom, writeAudit } from "@/lib/audit";
import { AuditAction, UserStatus } from "@/generated/prisma/enums";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi.").max(200),
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      status: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  // Halaman login memakai Server Action, bukan endpoint Auth.js, agar pesan
  // error dapat ditampilkan dalam bentuk yang dikendalikan server.
  providers: [
    Credentials({
      name: "Kredensial",
      credentials: { email: {}, password: {} },
      authorize: async (raw, request) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip = clientIpFrom(new Headers(request?.headers ?? new Headers()));
        const ipLimit = await consumeDbRateLimit(`login:ip:${ip ?? "unknown"}`, 10, 15 * 60_000);
        const emailLimit = await consumeDbRateLimit(`login:email:${email.trim().toLowerCase()}`, 5, 15 * 60_000);
        if (!ipLimit.allowed || !emailLimit.allowed) {
          await writeAudit({
            action: AuditAction.LOGIN_FAILED,
            resource: "Auth",
            resourceId: email,
            metadata: { reason: "RATE_LIMITED", ip },
            ipAddress: ip,
          }).catch(() => undefined);
          return null;
        }

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            role: true,
            status: true,
            lockedUntil: true,
          },
        });

        // Selalu lakukan pembandingan hash agar waktu respons tidak
        // membocorkan apakah email terdaftar.
        if (!user?.passwordHash) {
          fakeVerifyDelay();
          await writeAudit({
            action: AuditAction.LOGIN_FAILED,
            resource: "Auth",
            resourceId: email,
            metadata: { reason: "UNKNOWN_EMAIL" },
            ipAddress: ip,
          }).catch(() => undefined);
          return null;
        }

        if (isLocked(user.lockedUntil)) {
          await writeAudit({
            action: AuditAction.LOGIN_FAILED,
            resource: "Auth",
            resourceId: email,
            metadata: { reason: "ACCOUNT_LOCKED" },
            ipAddress: ip,
          }).catch(() => undefined);
          return null;
        }

        const ok = await verifyPassword(password, user.passwordHash);

        if (!ok || user.status !== UserStatus.ACTIVE) {
          if (ok) await registerFailedLogin(user.id);
          await writeAudit({
            action: AuditAction.LOGIN_FAILED,
            resource: "Auth",
            resourceId: email,
            metadata: { reason: ok ? "INACTIVE_ACCOUNT" : "BAD_PASSWORD" },
            ipAddress: ip,
          }).catch(() => undefined);
          return null;
        }

        await clearFailedLogins(user.id);
        await writeAudit({
          action: AuditAction.LOGIN,
          resource: "Auth",
          resourceId: user.id,
          actorUserId: user.id,
          ipAddress: ip,
          userAgent: request?.headers.get("user-agent") ?? null,
        }).catch(() => undefined);

        return { id: user.id, email: user.email, name: user.email };
      },
    }),
  ],
  callbacks: {
    /** Token hanya membawa identitas. Selalu baca role dari cookie/session. */
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    /**
     * Data sesi untuk UI saja. Otorisasi TIDAK boleh,andalkan nilai di sini:
     * guard server (`getCurrentPrincipal`) selalu query database.
     */
    async session({ session, token }) {
      const id = token.sub;
      if (!id) return session;
      const row = await db.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true, status: true },
      });
      if (!row || row.status !== UserStatus.ACTIVE) {
        return { ...session, user: { ...session.user, id: "", role: "", status: "NONE" } };
      }
      session.user = {
        ...session.user,
        id: row.id,
        email: row.email,
        name: row.email,
        role: row.role,
        status: row.status,
      };
      return session;
    },
  },
});
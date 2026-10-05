/**
 * Guard server-side: authentication, authorization, dan ownership.
 *
 * SEMUA route handler dan server action yang menyentuh data privat WAJIB
 * melewati salah satu fungsi di file ini. Menyembunyikan tombol di frontend
 * BUKAN kontrol akses.
 *
 * Kontrak:
 * - `userId` SELALU berasal dari token sesi, tidak pernah dari body/query.
 * - Role SELALU dibaca ulang dari `users` per request. Nilai dari JWT atau
 *   dari klien tidak pernah dipakai untuk keputusan otorisasi.
 * - Record yang boleh hanya diakses pemiliknya diverifikasi lewat filter
 *   `where` di query (lihat `assertOwnsRecord`), sehingga tidak ada
 *   kemungkinan "cek lalu ubah" (TOCTOU).
 */
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db/prisma";
import { UserStatus } from "@/generated/prisma/enums";
import {
  canAccess,
  hasPermission,
  isOwnResourceOnly,
  type Permission,
  type Role,
} from "@/lib/auth/permissions";
import { forbidden, notFound, unauthorized } from "@/lib/errors";

export type Principal = {
  userId: string;
  email: string;
  role: Role;
  status: UserStatus;
  /** `member.id` milik user ini, atau null bila akun belum punya profil. */
  memberId: string | null;
};

/**
 * Baca identitas pemanggil dari database.
 *
 * `cache()` memastikan satu render hanya query sekali. `auth()` membaca
 * cookie JWT; role TIDAK diambil dari sana melainkan dari baris `users`.
 */
export const getCurrentPrincipal = cache(async (): Promise<Principal | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      deletedAt: true,
      member: { select: { id: true } },
    },
  });

  // Akun dihapus (soft), dinonaktifkan, atau tidak ada → tidak ada akses.
  if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role as Role,
    status: user.status,
    memberId: user.member?.id ?? null,
  };
});

/**
 * Wajib ada sesi valid. Melempar `UNAUTHORIZED` untuk route handler, atau
 * redirect ke `/login` bila dipanggil dari Server Component.
 */
export async function requireSession(): Promise<Principal> {
  const principal = await getCurrentPrincipal();
  if (principal) return principal;
  throw unauthorized();
}

/** Versi untuk Server Component: mengarahkan pengunjung ke halaman login. */
export async function requireSessionPage(nextPath = "/admin"): Promise<Principal> {
  const principal = await getCurrentPrincipal();
  if (principal) return principal;
  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}

/**
 * Wajib punya role dari daftar yang diizinkan.
 * Pem hierarchies: cek sesi dulu, baru role.
 */
export async function requireRole(allowed: Role[]): Promise<Principal> {
  const principal = await requireSession();
  if (!allowed.includes(principal.role)) {
    await recordDenied(principal, "role", allowed.join(","));
    throw forbidden();
  }
  return principal;
}

/** Wajib punya permission. */
export async function requirePermission(permission: Permission): Promise<Principal> {
  const principal = await requireSession();
  if (!hasPermission(principal.role, permission)) {
    await recordDenied(principal, permission, principal.role);
    throw forbidden();
  }
  return principal;
}

/**
 * Permission + kepemilikan record dalam satu langkah.
 *
 * `ownerUserId` harus berasal dari query database, bukan dari input klien.
 * Bila record tidak ada → `NOT_FOUND` (bukan `FORBIDDEN`) agar tidak
 * membocorkan keberadaan record milik orang lain.
 */
export async function requireOwnedResource(
  permission: Permission,
  ownerUserId: string | null,
): Promise<Principal> {
  const principal = await requireSession();
  const allowed = canAccess({
    role: principal.role,
    permission,
    ownerUserId,
    actorUserId: principal.userId,
  });
  if (!allowed) {
    await recordDenied(principal, permission, ownerUserId ?? "-");
    // Hindari membocorkan keberadaan record milik orang lain.
    throw isOwnResourceOnly(permission) ? notFound() : forbidden();
  }
  return principal;
}

/**
 * Ownership yang ditegakkan DI DALAM query (pola `updateMany`/`deleteMany`
 * pada docs/roles-and-permissions.md § 4.3).
 *
 * Mengembalikan jumlah baris yang benar-benar berubah. `0` berarti bukan
 * milik pemanggil.
 */
export async function assertOwnsRecord(
  ownerUserId: string | null,
  actorUserId: string,
): Promise<void> {
  if (ownerUserId !== actorUserId) throw notFound();
}

async function recordDenied(
  principal: Principal,
  permission: string,
  detail: string,
): Promise<void> {
  const { writeAudit } = await import("@/lib/audit");
  const { AuditAction } = await import("@/generated/prisma/enums");
  await writeAudit(
    {
      action: AuditAction.VIEW_SENSITIVE,
      resource: "Authorization",
      resourceId: principal.userId,
      actorUserId: principal.userId,
      metadata: { permission, detail, denied: true },
    },
    false,
  );
}

/** Guard untuk Server Component: hanya boleh masuk ke halamannya. */
export async function requirePermissionPage(
  permission: Permission,
  nextPath = "/admin",
): Promise<Principal> {
  const principal = await requireSessionPage(nextPath);
  if (!hasPermission(principal.role, permission)) {
    await recordDenied(principal, permission, principal.role);
    throw forbidden();
  }
  return principal;
}
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
// `forbidden()` milik Next.js menghasilkan status HTTP 403 sungguhan lewat
// `forbidden.tsx`; versi lokal di `@/lib/errors` hanya untuk route handler.
import { forbidden as nextForbidden } from "next/navigation";
import { auth } from "@/auth";
import {
  canAccess,
  hasPermission,
  isOwnResourceOnly,
  type Permission,
  type Role,
} from "@/lib/auth/permissions";
import { canEnterPortal, DASHBOARD_BY_ROLE } from "@/lib/auth/portals";
import { readPrincipal, type Principal } from "@/lib/auth/principal";
import { forbidden, notFound, unauthorized } from "@/lib/errors";

export type { Principal };

/**
 * Baca identitas pemanggil dari database.
 *
 * `cache()` memastikan satu render hanya query sekali. `auth()` membaca
 * cookie JWT; role TIDAK diambil dari sana melainkan dari baris `users`
 * (lihat `readPrincipal` di `src/lib/auth/principal.ts`).
 */
export const getCurrentPrincipal = cache(async (): Promise<Principal | null> => {
  const session = await auth();
  return readPrincipal(session?.user?.id);
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
 * Wajib punya role dari daftar yang diizinkan — versi Server Component.
 *
 * Tanpa sesi → redirect ke `/login`. Salah role → HTTP 403 sungguhan
 * (`forbidden.tsx`), bukan 500 dan bukan halaman kosong. Penolakan dicatat di
 * `audit_logs` sebagai `VIEW_SENSITIVE` dengan `denied: true`.
 */
export async function requireRolePage(allowed: Role[], nextPath?: string): Promise<Principal> {
  const principal = await requireSessionPage(nextPath ?? DASHBOARD_BY_ROLE[allowed[0] ?? "ANGGOTA"]);
  if (!allowed.includes(principal.role)) {
    await recordDenied(principal, "portal", allowed.join(","));
    // next/navigation#forbidden -> merender app/forbidden.tsx dengan status 403.
    nextForbidden();
  }
  return principal;
}

/**
 * Wajib punya izin masuk ke portal pada `path`.
 *
 * Pemeriksaan memakai peta role dari `src/lib/auth/portals.ts`, sehingga layout
 * `/admin`, `/pengurus`, `/member`, dan `/alumni` memakai definisi yang sama.
 */
export async function requirePortalPage(path: string): Promise<Principal> {
  const principal = await requireSessionPage(path);
  if (!canEnterPortal(path, principal.role)) {
    await recordDenied(principal, "portal", path);
    nextForbidden();
  }
  return principal;
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
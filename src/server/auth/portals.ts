/**
 * Pemetaan portal <-> role — SATU SUMBER KEBENARAN untuk route privat.
 *
 * Fungsi ini ada supaya tiga hal yang berbeda tidak bisa berbeda pendapat:
 * 1. Layout tiap portal memanggil `canEnterPortal()` untuk menolak role
 *    yang tidak berhak dengan status HTTP 403.
 * 2. `loginAction` mengarahkan pengguna ke dasbor sesuai role-nya, bukan
 *    everyone's ke `/admin`.
 * 3. Tes otorisasi memakai daftar yang sama.
 *
 * Aturan yang dijaga di sini:
 * - Role TIDAK PERNAH datang dari form atau query. Nilai ini adalah daftar
 *   statis di server; yang membandingkan dengan sesi adalah guard.
 * - Setiap role punya tepat satu dasbor.
 * - Redirect setelah login harus tetap berada di dalam daftar `PORTALS` di
 *   bawah supaya tidak membuka halaman yang tidak diatur.
 */
import type { Role } from "@/server/auth/permissions";

/** Deskripsi singkat tiap portal, dipakai halaman 403. */
export const PORTALS = {
  admin: {
    path: "/admin",
    label: "Dasbor admin",
    roles: ["ADMIN"] as const satisfies readonly Role[],
  },
  pengurus: {
    path: "/pengurus",
    label: "Portal pengurus",
    roles: ["PENGURUS", "ADMIN"] as const satisfies readonly Role[],
  },
  bendahara: {
    path: "/bendahara",
    label: "Portal bendahara",
    roles: ["BENDAHARA", "ADMIN"] as const satisfies readonly Role[],
  },
  member: {
    path: "/member",
    label: "Portal anggota",
    roles: ["ANGGOTA", "PENGURUS", "ADMIN"] as const satisfies readonly Role[],
  },
  alumni: {
    path: "/alumni",
    label: "Portal alumni",
    roles: ["ALUMNI", "ADMIN"] as const satisfies readonly Role[],
  },
} as const;

export type PortalKey = keyof typeof PORTALS;

/**
 * Dasbor bawaan tiap role. Semua path WAJIB ada di `PORTALS`.
 * ANGGOTA, PENGURUS, dan ALUMNI sengaja diarahkan ke portalnya masing-masing
 * supaya tidak mendarat di 403 setelah login.
 */
export const DASHBOARD_BY_ROLE: Record<Role, string> = {
  ADMIN: PORTALS.admin.path,
  PENGURUS: PORTALS.pengurus.path,
  BENDAHARA: PORTALS.bendahara.path,
  ANGGOTA: PORTALS.member.path,
  ALUMNI: PORTALS.alumni.path,
};

/** Semua prefix route privat. Harus konsisten dengan `src/proxy.ts`. */
export const PRIVATE_PREFIXES: string[] = Object.values(PORTALS).map((p) => p.path);

/** Role yang boleh masuk ke portal pada `path`. */
export function canEnterPortal(path: string, role: Role): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => (path === prefix || path.startsWith(`${prefix}/`)) && canEnterPortalKey(path, role),
  );
}

function canEnterPortalKey(path: string, role: Role): boolean {
  const portal = Object.values(PORTALS).find(
    (p) => path === p.path || path.startsWith(`${p.path}/`),
  );
  return portal ? (portal.roles as readonly Role[]).includes(role) : false;
}

/**
 * Normalisasi tujuan redirect setelah login.
 *
 * Menolak apa pun yang bukan path internal, lalu menolak tujuan yang berada di
 * portal milik role lain. Tanpa ini, `?next=/admin` akan membuat ANGGOTA
 * melihat halaman 403 alih-alih langsung masuk ke dasbornya.
 */
export function safeNextPath(candidate: unknown, role: Role): string {
  const fallback = DASHBOARD_BY_ROLE[role] ?? PORTALS.member.path;
  if (typeof candidate !== "string") return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  // Buang karakter kontrol/newline agar tidak bisa menyamar sebagai header.
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return fallback;
  if (PRIVATE_PREFIXES.some((p) => candidate === p || candidate.startsWith(`${p}/`))) {
    return canEnterPortal(candidate, role) ? candidate : fallback;
  }
  return candidate;
}

/**
 * Matriks permission — SATU SUMBER KEBENARAN untuk otorisasi server.
 *
 * Prinsip:
 * - Permission adalah capability (`<resource>:<action>`), bukan role.
 * - Role → permission dipetakan di file ini saja supaya bisa diaudit dan
 *   diuji (`tests/unit/permissions.test.ts`).
 * - Role TIDAK PERNAH dibaca dari form, query string, header, atau body.
 *   Satu-satunya sumber adalah `users.role` yang dibaca di server.
 * - Permission `OWN_RESOURCE` berarti: boleh dipakai, tetapi HANYA terhadap
 *   record milik pemanggil. Pemeriksaan kepemilikan terjadi di query
 *   (`where`), bukan di frontend.
 *
 * See docs/authorization.md.
 */

export const PERMISSIONS = [
  "user:read",
  "user:create",
  "user:update",
  "user:delete",
  "user:change_role",
  "member:read",
  "member:create",
  "member:update",
  "member:delete",
  "member:change_status",
  "alumni:read_directory",
  "alumni:read_contact",
  "news:read",
  "news:create",
  "news:update",
  "news:delete",
  "news:publish",
  "program:read",
  "program:create",
  "program:update",
  "program:delete",
  "event:read",
  "event:create",
  "event:update",
  "event:delete",
  "documentation:read",
  "documentation:create",
  "documentation:update",
  "documentation:delete",
  "announcement:read",
  "announcement:create",
  "announcement:update",
  "announcement:delete",
  "finance:read_summary",
  "finance:read_transaction",
  "finance:create",
  "finance:delete",
  "finance:export",
  "document:read",
  "document:create",
  "document:delete",
  "file:upload",
  "card:read_own",
  "card:read_any",
  "audit_log:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type Role = "ADMIN" | "PENGURUS" | "ANGGOTA" | "ALUMNI";

/**
 * Permission yang boleh dijalankan terhadap record milik sendiri saja.
 * Pemanggil tetap harus cocok dengan kepemilikan record (server-side).
 */
const OWN_RESOURCE: ReadonlySet<Permission> = new Set<Permission>([
  "member:update",
  "file:upload",
  "card:read_own",
]);

const ADMIN_ONLY: Permission[] = [
  "user:read",
  "user:create",
  "user:update",
  "user:delete",
  "user:change_role",
  "member:delete",
  "finance:delete",
  "document:delete",
  "audit_log:read",
];

/**
 * PENGURUS TIDAK mendapat permission destruktif secara default
 * (`news:delete`, `program:delete`, `event:delete`,
 * `documentation:delete`, `announcement:delete`, `document:delete`).
 * Pemberian tambahan nanti harus lewat kode, bukan lewat UI.
 */
const PENGURUS: Permission[] = [
  "member:read",
  "member:create",
  "member:update",
  "member:change_status",
  "alumni:read_directory",
  "alumni:read_contact",
  "news:read",
  "news:create",
  "news:update",
  "news:publish",
  "program:read",
  "program:create",
  "program:update",
  "event:read",
  "event:create",
  "event:update",
  "documentation:read",
  "documentation:create",
  "documentation:update",
  "announcement:read",
  "announcement:create",
  "announcement:update",
  "finance:read_summary",
  "finance:read_transaction",
  "document:read",
  "document:create",
  "file:upload",
  "card:read_own",
  "card:read_any",
];

const ANGGOTA: Permission[] = [
  "member:update",
  "alumni:read_directory",
  "news:read",
  "program:read",
  "event:read",
  "documentation:read",
  "announcement:read",
  "document:read",
  "file:upload",
  "card:read_own",
];

const ALUMNI: Permission[] = [
  "alumni:read_directory",
  "news:read",
  "program:read",
  "event:read",
  "documentation:read",
  "announcement:read",
  "document:read",
  "file:upload",
];

function build(role: Permission[]): ReadonlySet<Permission> {
  return new Set<Permission>(role);
}

export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  ADMIN: build([...PERMISSIONS]),
  PENGURUS: build(PENGURUS),
  ANGGOTA: build(ANGGOTA),
  ALUMNI: build(ALUMNI),
};

/** Permission destruktif yang tidak diberikan ke PENGURUS secara default. */
export const PENGURUS_DENIED: ReadonlySet<Permission> = new Set<Permission>([
  "news:delete",
  "program:delete",
  "event:delete",
  "documentation:delete",
  "announcement:delete",
  "document:delete",
  ...ADMIN_ONLY,
]);

/** Apakah role punya permission, tanpa mempertimbangkan kepemilikan record? */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/** Apakah permission ini hanya sah untuk record milik pemanggil sendiri? */
export function isOwnResourceOnly(permission: Permission): boolean {
  return OWN_RESOURCE.has(permission);
}

export type AccessCheck = {
  role: Role;
  permission: Permission;
  /** `user.id` pemilik record. Dikosongkan bila record tidak dimiliki user. */
  ownerUserId?: string | null;
  /** `user.id` pemanggil. */
  actorUserId: string;
};

/**
 * Otorisasi lengkap: permission + kepemilikan record.
 *
 * `OWN_RESOURCE` (lihat atas) hanya lolos bila `ownerUserId` sama dengan
 * `actorUserId`. Value-nya selalu berasal dari query database, bukan dari
 * parameter kiriman klien.
 */
export function canAccess({
  role,
  permission,
  ownerUserId,
  actorUserId,
}: AccessCheck): boolean {
  if (!hasPermission(role, permission)) return false;
  if (!isOwnResourceOnly(permission)) return true;
  return typeof ownerUserId === "string" && ownerUserId === actorUserId;
}

/** Daftar permission milik role — dipakai halaman "akun saya" dan tes. */
export function permissionsFor(role: Role): Permission[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])].sort();
}
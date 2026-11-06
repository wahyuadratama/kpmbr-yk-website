/**
 * Kebijakan akses file.
 *
 * `files.access_level` adalah satu-satunya penentu. URL publik TIDAK pernah
 * cukup untuk membuka dokumen restricted — semua akses lewat route server
 * yang memanggil `authorizeFileAccess()` lebih dulu.
 *
 * See docs/authorization.md § Akses File.
 */
import "server-only";
import { db } from "@/server/db/prisma";
import { FileAccessLevel } from "@/generated/prisma/enums";
import type { Role } from "@/server/auth/permissions";
import { forbidden, notFound } from "@/shared/errors";

const ALLOWED_ROLES: Record<FileAccessLevel, Role[]> = {
  PUBLIC: ["ADMIN", "PENGURUS", "ANGGOTA", "ALUMNI"],
  MEMBER_ONLY: ["ADMIN", "PENGURUS", "ANGGOTA"],
  PENGURUS_ONLY: ["ADMIN", "PENGURUS"],
  ADMIN_ONLY: ["ADMIN"],
};

export type FileRecord = {
  id: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: string;
  accessLevel: FileAccessLevel;
  altText: string | null;
};

export function canAccessLevel(
  accessLevel: FileAccessLevel,
  role: Role | null,
): boolean {
  if (accessLevel === FileAccessLevel.PUBLIC) return true;
  if (!role) return false;
  return ALLOWED_ROLES[accessLevel].includes(role);
}

/**
 * Ambil file dan pastikan pemanggil berhak.
 *
 * Berkas tidak ada → 404. Ada tapi tidak berhak → 403 (pengguna sudah
 * terautentikasi, jadi 403 lebih jujur daripada 404).
 */
export async function authorizeFileAccess(
  fileId: string,
  role: Role | null,
): Promise<FileRecord> {
  const file = await db.file.findFirst({
    where: { id: fileId, deletedAt: null },
    select: {
      id: true,
      storageKey: true,
      fileName: true,
      mimeType: true,
      size: true,
      kind: true,
      accessLevel: true,
      altText: true,
    },
  });
  if (!file) throw notFound("File tidak ditemukan.");
  if (!canAccessLevel(file.accessLevel, role)) throw forbidden("Anda tidak berhak diakses file ini.");
  return file;
}

/** Content-Disposition aman: mencegah header injection lewat nama file. */
export function contentDisposition(fileName: string): string {
  const cleaned = fileName.replace(/[\r\n"\\]/g, "_").slice(0, 200) || "file";
  const ascii = cleaned.replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(cleaned)}`;
}
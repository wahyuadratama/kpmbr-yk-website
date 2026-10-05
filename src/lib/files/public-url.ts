/**
 * Pembentuk URL aset publik.
 *
 * Hanya aset ber-`accessLevel = PUBLIC` yang boleh punya URL yang bisa
 * diakses langsung. File `MEMBER_ONLY`, `PENGURUS_ONLY`, dan `ADMIN_ONLY`
 * sengaja TIDAK pernah menghasilkan URL di sini — pemanggilnya memakai
 * `/api/files/[id]` yang memeriksa akses per request.
 *
 * Berkas lokal pada development tidak punya URL publik: folder `.data/uploads`
 * tidak disajikan sebagai statis. Karena itu fungsi ini mengembalikan `null`
 * bila `R2_PUBLIC_URL` belum diisi, dan pemanggil jatuh ke placeholder.
 */
import { FileAccessLevel } from "@/generated/prisma/enums";

type PublicFile = {
  storageKey: string;
  accessLevel: FileAccessLevel | string;
  altText?: string | null;
};

/** Basis URL R2 tanpa trailing slash, atau `null` bila belum dikonfigurasi. */
export function publicBaseUrl(): string | null {
  const raw = process.env.R2_PUBLIC_URL?.trim();
  if (!raw) return null;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

/**
 * URL absolut aset yang boleh publik, atau `null`.
 *
 * `null` berarti pemanggil harus memakai placeholder (gradient) — bukan berarti
 * file tidak ada.
 */
export function publicAssetUrl(file: PublicFile | null | undefined): string | null {
  if (!file) return null;
  if (file.accessLevel !== FileAccessLevel.PUBLIC) return null;
  const base = publicBaseUrl();
  if (!base) return null;
  // `storageKey` dibangun di server dari UUID, bukan nama kiriman, jadi tidak
  // ada path traversal. Slash di depan tetap dibuang agar host tidak bisa
  // pecah ke origin lain.
  const key = file.storageKey.replace(/^\/+/, "");
  return `${base}/${key}`;
}

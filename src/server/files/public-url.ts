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

/**
 * Sumber gambar untuk ditampilkan di halaman publik.
 *
 * Urutan pilihan:
 * 1. URL R2 langsung (kalau `R2_PUBLIC_URL` sudah diisi) — paling cepat,
 *    dilayani CDN tanpa menyentuh server aplikasi.
 * 2. Route `/api/public-files/<id>` — dilayani server, hanya untuk file
 *    ber-`accessLevel = PUBLIC`.
 *
 * Berkas non-publik TIDAK PERNAH mendapat URL di sini.
 */
export function publicFileSrc(
  file:
    | (PublicFile & { id?: string | null })
    | null
    | undefined,
): string | null {
  if (!file) return null;
  if (file.accessLevel !== FileAccessLevel.PUBLIC) return null;

  const direct = publicAssetUrl(file);
  if (direct) return direct;

  if (file.id) return `/api/public-files/${file.id}`;
  return null;
}

/**
 * Data awal untuk `ImagePicker` di dashboard.
 *
 * Pratinjau memakai `/api/files/<id>` (bukan route publik) karena pemakai
 * dashboard selalu punya sesi. Hanya berkas `PUBLIC` yang dapat dilampirkan
 * sebagai gambar sampul yang tampil di halaman publik.
 */
export function coverPreview(
  file:
    | { id: string; accessLevel: string; altText: string | null }
    | null
    | undefined,
): { id: string; url: string; altText: string } | null {
  if (!file) return null;
  if (file.accessLevel !== FileAccessLevel.PUBLIC) return null;
  return {
    id: file.id,
    url: `/api/files/${file.id}`,
    altText: file.altText ?? "",
  };
}

/**
 * Abstraksi penyimpanan file.
 *
 * Prinsip:
 * - Binary TIDAK pernah disimpan di MySQL. Database hanya menyimpan metadata
 *   (`files`).
 * - Development memakai penyimpanan lokal di dalam repo (`.data/uploads`),
 *   yang sudah masuk `.gitignore`.
 * - Produksi diarahkan ke Cloudflare R2 (S3-compatible) melalui env.
 *   Driver R2 sengaja belum diimplementasikan pada tahap ini — lihat
 *   docs/backend-architecture.md § Storage. Titik integrasinya adalah
 *   antarmuka di file ini, jadi tidak ada perubahan pemanggil.
 * - Kunci objek (`storageKey`) SELALU dibangun di server dari ID acak, bukan
 *   dari nama file kiriman. Nama file asli hanya disimpan sebagai metadata.
 *   Ini menutup jalur path traversal.
 */
import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db/prisma";
import { FileAccessLevel, FileKind } from "@/generated/prisma/enums";
import { tooLarge, unsupportedMedia } from "@/lib/errors";

/** Batas ukuran per jenis file (byte). */
export const MAX_SIZE: Record<FileKind, number> = {
  IMAGE: 8 * 1024 * 1024,
  VIDEO: 200 * 1024 * 1024,
  AUDIO: 20 * 1024 * 1024,
  PDF: 15 * 1024 * 1024,
  SPREADSHEET: 10 * 1024 * 1024,
  DOCUMENT: 15 * 1024 * 1024,
  OTHER: 10 * 1024 * 1024,
};

/** MIME yang diizinkan per kind. Daftar putih, bukan daftar hitam. */
export const ALLOWED_MIME: Record<FileKind, string[]> = {
  IMAGE: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  VIDEO: ["video/mp4", "video/webm"],
  AUDIO: ["audio/mpeg", "audio/ogg", "audio/wav"],
  PDF: ["application/pdf"],
  SPREADSHEET: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  DOCUMENT: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
  OTHER: [],
};

export type DetectedKind = FileKind | null;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "application/pdf": "pdf",
};

/** Tentukan kind dari MIME; `null` berarti tidak diizinkan. */
export function kindForMime(mime: string): DetectedKind {
  const normalized = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  for (const [kind, list] of Object.entries(ALLOWED_MIME)) {
    if (list.includes(normalized)) return kind as FileKind;
  }
  return null;
}

/** Magic bytes — ekstensi dan MIME yang diklaim klien tidak pernah dipercaya. */
const SIGNATURES: { mime: string; bytes: number[][] }[] = [
  { mime: "image/jpeg", bytes: [[0xff, 0xd8, 0xff]] },
  { mime: "image/png", bytes: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  { mime: "image/gif", bytes: [[0x47, 0x49, 0x46, 0x38]] },
  { mime: "application/pdf", bytes: [[0x25, 0x50, 0x44, 0x46]] },
  { mime: "application/zip", bytes: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x5c, 0x36]] },
];

function matchesSignature(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    for (const prefix of sig.bytes) {
      if (prefix.every((byte, index) => buffer[index] === byte)) return sig.mime;
    }
  }
  return null;
}

/** Deteksi MIME dari isi file. Dikembalikan bersama MIME yang diklaim klien. */
export function sniffMime(buffer: Buffer): string | null {
  return matchesSignature(buffer);
}

export type StoredObject = {
  storageKey: string;
  size: number;
  checksum: string;
};

const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

/**
 * Kunci objek. Menggabungkan tanggal, ID acak, dan ekstensi hasil
 * pemeriksaan MIME — bukan nama file kiriman.
 */
function buildStorageKey(mime: string, now = new Date()): { key: string; ext: string } {
  const ext = EXT_BY_MIME[mime.split(";")[0]?.trim().toLowerCase() ?? ""] ?? "bin";
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id = randomUUID();
  return { key: `${yyyy}/${mm}/${id}.${ext}`, ext };
}

/**
 * Simpan binary dan catat metadata-nya.
 *
 * Menolak file yang: MIME tidak diizinkan, ukuran melebihi batas, atau
 * signature isi tidak cocok dengan MIME yang diklaim (untuk format dengan
 * signature yang dikenal).
 */
export async function storeFile(params: {
  data: Buffer;
  declaredMime: string;
  declaredName: string;
  kind?: FileKind;
  accessLevel: FileAccessLevel;
  uploadedById: string | null;
  altText?: string | null;
}): Promise<StoredObject> {
  const { data, declaredMime, declaredName } = params;

  const detected = kindForMime(declaredMime);
  if (!detected) throw unsupportedMedia("Jenis file ini tidak diizinkan.");

  const limit = MAX_SIZE[detected];
  if (data.byteLength > limit) {
    throw tooLarge(`Ukuran file melebihi batas ${Math.round(limit / 1024 / 1024)} MB.`);
  }
  if (data.byteLength === 0) throw unsupportedMedia("File kosong.");

  const sniffed = sniffMime(data);
  if (sniffed && sniffed !== declaredMime.split(";")[0]?.trim().toLowerCase()) {
    // `application/zip` adalah container docx/xlsx, jadi tidak dianggap konflik.
    const containerOk =
      declaredMime.includes("officedocument") && sniffed === "application/zip";
    if (!containerOk) {
      throw unsupportedMedia("Isi file tidak cocok dengan jenis file yang dipilih.");
    }
  }

  const checksum = createHash("sha256").update(data).digest("hex");
  const { key } = buildStorageKey(declaredMime);
  const target = path.join(LOCAL_ROOT, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data, { flag: "wx" });

  await db.file.create({
    data: {
      storageKey: key,
      fileName: declaredName.slice(0, 255),
      mimeType: declaredMime.slice(0, 191),
      size: data.byteLength,
      kind: params.kind ?? detected,
      accessLevel: params.accessLevel,
      checksum,
      altText: params.altText?.slice(0, 255) ?? null,
      uploadedById: params.uploadedById,
    },
  });

  return { storageKey: key, size: data.byteLength, checksum };
}

/** Baca binary dari penyimpanan. Untuk route unduh yang sudah diotorisasi. */
export async function readFile(storageKey: string): Promise<Buffer> {
  const target = path.join(LOCAL_ROOT, storageKey);
  const normalized = path.normalize(target);
  if (!normalized.startsWith(LOCAL_ROOT)) {
    throw new Error("storageKey di luar direktori penyimpanan.");
  }
  const { readFile: rf } = await import("node:fs/promises");
  return rf(normalized);
}

/** Hapus binary. Metadata di-*soft delete*, tidak dihapus dari database. */
export async function deleteObject(storageKey: string): Promise<void> {
  const target = path.normalize(path.join(LOCAL_ROOT, storageKey));
  if (!target.startsWith(LOCAL_ROOT)) return;
  await rm(target, { force: true });
}
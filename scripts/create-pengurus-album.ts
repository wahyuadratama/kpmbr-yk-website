/**
 * Script buat album "Pengurus KPMBR-YK" (14 Sep 2026) dari foto di tmp-dokumentasi/pengurus.
 * Idempotent: kalau album sudah ada (slug sama), skip tanpa duplikat.
 *
 * Jalankan: npx tsx --env-file=.env scripts/create-pengurus-album.ts
 */
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db/prisma";
import { storeFile } from "@/server/storage";
import { FileAccessLevel, FileKind } from "@/generated/prisma/enums";

interface UploadedFile {
  id: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: FileKind;
  accessLevel: FileAccessLevel;
  altText: string | null;
  localPath: string;
}

const ALBUM_TITLE = "Pengurus KPMBR-YK";
const ALBUM_SLUG = "pengurus-kpmbr-yk";
const EVENT_DATE = "2026-09-14"; // 14 Sep 2026
const DESCRIPTION = "Foto pengurus KPMBR-YK periode 2026/2027 (Kabinet Sabilulungan) saat pengambilan gambar resmi.";
const ACCENT = "brand";
const SOURCE_DIR = path.join(process.cwd(), "tmp-dokumentasi", "pengurus");
const PHOTO_COUNT = 25; // ambil 25 foto pertama (DSCF6001–DSCF6025)
const COVER_INDEX = 0; // DSCF6001 sebagai cover

async function main() {
  console.log(`[create-pengurus-album] Memulai pembuatan album "${ALBUM_TITLE}"...\n`);

  // 1. Cek apakah album sudah ada (idempotent)
  const existingAlbum = await db.documentationAlbum.findUnique({
    where: { slug: ALBUM_SLUG },
    select: { id: true, title: true, photoCount: true },
  });

  if (existingAlbum) {
    console.log(`[create-pengurus-album] ✓ Album sudah ada: "${existingAlbum.title}" (slug: ${ALBUM_SLUG}, photoCount: ${existingAlbum.photoCount})`);
    console.log("[create-pengurus-album] Skip pembuatan (idempotent).");
    return;
  }

  console.log(`[create-pengurus-album] Album belum ada, melanjutkan...\n`);

  // 2. Siapkan daftar file foto
  const photoFiles: string[] = [];
  for (let i = 1; i <= PHOTO_COUNT; i++) {
    const num = String(i).padStart(4, "0");
    photoFiles.push(`DSCF${num}.JPG`);
  }

  // Verifikasi file ada
  const missing: string[] = [];
  for (const f of photoFiles) {
    const full = path.join(SOURCE_DIR, f);
    try {
      await readFile(full);
    } catch {
      missing.push(f);
    }
  }
  if (missing.length > 0) {
    console.error(`[create-pengurus-album] ✗ File hilang: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`[create-pengurus-album] ✓ ${photoFiles.length} file foto ditemukan\n`);

  // 3. Upload foto ke storage & buat record File
  const uploadedFiles: UploadedFile[] = [];
  for (let i = 0; i < photoFiles.length; i++) {
    const fileName = photoFiles[i];
    const localPath = path.join(SOURCE_DIR, fileName);
    const data = await readFile(localPath);

    console.log(`[create-pengurus-album] Upload ${i + 1}/${photoFiles.length}: ${fileName} (${Math.round(data.length / 1024 / 1024)} MB)...`);

    const stored = await storeFile({
      data,
      declaredMime: "image/jpeg",
      declaredName: fileName,
      kind: FileKind.IMAGE,
      accessLevel: FileAccessLevel.PUBLIC,
      uploadedById: null, // system upload
      altText: `${ALBUM_TITLE} - foto ${i + 1}`,
    });

    const fileRecord = await db.file.findUnique({
      where: { storageKey: stored.storageKey },
      select: { id: true, storageKey: true, fileName: true, mimeType: true, size: true, kind: true, accessLevel: true, altText: true },
    });

    if (!fileRecord) {
      console.error(`[create-pengurus-album] ✗ Gagal baca file record untuk ${fileName}`);
      process.exit(1);
    }

    uploadedFiles.push({ ...fileRecord, localPath });
    console.log(`  ✓ ${fileRecord.id} (${stored.storageKey})`);
  }

  // 4. Buat album + item dalam transaksi
  const coverFileId = uploadedFiles[COVER_INDEX].id;

  const created = await db.$transaction(async (tx) => {
    // Buat album
    const album = await tx.documentationAlbum.create({
      data: {
        title: ALBUM_TITLE,
        slug: ALBUM_SLUG,
        description: DESCRIPTION,
        eventDate: new Date(EVENT_DATE),
        accent: ACCENT,
        coverFileId,
        photoCount: uploadedFiles.length,
      },
      select: { id: true, slug: true, title: true },
    });

    // Buat DocumentationItem untuk tiap foto
    for (let i = 0; i < uploadedFiles.length; i++) {
      await tx.documentationItem.create({
        data: {
          albumId: album.id,
          fileId: uploadedFiles[i].id,
          sortOrder: i,
          caption: `${ALBUM_TITLE} - foto ${i + 1}`,
        },
      });
    }

    return album;
  });

  console.log(`\n[create-pengurus-album] ✓ Album dibuat: ${created.title} (${created.slug})`);
  console.log(`[create-pengurus-album] ✓ ${uploadedFiles.length} foto terhubung`);
  console.log(`[create-pengurus-album] ✓ Cover: ${coverFileId} (${uploadedFiles[COVER_INDEX].fileName})`);
  console.log("\n[create-pengurus-album] Selesai!");
}

main().catch((err) => {
  console.error("[create-pengurus-album] Fatal:", err);
  process.exit(1);
});
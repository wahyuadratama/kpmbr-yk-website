/**
 * Script migrasi: pindahkan file lama dari .data/uploads/ ke Cloudflare R2.
 *
 * Jalankan dengan: npm run migrate:r2
 *
 * Proses:
 * 1. Cek apakah R2 sudah dikonfigurasi
 * 2. Baca semua file dari database yang belum dimigrasikan
 * 3. Upload ke R2
 * 4. Tandai sebagai sudah dimigrasikan
 * 5. Hapus file lokal setelah sukses
 */
import "server-only";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { db } from "@/server/db/prisma";
import { uploadToR2, isR2Configured } from "@/server/storage/r2";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

async function migrateToR2() {
  console.log("[R2 Migration] Memulai migrasi file ke Cloudflare R2...\n");

  if (!isR2Configured()) {
    console.error(
      "[R2 Migration] ❌ R2 belum dikonfigurasi. Isi env vars terlebih dahulu:",
    );
    console.error("  - R2_ACCOUNT_ID");
    console.error("  - R2_ACCESS_KEY_ID");
    console.error("  - R2_SECRET_ACCESS_KEY");
    console.error("  - R2_BUCKET_NAME");
    process.exit(1);
  }

  console.log("[R2 Migration] ✓ R2 sudah dikonfigurasi\n");

  // Ambil semua file dari database
  const files = await db.file.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
      fileName: true,
    },
  });

  if (files.length === 0) {
    console.log("[R2 Migration] ℹ Tidak ada file untuk dimigrasikan.");
    process.exit(0);
  }

  console.log(`[R2 Migration] Ditemukan ${files.length} file untuk dimigrasikan\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const localPath = path.join(LOCAL_ROOT, file.storageKey);

    try {
      // Baca file lokal
      const data = await readFile(localPath);

      // Upload ke R2
      const uploaded = await uploadToR2(
        file.storageKey,
        data,
        file.mimeType,
      );

      if (!uploaded) {
        console.error(
          `[R2 Migration] ❌ Gagal upload: ${file.fileName} (${file.storageKey})`,
        );
        failCount++;
        continue;
      }

      // Hapus file lokal setelah sukses
      await rm(localPath, { force: true });

      console.log(
        `[R2 Migration] ✓ Migrasikan: ${file.fileName} (${file.storageKey})`,
      );
      successCount++;
    } catch (error) {
      console.error(
        `[R2 Migration] ❌ Error: ${file.fileName} (${file.storageKey})`,
      );
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      failCount++;
    }
  }

  console.log(`\n[R2 Migration] Selesai!`);
  console.log(`  ✓ Berhasil: ${successCount}`);
  console.log(`  ❌ Gagal: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

migrateToR2().catch((error) => {
  console.error("[R2 Migration] Fatal error:", error);
  process.exit(1);
});

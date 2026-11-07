/**
 * Script verifikasi: cek konfigurasi R2 dan test upload/download.
 *
 * Jalankan dengan: npm run verify:r2
 */
import "server-only";
import { isR2Configured, uploadToR2, downloadFromR2, deleteFromR2 } from "@/server/storage/r2";

async function verifyR2() {
  console.log("[R2 Verify] Memulai verifikasi Cloudflare R2...\n");

  // Cek konfigurasi
  if (!isR2Configured()) {
    console.error("[R2 Verify] ❌ R2 belum dikonfigurasi.");
    console.error("\nEnv vars yang diperlukan:");
    console.error("  - R2_ACCOUNT_ID");
    console.error("  - R2_ACCESS_KEY_ID");
    console.error("  - R2_SECRET_ACCESS_KEY");
    console.error("  - R2_BUCKET_NAME");
    process.exit(1);
  }

  console.log("[R2 Verify] ✓ R2 sudah dikonfigurasi\n");

  // Test upload
  console.log("[R2 Verify] Testing upload...");
  const testKey = `test/${Date.now()}.txt`;
  const testData = Buffer.from("Test file for R2 verification");

  const uploadSuccess = await uploadToR2(testKey, testData, "text/plain");
  if (!uploadSuccess) {
    console.error("[R2 Verify] ❌ Upload gagal");
    process.exit(1);
  }
  console.log("[R2 Verify] ✓ Upload berhasil\n");

  // Test download
  console.log("[R2 Verify] Testing download...");
  const downloadedData = await downloadFromR2(testKey);
  if (!downloadedData) {
    console.error("[R2 Verify] ❌ Download gagal");
    process.exit(1);
  }
  if (!downloadedData.equals(testData)) {
    console.error("[R2 Verify] ❌ Data tidak cocok");
    process.exit(1);
  }
  console.log("[R2 Verify] ✓ Download berhasil\n");

  // Test delete
  console.log("[R2 Verify] Testing delete...");
  const deleteSuccess = await deleteFromR2(testKey);
  if (!deleteSuccess) {
    console.error("[R2 Verify] ❌ Delete gagal");
    process.exit(1);
  }
  console.log("[R2 Verify] ✓ Delete berhasil\n");

  console.log("[R2 Verify] ✓ Semua test berhasil!");
  console.log("\nR2 sudah siap digunakan untuk production.");
}

verifyR2().catch((error) => {
  console.error("[R2 Verify] Fatal error:", error);
  process.exit(1);
});

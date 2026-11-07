/**
 * Cleanup Script — Hapus Data [CONTOH] dari Database
 *
 * Script ini menghapus entri contoh yang dibuat oleh seed.ts:
 * - Program kerja: [CONTOH] Program kerja KPMBR-YK
 * - Album dokumentasi: [CONTOH] Album dokumentasi KPMBR-YK
 *
 * Jalankan dengan: npm run db:cleanup-contoh
 */

import { db } from "../src/server/db/prisma.js";

function assertCleanupAllowed(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Cleanup DITOLAK: NODE_ENV=production.");
  }
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("DATABASE_URL belum diset.");
  const host = /@([^:/?]+)/.exec(url)?.[1] ?? "";
  const local = ["localhost", "127.0.0.1", "::1", "kpmbr-db"].includes(host);
  if (!local) {
    throw new Error(
      `Cleanup DITOLAK: DATABASE_URL menuju host "${host}", bukan host lokal.`
    );
  }
}

async function main(): Promise<void> {
  assertCleanupAllowed();

  console.log("\n=== Cleanup Data [CONTOH] dari Database ===\n");

  try {
    // Hapus program kerja contoh
    const deletedProgram = await db.program.deleteMany({
      where: {
        slug: "program-kerja-contoh",
      },
    });
    console.log(`✓ Hapus program kerja contoh: ${deletedProgram.count} baris`);

    // Hapus album dokumentasi contoh
    const deletedAlbum = await db.documentationAlbum.deleteMany({
      where: {
        slug: "dokumentasi-contoh",
      },
    });
    console.log(`✓ Hapus album dokumentasi contoh: ${deletedAlbum.count} baris`);

    console.log("\n✅ Cleanup selesai!\n");
  } catch (error) {
    console.error("❌ Cleanup gagal:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main().catch(async (error: unknown) => {
  console.error("Cleanup gagal:", error);
  await db.$disconnect();
  process.exit(1);
});

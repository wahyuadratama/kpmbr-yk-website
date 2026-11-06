/**
 * Script untuk Query Nilai Aktual dari Database
 * Digunakan untuk laporan Prompt 1 — menampilkan nilai sebenarnya di /keanggotaan dan /kontak
 */

import { db } from "../src/lib/db/prisma.js";
import { parseList, parseTitledList } from "../src/lib/content/markdown.js";
import { siteConfig } from "../src/lib/site-config.js";

const CONTENT_KEYS = {
  persyaratan: "keanggotaan.persyaratan",
  manfaat: "keanggotaan.manfaat",
  langkah: "keanggotaan.langkah",
};

async function main(): Promise<void> {
  console.log("\n=== NILAI AKTUAL DARI DATABASE & SITECONFIG ===\n");

  try {
    // Query /keanggotaan
    console.log("📋 HALAMAN /keanggotaan\n");

    const persyaratan = await db.organizationContent.findFirst({
      where: { key: CONTENT_KEYS.persyaratan, isPublished: true },
      select: { body: true },
    });

    const manfaat = await db.organizationContent.findFirst({
      where: { key: CONTENT_KEYS.manfaat, isPublished: true },
      select: { body: true },
    });

    const langkah = await db.organizationContent.findFirst({
      where: { key: CONTENT_KEYS.langkah, isPublished: true },
      select: { body: true },
    });

    console.log("1️⃣ PERSYARATAN KEANGGOTAAN:");
    if (persyaratan?.body) {
      const items = parseList(persyaratan.body);
      items.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item}`);
      });
    } else {
      console.log("   ❌ KOSONG (belum diisi di database)");
    }

    console.log("\n2️⃣ MANFAAT KEANGGOTAAN:");
    if (manfaat?.body) {
      const items = parseTitledList(manfaat.body);
      items.forEach((item) => {
        console.log(`   • ${item.title}`);
        console.log(`     ${item.description}`);
      });
    } else {
      console.log("   ❌ KOSONG (belum diisi di database)");
    }

    console.log("\n3️⃣ ALUR PENDAFTARAN:");
    if (langkah?.body) {
      const items = parseTitledList(langkah.body);
      items.forEach((item, i) => {
        console.log(`   Langkah ${i + 1}: ${item.title}`);
        console.log(`   ${item.description}`);
      });
    } else {
      console.log("   ❌ KOSONG (belum diisi di database)");
    }

    // Query /kontak
    console.log("\n\n📞 HALAMAN /kontak\n");

    console.log("1️⃣ EMAIL SEKRETARIAT:");
    console.log(`   ${siteConfig.contact.email}`);

    console.log("\n2️⃣ INSTAGRAM:");
    console.log(`   ${siteConfig.contact.instagram}`);

    console.log("\n3️⃣ ALAMAT LENGKAP:");
    console.log(`   Jalan: ${siteConfig.address.street}`);
    console.log(`   Kota: ${siteConfig.address.city}`);
    console.log(`   Provinsi: ${siteConfig.address.region}`);
    console.log(`   Kode Pos: ${siteConfig.address.postalCode || "(kosong)"}`);

    console.log("\n\n✅ Query selesai!\n");
  } catch (error) {
    console.error("❌ Query gagal:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main().catch(async (error: unknown) => {
  console.error("Query gagal:", error);
  await db.$disconnect();
  process.exit(1);
});

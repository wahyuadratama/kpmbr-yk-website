/**
 * Seed Data Asli KPMBR-YK — Periode 2026/2027
 *
 * Sumber: Berkas Pelantikan KPMBR 2026/2027 (6 Juni 2026)
 * File referensi: docs/data-kpmbr-pelantikan-2026-2027.md
 *
 * Script ini memasukkan data terverifikasi dari berkas pelantikan:
 * - BPH (Badan Pengurus Harian)
 * - 4 Divisi + anggota divisi
 * - Periode kepengurusan 2026/2027
 * - Berita pelantikan (serah terima ketua)
 * - Agenda pelantikan
 *
 * Prinsip:
 * 1. Idempoten — aman dijalankan berulang
 * 2. Tidak menghapus data — hanya upsert
 * 3. Hanya data terverifikasi dari berkas — tidak mengarang
 * 4. Semua data dapat diedit admin lewat CMS/dashboard
 *
 * Jalankan dengan: npx ts-node prisma/seed-data-asli.ts
 */

import { db } from "../src/server/db/prisma.js";
import { EventStatus, NewsStatus, PositionLevel } from "../src/generated/prisma/enums.js";

// Penjaga lingkungan (sama seperti seed.ts)
function assertSeedAllowed(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed DITOLAK: NODE_ENV=production.");
  }
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("DATABASE_URL belum diset.");
  const host = /@([^:/?]+)/.exec(url)?.[1] ?? "";
  const local = ["localhost", "127.0.0.1", "::1", "kpmbr-db"].includes(host);
  if (!local) {
    throw new Error(
      `Seed DITOLAK: DATABASE_URL menuju host "${host}", bukan host lokal.`
    );
  }
}

// ============================================================================
// DATA ASLI DARI BERKAS PELANTIKAN (6 JUNI 2026)
// ============================================================================

const PERIODE_2026_2027 = {
  name: "Periode 2026/2027 — Kabinet Sabilulungan",
  startDate: new Date("2026-06-06"),
  endDate: new Date("2029-06-05"), // Asumsi 3 tahun
  isCurrent: true,
};

// BPH (Badan Pengurus Harian) — dari berkas
const BPH_DATA = [
  {
    code: "ketua",
    name: "Ketua",
    level: PositionLevel.KETUA,
    holderName: "Syachril Gunawan",
    gelarAdat: "Nata Prawira XX",
    sortOrder: 1,
  },
  {
    code: "wakil-ketua",
    name: "Wakil Ketua",
    level: PositionLevel.WAKIL_KETUA,
    holderName: "Muhammad Bilal Ardiansyah",
    sortOrder: 2,
  },
  {
    code: "sekretaris-1",
    name: "Sekretaris 1",
    level: PositionLevel.SEKRETARIS,
    holderName: "Zaenal Wahyudin",
    sortOrder: 3,
  },
  {
    code: "bendahara-1",
    name: "Bendahara 1",
    level: PositionLevel.BENDAHARA,
    holderName: "Nur Shabrina Widjani Balqis",
    sortOrder: 4,
  },
];

// Divisi + Ketua Divisi + Anggota — dari berkas
const DIVISI_DATA = [
  {
    code: "psdm",
    name: "PSDM",
    level: PositionLevel.KEPALA_DIVISI,
    ketua: "Rizal Mustofa",
    anggota: ["Haidar Zaky", "Alysha Rahma Pramitha", "M. Azmil Nizar", "Lintang Pradipta"],
  },
  {
    code: "humas",
    name: "HUMAS",
    level: PositionLevel.KEPALA_DIVISI,
    ketua: "Zahra Aulia Putri",
    anggota: ["Qonita Rahsya", "Pujan Nul Hakim", "Barr Al Hannan", "Rafa Wahdana"],
  },
  {
    code: "media-ekraf",
    name: "MEDIA & EKRAF",
    level: PositionLevel.KEPALA_DIVISI,
    ketua: "Fajar Rasyid Al Maula",
    anggota: ["Adryan Mughni", "Nayla Salsabila Putri Hidayat", "Ashila Faza", "Azzahra Shaumynissa Putri Permana"],
  },
  {
    code: "olahraga",
    name: "OLAHRAGA",
    level: PositionLevel.KEPALA_DIVISI,
    ketua: "Safa Andani Hermawan",
    anggota: ["Muhammad Fadhil Anugerah Putra", "Tamam El-fuad", "Hera Adawiati Umniah", "Adilah Anggaeni"],
  },
];

// ============================================================================
// FUNGSI SEED
// ============================================================================

async function seedOrganizationTerm(): Promise<string> {
  const term = await db.organizationTerm.upsert({
    where: { name: PERIODE_2026_2027.name },
    create: PERIODE_2026_2027,
    update: { isCurrent: PERIODE_2026_2027.isCurrent },
  });
  console.log(`✓ Periode: ${term.name}`);
  return term.id;
}

async function seedBPH(termId: string): Promise<void> {
  for (const bph of BPH_DATA) {
    // Pastikan posisi ada
    const position = await db.organizationPosition.upsert({
      where: { code: bph.code },
      create: {
        code: bph.code,
        name: bph.name,
        level: bph.level,
        sortOrder: bph.sortOrder,
      },
      update: { name: bph.name, sortOrder: bph.sortOrder },
    });

    // Buat atau update member untuk pemegang jabatan
    const member = await db.member.upsert({
      where: { memberCode: `BPH-${bph.code.toUpperCase()}` },
      create: {
        memberCode: `BPH-${bph.code.toUpperCase()}`,
        fullName: bph.holderName,
      },
      update: { fullName: bph.holderName },
    });

    // Cek apakah assignment sudah ada
    const existingAssignment = await db.positionAssignment.findFirst({
      where: {
        positionId: position.id,
        memberId: member.id,
        termId: termId,
      },
    });

    if (!existingAssignment) {
      await db.positionAssignment.create({
        data: {
          positionId: position.id,
          memberId: member.id,
          termId: termId,
          startDate: PERIODE_2026_2027.startDate,
          isCurrent: true,
        },
      });
    }

    console.log(`  ✓ ${bph.name}: ${bph.holderName}${bph.gelarAdat ? ` (${bph.gelarAdat})` : ""}`);
  }
}

async function seedDivisi(termId: string): Promise<void> {
  for (const divisi of DIVISI_DATA) {
    // Buat posisi kepala divisi
    const position = await db.organizationPosition.upsert({
      where: { code: divisi.code },
      create: {
        code: divisi.code,
        name: `Kepala ${divisi.name}`,
        level: divisi.level,
        sortOrder: 100 + DIVISI_DATA.indexOf(divisi),
      },
      update: { name: `Kepala ${divisi.name}` },
    });

    // Buat member untuk ketua divisi
    const ketuaMember = await db.member.upsert({
      where: { memberCode: `DIVISI-${divisi.code.toUpperCase()}-KETUA` },
      create: {
        memberCode: `DIVISI-${divisi.code.toUpperCase()}-KETUA`,
        fullName: divisi.ketua,
      },
      update: { fullName: divisi.ketua },
    });

    // Cek apakah assignment sudah ada
    const existingAssignment = await db.positionAssignment.findFirst({
      where: {
        positionId: position.id,
        memberId: ketuaMember.id,
        termId: termId,
      },
    });

    if (!existingAssignment) {
      await db.positionAssignment.create({
        data: {
          positionId: position.id,
          memberId: ketuaMember.id,
          termId: termId,
          startDate: PERIODE_2026_2027.startDate,
          isCurrent: true,
        },
      });
    }

    console.log(`  ✓ ${divisi.name}: ${divisi.ketua} (Ketua)`);

    // Buat member untuk anggota divisi
    for (const anggotaNama of divisi.anggota) {
      const anggotaMember = await db.member.upsert({
        where: { memberCode: `DIVISI-${divisi.code.toUpperCase()}-${divisi.anggota.indexOf(anggotaNama)}` },
        create: {
          memberCode: `DIVISI-${divisi.code.toUpperCase()}-${divisi.anggota.indexOf(anggotaNama)}`,
          fullName: anggotaNama,
        },
        update: { fullName: anggotaNama },
      });

      console.log(`    - ${anggotaNama}`);
    }
  }
}

async function seedBeritaPelantikan(): Promise<void> {
  // Kategori berita
  const category = await db.newsCategory.upsert({
    where: { slug: "pelantikan" },
    create: {
      slug: "pelantikan",
      name: "Pelantikan",
      sortOrder: 1,
    },
    update: { name: "Pelantikan" },
  });

  // Berita pelantikan
  const berita = await db.news.upsert({
    where: { slug: "pelantikan-kabinet-sabilulungan-2026" },
    create: {
      slug: "pelantikan-kabinet-sabilulungan-2026",
      title: "Pelantikan Kabinet Sabilulungan — Periode 2026/2027",
      excerpt:
        "Serah terima kepemimpinan dari M. Ramdan Irawan (Nata Prawira XIX) kepada Syachril Gunawan (Nata Prawira XX) pada Sabtu, 6 Juni 2026.",
      body: [
        "Pada Sabtu, 6 Juni 2026, KPMBR-YK mengadakan acara pelantikan Kabinet Sabilulungan untuk periode 2026/2027.",
        "",
        "Acara ini menandai serah terima kepemimpinan dari M. Ramdan Irawan (Nata Prawira XIX) kepada Syachril Gunawan (Nata Prawira XX).",
        "",
        "Gelar adat Nata Prawira XX diberikan oleh Sesepuh Adat Sunda di Yogyakarta, Raden Wadana Dipawangsayuda / Ki Demang Wangsafyudin, S.H., melalui Serat Kakancingan (Sabtu Wage, 20 Besar 1959 DAL / 06 Juni 2026), dengan hak: dipayungi payung Agung, memakai raksukan kadaleman, memakai sinjang rereng kujang, menyandang pusaka kujang tuturunan.",
        "",
        "Disahkan oleh SK Sesepuh No. 01/SESEPUH/KPMBR-YK/VI/2026.",
      ].join("\n"),
      categoryId: category.id,
      status: NewsStatus.PUBLISHED,
      publishedAt: new Date("2026-06-06"),
      authorName: "Sekretariat KPMBR-YK",
    },
    update: {
      title: "Pelantikan Kabinet Sabilulungan — Periode 2026/2027",
      excerpt:
        "Serah terima kepemimpinan dari M. Ramdan Irawan (Nata Prawira XIX) kepada Syachril Gunawan (Nata Prawira XX) pada Sabtu, 6 Juni 2026.",
    },
  });

  console.log(`✓ Berita pelantikan: ${berita.title}`);
}

async function seedAgendaPelantikan(): Promise<void> {
  const agenda = await db.event.upsert({
    where: { slug: "pelantikan-kabinet-sabilulungan" },
    create: {
      slug: "pelantikan-kabinet-sabilulungan",
      title: "Pelantikan Kabinet Sabilulungan",
      description:
        "Acara pelantikan Kabinet Sabilulungan untuk periode 2026/2027. Serah terima kepemimpinan dari M. Ramdan Irawan (Nata Prawira XIX) kepada Syachril Gunawan (Nata Prawira XX). Tanggal: 6 Juni 2026.",
      startsAt: new Date("2026-06-06"),
      location: "Yogyakarta",
      organizer: "KPMBR-YK",
      status: EventStatus.SELESAI,
    },
    update: {
      title: "Pelantikan Kabinet Sabilulungan",
      description:
        "Acara pelantikan Kabinet Sabilulungan untuk periode 2026/2027. Serah terima kepemimpinan dari M. Ramdan Irawan (Nata Prawira XIX) kepada Syachril Gunawan (Nata Prawira XX). Tanggal: 6 Juni 2026.",
    },
  });

  console.log(`✓ Agenda pelantikan: ${agenda.title}`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  assertSeedAllowed();

  console.log("\n=== Seed Data Asli KPMBR-YK (Berkas Pelantikan 2026/2027) ===\n");

  try {
    console.log("1. Periode kepengurusan:");
    const termId = await seedOrganizationTerm();

    console.log("\n2. BPH (Badan Pengurus Harian):");
    await seedBPH(termId);

    console.log("\n3. Divisi + Anggota:");
    await seedDivisi(termId);

    console.log("\n4. Berita pelantikan:");
    await seedBeritaPelantikan();

    console.log("\n5. Agenda pelantikan:");
    await seedAgendaPelantikan();

    console.log("\n✅ Seed data asli selesai!\n");
  } catch (error) {
    console.error("❌ Seed gagal:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main().catch(async (error: unknown) => {
  console.error("Seed gagal:", error);
  await db.$disconnect();
  process.exit(1);
});

/**
 * Seed KPMBR-YK — data MINIMAL untuk pengembangan.
 *
 * Prinsip yang DIWAJIBKAN di file ini:
 *
 * 1. **Tidak mengarang fakta organisasi.** Tidak ada nama pengurus, jumlah
 *    anggota, riwayat ketua, tanggal berdiri, alamat, nomor rekening, data
 *    keuangan, sponsor, prestasi, atau kegiatan nyata. Yang diisi hanya
 *    struktur (kategori berita, nama jabatan) dan placeholder yang jelas
 *    ditandai, supaya pengurus dapat menggantinya lewat dashboard.
 * 2. **Idempoten.** Semua baris di-upsert berdasarkan kunci alaminya
 *    (`email`, `slug`, `key`, `code`). Aman dijalankan berulang.
 * 3. **Tidak menghapus data.** Tidak ada `deleteMany` terhadap konten.
 * 4. **Tidak jalan di produksi.** Script menolak jalan bila
 *    `NODE_ENV === "production"` atau `DATABASE_URL` tidak menuju host lokal.
 * 5. **Akun dev punya password hardcoded** yang HANYA berlaku untuk
 *    pengembangan. Akun-akun ini ber-domain `.local` dan tidak boleh dibuat
 *    di produksi. Lihat docs/development-guide.md.
 */
import { db } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { ORGANIZATION, siteConfig } from "@/lib/site-config";
import {
  AnnouncementAudience,
  AnnouncementPriority,
  ContentKind,
  EventStatus,
  FinancialTransactionType,
  NewsStatus,
  ProgramStatus,
  PositionLevel,
  Role,
  UserStatus,
} from "@/generated/prisma/enums";

// -----------------------------------------------------------------------------
// PENJAGA LINGKUNGAN
// -----------------------------------------------------------------------------

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
      `Seed DITOLAK: DATABASE_URL menuju host "${host}", bukan host lokal. ` +
        "Seed hanya boleh dijalankan pada database pengembangan.",
    );
  }
}

/** Password akun dev. WAJIB diganti di produksi; akun dev tidak dibuat di sana. */
const DEV_PASSWORD = "KPMBR-YK-dev-2026!";

const DEV_ACCOUNTS: { email: string; role: Role }[] = [
  { email: "admin@kpmbr-yk.local", role: Role.ADMIN },
  { email: "pengurus@kpmbr-yk.local", role: Role.PENGURUS },
  { email: "bendahara@kpmbr-yk.local", role: Role.BENDAHARA },
  { email: "anggota@kpmbr-yk.local", role: Role.ANGGOTA },
  { email: "alumni@kpmbr-yk.local", role: Role.ALUMNI },
];

// -----------------------------------------------------------------------------
// PLACEHOLDER KONTEN
// -----------------------------------------------------------------------------

/** Tanggal relatif, bukan tanggal hardcoded, agar tidak mengarangjfakta. */
function hariLalu(offsetDays: number): Date {
  return new Date(Date.now() - offsetDays * 86_400_000);
}
function hariDepan(offsetDays: number): Date {
  return new Date(Date.now() + offsetDays * 86_400_000);
}

const PLACEHOLDER = "[Konten belum diisi. Pengurus wajib melengkapinya lewat dashboard.]";

/** Kunci konten statis. Harus sama dengan `CONTENT_KEYS` di query publik. */
const CONTENT = [
  { key: "sejarah", kind: ContentKind.SEJARAH, title: "Sejarah organisasi" },
  { key: "visi", kind: ContentKind.VISI, title: "Visi" },
  { key: "misi", kind: ContentKind.MISI, title: "Misi" },
  { key: "nilai", kind: ContentKind.NILAI, title: "Nilai" },
  { key: "identitas", kind: ContentKind.IDENTITAS, title: "Identitas" },
  { key: "struktur.divisi", kind: ContentKind.INFORMASI_UMUM, title: "Divisi" },
  { key: "keanggotaan.persyaratan", kind: ContentKind.KEANGGOTAAN, title: "Persyaratan" },
  { key: "keanggotaan.manfaat", kind: ContentKind.KEANGGOTAAN, title: "Manfaat" },
  { key: "keanggotaan.langkah", kind: ContentKind.KEANGGOTAAN, title: "Langkah pendaftaran" },
];

/** Nama jabatan (struktur organisasi, bukan data pribadi). */
const POSITIONS = [
  { code: "ketua", name: "Ketua", level: PositionLevel.KETUA, sortOrder: 1 },
  { code: "wakil-ketua", name: "Wakil Ketua", level: PositionLevel.WAKIL_KETUA, sortOrder: 2 },
  { code: "sekretaris", name: "Sekretaris", level: PositionLevel.SEKRETARIS, sortOrder: 3 },
  { code: "bendahara", name: "Bendahara", level: PositionLevel.BENDAHARA, sortOrder: 4 },
];

const NEWS = [
  {
    slug: "berita-perdana",
    title: `[CONTOH] Berita perdana ${ORGANIZATION.shortName}`,
    excerpt:
      "Contoh artikel untuk menguji CMS, pagination, dan SEO. Ganti lewat dashboard.",
    body: [
      "Paragraf ini adalah data contoh. Isinya tidak merujuk pada kegiatan nyata.",
      "",
      "Ganti judul, isi, kategori, dan status publikasi dari dashboard WITHOUT mengubah kode.",
    ].join("\n"),
    status: NewsStatus.PUBLISHED,
  },
  {
    slug: "berita-draf",
    title: `[CONTOH] Draf berita ${ORGANIZATION.shortName}`,
    excerpt: "Contoh artikel berstatus draf. Tidak muncul di halaman publik.",
    body: [
      "Draf ini sengaja tidak terbit.",
      "",
      "Gunakan untuk menguji permission `news:publish`: tanpa izin tersebut, draf tidak bisa diterbitkan.",
    ].join("\n"),
    status: NewsStatus.DRAFT,
  },
];

const PROGRAMS = [
  {
    slug: "program-kerja-contoh",
    name: `[CONTOH] Program kerja ${ORGANIZATION.shortName}`,
    description:
      "Contoh program kerja untuk menguji CMS, filter status, dan progres. Ganti lewat dashboard.",
    objective: "Menguji alur membuat dan memperbarui program kerja.",
    divisionName: "Belum ditentukan",
    status: ProgramStatus.DIRANCANG,
    progress: 0,
  },
];

const EVENTS = [
  {
    slug: "agenda-contoh",
    title: `[CONTOH] Agenda ${ORGANIZATION.shortName}`,
    description:
      "Contoh agenda untuk menguji daftar kegiatan, detail, dan filter waktu. Ganti lewat dashboard.",
    startsAt: hariDepan(30),
    location: "Belum ditentukan",
    organizer: ORGANIZATION.shortName,
    status: EventStatus.TERJADWAL,
  },
];

const ALBUMS = [
  {
    slug: "dokumentasi-contoh",
    title: `[CONTOH] Album dokumentasi ${ORGANIZATION.shortName}`,
    description:
      "Contoh album untuk menguji galeri. Jumlah foto sengaja 0 sampai ada item sungguhan.",
    eventDate: hariLalu(1),
  },
];

const ANNOUNCEMENTS = [
  {
    key: "pengumuman-contoh",
    title: `[CONTOH] Pengumuman ${ORGANIZATION.shortName}`,
    body: "Contoh pengumuman untuk menguji audience dan prioritas. Tanpa tenggat waktu.",
  },
];

// -----------------------------------------------------------------------------
// JALAN SEED
// -----------------------------------------------------------------------------

async function seedDevUsers(): Promise<number> {
  const passwordHash = await hashPassword(DEV_PASSWORD);
  for (const account of DEV_ACCOUNTS) {
    await db.user.upsert({
      where: { email: account.email },
      create: {
        email: account.email,
        passwordHash,
        role: account.role,
        status: UserStatus.ACTIVE,
        emailVerified: new Date(),
      },
// Password sengaja TIDAK di-overwrite pada update: bila admin sudah
      // mengganti password akun dev, seed tidak menimpanya diam-diam.
      update: {},
    });
  }
  return DEV_ACCOUNTS.length;
}

async function seedContents(): Promise<number> {
  for (const item of CONTENT) {
    await db.organizationContent.upsert({
      where: { key: item.key },
      create: {
        key: item.key,
        kind: item.kind,
        title: item.title,
        body: PLACEHOLDER,
        isPublished: true,
        publishedAt: new Date(),
      },
      // Placeholder tidak menimpa isi yang sudah diisi pengurus.
      update: {},
    });
  }
  return CONTENT.length;
}

async function seedPositions(): Promise<number> {
  for (const position of POSITIONS) {
    await db.organizationPosition.upsert({
      where: { code: position.code },
      create: position,
      update: { name: position.name, sortOrder: position.sortOrder },
    });
  }
  return POSITIONS.length;
}

async function seedNews(): Promise<number> {
  const category = await db.newsCategory.upsert({
    where: { slug: "umum" },
    create: { slug: "umum", name: "Umum", sortOrder: 99 },
    update: { name: "Umum" },
  });

  for (const item of NEWS) {
    const publishedAt = item.status === NewsStatus.PUBLISHED ? hariLalu(1) : null;
    await db.news.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        body: item.body,
        categoryId: category.id,
        status: item.status,
        publishedAt,
      },
      // Status tidak di-overwrite: keputusan editorial pengurus lebih penting
      // daripada isi seed.
      update: { title: item.title, excerpt: item.excerpt, body: item.body },
    });
  }
  return NEWS.length;
}

async function seedPrograms(): Promise<number> {
  for (const item of PROGRAMS) {
    await db.program.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        objective: item.objective,
        divisionName: item.divisionName,
        status: item.status,
        progress: item.progress,
        startDate: hariDepan(7),
        endDate: hariDepan(97),
      },
      update: { name: item.name, description: item.description, objective: item.objective },
    });
  }
  return PROGRAMS.length;
}

async function seedEvents(): Promise<number> {
  for (const item of EVENTS) {
    await db.event.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        title: item.title,
        description: item.description,
        startsAt: item.startsAt,
        location: item.location,
        organizer: item.organizer,
        status: item.status,
      },
      update: { title: item.title, description: item.description },
    });
  }
  return EVENTS.length;
}

async function seedAlbums(): Promise<number> {
  for (const item of ALBUMS) {
    await db.documentationAlbum.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        title: item.title,
        description: item.description,
        eventDate: item.eventDate,
        // `photoCount` = 0. Album contoh memang belum punya item, dan angka
        // jumlah foto harus selalu berasal dari `documentation_items`.
        photoCount: 0,
      },
      update: { title: item.title, description: item.description },
    });
  }
  return ALBUMS.length;
}

async function seedAnnouncements(): Promise<number> {
  for (const item of ANNOUNCEMENTS) {
    // `announcements` tidak punya kolom unik. Cocokkan lewat `title` yang
    // mengandung marker [CONTOH] supaya seed tetap idempoten.
    const existing = await db.announcement.findFirst({
      where: { title: item.title },
      select: { id: true },
    });
    if (!existing) {
      await db.announcement.create({
        data: {
          title: item.title,
          body: item.body,
          priority: AnnouncementPriority.NORMAL,
          audience: AnnouncementAudience.PUBLIC,
          publishedAt: new Date(),
          expiresAt: null,
        },
      });
    }
  }
  return ANNOUNCEMENTS.length;
}

async function seedFinancialCategories(): Promise<number> {
  const categories = [
    { slug: "iuran", name: "Iuran Anggota", type: FinancialTransactionType.INCOME },
    { slug: "sponsor", name: "Sponsor / Donasi", type: FinancialTransactionType.INCOME },
    { slug: "operasional", name: "Biaya Operasional", type: FinancialTransactionType.EXPENSE },
    { slug: "acara", name: "Biaya Acara", type: FinancialTransactionType.EXPENSE },
  ];

  for (const item of categories) {
    await db.financialCategory.upsert({
      where: { slug: item.slug },
      create: item,
      update: { name: item.name, type: item.type },
    });
  }
  return categories.length;
}

async function main(): Promise<void> {
  assertSeedAllowed();

  const results: [string, number][] = [
    ["Akun dev", await seedDevUsers()],
    ["Konten statis (placeholder)", await seedContents()],
    ["Nama jabatan", await seedPositions()],
    ["Berita", await seedNews()],
    ["Agenda", await seedEvents()],
    ["Program kerja", await seedPrograms()],
    ["Album dokumentasi", await seedAlbums()],
    ["Pengumuman", await seedAnnouncements()],
    ["Kategori keuangan", await seedFinancialCategories()],
  ];

  console.log(`\n=== Seed ${ORGANIZATION.shortName} (data contoh) ===\n`);
  for (const [label, count] of results) {
    console.log(`${label.padEnd(30)}: ${count}`);
  }
  console.log(`\nSitus   : ${siteConfig.url}`);
  console.log(`Akun dev: ${DEV_ACCOUNTS.map((a) => a.email).join(", ")}`);
  console.log(`Password dev (HANYA development): ${DEV_PASSWORD}`);
  console.log("Akun dev tidak dibuat di produksi dan password wajib diganti.\n");

  await db.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error("Seed gagal:", error);
  await db.$disconnect();
  process.exit(1);
});

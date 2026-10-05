/**
 * Pipeline aset brand — membuat favicon, apple-icon, dan logo navbar dari
 * satu berkas logo sumber.
 *
 * Jalankan: npm run assets:brand
 *
 * Asal logo: `src/assets/kpmbr-logo-source.png`
 * (ganti berkas itu bila organisasi memberikan logo baru, lalu jalankan ulang)
 *
 * Hasil:
 * - `src/assets/kpmbr-logo.png`  192px — logo untuk navbar/footer
 * - `src/app/icon.png`           256px — favicon
 * - `src/app/apple-icon.png`     180px — ikon iOS home screen
 *
 * sharp dipakai karena sudah menjadi dependensi runtime Next.js untuk optimasi
 * gambar, jadi script ini tidak menambah bobot dependensi. Kuantisasi palet
 * membuat PNG jauh lebih ringan dan pada logo dengan warna datar selisihnya
 * tidak kasat mata.
 */
import { mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE = resolve(ROOT, "src/assets/kpmbr-logo-source.png");

type Target = {
  /** Path output relatif terhadap root project. */
  out: string;
  /** Sisi kanvas persegi (px). */
  size: number;
  /** Kenapa ukuran ini dipilih. */
  note: string;
};

const TARGETS: Target[] = [
  {
    out: "src/assets/kpmbr-logo.png",
    size: 192,
    note: "navbar/footer, tampil sekitar 40px CSS dengan headroom untuk layar retina",
  },
  { out: "src/app/icon.png", size: 256, note: "favicon browser" },
  { out: "src/app/apple-icon.png", size: 180, note: "ikon iOS, spesifikasi 180x180" },
];

async function build() {
  const srcStat = await stat(SOURCE).catch(() => null);
  if (!srcStat) {
    throw new Error(
      `Berkas logo sumber tidak ditemukan: ${SOURCE}\n` +
        "Letakkan logo resmi (PNG transparan) di sana lalu jalankan ulang.",
    );
  }

  console.log(`Sumber: ${SOURCE} (${(srcStat.size / 1024).toFixed(1)} KB)\n`);

  for (const target of TARGETS) {
    const dest = resolve(ROOT, target.out);
    await mkdir(dirname(dest), { recursive: true });

    await sharp(SOURCE)
      // Pangkas margin kosong/transparan agar logo mengisi kanvas.
      .trim({ threshold: 12 })
      // Kanvas persegi, konten di tengah, sisanya transparan.
      .resize(target.size, target.size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      // Kuantisasi ke palet 256 warna supaya berkas jauh lebih ringan.
      .png({ palette: true, quality: 92, compressionLevel: 9, effort: 10 })
      .toFile(dest);

    const outStat = await stat(dest);
    console.log(
      `  ${target.out.padEnd(28)} ${String(target.size).padStart(3)}px  ` +
        `${(outStat.size / 1024).toFixed(1).padStart(6)} KB   (${target.note})`,
    );
  }

  console.log("\nSelesai. Latar transparan dipertahankan, tanpa kotak putih.");
}

build().catch((err: unknown) => {
  console.error("Gagal membuat aset brand:", err);
  process.exit(1);
});

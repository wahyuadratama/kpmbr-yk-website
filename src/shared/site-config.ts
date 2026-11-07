/**
 * Identitas resmi organisasi — SATU SUMBER KEBENARAN untuk nama organisasi.
 *
 * Nilai di sini dipakai seluruh website (header, footer, metadata, Open Graph,
 * halaman publik). Jangan menulis nama organisasi secara harfiah di komponen
 * atau halaman; pakai `siteConfig.name` / `siteConfig.fullName` /
 * `siteConfig.display` supaya perbaikan nama tidak harus menyentuh banyak file.
 */
export const ORGANIZATION = {
  /** Nama singkat resmi. */
  shortName: "KPMBR-YK",
  /** Nama lengkap resmi. */
  fullName: "Keluarga Pelajar dan Mahasiswa Bandung Raya Yogyakarta",
  /** Bentuk resmi saat nama singkat dan nama lengkap ditampilkan bersamaan. */
  display:
    "KPMBR-YK — Keluarga Pelajar dan Mahasiswa Bandung Raya Yogyakarta",
} as const;

/**
 * Konfigurasi identitas situs KPMBR-YK — metadata, navigasi, dan teks yang
 * dipakai lintas halaman.
 *
 * Nama organisasi TIDAK ditulis ulang di sini. Nilai diambil dari
 * `ORGANIZATION` di atas.
 */
export const siteConfig = {
  name: ORGANIZATION.shortName,
  fullName: ORGANIZATION.fullName,
  displayName: ORGANIZATION.display,
  tagline: "Bersatu, Berpikir, Bersama",
  description:
    "Platform digital resmi KPMBR-YK — Keluarga Pelajar dan Mahasiswa Bandung Raya Yogyakarta. Informasi organisasi, program kerja, agenda, dokumentasi, dan keanggotaan.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "id-ID",
  keywords: [
    "KPMBR-YK",
    "Keluarga Pelajar dan Mahasiswa Bandung Raya Yogyakarta",
    "organisasi mahasiswa Yogyakarta",
    "pelajar Yogyakarta",
    "mahasiswa Yogyakarta",
    "BEM",
    "UKM Yogyakarta",
  ],
  address: {
    street: "Jl. Pengok Kidul No.14, Baciro, Kec. Gondokusuman",
    city: "Yogyakarta",
    region: "Daerah Istimewa Yogyakarta",
    postalCode: "55225",
    country: "ID",
  },
  contact: {
    email: "kpmbandungraya@gmail.com",
    instagram: "https://instagram.com/kpmbandungraya.yk",
  },
} as const;

export type NavItem = {
  title: string;
  href: string;
  description?: string;
};

/**
 * Navigasi footer — dikelompokkan agar tidak menjadi daftar panjang.
 *
 * Menu navbar utama TIDAK ada di sini. Sumber kebenaran navigasi navbar
 * adalah `src/lib/navigation.ts`.
 */
export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Organisasi",
    items: [
      { title: "Tentang KPMBR-YK", href: "/tentang" },
      { title: "Sejarah", href: "/tentang#sejarah" },
      { title: "Visi & Misi", href: "/tentang#visi" },
      { title: "Kepengurusan", href: "/kepengurusan" },
    ],
  },
  {
    title: "Program",
    items: [
      { title: "Program Kerja", href: "/proker" },
      { title: "Agenda", href: "/agenda" },
      { title: "Dokumentasi", href: "/dokumentasi" },
      { title: "Berita", href: "/berita" },
    ],
  },
  {
    title: "Keanggotaan",
    items: [
      { title: "Cara Bergabung", href: "/keanggotaan" },
      { title: "Persyaratan", href: "/keanggotaan#persyaratan" },
      { title: "Manfaat Anggota", href: "/keanggotaan#manfaat" },
      { title: "Syarat & Ketentuan", href: "/syarat-ketentuan" },
    ],
  },
];

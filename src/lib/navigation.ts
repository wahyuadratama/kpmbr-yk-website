/**
 * Konfigurasi navigasi website publik — SATU SUMBER KEBENARAN untuk menu.
 *
 * Dipisah dari `src/lib/site-config.ts` (identitas situs) karena navigasi
 * punya bentuk berbeda: ia berupa pohon kategori, bukan daftar tautan datar.
 *(Component presentasi seperti `site-header.tsx` dan `not-found.tsx` membaca
 * dari sini, sehingga tidak ada daftar menu yang diduplikasi.)
 *
 * Aturan yang dijaga:
 * - SEMUA `href` menunjuk route yang benar-benar ada di `src/app/(public)`.
 *   Tidak ada tautan ke halaman kosong atau route hasil asumsi.
 * - Halaman yang berada di dalam sebuah kategori tetap punya tautan
 *   terpisah di panel dropdown, sehingga tidak ada akses yang hilang.
 * - `href` boleh memuat anchor (`/tentang#sejarah`); bagian anchor dipakai
 *   untuk menuju bagian tertentu pada halaman yang sama.
 */

/** Anak menu di dalam sebuah kategori. */
export type NavChild = {
  title: string;
  href: string;
  /** Keterangan singkat yang membantu pengguna memahami isi halaman. */
  description?: string;
};

/** Entri navbar: tautan langsung atau kategori dengan submenu. */
export type NavEntry =
  | { type: "link"; title: string; href: string }
  | {
      type: "dropdown";
      title: string;
      /** Route utama kategori — dipakai untuk state aktif. */
      href: string;
      children: NavChild[];
    };

/**
 * Menu navbar publik.
 *
 * Kategori: Tentang, Organisasi, Kegiatan, Informasi. "Beranda" adalah tautan
 * langsung, dan "Gabung" (> `joinCta`) adalah CTA terpisah.
 */
export const publicNav: NavEntry[] = [
  {
    type: "link",
    title: "Beranda",
    href: "/",
  },
  {
    type: "dropdown",
    title: "Tentang",
    href: "/tentang",
    children: [
      {
        title: "Profil KPMBR-YK",
        href: "/tentang",
        description: "Identitas, visi, misi, dan profil organisasi",
      },
      {
        title: "Sejarah Organisasi",
        href: "/tentang#sejarah",
        description: "Perjalanan KPMBR-YK sejak berdiri",
      },
      {
        title: "Nilai & Budaya Sunda",
        href: "/tentang#nilai",
        description: "Nilai yang dipegang dan diwariskan",
      },
      {
        title: "Kontak",
        href: "/kontak",
        description: "Hubungi Sekretariat KPMBR-YK",
      },
    ],
  },
  {
    type: "dropdown",
    title: "Organisasi",
    href: "/kepengurusan",
    children: [
      {
        title: "Kepengurusan Saat Ini",
        href: "/kepengurusan",
        description: "Jabatan inti beserta penanggung jawabnya",
      },
      {
        title: "Struktur Organisasi",
        href: "/tentang#pengurus",
        description: "Divisi yang menjalankan program kerja",
      },
      {
        title: "Alumni & Demisioner",
        href: "/alumni-direktori",
        description: "Direktori anggota yang telah lulus",
      },
    ],
  },
  {
    type: "dropdown",
    title: "Kegiatan",
    href: "/proker",
    children: [
      {
        title: "Program Kerja",
        href: "/proker",
        description: "Program yang sedang dan telah dijalankan",
      },
      {
        title: "Agenda Kegiatan",
        href: "/agenda",
        description: "Jadwal kegiatan organisasi",
      },
      {
        title: "Dokumentasi",
        href: "/dokumentasi",
        description: "Dokumentasi foto kegiatan organisasi",
      },
    ],
  },
  {
    type: "dropdown",
    title: "Informasi",
    href: "/berita",
    children: [
      {
        title: "Berita",
        href: "/berita",
        description: "Kabar terbaru dari organisasi",
      },
    ],
  },
];

/**
 * CTA utama navbar: ajakan bergabung.
 *
 * Pendaftaran daring BELUM tersedia — halaman keanggotaan memuat alur
 * pendaftaran manual ke Sekretariat. Karena itu tujuan CTA adalah bagian
 * "Cara bergabung" pada halaman keanggotaan, bukan halaman pendaftaran.
 */
export const joinCta: { title: string; href: string } = {
  title: "Gabung",
  href: "/keanggotaan#bergabung",
};

/** Ambil bagian path dari `href`, buang anchor dan query. */
export function pathOf(href: string): string {
  const withoutQuery = href.split("?")[0] ?? href;
  const withoutHash = withoutQuery.split("#")[0] ?? withoutQuery;
  return withoutHash.length > 0 ? withoutHash : "/";
}

/**
 * Apakah halaman saat ini termasuk dalam `href`?
 *
 * Perbandingan dilakukan pada bagian path saja, sehingga anchor
 * (`/tentang#sejarah`) dianggap aktif saat berada di `/tentang`. Route induk
 * tidak keliru menandai halaman yang tidak berkaitan: `/kepengurusan` TIDAK
 * menandai `/keanggotaan` sebagai aktif.
 */
export function isHrefActive(pathname: string, href: string): boolean {
  const path = pathOf(href);
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Apakah salah satu anak menu sedang aktif?
 *
 * Dipakai untuk menandai kategori induk (mis. "Tentang") saat pengguna berada
 * di salah satu halamannya.
 */
export function hasActiveChild(pathname: string, children: NavChild[]): boolean {
  return children.some((child) => isHrefActive(pathname, child.href));
}

/**
 * Child pertama yang cocok dengan halaman saat ini.
 *
 * Beberapa kategori punya lebih dari satu anak yang menunjuk path yang sama
 * tetapi anchor berbeda (mis. "Profil" dan "Sejarah" keduanya menuju
 * `/tentang`). Tanpa helper ini, ketiganya akan tampil aktif bersamaan.
 * Dengan mengambil anak pertama yang cocok, tepat satu item yang ditandai
 * aktif per kategori.
 */
export function activeChildHref(
  pathname: string,
  children: NavChild[],
): string | null {
  for (const child of children) {
    if (isHrefActive(pathname, child.href)) return child.href;
  }
  return null;
}

/** Daftar seluruh tautan yang bisa dicapai dari navbar (dataran). */
export function flattenNavLinks(entries: NavEntry[]): NavChild[] {
  const links: NavChild[] = [];
  for (const entry of entries) {
    if (entry.type === "link") {
      links.push({ title: entry.title, href: entry.href });
    } else {
      links.push(...entry.children);
    }
  }
  return links;
}

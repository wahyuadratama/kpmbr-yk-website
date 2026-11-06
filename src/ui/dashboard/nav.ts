/**
 * Konfigurasi navigasi dashboard (CMS).
 *
 * Satu sumber kebenaran untuk menu tiap portal. Setiap entri membawa
 * permission yang dibutuhkan agar item tersebut ditampilkan; penyaringan
 * dilakukan di server (layout), sehingga menu yang tidak boleh diakses
 * tidak pernah ikut ter-render ke browser.
 *
 * Ikon disimpan sebagai NAMA STRING, bukan komponen React: komponen React
 * tidak boleh diteruskan dari Server Component ke Client Component. Pemetaan
 * nama ke ikon ada di `src/lib/dashboard/icons.ts`.
 */
import { hasPermission, type Permission, type Role } from "@/lib/auth/permissions";
import type { DashboardIconName } from "@/lib/dashboard/icons";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: DashboardIconName;
  /** Permission yang dibutuhkan. Kosong = semua role portal boleh melihat. */
  permission?: Permission;
};

export type DashboardNavGroup = {
  /** Label kategori; `null` berarti grup tanpa judul. */
  label: string | null;
  items: DashboardNavItem[];
};

/* -------------------------------------------------------------------------- */
/* ADMIN                                                                      */
/* -------------------------------------------------------------------------- */

export const ADMIN_NAV: DashboardNavGroup[] = [
  {
    label: null,
    items: [{ title: "Dashboard", href: "/admin", icon: "home" }],
  },
  {
    label: "Konten",
    items: [
      {
        // Daftar terpadu seluruh konten publik (berita, pengumuman, program
        // kerja, agenda, dokumentasi) dengan tab dan pencarian.
        title: "Semua Konten",
        href: "/admin/konten",
        icon: "news",
        permission: "news:read",
      },
      {
        // Modul program, agenda, dan dokumentasi punya route CMS sendiri di
        // portal admin DAN di portal pengurus. Tampilannya sama (satu
        // implementasi di src/modules/*/admin-view.tsx), tetapi alamatnya
        // berbeda supaya navigasi tidak melompat ke portal lain.
        title: "Program Kerja",
        href: "/admin/proker",
        icon: "folder",
        permission: "program:read",
      },
      {
        title: "Agenda",
        href: "/admin/agenda",
        icon: "calendar",
        permission: "event:read",
      },
      {
        title: "Dokumentasi",
        href: "/admin/dokumentasi",
        icon: "image",
        permission: "documentation:read",
      },
      {
        title: "Arsip Dokumen",
        href: "/admin/arsip",
        icon: "file",
        permission: "document:read",
      },
    ],
  },
  {
    label: "Organisasi",
    items: [
      {
        title: "Anggota",
        href: "/admin/anggota",
        icon: "users",
        permission: "member:read",
      },
      {
        title: "Alumni",
        href: "/admin/alumni",
        icon: "users",
        permission: "member:read",
      },
    ],
  },
  {
    label: "Keuangan",
    items: [
      {
        // Route CMS keuangan punya alamat sendiri di tiap portal. Tampilannya
        // sama (satu implementasi di src/modules/finance/*-view.tsx), tetapi
        // alamatnya berbeda supaya navigasi tidak melompat ke portal lain.
        title: "Transaksi",
        href: "/admin/transaksi",
        icon: "wallet",
        permission: "finance:read_transaction",
      },
      {
        title: "Laporan Keuangan",
        href: "/admin/laporan",
        icon: "chart",
        permission: "finance:read_summary",
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        title: "Pengguna",
        href: "/admin/users",
        icon: "users",
        permission: "user:read",
      },
      {
        title: "Log Audit",
        href: "/admin/audit-log",
        icon: "list",
        permission: "audit_log:read",
      },
      {
        title: "Pengaturan Website",
        href: "/admin/pengaturan",
        icon: "settings",
        permission: "website:read",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* PENGURUS                                                                   */
/* -------------------------------------------------------------------------- */

export const PENGURUS_NAV: DashboardNavGroup[] = [
  {
    label: null,
    items: [{ title: "Dashboard", href: "/pengurus", icon: "home" }],
  },
  {
    label: "Konten",
    items: [
      {
        title: "Program Kerja",
        href: "/pengurus/proker",
        icon: "folder",
        permission: "program:read",
      },
      {
        title: "Agenda",
        href: "/pengurus/agenda",
        icon: "calendar",
        permission: "event:read",
      },
      {
        title: "Dokumentasi",
        href: "/pengurus/dokumentasi",
        icon: "image",
        permission: "documentation:read",
      },
      {
        title: "Berita & Pengumuman",
        href: "/pengurus/berita",
        icon: "news",
        permission: "news:read",
      },
    ],
  },
  {
    label: "Laporan",
    items: [
      {
        title: "Laporan Keuangan",
        href: "/pengurus/laporan",
        icon: "chart",
        permission: "finance:read_summary",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* BENDAHARA                                                                  */
/* -------------------------------------------------------------------------- */

export const BENDAHARA_NAV: DashboardNavGroup[] = [
  {
    label: null,
    items: [{ title: "Dashboard", href: "/bendahara", icon: "home" }],
  },
  {
    label: "Keuangan",
    items: [
      {
        title: "Transaksi",
        href: "/bendahara/transaksi",
        icon: "wallet",
        permission: "finance:read_transaction",
      },
      {
        title: "Kategori",
        href: "/bendahara/kategori",
        icon: "list",
        permission: "finance:read_transaction",
      },
      {
        title: "Laporan",
        href: "/bendahara/laporan",
        icon: "chart",
        permission: "finance:read_summary",
      },
      {
        title: "Transparansi",
        href: "/bendahara/transparansi",
        icon: "receipt",
        permission: "finance:read_summary",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* ANGGOTA & ALUMNI                                                           */
/* -------------------------------------------------------------------------- */

export const MEMBER_NAV: DashboardNavGroup[] = [
  {
    label: null,
    items: [{ title: "Dashboard", href: "/member", icon: "home" }],
  },
  {
    label: "Saya",
    items: [
      { title: "Profil Saya", href: "/member/profil", icon: "users" },
      { title: "Kartu Anggota", href: "/member/kartu", icon: "shield" },
    ],
  },
  {
    label: "Informasi",
    items: [
      { title: "Agenda", href: "/member/agenda", icon: "calendar" },
      { title: "Pengumuman", href: "/member/pengumuman", icon: "megaphone" },
      {
        title: "Transparansi Keuangan",
        href: "/member/transparansi",
        icon: "chart",
        permission: "finance:read_summary",
      },
    ],
  },
];

export const ALUMNI_NAV: DashboardNavGroup[] = [
  {
    label: null,
    items: [{ title: "Dashboard", href: "/alumni", icon: "home" }],
  },
  {
    label: "Saya",
    items: [
      { title: "Profil Alumni", href: "/alumni/profil", icon: "users" },
    ],
  },
  {
    label: "Informasi",
    items: [
      { title: "Agenda", href: "/alumni/agenda", icon: "calendar" },
      { title: "Pengumuman", href: "/alumni/pengumuman", icon: "megaphone" },
    ],
  },
];

/**
 * Saring menu sesuai permission role.
 *
 * Dipanggil di server pada layout portal, sehingga item yang tidak boleh
 * diakses TIDAK PERNAH ikut ter-render ke browser. Ini hanya soal tampilan —
 * otorisasi tetap ditegakkan pada setiap aksi dan query.
 */
export function filterNavForRole(
  groups: DashboardNavGroup[],
  role: Role,
): DashboardNavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || hasPermission(role, item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

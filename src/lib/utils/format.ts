/**
 * Format & normalisasi data untuk seluruh UI.
 * Semua output mengikuti konvensi Indonesia (id-ID).
 */

const RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const ANGKA = new Intl.NumberFormat("id-ID");

/** Format nilai uang dalam rupiah penuh, mis. `Rp 1.500.000`. */
export function formatRupiah(value: number | bigint): string {
  return RUPIAH.format(typeof value === "bigint" ? Number(value) : value);
}

/** Format angka, mis. `1.500`. */
export function formatNumber(value: number | bigint): string {
  return ANGKA.format(typeof value === "bigint" ? Number(value) : value);
}

const TANGGAL_PANJANG = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const TANGGAL_PENDEK = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const HARI_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const JAM = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

/** `10 Oktober 2026` */
export function formatTanggal(date: Date | string): string {
  return TANGGAL_PANJANG.format(toDate(date));
}

/** `10 Okt 2026` */
export function formatTanggalPendek(date: Date | string): string {
  return TANGGAL_PENDEK.format(toDate(date));
}

/** `Jumat, 10 Oktober 2026` */
export function formatTanggalLengkap(date: Date | string): string {
  return HARI_TANGGAL.format(toDate(date));
}

/** `19:30 WIB` */
export function formatJam(date: Date | string): string {
  return `${JAM.format(toDate(date))} WIB`;
}

/** Angka hari tanpa nol, mis. `10` — dipakai pada blok tanggal. */
export function formatHari(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(toDate(date));
}

/** Singkatan bulan, mis. `OKT` — dipakai pada blok tanggal. */
export function formatBulanSingkat(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    timeZone: "Asia/Jakarta",
  })
    .format(toDate(date))
    .replace(".", "")
    .toUpperCase();
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Ubah teks bebas menjadi slug URL: `Judul Berita!` → `judul-berita`. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/** Potong teks pada batas kata dan tambahkan elipsis. */
export function truncate(input: string, maxLength = 140): string {
  if (input.length <= maxLength) return input;
  const cut = input.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Ambil inisial untuk avatar cadangan, mis. `Ahmad Fauzi` → `AF`. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
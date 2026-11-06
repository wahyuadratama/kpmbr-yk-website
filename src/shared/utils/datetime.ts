/**
 * Pemrosesan tanggal dan waktu.
 *
 * Konvensi yang dipakai seluruh aplikasi:
 *
 * - Kolom `DateTime` di MySQL adalah `DATETIME` TANPA zona waktu. Prisma
 *   membaca dan menulis nilai tersebut sebagai UTC.
 * - Semua tanggal disimpan sebagai UTC.
 * - Semua tanggal ditampilkan dalam zona organisasi, `Asia/Jakarta` (WIB).
 *   Fungsi `formatTanggal` dan temannya di `src/lib/utils/format.ts` sudah
 *   memakai zona tersebut.
 *
 * Yang perlu diperhatikan adalah MASUKAN form: nilai dari
 * `<input type="datetime-local">` tidak membawa zona waktu, sehingga
 * `new Date("2026-10-21T10:00")` akan ditafsirkan sebagai waktu lokal
 * SERVER. Kalau server berjalan di zona lain, nilai yang tersimpan bergeser
 * beberapa jam. Fungsi di bawah menafsirkan input tersebut sebagai waktu WIB
 * secara eksplisit, sehingga hasilnya sama di mana pun server dijalankan.
 */

/** Zona waktu organisasi. WIB = UTC+7 dan tidak memakai daylight saving. */
export const ORGANIZATION_TIMEZONE = "Asia/Jakarta";

/** Selisih WIB terhadap UTC dalam menit. */
const WIB_OFFSET_MINUTES = 7 * 60;

const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Tafsirkan nilai `datetime-local` sebagai waktu WIB.
 *
 * Hasilnya adalah `Date` UTC — sesuai cara Prisma menyimpan `DATETIME`.
 * Nilai yang tidak dikenali diteruskan ke `new Date(value)` supaya galat
 * validasi tetap ditangani di lapisan skema.
 */
export function parseLocalDateTime(value: string): Date {
  const match = DATE_TIME_PATTERN.exec(value.trim());
  if (!match) return new Date(value);

  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second ?? "0"),
    ) - WIB_OFFSET_MINUTES * 60_000,
  );
}

/**
 * Tafsirkan nilai `date` sebagai tengah malam WIB.
 *
 * Dipakai untuk kolom yang hanya menyimpan tanggal (tanpa jam), seperti
 * tanggal album dokumentasi dan tanggal transaksi keuangan.
 */
export function parseLocalDate(value: string): Date {
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) return new Date(value);

  const [, year, month, day] = match;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)) -
      WIB_OFFSET_MINUTES * 60_000,
  );
}

/**
 * Nilai default hari ini dalam format `yyyy-MM-dd` pada zona WIB.
 *
 * Dipakai sebagai nilai awal `<input type="date">` sehingga tanggal yang
 * dipilih Default sesuai hari di WIB, bukan hari di zona server.
 */
export function todayInOrganizationTimezone(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ORGANIZATION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts;
}

/**
 * Pengaturan website & status operasional.
 *
 * Tabel `website_settings` berisi baris TUNGGAL (id = "default"). Fungsinya:
 * - status maintenance, ditegakkan di lapisan request (`src/proxy.ts`), bukan
 *   dengan menyembunyikan elemen di frontend;
 * - identitas, kontak, metadata SEO, dan struktur navigasi yang dapat disunting
 *   admin.
 *
 * Catatan performa: pemeriksaan maintenance terjadi pada setiap request
 * halaman publik. Query diambil satu kolom boolean dan hasilnya disimpan di
 * memori proses dengan TTL pendek supaya tidak membebani database.
 */
import "server-only";
import { db } from "@/lib/db/prisma";

/** TTL cache status maintenance di memori (detik). */
const MAINTENANCE_TTL_MS = 5_000;

type MaintenanceState = {
  enabled: boolean;
  message: string | null;
  estimateAt: Date | null;
  startedAt: Date | null;
};

let cache: { value: MaintenanceState; expiresAt: number } | null = null;

/** Pesan bawaan ketika admin tidak menulis pesan sendiri. */
export const DEFAULT_MAINTENANCE_MESSAGE =
  "Website KPMBR-YK sedang dalam pemeliharaan terjadwal. Mohon maaf atas ketidaknyamanannya.";

/**
 * Status maintenance saat ini.
 *
 * Dikembalikan dari cache memori ber-TTL pendek supaya request halaman publik
 * tidak selalu menyentuh database. `resetMaintenanceCache()` dipakai setelah
 * admin mengubah status agar perubahan langsung berlaku.
 */
export async function getMaintenanceState(): Promise<MaintenanceState> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;

  const row = await db.websiteSetting.findUnique({
    where: { id: "default" },
    select: {
      isMaintenanceEnabled: true,
      maintenanceMessage: true,
      maintenanceEstimateAt: true,
      maintenanceStartedAt: true,
    },
  });

  const value: MaintenanceState = {
    enabled: row?.isMaintenanceEnabled ?? false,
    message: row?.maintenanceMessage ?? null,
    estimateAt: row?.maintenanceEstimateAt ?? null,
    startedAt: row?.maintenanceStartedAt ?? null,
  };

  cache = { value, expiresAt: now + MAINTENANCE_TTL_MS };
  return value;
}

/** Buang cache status maintenance. Dipanggil setelah admin mengubahnya. */
export function resetMaintenanceCache(): void {
  cache = null;
}

/** Apakah website sedang dalam mode pemeliharaan? */
export async function isMaintenanceActive(): Promise<boolean> {
  return (await getMaintenanceState()).enabled;
}

/** Pesan maintenance yang berlaku (memakai pesan bawaan bila kosong). */
export async function getMaintenanceMessage(): Promise<string> {
  const state = await getMaintenanceState();
  return state.message?.trim() || DEFAULT_MAINTENANCE_MESSAGE;
}

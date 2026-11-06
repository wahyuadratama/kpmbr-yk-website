import type { Metadata } from "next";
import { requirePermissionPage } from "@/server/auth/guards";
import { LaporanKeuanganAdminView } from "@/ui/components/modules/finance-laporan-view";

export const metadata: Metadata = { title: "Laporan Keuangan" };
export const dynamic = "force-dynamic";

/**
 * Laporan keuangan dari sisi pengurus.
 *
 * Pengurus punya `finance:read_summary` sehingga boleh MELIHAT laporan, tapi
 * tidak punya `finance:approve`/`finance:publish` sehingga tombol Setujui dan
 * Publikasikan tidak pernah muncul di sini. Tampilan yang sama dipakai portal
 * bendahara dan admin (`src/modules/finance/laporan-view.tsx`).
 */
export default async function PengurusLaporanPage() {
  const principal = await requirePermissionPage("finance:read_summary", "/pengurus");
  return <LaporanKeuanganAdminView principal={principal} />;
}

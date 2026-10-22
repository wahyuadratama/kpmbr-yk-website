import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { LaporanKeuanganAdminView } from "@/modules/finance/laporan-view";

export const metadata: Metadata = { title: "Laporan Keuangan" };
export const dynamic = "force-dynamic";

/**
 * Laporan keuangan beserta alur pemeriksaan dan publikasinya.
 *
 * Tampilan dipakai bersama dengan portal admin dan portal pengurus
 * (`src/modules/finance/laporan-view.tsx`). Otorisasi tiap aksi tetap
 * diperiksa lewat permission di dalam tampilan.
 */
export default async function LaporanPage() {
  const principal = await requirePortalPage("/bendahara");
  return <LaporanKeuanganAdminView principal={principal} />;
}

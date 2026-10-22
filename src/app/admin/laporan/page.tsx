import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/guards";
import { LaporanKeuanganAdminView } from "@/modules/finance/laporan-view";

export const metadata: Metadata = { title: "Laporan Keuangan" };
export const dynamic = "force-dynamic";

/**
 * Laporan keuangan dari Admin Control Center.
 *
 * Tampilan sama dengan portal bendahara dan portal pengurus
 * (`src/modules/finance/laporan-view.tsx`), tetapi tetap berada di dalam
 * portal admin supaya navigasi tidak melompat ke portal lain.
 */
export default async function AdminLaporanPage() {
  const principal = await requirePermissionPage("finance:read_summary");
  return <LaporanKeuanganAdminView principal={principal} />;
}

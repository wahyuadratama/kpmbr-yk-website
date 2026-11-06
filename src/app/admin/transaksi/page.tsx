import type { Metadata } from "next";
import { requirePermissionPage } from "@/server/auth/guards";
import { TransaksiAdminView } from "@/ui/components/modules/finance-transaksi-view";

export const metadata: Metadata = { title: "Transaksi" };
export const dynamic = "force-dynamic";

/**
 * Transaksi keuangan dari Admin Control Center.
 *
 * Tampilan sama dengan portal bendahara
 * (`src/modules/finance/transaksi-view.tsx`), tetapi tetap berada di dalam
 * portal admin supaya navigasi tidak melompat ke portal lain.
 */
export default async function AdminTransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const principal = await requirePermissionPage("finance:read_transaction");
  const params = await searchParams;
  return (
    <TransaksiAdminView
      principal={principal}
      searchParams={params}
      basePath="/admin/transaksi"
    />
  );
}

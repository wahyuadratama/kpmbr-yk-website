import type { Metadata } from "next";
import { requirePortalPage } from "@/server/auth/guards";
import { TransaksiAdminView } from "@/ui/components/modules/finance-transaksi-view";

export const metadata: Metadata = { title: "Transaksi" };
export const dynamic = "force-dynamic";

/**
 * CMS transaksi keuangan.
 *
 * Tampilan dipakai bersama dengan portal admin dan portal pengurus
 * (`src/modules/finance/transaksi-view.tsx`); yang membedakan hanya guard
 * portalnya dan permission yang dimiliki role.
 */
export default async function TransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const principal = await requirePortalPage("/bendahara");
  const params = await searchParams;
  return (
    <TransaksiAdminView
      principal={principal}
      searchParams={params}
      basePath="/bendahara/transaksi"
    />
  );
}

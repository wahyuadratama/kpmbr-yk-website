import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { DokumentasiAdminView } from "@/modules/documentation/admin-view";

export const metadata: Metadata = { title: "Kelola Dokumentasi" };
export const dynamic = "force-dynamic";

/**
 * Pengelolaan album dokumentasi.
 *
 * Tampilan dipakai bersama dengan portal admin
 * (`src/modules/documentation/admin-view.tsx`); yang membedakan hanya guard
 * portalnya.
 */
export default async function DokumentasiPage() {
  const principal = await requirePortalPage("/pengurus");
  return <DokumentasiAdminView principal={principal} />;
}

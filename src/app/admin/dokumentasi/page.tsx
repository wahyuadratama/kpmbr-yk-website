import type { Metadata } from "next";
import { requirePermissionPage } from "@/server/auth/guards";
import { DokumentasiAdminView } from "@/server/modules/documentation/admin-view";

export const metadata: Metadata = { title: "Dokumentasi" };
export const dynamic = "force-dynamic";

/**
 * Pengelolaan dokumentasi dari Admin Control Center.
 *
 * Tampilan sama dengan portal pengurus
 * (`src/modules/documentation/admin-view.tsx`), tetapi tetap berada di dalam
 * portal admin supaya navigasi tidak melompat ke portal lain.
 */
export default async function AdminDokumentasiPage() {
  const principal = await requirePermissionPage("documentation:read");
  return <DokumentasiAdminView principal={principal} />;
}

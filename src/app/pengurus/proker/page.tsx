import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { ProgramKerjaAdminView } from "@/modules/programs/admin-view";

export const metadata: Metadata = { title: "Kelola Program Kerja" };
export const dynamic = "force-dynamic";

/**
 * Pengelolaan program kerja.
 *
 * Tampilan dipakai bersama dengan portal admin
 * (`src/modules/programs/admin-view.tsx`); yang membedakan hanya guard
 * portalnya.
 */
export default async function ProkerPage() {
  const principal = await requirePortalPage("/pengurus");
  return <ProgramKerjaAdminView principal={principal} />;
}

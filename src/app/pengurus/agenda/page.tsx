import type { Metadata } from "next";
import { requirePortalPage } from "@/server/auth/guards";
import { AgendaAdminView } from "@/ui/components/modules/events-admin-view";

export const metadata: Metadata = { title: "Kelola Agenda" };
export const dynamic = "force-dynamic";

/**
 * Pengelolaan agenda kegiatan.
 *
 * Tampilan dipakai bersama dengan portal admin
 * (`src/modules/events/admin-view.tsx`); yang membedakan hanya guard portalnya.
 */
export default async function AgendaPage() {
  const principal = await requirePortalPage("/pengurus");
  return <AgendaAdminView principal={principal} />;
}

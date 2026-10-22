import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/guards";
import { AgendaAdminView } from "@/modules/events/admin-view";

export const metadata: Metadata = { title: "Agenda" };
export const dynamic = "force-dynamic";

/**
 * Pengelolaan agenda dari Admin Control Center.
 *
 * Tampilan sama dengan portal pengurus (`src/modules/events/admin-view.tsx`),
 * tetapi tetap berada di dalam portal admin supaya navigasi tidak melompat
 * ke portal lain.
 */
export default async function AdminAgendaPage() {
  const principal = await requirePermissionPage("event:read");
  return <AgendaAdminView principal={principal} />;
}

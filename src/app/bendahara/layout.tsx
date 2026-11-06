import type { ReactNode } from "react";
import { requirePortalPage } from "@/server/auth/guards";
import { DashboardShell } from "@/ui/components/dashboard/dashboard-shell";
import { BENDAHARA_NAV, filterNavForRole } from "@/ui/dashboard/nav";

/**
 * Layout portal bendahara.
 *
 * Guard menolak role selain BENDAHARA dan ADMIN dengan HTTP 403. Menu
 * bendahara tidak memuat modul administrasi (pengguna, pengaturan website,
 * audit log) —-wewenang tersebut milik ADMIN.
 */
export const dynamic = "force-dynamic";

export default async function BendaharaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const principal = await requirePortalPage("/bendahara");

  return (
    <DashboardShell
      portalLabel="Portal Bendahara"
      nav={filterNavForRole(BENDAHARA_NAV, principal.role)}
      role={principal.role}
      email={principal.email}
    >
      {children}
    </DashboardShell>
  );
}

import type { ReactNode } from "react";
import { requirePortalPage } from "@/server/auth/guards";
import { DashboardShell } from "@/ui/components/dashboard/dashboard-shell";
import { ALUMNI_NAV, filterNavForRole } from "@/ui/dashboard/nav";

/**
 * Layout `/alumni`.
 *
 * Guard menolak role selain ALUMNI dan ADMIN dengan HTTP 403. Status alumni
 * tidak otomatis memberi akses pengurus maupun administrator.
 */
export const dynamic = "force-dynamic";

export default async function AlumniLayout({
  children,
}: {
  children: ReactNode;
}) {
  const principal = await requirePortalPage("/alumni");

  return (
    <DashboardShell
      portalLabel="Portal Alumni"
      nav={filterNavForRole(ALUMNI_NAV, principal.role)}
      role={principal.role}
      email={principal.email}
    >
      {children}
    </DashboardShell>
  );
}

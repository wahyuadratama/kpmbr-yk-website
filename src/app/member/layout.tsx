import type { ReactNode } from "react";
import { requirePortalPage } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MEMBER_NAV, filterNavForRole } from "@/lib/dashboard/nav";

/**
 * Layout `/member`.
 *
 * Guard menolak role selain ANGGOTA, PENGURUS, dan ADMIN dengan HTTP 403.
 * ALUMNI tidak termasuk: alumni memakai portal `/alumni`.
 */
export const dynamic = "force-dynamic";

export default async function MemberLayout({
  children,
}: {
  children: ReactNode;
}) {
  const principal = await requirePortalPage("/member");

  return (
    <DashboardShell
      portalLabel="Portal Anggota"
      nav={filterNavForRole(MEMBER_NAV, principal.role)}
      role={principal.role}
      email={principal.email}
    >
      {children}
    </DashboardShell>
  );
}

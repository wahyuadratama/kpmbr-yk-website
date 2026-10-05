import type { ReactNode } from "react";
import { requirePortalPage } from "@/lib/auth/guards";
import { PortalShell } from "@/components/layout/portal-shell";

/**
 * Layout `/member`.
 *
 * Guard menolak role selain ANGGOTA, PENGURUS, dan ADMIN dengan HTTP 403.
 * ALUMNI tidak termasuk: alumni memakai portal `/alumni`.
 */
export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const principal = await requirePortalPage("/member");
  return (
    <PortalShell path="member" principal={principal}>
      {children}
    </PortalShell>
  );
}
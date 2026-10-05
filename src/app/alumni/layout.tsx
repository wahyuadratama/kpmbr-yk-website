import type { ReactNode } from "react";
import { requirePortalPage } from "@/lib/auth/guards";
import { PortalShell } from "@/components/layout/portal-shell";

/**
 * Layout `/alumni`.
 *
 * Guard menolak role selain ALUMNI dan ADMIN dengan HTTP 403. Stage 5 akan
 * menambah isi portal ini; yang diuji sekarang adalah batas aksesnya saja.
 */
export const dynamic = "force-dynamic";

export default async function AlumniLayout({ children }: { children: ReactNode }) {
  const principal = await requirePortalPage("/alumni");
  return (
    <PortalShell path="alumni" principal={principal}>
      {children}
    </PortalShell>
  );
}
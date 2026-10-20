import type { ReactNode } from "react";
import { requirePortalPage } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ADMIN_NAV, filterNavForRole } from "@/lib/dashboard/nav";

/**
 * Layout area admin — CMS Administrator.
 *
 * `requirePortalPage("/admin")` membungkus seluruh subtree: tanpa sesi valid
 * pengunjung ke `/login`, dan role selain ADMIN mendapat HTTP 403. Keduanya
 * DI SERVER, bukan sekadar menyembunyikan menu.
 *
 * Menu dashboard disaring di server berdasarkan permission role, sehingga item
 * yang tidak boleh diakses tidak pernah ikut ter-render.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const principal = await requirePortalPage("/admin");

  return (
    <DashboardShell
      portalLabel="CMS Administrator"
      nav={filterNavForRole(ADMIN_NAV, principal.role)}
      role={principal.role}
      email={principal.email}
    >
      {children}
    </DashboardShell>
  );
}

import type { ReactNode } from "react";
import { requirePortalPage } from "@/server/auth/guards";
import { DashboardShell } from "@/ui/components/dashboard/dashboard-shell";
import { PENGURUS_NAV, filterNavForRole } from "@/ui/dashboard/nav";

/**
 * Layout `/pengurus`.
 *
 * Guard menolak role selain PENGURUS dan ADMIN dengan HTTP 403. Pemeriksaan
 * terjadi sebelum subtree di bawahnya dirender, jadi tidak ada halaman portal
 * yang bocor tanpa perlu dicek satu per satu.
 *
 * Menu pengurus disaring berdasarkan permission sehingga pengurus tidak
 * otomatis mendapat hak administrasi global.
 */
export const dynamic = "force-dynamic";

export default async function PengurusLayout({
  children,
}: {
  children: ReactNode;
}) {
  const principal = await requirePortalPage("/pengurus");

  return (
    <DashboardShell
      portalLabel="Portal Pengurus"
      nav={filterNavForRole(PENGURUS_NAV, principal.role)}
      role={principal.role}
      email={principal.email}
    >
      {children}
    </DashboardShell>
  );
}

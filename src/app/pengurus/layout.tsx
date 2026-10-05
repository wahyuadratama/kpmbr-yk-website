import type { ReactNode } from "react";
import { requirePortalPage } from "@/lib/auth/guards";
import { PortalShell } from "@/components/layout/portal-shell";

/**
 * Layout `/pengurus`.
 *
 * Guard menolak role selain PENGURUS dan ADMIN dengan HTTP 403. Pemeriksaan
 * terjadi sebelum subtree di bawahnya dirender, jadi tidak ada halaman portal
 * yang bocor tanpa perlu dicek satu per satu.
 */
export const dynamic = "force-dynamic";

export default async function PengurusLayout({ children }: { children: ReactNode }) {
  const principal = await requirePortalPage("/pengurus");
  return (
    <PortalShell path="pengurus" principal={principal}>
      {children}
    </PortalShell>
  );
}
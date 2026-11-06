import type { Metadata } from "next";
import { requirePermissionPage } from "@/server/auth/guards";
import { ProgramKerjaAdminView } from "@/ui/components/modules/programs-admin-view";

export const metadata: Metadata = { title: "Program Kerja" };
export const dynamic = "force-dynamic";

/**
 * Pengelolaan program kerja dari Admin Control Center.
 *
 * Tampilan sama dengan portal pengurus
 * (`src/modules/programs/admin-view.tsx`), tetapi tetap berada di dalam portal
 * admin supaya navigasi tidak melompat ke portal lain.
 *
 * Guard `requirePortalPage("/admin")` di layout admin membatasi halaman ini
 * hanya untuk ADMIN; tombol aksi di dalam tampilan sendiri diperiksa lagi
 * lewat permission.
 */
export default async function AdminProgramKerjaPage() {
  const principal = await requirePermissionPage("program:read");
  return <ProgramKerjaAdminView principal={principal} />;
}

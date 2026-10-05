import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { EmptyState } from "@/components/ui/empty-state";
import { DASHBOARD_BY_ROLE } from "@/lib/auth/portals";

export const metadata: Metadata = {
  title: "Portal alumni",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dasbor alumni — placeholder untuk Stage 5.
 *
 * Yang diuji di halaman ini HANYA batas aksesnya: ALUMNI dan ADMIN boleh masuk,
 * ANGGOTA dan PENGURUS tidak. Direktori alumni menunggu REQUIRES DECISION § 8.3
 * soal privasi, jadi belum dibuat sekarang.
 */
export default async function AlumniPage() {
  const principal = await requirePortalPage("/alumni");
  const home = DASHBOARD_BY_ROLE[principal.role];

  return (
    <div className="space-y-10">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Portal alumni</h1>
        <p className="text-sm text-muted-foreground">
          Masuk sebagai <strong>{principal.email}</strong> ({principal.role})
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Fitur</h2>
        <EmptyState
          title="Direktori alumni belum tersedia"
          description="Direktori, edit profil alumni, dan transisi keanggotaan dibangun pada Stage 5 setelah organisasi memutuskan aturan privasinya."
          action={{
            label: home === "/alumni" ? "Kembali ke situs publik" : "Ke dasbor admin",
            href: home === "/alumni" ? "/" : home,
          }}
        />
      </section>
    </div>
  );
}
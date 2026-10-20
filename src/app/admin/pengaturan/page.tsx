import type { Metadata } from "next";
import { requirePermissionPage } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import {
  WebsiteSettingsForm,
  type WebsiteSettingsValues,
} from "@/components/admin/website-settings-form";
import { updateWebsiteSettingsAction } from "@/lib/settings/website-actions";
import { MaintenancePanel } from "@/components/admin/maintenance-panel";
import { setMaintenanceAction } from "@/lib/settings/website-actions";
import { getMaintenanceState } from "@/lib/settings/website";
import { toDatetimeLocal } from "@/lib/utils/format";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Pengaturan Website" };
export const dynamic = "force-dynamic";

/**
 * Pengaturan website: identitas, kontak, metadata SEO, dan status
 * pemeliharaan.
 *
 * Guard `website:read` di halaman; penyimpanan memakai `website:update`.
 * Keduanya diperiksa di server.
 */
export default async function PengaturanPage() {
  await requirePermissionPage("website:read");

  const row = await db.websiteSetting.findUnique({
    where: { id: "default" },
    select: {
      siteName: true,
      siteDescription: true,
      slogan: true,
      organizationName: true,
      contactEmail: true,
      contactInstagram: true,
      addressLine: true,
      city: true,
      region: true,
      seoTitle: true,
      seoDescription: true,
    },
  });

  const maintenance = await getMaintenanceState();

  const initial: WebsiteSettingsValues = {
    siteName: row?.siteName ?? siteConfig.name,
    siteDescription: row?.siteDescription ?? siteConfig.description,
    slogan: row?.slogan ?? siteConfig.tagline,
    organizationName: row?.organizationName ?? siteConfig.fullName,
    contactEmail: row?.contactEmail ?? siteConfig.contact.email,
    contactInstagram: row?.contactInstagram ?? siteConfig.contact.instagram,
    addressLine: row?.addressLine ?? siteConfig.address.street,
    city: row?.city ?? siteConfig.address.city,
    region: row?.region ?? siteConfig.address.region,
    seoTitle: row?.seoTitle ?? `${siteConfig.name} — ${siteConfig.tagline}`,
    seoDescription: row?.seoDescription ?? siteConfig.description,
  };

  return (
    <div className="space-y-5">
      <PageHeading
        title="Pengaturan Website"
        description="Identitas, kontak, metadata SEO, dan status operasional situs."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Identitas & Kontak"
          description="Informasi yang ditampilkan di header, footer, dan halaman kontak."
          className="xl:col-span-2"
        >
          <WebsiteSettingsForm
            initial={initial}
            action={updateWebsiteSettingsAction}
          />
        </Panel>

        <Panel
          title="Status Pemeliharaan"
          description="Terapkan pemeliharaan tanpa deployment ulang."
        >
          <MaintenancePanel
            isEnabled={maintenance.enabled}
            message={maintenance.message ?? ""}
            estimateAt={
              maintenance.estimateAt
                ? toDatetimeLocal(maintenance.estimateAt)
                : ""
            }
            action={setMaintenanceAction}
          />
        </Panel>
      </div>
    </div>
  );
}

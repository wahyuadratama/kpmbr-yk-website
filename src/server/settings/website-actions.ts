"use server";

/**
 * Server Action untuk pengaturan website dan status pemeliharaan.
 *
 * Semua perubahan dicatat di `audit_logs`. Perubahan status maintenance
 * langsung berlaku — tidak ada deployment ulang.
 */
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { parseOrThrow } from "@/lib/validation/parse";
import { runAction, type ActionResult } from "@/lib/actions/result";
import { writeAudit } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { resetMaintenanceCache } from "@/lib/settings/website";

/** ID baris tunggal tabel `website_settings`. */
const SETTINGS_ID = "default";

const settingsSchema = z.object({
  siteName: z.string().trim().max(191).optional(),
  siteDescription: z.string().trim().max(500).optional(),
  slogan: z.string().trim().max(191).optional(),
  organizationName: z.string().trim().max(191).optional(),
  contactEmail: z.string().trim().email("Format email tidak valid.").max(191).optional().or(z.literal("")),
  contactInstagram: z.string().trim().max(191).optional(),
  addressLine: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  region: z.string().trim().max(100).optional(),
  seoTitle: z.string().trim().max(191).optional(),
  seoDescription: z.string().trim().max(300).optional(),
});

const maintenanceSchema = z.object({
  isMaintenanceEnabled: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .transform((value) => value === "on" || value === "true"),
  maintenanceMessage: z.string().trim().max(1000).optional(),
  maintenanceEstimateAt: z.string().trim().optional(),
});

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Simpan identitas, kontak, dan metadata SEO website.
 *
 * Hanya nilai yang terkirim yang diperbarui; kolom yang tidak ada pada form
 * tidak tersentuh.
 */
export async function updateWebsiteSettingsAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ saved: true }>> {
  return runAction("website.settings.update", async () => {
    const principal = await requirePermission("website:update");
    const input = parseOrThrow(settingsSchema, {
      siteName: formData.get("siteName") ?? undefined,
      siteDescription: formData.get("siteDescription") ?? undefined,
      slogan: formData.get("slogan") ?? undefined,
      organizationName: formData.get("organizationName") ?? undefined,
      contactEmail: formData.get("contactEmail") ?? undefined,
      contactInstagram: formData.get("contactInstagram") ?? undefined,
      addressLine: formData.get("addressLine") ?? undefined,
      city: formData.get("city") ?? undefined,
      region: formData.get("region") ?? undefined,
      seoTitle: formData.get("seoTitle") ?? undefined,
      seoDescription: formData.get("seoDescription") ?? undefined,
    });

    const data = {
      siteName: emptyToUndefined(input.siteName) ?? null,
      siteDescription: emptyToUndefined(input.siteDescription) ?? null,
      slogan: emptyToUndefined(input.slogan) ?? null,
      organizationName: emptyToUndefined(input.organizationName) ?? null,
      contactEmail: emptyToUndefined(input.contactEmail) ?? null,
      contactInstagram: emptyToUndefined(input.contactInstagram) ?? null,
      addressLine: emptyToUndefined(input.addressLine) ?? null,
      city: emptyToUndefined(input.city) ?? null,
      region: emptyToUndefined(input.region) ?? null,
      seoTitle: emptyToUndefined(input.seoTitle) ?? null,
      seoDescription: emptyToUndefined(input.seoDescription) ?? null,
    };

    await db.websiteSetting.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data, updatedById: principal.userId },
      update: { ...data, updatedById: principal.userId },
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "WebsiteSetting",
      resourceId: SETTINGS_ID,
      actorUserId: principal.userId,
      metadata: { fields: Object.keys(data) },
    });

    return { saved: true };
  });
}

/**
 * Aktifkan atau nonaktifkan mode pemeliharaan.
 *
 * Status disimpan permanen di database dan langsung dibaca oleh
 * `src/proxy.ts`, sehingga tidak ada deployment ulang yang diperlukan.
 */
export async function setMaintenanceAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ isMaintenanceEnabled: boolean }>> {
  return runAction("website.maintenance.set", async () => {
    const principal = await requirePermission("website:update");
    const input = parseOrThrow(maintenanceSchema, {
      isMaintenanceEnabled: formData.get("isMaintenanceEnabled") ?? "false",
      maintenanceMessage: formData.get("maintenanceMessage") ?? undefined,
      maintenanceEstimateAt: formData.get("maintenanceEstimateAt") ?? undefined,
    });

    const estimate = input.maintenanceEstimateAt
      ? new Date(input.maintenanceEstimateAt)
      : null;
    if (estimate && Number.isNaN(estimate.getTime())) {
      throw new Error("Perkiraan waktu selesai tidak valid.");
    }

    const data = {
      isMaintenanceEnabled: input.isMaintenanceEnabled,
      maintenanceMessage: emptyToUndefined(input.maintenanceMessage) ?? null,
      maintenanceEstimateAt: estimate,
      maintenanceStartedAt: input.isMaintenanceEnabled ? new Date() : null,
    };

    await db.websiteSetting.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data, updatedById: principal.userId },
      update: { ...data, updatedById: principal.userId },
    });

    // Cache dibuang agar status baru langsung berlaku pada request berikutnya.
    resetMaintenanceCache();

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "WebsiteSetting",
      resourceId: SETTINGS_ID,
      actorUserId: principal.userId,
      metadata: {
        isMaintenanceEnabled: input.isMaintenanceEnabled,
        maintenanceEstimateAt: estimate ? estimate.toISOString() : null,
      },
    });

    return { isMaintenanceEnabled: input.isMaintenanceEnabled };
  });
}

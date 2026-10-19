/**
 * Server action untuk dokumen arsip organisasi (Stage 7).
 *
 * Prinsip:
 * - Semua mutasi tercatat di `audit_logs` (CREATE / UPDATE / DELETE).
 * - `createdById` diambil dari session (principal), TIDAK dari input klien.
 * - Cache tag `org-documents` di-invalidate setelah mutasi.
 */
import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { parseOrThrow } from "@/lib/validation/parse";
import {
  organizationDocumentCreateSchema,
  organizationDocumentUpdateSchema,
} from "@/lib/validation/organization-document";
import { cuidSchema } from "@/lib/validation/common";
import { notFound } from "@/lib/errors";
import { runAction, type ActionResult } from "@/lib/actions/result";
import { writeAudit } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { ORG_DOC_TAGS } from "@/modules/organization-documents/queries";

const idSchema = z.object({ id: cuidSchema });

function refreshOrgDocCache(): void {
  updateTag(ORG_DOC_TAGS.list);
}

/* -------------------------------------------------------------------------- */
/* CREATE                                                                     */
/* -------------------------------------------------------------------------- */

export async function createOrganizationDocumentAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("organization-document.create", async () => {
    const principal = await requirePermission("document:create");
    const input = parseOrThrow(organizationDocumentCreateSchema, raw);

    const created = await db.$transaction(async (tx) => {
      return tx.organizationDocument.create({
        data: {
          title: input.title,
          slug: input.slug,
          category: input.category,
          description: input.description ?? undefined,
          fileId: input.fileId,
          accessLevel: input.accessLevel,
          uploadedById: principal.userId,
        },
        select: { id: true },
      });
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "OrganizationDocument",
      resourceId: created.id,
      actorUserId: principal.userId,
      metadata: {
        title: input.title,
        slug: input.slug,
        category: input.category,
        accessLevel: input.accessLevel,
        fileId: input.fileId ?? null,
      },
    });

    refreshOrgDocCache();
    return created;
  });
}

/* -------------------------------------------------------------------------- */
/* UPDATE                                                                     */
/* -------------------------------------------------------------------------- */

export async function updateOrganizationDocumentAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const schema = organizationDocumentUpdateSchema;
  return runAction("organization-document.update", async () => {
    const principal = await requirePermission("document:create");
    const input = parseOrThrow(schema, raw);

    const existing = await db.organizationDocument.findUnique({
      where: { id: input.id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Dokumen tidak ditemukan.");

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.category !== undefined) data.category = input.category;
    if (input.description !== undefined) data.description = input.description;
    if (input.fileId !== undefined) data.fileId = input.fileId;
    if (input.accessLevel !== undefined) data.accessLevel = input.accessLevel;

    const updated = await db.$transaction(async (tx) => {
      return tx.organizationDocument.update({
        where: { id: existing.id },
        data: data as unknown as Parameters<
          typeof tx.organizationDocument.update
        >[0]["data"],
        select: { id: true },
      });
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "OrganizationDocument",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { fields: Object.keys(input).filter((key) => key !== "id") },
    });

    refreshOrgDocCache();
    return updated;
  });
}

/* -------------------------------------------------------------------------- */
/* DELETE                                                                     */
/* -------------------------------------------------------------------------- */

export async function deleteOrganizationDocumentAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("organization-document.delete", async () => {
    const principal = await requirePermission("document:delete");
    const { id } = parseOrThrow(idSchema, raw);

    const existing = await db.organizationDocument.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Dokumen tidak ditemukan.");

    const result = await db.$transaction(async (tx) => {
      return tx.organizationDocument.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
    if (result.count === 0) throw notFound("Dokumen tidak ditemukan.");

    await writeAudit({
      action: AuditAction.DELETE,
      resource: "OrganizationDocument",
      resourceId: id,
      actorUserId: principal.userId,
      metadata: { softDelete: true },
    });

    refreshOrgDocCache();
    return { id };
  });
}

/** Wrapper form action untuk tombol hapus di halaman (mengembalikan void). */
export async function deleteOrganizationDocumentFormAction(
  formData: FormData,
): Promise<void> {
  "use server";
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await deleteOrganizationDocumentAction({ id });
}

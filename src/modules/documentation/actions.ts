/**
 * Server action CMS untuk dokumentasi (album foto).
 */
import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { parseOrThrow } from "@/lib/validation/parse";
import { cuidSchema, shortText } from "@/lib/validation/common";
import { accentSchema } from "@/lib/validation/common";
import { notFound, conflict } from "@/lib/errors";
import { runAction, type ActionResult } from "@/lib/actions/result";
import { writeAudit } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma/enums";

const idSchema = z.object({ id: cuidSchema });

const albumCreateSchema = z.object({
  title: shortText(191),
  slug: z.string().trim().min(1).max(191).optional(),
  description: z.string().trim().max(1000).optional().default(""),
  eventDate: z.string().min(1, "Tanggal acara wajib diisi."),
  accent: accentSchema.default("brand"),
});

function refreshDocCache(): void {
  updateTag("documentation");
}

export async function createDocumentationAlbumAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("documentation.create", async () => {
    const principal = await requirePermission("documentation:create");
    const input = parseOrThrow(albumCreateSchema, raw);

    const slug =
      input.slug ?? (await slugifyUnique(input.title));

    const created = await db.documentationAlbum.create({
      data: {
        title: input.title,
        slug,
        description: input.description || null,
        eventDate: new Date(input.eventDate),
        accent: input.accent,
      },
      select: { id: true, slug: true },
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "Documentation",
      resourceId: created.id,
      actorUserId: principal.userId,
      metadata: { slug: created.slug },
    });

    refreshDocCache();
    return created;
  });
}

export async function updateDocumentationAlbumAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const schema = albumCreateSchema.partial().extend({ id: cuidSchema });
  return runAction("documentation.update", async () => {
    const principal = await requirePermission("documentation:update");
    const input = parseOrThrow(schema, raw);

    const existing = await db.documentationAlbum.findUnique({
      where: { id: input.id },
      select: { id: true, slug: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Album tidak ditemukan.");

    const updated = await db.documentationAlbum.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
        ...(input.eventDate !== undefined ? { eventDate: new Date(input.eventDate) } : {}),
        ...(input.accent !== undefined ? { accent: input.accent } : {}),
      },
      select: { id: true },
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "Documentation",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { fields: Object.keys(input).filter((key) => key !== "id") },
    });

    refreshDocCache();
    return updated;
  });
}

export async function deleteDocumentationAlbumAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("documentation.delete", async () => {
    const principal = await requirePermission("documentation:delete");
    const { id } = parseOrThrow(idSchema, raw);

    const existing = await db.documentationAlbum.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Album tidak ditemukan.");

    const result = await db.documentationAlbum.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw notFound("Album tidak ditemukan.");

    await writeAudit({
      action: AuditAction.DELETE,
      resource: "Documentation",
      resourceId: id,
      actorUserId: principal.userId,
      metadata: { softDelete: true },
    });

    refreshDocCache();
    return { id };
  });
}

async function slugifyUnique(title: string): Promise<string> {
  const root = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "album";

  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = suffix === 1 ? root : `${root}-${suffix}`;
    const clash = await db.documentationAlbum.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  throw conflict("Tidak dapat membuat slug unik untuk album ini.");
}

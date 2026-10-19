/**
 * Server action CMS untuk pengumuman.
 */
import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { parseOrThrow } from "@/lib/validation/parse";
import { announcementCreateSchema } from "@/lib/validation/cms";
import { cuidSchema } from "@/lib/validation/common";
import { notFound } from "@/lib/errors";
import { runAction, type ActionResult } from "@/lib/actions/result";
import { writeAudit } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma/enums";

const idSchema = z.object({ id: cuidSchema });

function refreshAnnouncementCache(): void {
  updateTag("announcements");
}

export async function createAnnouncementAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("announcement.create", async () => {
    const principal = await requirePermission("announcement:create");
    const input = parseOrThrow(announcementCreateSchema, raw);

    const created = await db.$transaction(async (tx) => {
      return tx.announcement.create({
        data: {
          title: input.title,
          body: input.body,
          priority: input.priority,
          audience: input.audience,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          createdById: principal.userId,
        },
        select: { id: true },
      });
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "Announcement",
      resourceId: created.id,
      actorUserId: principal.userId,
      metadata: { audience: input.audience, priority: input.priority },
    });

    refreshAnnouncementCache();
    return created;
  });
}

export async function updateAnnouncementAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const schema = announcementCreateSchema.partial().extend({ id: cuidSchema });
  return runAction("announcement.update", async () => {
    const principal = await requirePermission("announcement:update");
    const input = parseOrThrow(schema, raw);

    const existing = await db.announcement.findUnique({
      where: { id: input.id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Pengumuman tidak ditemukan.");

    const updated = await db.$transaction(async (tx) => {
      return tx.announcement.update({
        where: { id: existing.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.body !== undefined ? { body: input.body } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.audience !== undefined ? { audience: input.audience } : {}),
          ...(input.publishedAt !== undefined
            ? { publishedAt: new Date(input.publishedAt) }
            : {}),
          ...(input.expiresAt !== undefined ? { expiresAt: new Date(input.expiresAt) } : {}),
        },
        select: { id: true },
      });
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "Announcement",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { fields: Object.keys(input).filter((key) => key !== "id") },
    });

    refreshAnnouncementCache();
    return updated;
  });
}

export async function deleteAnnouncementAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("announcement.delete", async () => {
    const principal = await requirePermission("announcement:delete");
    const { id } = parseOrThrow(idSchema, raw);

    const existing = await db.announcement.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Pengumuman tidak ditemukan.");

    const result = await db.$transaction(async (tx) => {
      return tx.announcement.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
    if (result.count === 0) throw notFound("Pengumuman tidak ditemukan.");

    await writeAudit({
      action: AuditAction.DELETE,
      resource: "Announcement",
      resourceId: id,
      actorUserId: principal.userId,
      metadata: { softDelete: true },
    });

    refreshAnnouncementCache();
    return { id };
  });
}

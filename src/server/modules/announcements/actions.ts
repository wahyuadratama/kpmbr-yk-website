/**
 * Server action CMS untuk pengumuman.
 */
import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db/prisma";
import { requirePermission } from "@/server/auth/guards";
import { parseOrThrow } from "@/shared/validation/parse";
import { announcementCreateSchema } from "@/shared/validation/cms";
import { cuidSchema } from "@/shared/validation/common";
import { notFound } from "@/shared/errors";
import { runAction, type ActionResult } from "@/server/actions/result";
import { writeAudit } from "@/server/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { parseLocalDateTime } from "@/shared/utils/datetime";
import { notifyAnnouncementPublished } from "@/server/modules/notifications/create";

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
          coverFileId: input.coverFileId ?? null,
          priority: input.priority,
          audience: input.audience,
        publishedAt: input.publishedAt
          ? parseLocalDateTime(String(input.publishedAt))
          : new Date(),
        expiresAt: input.expiresAt
          ? parseLocalDateTime(String(input.expiresAt))
          : null,
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

    // Trigger notifikasi in-app ke semua user aktif (non-blocking via helper).
    await notifyAnnouncementPublished({
      announcementId: created.id,
      title: input.title,
      link: "/member/pengumuman",
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
          ...(input.coverFileId !== undefined
            ? { coverFileId: input.coverFileId ?? null }
            : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.audience !== undefined ? { audience: input.audience } : {}),
        ...(input.publishedAt !== undefined
          ? {
              publishedAt: input.publishedAt
                ? parseLocalDateTime(String(input.publishedAt))
                : new Date(),
            }
          : {}),
        ...(input.expiresAt !== undefined
          ? {
              expiresAt: input.expiresAt
                ? parseLocalDateTime(String(input.expiresAt))
                : null,
            }
          : {}),
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

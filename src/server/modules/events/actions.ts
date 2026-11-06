/**
 * Server action CMS untuk agenda kegiatan.
 */
import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db, Prisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/auth/guards";
import { parseOrThrow } from "@/shared/validation/parse";
import { eventCreateSchema } from "@/shared/validation/cms";
import { cuidSchema } from "@/shared/validation/common";
import { conflict, notFound } from "@/shared/errors";
import { runAction, type ActionResult } from "@/server/actions/result";
import { writeAudit } from "@/server/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { parseLocalDateTime } from "@/shared/utils/datetime";

const idSchema = z.object({ id: cuidSchema });

function refreshEventCache(): void {
  updateTag("events");
}

/** Buat slug unik untuk agenda (dipakai dalam transaksi). */
async function buildEventSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  const root = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "agenda";
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = suffix === 1 ? root : `${root}-${suffix}`;
    const clash = await tx.event.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  throw conflict("Tidak dapat membuat slug unik untuk agenda ini.");
}

export async function createEventAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction("event.create", async () => {
    const principal = await requirePermission("event:create");
    const input = parseOrThrow(eventCreateSchema, raw);

    const created = await db.$transaction(async (tx) => {
      const slug = input.slug ?? (await buildEventSlug(tx, input.title));
      if (input.slug) {
        const clash = await tx.event.findUnique({
          where: { slug: input.slug },
          select: { id: true },
        });
        if (clash) throw conflict(`Slug "${input.slug}" sudah dipakai agenda lain.`);
      }

      return tx.event.create({
        data: {
          title: input.title,
          slug,
          description: input.description,
        startsAt: parseLocalDateTime(String(input.startsAt)),
        endsAt: input.endsAt ? parseLocalDateTime(String(input.endsAt)) : null,
        location: input.location,
        organizer: input.organizer,
        coverFileId: input.coverFileId ?? null,
        status: input.status,
        },
        select: { id: true, slug: true },
      });
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "Event",
      resourceId: created.id,
      actorUserId: principal.userId,
      metadata: { slug: created.slug, status: input.status },
    });

    refreshEventCache();
    return created;
  });
}

export async function updateEventAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const schema = eventCreateSchema.partial().extend({ id: cuidSchema });
  return runAction("event.update", async () => {
    const principal = await requirePermission("event:update");
    const input = parseOrThrow(schema, raw);

    const existing = await db.event.findUnique({
      where: { id: input.id },
      select: { id: true, slug: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Agenda tidak ditemukan.");

    const updated = await db.$transaction(async (tx) => {
      let slug = existing.slug;
      if (input.slug !== undefined && input.slug !== existing.slug) {
        const clash = await tx.event.findUnique({
          where: { slug: input.slug },
          select: { id: true },
        });
        if (clash) throw conflict(`Slug "${input.slug}" sudah dipakai agenda lain.`);
        slug = input.slug;
      }

      return tx.event.update({
        where: { id: existing.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(slug !== existing.slug ? { slug } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.startsAt !== undefined
            ? { startsAt: parseLocalDateTime(String(input.startsAt)) }
            : {}),
          ...(input.endsAt !== undefined
            ? {
                endsAt: input.endsAt
                  ? parseLocalDateTime(String(input.endsAt))
                  : null,
              }
            : {}),
          ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.organizer !== undefined ? { organizer: input.organizer } : {}),
        ...(input.coverFileId !== undefined
          ? { coverFileId: input.coverFileId ?? null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        },
        select: { id: true },
      });
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "Event",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { fields: Object.keys(input).filter((key) => key !== "id") },
    });

    refreshEventCache();
    return updated;
  });
}

export async function deleteEventAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction("event.delete", async () => {
    const principal = await requirePermission("event:delete");
    const { id } = parseOrThrow(idSchema, raw);

    const existing = await db.event.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Agenda tidak ditemukan.");

    const result = await db.$transaction(async (tx) => {
      return tx.event.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
    if (result.count === 0) throw notFound("Agenda tidak ditemukan.");

    await writeAudit({
      action: AuditAction.DELETE,
      resource: "Event",
      resourceId: id,
      actorUserId: principal.userId,
      metadata: { softDelete: true },
    });

    refreshEventCache();
    return { id };
  });
}

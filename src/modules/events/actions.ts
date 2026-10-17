/**
 * Server action CMS untuk agenda kegiatan.
 */
import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { parseOrThrow } from "@/lib/validation/parse";
import { eventCreateSchema } from "@/lib/validation/cms";
import { cuidSchema } from "@/lib/validation/common";
import { conflict, notFound } from "@/lib/errors";
import { runAction, type ActionResult } from "@/lib/actions/result";
import { writeAudit } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma/enums";

const idSchema = z.object({ id: cuidSchema });

function refreshEventCache(): void {
  updateTag("events");
}

export async function createEventAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction("event.create", async () => {
    const principal = await requirePermission("event:create");
    const input = parseOrThrow(eventCreateSchema, raw);

    const slug =
      input.slug ?? (await slugifyUnique(input.title));

    const created = await db.event.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        location: input.location,
        organizer: input.organizer,
        status: input.status,
      },
      select: { id: true, slug: true },
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

    const updated = await db.event.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.startsAt !== undefined ? { startsAt: new Date(input.startsAt) } : {}),
        ...(input.endsAt !== undefined
          ? { endsAt: input.endsAt ? new Date(input.endsAt) : null }
          : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.organizer !== undefined ? { organizer: input.organizer } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      select: { id: true },
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

    const result = await db.event.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
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

async function slugifyUnique(title: string): Promise<string> {
  const root = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "agenda";

  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = suffix === 1 ? root : `${root}-${suffix}`;
    const clash = await db.event.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  throw conflict("Tidak dapat membuat slug unik untuk agenda ini.");
}

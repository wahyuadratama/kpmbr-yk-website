/**
 * Server action CMS untuk program kerja.
 */
import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db, Prisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/auth/guards";
import { parseOrThrow } from "@/shared/validation/parse";
import { programCreateSchema } from "@/shared/validation/cms";
import { cuidSchema } from "@/shared/validation/common";
import { conflict, notFound } from "@/shared/errors";
import { runAction, type ActionResult } from "@/server/actions/result";
import { writeAudit } from "@/server/audit";
import { AuditAction } from "@/generated/prisma/enums";

const idSchema = z.object({ id: cuidSchema });

function refreshProgramCache(): void {
  updateTag("programs");
}

/** Buat slug unik untuk program kerja (dipakai dalam transaksi). */
async function buildProgramSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  const root = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "program";
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = suffix === 1 ? root : `${root}-${suffix}`;
    const clash = await tx.program.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  throw conflict("Tidak dapat membuat slug unik untuk program kerja ini.");
}

export async function createProgramAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction("program.create", async () => {
    const principal = await requirePermission("program:create");
    const input = parseOrThrow(programCreateSchema, raw);

    const created = await db.$transaction(async (tx) => {
      const slug = input.slug ?? (await buildProgramSlug(tx, input.name));
      if (input.slug) {
        const clash = await tx.program.findUnique({
          where: { slug: input.slug },
          select: { id: true },
        });
        if (clash) throw conflict(`Slug "${input.slug}" sudah dipakai program lain.`);
      }

      return tx.program.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          objective: input.objective,
        divisionName: input.divisionName,
        picMemberId: input.picMemberId ?? null,
        coverFileId: input.coverFileId ?? null,
        status: input.status,
          progress: input.progress,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
        },
        select: { id: true, slug: true },
      });
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "Program",
      resourceId: created.id,
      actorUserId: principal.userId,
      metadata: { slug: created.slug, status: input.status, progress: input.progress },
    });

    refreshProgramCache();
    return created;
  });
}

export async function updateProgramAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const schema = programCreateSchema.partial().extend({ id: cuidSchema });
  return runAction("program.update", async () => {
    const principal = await requirePermission("program:update");
    const input = parseOrThrow(schema, raw);

    const existing = await db.program.findUnique({
      where: { id: input.id },
      select: { id: true, slug: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Program kerja tidak ditemukan.");

    const updated = await db.$transaction(async (tx) => {
      let slug = existing.slug;
      if (input.slug !== undefined && input.slug !== existing.slug) {
        const clash = await tx.program.findUnique({
          where: { slug: input.slug },
          select: { id: true },
        });
        if (clash) throw conflict(`Slug "${input.slug}" sudah dipakai program lain.`);
        slug = input.slug;
      }

      return tx.program.update({
        where: { id: existing.id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(slug !== existing.slug ? { slug } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.objective !== undefined ? { objective: input.objective } : {}),
          ...(input.divisionName !== undefined ? { divisionName: input.divisionName } : {}),
        ...(input.picMemberId !== undefined ? { picMemberId: input.picMemberId ?? null } : {}),
        ...(input.coverFileId !== undefined
          ? { coverFileId: input.coverFileId ?? null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.progress !== undefined ? { progress: input.progress } : {}),
          ...(input.startDate !== undefined
            ? { startDate: input.startDate ? new Date(input.startDate) : null }
            : {}),
          ...(input.endDate !== undefined
            ? { endDate: input.endDate ? new Date(input.endDate) : null }
            : {}),
        },
        select: { id: true },
      });
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "Program",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { fields: Object.keys(input).filter((key) => key !== "id") },
    });

    refreshProgramCache();
    return updated;
  });
}

export async function deleteProgramAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction("program.delete", async () => {
    const principal = await requirePermission("program:delete");
    const { id } = parseOrThrow(idSchema, raw);

    const existing = await db.program.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Program kerja tidak ditemukan.");

    const result = await db.$transaction(async (tx) => {
      return tx.program.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
    if (result.count === 0) throw notFound("Program kerja tidak ditemukan.");

    await writeAudit({
      action: AuditAction.DELETE,
      resource: "Program",
      resourceId: id,
      actorUserId: principal.userId,
      metadata: { softDelete: true },
    });

    refreshProgramCache();
    return { id };
  });
}

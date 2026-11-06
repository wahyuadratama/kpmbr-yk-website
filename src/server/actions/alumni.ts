/**
 * Server action transisi keanggotaan anggota → alumni — Stage 5.
 *
 * Hanya ADMIN. Alur:
 *   authorization (member:change_status + user:change_role) →
 *   validasi → update Membership status LULUS → update User role ALUMNI →
 *   audit log.
 *
 * Riwayat Membership TIDAK pernah dihapus, hanya berubah status.
 */
"use server";

import { runAction } from "@/server/actions/result";
import { requirePermission } from "@/server/auth/guards";
import { db } from "@/server/db/prisma";
import { writeAudit } from "@/server/audit";
import { AuditAction, MembershipEndReason, Role } from "@/generated/prisma/enums";
import { notFound } from "@/shared/errors";
import { z } from "zod";

const schema = z.object({
  memberId: z.string().trim().min(1),
  graduationYear: z.coerce.number().int().min(1900).max(2100),
  endReason: z.nativeEnum(MembershipEndReason).default(MembershipEndReason.LULUS),
  notes: z.string().trim().max(255).optional().default(""),
});

export type TransisiResult = {
  ok: boolean;
  error?: { code: string; message: string };
  data?: { memberId: string; userId: string; role: string };
};

export async function transisiKeanggotaanAction(
  _prevState: unknown,
  formData: FormData,
): Promise<TransisiResult> {
  return runAction("alumni.transisi", async () => {
    const principal = await requirePermission("member:change_status");
    const input = parseSchema(Object.fromEntries(formData.entries()));

    const member = await db.member.findUnique({
      where: { id: input.memberId },
      select: {
        id: true,
        userId: true,
        fullName: true,
        graduationYear: true,
        user: { select: { id: true, role: true, status: true } },
      },
    });
    if (!member || !member.userId) throw notFound("Anggota tidak ditemukan.");

    const activeMembership = await db.membership.findFirst({
      where: { memberId: member.id, endDate: null },
      select: { id: true, status: true, cohort: true },
    });
    if (!activeMembership || activeMembership.status !== "AKTIF") {
      throw new Error("Anggota belum memiliki keanggiatan AKTIF.");
    }

    await db.$transaction([
      db.membership.update({
        where: { id: activeMembership.id },
        data: {
          status: "LULUS",
          endDate: new Date(),
          endReason: input.endReason,
          notes: input.notes || null,
        },
      }),
      db.user.update({
        where: { id: member.userId },
        data: {
          role: Role.ALUMNI,
        },
      }),
      db.member.update({
        where: { id: member.id },
        data: {
          graduationYear: input.graduationYear,
        },
      }),
    ]);

    await writeAudit({
      action: AuditAction.ROLE_CHANGE,
      resource: "Member",
      resourceId: member.id,
      actorUserId: principal.userId,
      metadata: {
        memberId: member.id,
        userId: member.userId,
        graduationYear: input.graduationYear,
        endReason: input.endReason,
        roleBefore: member.user?.role ?? null,
        roleAfter: Role.ALUMNI,
      },
    });

    return {
      memberId: member.id,
      userId: member.userId,
      role: Role.ALUMNI,
    };
  });
}

function parseSchema(raw: unknown) {
  return schema.parse(raw);
}

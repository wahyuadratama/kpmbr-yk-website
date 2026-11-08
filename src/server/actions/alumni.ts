/**
 * Server action transisi keanggotaan.
 *
 * Alur manual (ADMIN/PENGURUS, permission member:change_status):
 *   AKTIF → LULUS  : membership status LULUS, isi graduationYear.
 *   LULUS → ALUMNI : user role ALUMNI, kartu anggota dinonaktifkan.
 *
 * Tidak boleh loncat/mundur. Setiap transisi tercatat audit log.
 * Riwayat Membership TIDAK pernah dihapus.
 */
"use server";

import { runAction } from "@/server/actions/result";
import { requirePermission } from "@/server/auth/guards";
import { db } from "@/server/db/prisma";
import { writeAudit } from "@/server/audit";
import {
  AuditAction,
  MembershipEndReason,
  MembershipStatus,
  NotificationType,
  Role,
} from "@/generated/prisma/enums";
import { notifyUserAndAdmins } from "@/server/modules/notifications/create";
import { z } from "zod";

const schema = z.object({
  memberId: z.string().trim().min(1, "ID anggota wajib diisi."),
  action: z.enum(["MARK_LULUS", "MARK_ALUMNI"]),
  graduationYear: z.coerce.number().int().min(1900).max(2100).optional(),
  endReason: z.nativeEnum(MembershipEndReason).default(MembershipEndReason.LULUS),
  notes: z.string().trim().max(255).optional().default(""),
});

export type TransisiResult = {
  ok: boolean;
  error?: { code: string; message: string };
  data?: { memberId: string; userId: string; toStatus: string; role: string };
};

export async function transisiKeanggotaanAction(
  _prevState: unknown,
  formData: FormData,
): Promise<TransisiResult> {
  return runAction("alumni.transisi", async () => {
    const principal = await requirePermission("member:change_status");
    const input = schema.parse(Object.fromEntries(formData.entries()));

    const member = await db.member.findUnique({
      where: { id: input.memberId },
      select: {
        id: true,
        userId: true,
        fullName: true,
        memberCode: true,
        graduationYear: true,
        user: { select: { id: true, role: true, status: true } },
        memberships: {
          where: { endDate: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, status: true, cohort: true },
        },
      },
    });
    if (!member || !member.userId) throw new Error("Anggota tidak ditemukan atau belum memiliki akun.");

    const current = member.memberships[0];
    if (!current) throw new Error("Anggota tidak memiliki keanggotaan aktif/berjalan.");

    if (input.action === "MARK_LULUS") {
      if (current.status !== MembershipStatus.AKTIF) {
        throw new Error(`Transisi ilegal: hanya AKTIF → LULUS. Status saat ini: ${current.status}.`);
      }
      if (!input.graduationYear) throw new Error("Tahun lulus wajib diisi untuk transisi LULUS.");
      const gradYear = input.graduationYear;

      await db.$transaction([
        db.membership.update({
          where: { id: current.id },
          data: {
            status: MembershipStatus.LULUS,
            endDate: new Date(),
            endReason: input.endReason,
            notes: input.notes || null,
          },
        }),
        db.member.update({
          where: { id: member.id },
          data: { graduationYear: gradYear },
        }),
      ]);

      await writeAudit({
        action: AuditAction.ROLE_CHANGE,
        resource: "Membership",
        resourceId: current.id,
        actorUserId: principal.userId,
        metadata: {
          memberId: member.id,
          memberCode: member.memberCode,
          userId: member.userId,
          transition: "AKTIF->LULUS",
          graduationYear: gradYear,
          endReason: input.endReason,
          notes: input.notes || null,
        },
      });

      await notifyUserAndAdmins({
        memberUserId: member.userId,
        type: NotificationType.MEMBERSHIP_TRANSITION,
        memberTitle: "Status keanggotaan diperbarui",
        memberBody: `Status keanggotaanmu berubah menjadi LULUS (${gradYear}).`,
        adminTitle: "Transisi keanggotaan: LULUS",
        adminBody: `${member.fullName} (${member.memberCode}) ditandai LULUS oleh ${principal.email}.`,
        link: "/member/profil",
        adminLink: "/admin/anggota",
      });

      return { memberId: member.id, userId: member.userId, toStatus: "LULUS", role: member.user?.role ?? "" };
    }

    // MARK_ALUMNI
    if (current.status !== MembershipStatus.LULUS) {
      throw new Error(`Transisi ilegal: hanya LULUS → ALUMNI. Status saat ini: ${current.status}.`);
    }

    await db.$transaction([
      db.user.update({
        where: { id: member.userId },
        data: { role: Role.ALUMNI },
      }),
      db.digitalMemberCard.updateMany({
        where: { memberId: member.id, isActive: true, revokedAt: null },
        data: { isActive: false, revokedAt: new Date(), revokedById: principal.userId },
      }),
    ]);

    await writeAudit({
      action: AuditAction.ROLE_CHANGE,
      resource: "Member",
      resourceId: member.id,
      actorUserId: principal.userId,
      metadata: {
        memberId: member.id,
        memberCode: member.memberCode,
        userId: member.userId,
        transition: "LULUS->ALUMNI",
        roleBefore: member.user?.role ?? null,
        roleAfter: Role.ALUMNI,
        cardsRevoked: true,
        notes: input.notes || null,
      },
    });

    await notifyUserAndAdmins({
      memberUserId: member.userId,
      type: NotificationType.MEMBERSHIP_TRANSITION,
      memberTitle: "Selamat, kamu kini Alumni",
      memberBody: "Status keanggotaanmu berubah menjadi ALUMNI. Kartu anggota dinonaktifkan.",
      adminTitle: "Transisi keanggotaan: ALUMNI",
      adminBody: `${member.fullName} (${member.memberCode}) dijadikan ALUMNI oleh ${principal.email}.`,
      link: "/alumni/profil",
      adminLink: "/admin/alumni",
    });

    return { memberId: member.id, userId: member.userId, toStatus: "ALUMNI", role: Role.ALUMNI };
  });
}

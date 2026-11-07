/**
 * Server actions: pengajuan data anggota (self-service) + persetujuan sekretariat/admin.
 *
 * Akun yang BELUM terhubung (principal.memberId null) dapat mengajukan data.
 * Submit TIDAK membuat Member aktif / tidak menghubungkan akun — harus disetujui
 * ADMIN/PENGURUS (member:create). Semua aksi tercatat audit log.
 */
"use server";

import { runAction, type ActionResult } from "@/server/actions/result";
import { requirePermission, requireSession } from "@/server/auth/guards";
import { parseOrThrow } from "@/shared/validation/parse";
import { memberApplicationSchema } from "@/shared/validation/member";
import { db } from "@/server/db/prisma";
import { writeAudit } from "@/server/audit";
import {
  AuditAction,
  Gender,
  MemberApplicationStatus,
  MembershipStatus,
  NotificationType,
  Role,
  UserStatus,
} from "@/generated/prisma/enums";
import { createNotification } from "@/server/modules/notifications/create";

const COHORT = new Date().getFullYear();

function safeGender(v: string | null | undefined): Gender | null {
  if (v === "LAKI_LAKI" || v === "PEREMPUAN") return v;
  return null;
}

/** Submit pengajuan (akun belum terhubung). Cegah ganda: 1 PENDING per user. */
export async function submitMemberApplicationAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return runAction("memberApplication.submit", async () => {
    const principal = await requireSession();
    if (principal.memberId) {
      throw new Error("Akun Anda sudah terhubung ke data anggota.");
    }

    const pending = await db.memberApplication.findFirst({
      where: { userId: principal.userId, status: MemberApplicationStatus.PENDING },
      select: { id: true },
    });
    if (pending) {
      throw new Error("Anda sudah memiliki pengajuan yang sedang menunggu persetujuan.");
    }

    const raw = Object.fromEntries(formData.entries());
    // gender from form may be "" — normalize
    if (raw.gender === "") delete raw.gender;
    const data = parseOrThrow(memberApplicationSchema, raw);

    const created = await db.memberApplication.create({
      data: {
        userId: principal.userId,
        status: MemberApplicationStatus.PENDING,
        fullName: data.fullName,
        nickname: data.nickname || null,
        gender: safeGender(data.gender as string | undefined),
        phone: data.phone || null,
        city: data.city || null,
        bio: data.bio || null,
        addressDetail: data.addressDetail || null,
      },
      select: { id: true, fullName: true },
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "MemberApplication",
      resourceId: created.id,
      actorUserId: principal.userId,
      metadata: { userId: principal.userId, fullName: created.fullName },
    });

    // Notifikasi ke ADMIN/PENGURUS aktif
    const reviewers = await db.user.findMany({
      where: {
        role: { in: [Role.ADMIN, Role.PENGURUS] },
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      select: { id: true },
    });
    await Promise.all(
      reviewers.map((r) =>
        createNotification({
          userId: r.id,
          type: NotificationType.SYSTEM,
          title: "Pengajuan anggota baru",
          body: `${created.fullName} (${principal.email}) mengajukan data anggota.`,
          link: "/admin/anggota/pengajuan",
        }),
      ),
    );

    return { id: created.id };
  });
}

async function nextMemberCode(tx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `KPMBR-YK-${year}-`;
  const rows = await tx.member.findMany({
    where: { memberCode: { startsWith: prefix } },
    select: { memberCode: true },
  });
  let max = 0;
  for (const r of rows) {
    const m = /(\d{4})$/.exec(r.memberCode);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

/** Setujui pengajuan → buat Member + Membership AKTIF, hubungkan ke user. */
export async function approveMemberApplicationAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ memberId: string; memberCode: string }>> {
  return runAction("memberApplication.approve", async () => {
    const principal = await requirePermission("member:create");
    const id = String(formData.get("id") || "").trim();
    if (!id) throw new Error("ID pengajuan tidak valid.");

    const app = await db.memberApplication.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, member: { select: { id: true } } } } },
    });
    if (!app) throw new Error("Pengajuan tidak ditemukan.");
    if (app.status !== MemberApplicationStatus.PENDING) {
      throw new Error("Pengajuan ini sudah diproses.");
    }
    if (app.user.member) throw new Error("Akun ini sudah terhubung ke data anggota.");

    const result = await db.$transaction(async (tx) => {
      const memberCode = await nextMemberCode(tx);
      const member = await tx.member.create({
        data: {
          userId: app.userId,
          memberCode,
          fullName: app.fullName,
          nickname: app.nickname,
          gender: app.gender,
          phone: app.phone,
          city: app.city,
          bio: app.bio,
          addressDetail: app.addressDetail,
        },
        select: { id: true, memberCode: true },
      });
      await tx.membership.create({
        data: {
          memberId: member.id,
          status: MembershipStatus.AKTIF,
          cohort: COHORT,
          startDate: new Date(),
        },
      });
      await tx.memberApplication.update({
        where: { id: app.id },
        data: {
          status: MemberApplicationStatus.APPROVED,
          reviewedById: principal.userId,
          reviewedAt: new Date(),
        },
      });
      return member;
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "Member",
      resourceId: result.id,
      actorUserId: principal.userId,
      metadata: {
        fromApplicationId: app.id,
        userId: app.userId,
        memberCode: result.memberCode,
        fullName: app.fullName,
      },
    });

    await createNotification({
      userId: app.userId,
      type: NotificationType.SYSTEM,
      title: "Pengajuan anggota disetujui",
      body: `Pengajuanmu disetujui. Kode anggota: ${result.memberCode}.`,
      link: "/member/profil",
    });

    return { memberId: result.id, memberCode: result.memberCode };
  });
}

/** Tolak pengajuan. Akun tetap belum terhubung, boleh mengajukan ulang. */
export async function rejectMemberApplicationAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return runAction("memberApplication.reject", async () => {
    const principal = await requirePermission("member:create");
    const id = String(formData.get("id") || "").trim();
    const note = String(formData.get("rejectionNote") || "").trim().slice(0, 255);
    if (!id) throw new Error("ID pengajuan tidak valid.");

    const app = await db.memberApplication.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, fullName: true },
    });
    if (!app) throw new Error("Pengajuan tidak ditemukan.");
    if (app.status !== MemberApplicationStatus.PENDING) {
      throw new Error("Pengajuan ini sudah diproses.");
    }

    await db.memberApplication.update({
      where: { id: app.id },
      data: {
        status: MemberApplicationStatus.REJECTED,
        rejectionNote: note || null,
        reviewedById: principal.userId,
        reviewedAt: new Date(),
      },
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "MemberApplication",
      resourceId: app.id,
      actorUserId: principal.userId,
      metadata: { decision: "REJECTED", userId: app.userId, rejectionNote: note || null },
    });

    await createNotification({
      userId: app.userId,
      type: NotificationType.SYSTEM,
      title: "Pengajuan anggota ditolak",
      body: note
        ? `Pengajuanmu ditolak. Alasan: ${note}`
        : "Pengajuanmu ditolak. Kamu dapat mengajukan ulang dari halaman profil.",
      link: "/member/profil",
    });

    return { id: app.id };
  });
}

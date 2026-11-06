/**
 * Server action: ubah profil anggota sendiri.
 *
 * Alur: authentication → authorization (member:update, own resource) →
 * validation → update Member → audit UPDATE.
 *
 * `memberId` diambil dari principal (bukan dari klien), sehingga anggota
 * tidak bisa mengubah profil orang lain.
 */
"use server";

import { runAction } from "@/server/actions/result";
import { requirePermission } from "@/server/auth/guards";
import { parseOrThrow } from "@/shared/validation/parse";
import { memberProfileSchema } from "@/shared/validation/member";
import { db } from "@/server/db/prisma";
import { writeAudit } from "@/server/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { forbidden } from "@/shared/errors";

export type UpdateMemberProfileResult = {
  ok?: boolean;
  error?: {
    code: string;
    message: string;
    fields?: { field: string; message: string }[];
  };
  data?: { id: string; fullName: string };
};

export async function updateMemberProfile(
  _prevState: unknown,
  formData: FormData,
): Promise<UpdateMemberProfileResult> {
  return runAction("updateMemberProfile", async () => {
    const principal = await requirePermission("member:update");

    const memberId = principal.memberId;
    if (!memberId) {
      throw forbidden("Profil anggota tidak ditemukan.");
    }

    const raw = Object.fromEntries(formData.entries());
    const data = parseOrThrow(memberProfileSchema, raw);

    const updated = await db.member.update({
      where: { id: memberId },
      data: {
        fullName: data.fullName,
        nickname: data.nickname ?? null,
        gender: data.gender ?? null,
        phone: data.phone ?? null,
        city: data.city ?? null,
        bio: data.bio ?? null,
        addressDetail: data.addressDetail ?? null,
        isDirectoryVisible: data.isDirectoryVisible ?? false,
      },
      select: { id: true, fullName: true },
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "Member",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { fields: Object.keys(data) },
    });

    return updated;
  });
}

/**
 * Server action: manajemen user & anggota (khusus ADMIN).
 *
 * Alur: authentication → authorization → validation → ubah data → audit.
 * Semua aksi ADMIN-only dan dituliskan ke audit_log.
 */
"use server";

import { runAction } from "@/lib/actions/result";
import { requirePermission } from "@/lib/auth/guards";
import { parseOrThrow } from "@/lib/validation/parse";
import { cuidSchema } from "@/lib/validation/common";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { writeAudit } from "@/lib/audit";
import { AuditAction, Role, UserStatus } from "@/generated/prisma/enums";
import { forbidden, notFound } from "@/lib/errors";

const idSchema = z.object({ id: cuidSchema });

const roleSchema = z.object({
  id: cuidSchema,
  role: z.nativeEnum(Role),
});

const statusSchema = z.object({
  id: cuidSchema,
  status: z.nativeEnum(UserStatus),
});

export type UserAdminResult = {
  ok: boolean;
  error?: { code: string; message: string; fields?: { field: string; message: string }[] };
  data?: { id: string; email: string; role: string; status: string };
};

async function findUserOr404(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, status: true, deletedAt: true },
  });
  if (!user || user.deletedAt) throw notFound("Pengguna tidak ditemukan.");
  return user;
}

/** Ubah role user. Hanya ADMIN. */
export async function updateUserRoleAction(
  formData: FormData,
): Promise<UserAdminResult> {
  return runAction("admin.user.role", async () => {
    const principal = await requirePermission("user:change_role");
    const input = parseOrThrow(roleSchema, Object.fromEntries(formData.entries()));

    const user = await findUserOr404(input.id);
    if (user.id === principal.userId) {
      throw forbidden("Tidak dapat mengubah role sendiri.");
    }

    const updated = await db.user.update({
      where: { id: input.id },
      data: { role: input.role },
      select: { id: true, email: true, role: true, status: true },
    });

    await writeAudit({
      action: AuditAction.ROLE_CHANGE,
      resource: "User",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { roleBefore: user.role, roleAfter: input.role },
    });

    return updated;
  });
}

/** Ubah status user (ACTIVE / SUSPENDED / ARCHIVED). Hanya ADMIN. */
export async function updateUserStatusAction(
  formData: FormData,
): Promise<UserAdminResult> {
  return runAction("admin.user.status", async () => {
    const principal = await requirePermission("user:update");
    const input = parseOrThrow(statusSchema, Object.fromEntries(formData.entries()));

    const user = await findUserOr404(input.id);
    if (user.id === principal.userId) {
      throw forbidden("Tidak dapat mengubah status sendiri.");
    }

    const updated = await db.user.update({
      where: { id: input.id },
      data: { status: input.status },
      select: { id: true, email: true, role: true, status: true },
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "User",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { statusBefore: user.status, statusAfter: input.status },
    });

    return updated;
  });
}

/** Hapus (soft delete) user. Hanya ADMIN. */
export async function deleteUserAction(
  formData: FormData,
): Promise<UserAdminResult> {
  return runAction("admin.user.delete", async () => {
    const principal = await requirePermission("user:delete");
    const { id } = parseOrThrow(idSchema, Object.fromEntries(formData.entries()));

    const user = await findUserOr404(id);
    if (user.id === principal.userId) {
      throw forbidden("Tidak dapat menghapus sendiri.");
    }

    const updated = await db.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: UserStatus.ARCHIVED },
      select: { id: true, email: true, role: true, status: true },
    });

    await writeAudit({
      action: AuditAction.DELETE,
      resource: "User",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { softDelete: true },
    });

    return updated;
  });
}

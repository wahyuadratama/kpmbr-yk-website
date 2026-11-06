/**
 * Server action untuk kartu anggota digital.
 *
 * Prinsip keamanan:
 * - Token verifikasi TIDAK pernah disimpan dalam bentuk teks di database.
 * - Hanya `tokenHash` (SHA-256) yang tersimpan.
 * - Token mentah hanya dikembalikan sekali saat pembuatan, lalu dibuang.
 */
"use server";

import { runAction, type ActionResult } from "@/lib/actions/result";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { writeAudit } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { generateToken, hashToken } from "@/lib/crypto";
import { forbidden, notFound } from "@/lib/errors";

export type DigitalCardData = {
  id: string;
  publicKey: string;
  isActive: boolean;
  createdAt?: Date | null;
  token?: string; // hanya digenerate action
};

export type DigitalCardResult = ActionResult<DigitalCardData | null>;

export async function generateDigitalCardAction(
  _prevState: unknown,
  _formData: FormData,
): Promise<DigitalCardResult> {
  return runAction("digital-member-card.generate", async () => {
    const principal = await requirePermission("card:read_own");

    const memberId = principal.memberId;
    if (!memberId) {
      throw forbidden("Profil anggota tidak ditemukan.");
    }

    const existing = await db.digitalMemberCard.findFirst({
      where: { memberId, deletedAt: null },
      select: { id: true, isActive: true },
    });

    if (existing && existing.isActive) {
      throw new Error("Kartu digital sudah aktif.");
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const publicKey = hashToken(`${token}:${Date.now()}`).slice(0, 32);

    const card = await db.digitalMemberCard.create({
      data: {
        memberId,
        tokenHash,
        publicKey,
        isActive: true,
      },
      select: { id: true, publicKey: true, isActive: true, createdAt: true },
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "DigitalMemberCard",
      resourceId: card.id,
      actorUserId: principal.userId,
      metadata: { memberId },
    });

    return {
      ...card,
      token,
    } as DigitalCardData;
  });
}

export async function revokeDigitalCardAction(
  _prevState: unknown,
  _formData: FormData,
): Promise<DigitalCardResult> {
  return runAction("digital-member-card.revoke", async () => {
    const principal = await requirePermission("card:read_own");

    const memberId = principal.memberId;
    if (!memberId) {
      throw forbidden("Profil anggota tidak ditemukan.");
    }

    const card = await db.digitalMemberCard.findFirst({
      where: { memberId, deletedAt: null },
      select: { id: true, isActive: true },
    });
    if (!card) throw notFound("Kartu digital tidak ditemukan.");

    const updated = await db.digitalMemberCard.update({
      where: { id: card.id },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedById: principal.userId,
      },
      select: {
        id: true,
        publicKey: true,
        isActive: true,
        createdAt: true,
      },
    });

    await writeAudit({
      action: AuditAction.DELETE,
      resource: "DigitalMemberCard",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { memberId },
    });

    return updated;
  });
}

export async function getDigitalCardAction(): Promise<DigitalCardResult> {
  return runAction("digital-member-card.get", async () => {
    const principal = await requirePermission("card:read_own");

    const memberId = principal.memberId;
    if (!memberId) {
      throw forbidden("Profil anggota tidak ditemukan.");
    }

    const card = await db.digitalMemberCard.findFirst({
      where: { memberId, deletedAt: null },
      select: { id: true, publicKey: true, isActive: true, createdAt: true },
    });

    return card ?? null;
  });
}

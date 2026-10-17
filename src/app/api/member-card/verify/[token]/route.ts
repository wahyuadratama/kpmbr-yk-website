/**
 * Verifikasi token kartu anggota digital.
 * `GET /api/member-card/verify/[token]`
 *
 * Rantai keamanan:
 *   token mentah dari URL → hash SHA-256 → cocokkan `tokenHash` di DB →
 *   cek `isActive` → audit VIEW_SENSITIVE → respons validitas.
 *
 * Token mentah TIDAK pernah dicocokkan secara teks di database.
 */
import { NextResponse } from "next/server";
import { getCurrentPrincipal } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { writeAudit } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { hashToken } from "@/lib/crypto";
import { clientIpFrom } from "@/lib/audit";
import { publicMessage, logSafe } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<Response> {
  try {
    const principal = await getCurrentPrincipal();
    const { token } = await context.params;

    if (!token || typeof token !== "string" || token.length < 8) {
      return NextResponse.json(
        { valid: false, error: "Token tidak valid." },
        { status: 400 },
      );
    }

    const tokenHash = hashToken(token);

    const card = await db.digitalMemberCard.findFirst({
      where: { tokenHash, deletedAt: null },
      select: {
        id: true,
        isActive: true,
        member: { select: { id: true, fullName: true, memberCode: true } },
      },
    });

    if (!card) {
      await writeAudit(
        {
          action: AuditAction.VIEW_SENSITIVE,
          resource: "DigitalMemberCard",
          actorUserId: principal?.userId ?? null,
          metadata: {
            result: "token_not_found",
            hashedPrefix: tokenHash.slice(0, 8),
          },
          ipAddress: clientIpFrom(request.headers),
          userAgent: request.headers.get("user-agent"),
        },
        false,
      );
      return NextResponse.json(
        { valid: false, error: "Kartu tidak ditemukan atau tidak aktif." },
        { status: 404 },
      );
    }

    if (!card.isActive) {
      await writeAudit(
        {
          action: AuditAction.VIEW_SENSITIVE,
          resource: "DigitalMemberCard",
          resourceId: card.id,
          actorUserId: principal?.userId ?? null,
          metadata: { result: "card_inactive", memberId: card.member.id },
          ipAddress: clientIpFrom(request.headers),
          userAgent: request.headers.get("user-agent"),
        },
        false,
      );
      return NextResponse.json(
        { valid: false, error: "Kartu telah dicabut." },
        { status: 403 },
      );
    }

    await writeAudit(
      {
        action: AuditAction.VIEW_SENSITIVE,
        resource: "DigitalMemberCard",
        resourceId: card.id,
        actorUserId: principal?.userId ?? null,
        metadata: { result: "valid", memberId: card.member.id },
        ipAddress: clientIpFrom(request.headers),
        userAgent: request.headers.get("user-agent"),
      },
      false,
    );

    return NextResponse.json({
      valid: true,
      card: {
        id: card.id,
        member: card.member,
      },
    });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500)
      console.error("[member-card] verifikasi gagal:", logSafe(error));
    return NextResponse.json(
      { valid: false, error: { code, message } },
      { status },
    );
  }
}

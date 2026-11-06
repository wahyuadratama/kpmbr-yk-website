/** Unggah file melalui `POST /api/files`. */
import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { db } from "@/server/db/prisma";
import { FileAccessLevel, FileKind } from "@/generated/prisma/enums";
import { storeFile, kindForMime } from "@/lib/storage";
import { writeAudit } from "@/server/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { clientIpFrom } from "@/server/audit";
import { publicMessage, logSafe, badRequest, unsupportedMedia } from "@/shared/errors";

export const dynamic = "force-dynamic";

const ACCEPTED_ACCESS_LEVELS: FileAccessLevel[] = [
  FileAccessLevel.PUBLIC,
  FileAccessLevel.MEMBER_ONLY,
  FileAccessLevel.PENGURUS_ONLY,
  FileAccessLevel.ADMIN_ONLY,
];

export async function POST(
  request: Request,
): Promise<Response> {
  try {
    const principal = await requirePermission("file:upload");

    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
      throw badRequest("File wajib diunggah.");
    }

    const declaredMime = fileEntry.type ?? "";
    const detected = kindForMime(declaredMime);
    if (!detected) {
      throw unsupportedMedia("Jenis file ini tidak diizinkan.");
    }

    const accessLevelRaw = String(formData.get("accessLevel") ?? FileAccessLevel.MEMBER_ONLY);
    if (!ACCEPTED_ACCESS_LEVELS.includes(accessLevelRaw as FileAccessLevel)) {
      throw badRequest("Tingkat akses file tidak valid.");
    }
    const accessLevel = accessLevelRaw as FileAccessLevel;

    const kindRaw = String(formData.get("kind") ?? detected);
    const kind = Object.values(FileKind).includes(kindRaw as FileKind)
      ? (kindRaw as FileKind)
      : detected;

    const altTextRaw = String(formData.get("altText") ?? "");
    const altText = altTextRaw.trim().length > 0 ? altTextRaw.slice(0, 255) : null;

    const arrayBuffer = await fileEntry.arrayBuffer();
    const data = Buffer.from(arrayBuffer);

    const stored = await storeFile({
      data,
      declaredMime,
      declaredName: fileEntry.name,
      kind,
      accessLevel,
      uploadedById: principal.userId,
      altText,
    });

    const file = await db.file.findUnique({
      where: { storageKey: stored.storageKey },
      select: {
        id: true, storageKey: true, fileName: true, mimeType: true, size: true,
        kind: true, accessLevel: true, altText: true, createdAt: true,
      },
    });

    await writeAudit({
      action: AuditAction.UPLOAD,
      resource: "File",
      resourceId: file?.id ?? null,
      actorUserId: principal.userId,
      metadata: { fileName: fileEntry.name, kind, accessLevel, size: data.byteLength },
      ipAddress: clientIpFrom(request.headers),
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({
      ok: true,
      file: {
        id: file?.id,
        storageKey: stored.storageKey,
        fileName: fileEntry.name,
        mimeType: declaredMime,
        size: stored.size,
        kind,
        accessLevel,
        altText,
      },
    });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[files] unggah gagal:", logSafe(error));
    return NextResponse.json({ error: { code, message } }, { status });
  }
}

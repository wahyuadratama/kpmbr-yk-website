/**
 * Unduh file — `GET /api/files/[id]`.
 *
 * Ini SATU-SATUNYA jalan membuka dokumen. Rantai yang ditegakkan:
 *   session → role → `access_level` → baca binary → audit DOWNLOAD.
 *
 * Confidentiality dijaga oleh pemeriksaan di server; nama file/id yang
 * ditebak tidak cukup karena `access_level` tetap diperiksa.
 */
import { NextResponse } from "next/server";
import { getCurrentPrincipal } from "@/lib/auth/guards";
import { authorizeFileAccess, contentDisposition } from "@/lib/files/access";
import { readFile } from "@/lib/storage";
import { clientIpFrom, writeAudit } from "@/lib/audit";
import { consumeDbRateLimit } from "@/lib/rate-limit-db";
import { AuditAction } from "@/generated/prisma/enums";
import { logSafe, publicMessage } from "@/lib/errors";

/** Route selalu dinamis: bergantung pada session. */
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const principal = await getCurrentPrincipal();
    const { id } = await context.params;

    // Rate limit unduhan per IP (dan per user bila login) untuk mencegah
    // scraping atau unduhan berlebihan.
    const ip = clientIpFrom(request.headers);
    const dlKey = `download:ip:${ip ?? "unknown"}`;
    const dlLimit = await consumeDbRateLimit(dlKey, 60, 15 * 60_000);
    if (!dlLimit.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Terlalu banyak unduhan. Coba lagi nanti." } },
        { status: 429 },
      );
    }

    // ID dari URL bukan tepercaya; tetap batasi bentuknya agar tidak
    // membanjiri query dengan string bebas.
    if (!/^[a-z0-9]{1,64}$/i.test(id)) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Id file tidak valid." } },
        { status: 400 },
      );
    }

    const file = await authorizeFileAccess(id, principal?.role ?? null);

    const binary = await readFile(file.storageKey);

    await writeAudit({
      action: AuditAction.DOWNLOAD,
      resource: "File",
      resourceId: file.id,
      actorUserId: principal?.userId ?? null,
      metadata: { fileName: file.fileName, accessLevel: file.accessLevel },
      ipAddress: clientIpFrom(request.headers),
      userAgent: request.headers.get("user-agent"),
    });

    // `X-Content-Type-Options: nosniff` mencegah browser menebak tipe dari
    // isi. Aset yang dirender inline (gambar) boleh tanpa `attachment`.
    const inline = file.kind === "IMAGE" || file.kind === "VIDEO";
    const headers: Record<string, string> = {
      "Content-Type": file.mimeType,
      "Content-Length": String(binary.byteLength),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": file.accessLevel === "PUBLIC" ? "public, max-age=300" : "private, no-store",
    };
    if (!inline) headers["Content-Disposition"] = contentDisposition(file.fileName);

    return new Response(new Uint8Array(binary), { status: 200, headers });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[files] unduh gagal:", logSafe(error));
    return NextResponse.json({ error: { code, message } }, { status });
  }
}
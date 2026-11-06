/**
 * Melayani aset publik — `GET /api/public-files/[id]`.
 *
 * Hanya file dengan `accessLevel = PUBLIC` yang bisa diakses, dan tidak
 * memerlukan sesi. Route ini membiarkan server melayani gambar sampul publik
 * selagi object storage R2 belum siap. Setelah `R2_PUBLIC_URL` diisi, halaman
 * publik memakai URL R2 langsung dan route ini tidak lagi dipanggil.
 *
 * File non-publik TIDAK dapat diakses lewat route ini — file tersebut
 * tetap dilayani `/api/files/[id]` yang memeriksa `access_level` per role.
 */
import { NextResponse } from "next/server";
import { db } from "@/server/db/prisma";
import { readFile } from "@/server/storage";
import { contentDisposition } from "@/server/files/access";
import { FileAccessLevel } from "@/generated/prisma/enums";
import { logSafe, publicMessage } from "@/shared/errors";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;

    if (!/^[a-z0-9]{1,64}$/i.test(id)) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Id file tidak valid." } },
        { status: 400 },
      );
    }

    const file = await db.file.findFirst({
      where: { id, deletedAt: null, accessLevel: FileAccessLevel.PUBLIC },
      select: {
        id: true,
        storageKey: true,
        fileName: true,
        mimeType: true,
        size: true,
        kind: true,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "File tidak ditemukan." } },
        { status: 404 },
      );
    }

    const binary = await readFile(file.storageKey);

    const headers: Record<string, string> = {
      "Content-Type": file.mimeType,
      "Content-Length": String(binary.byteLength),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // Aset publik boleh di-cache lama; nama filenya berupa UUID sehingga
      // URL-nya tetap unik.
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    };
    if (file.kind !== "IMAGE" && file.kind !== "VIDEO") {
      headers["Content-Disposition"] = contentDisposition(file.fileName);
    }

    return new Response(new Uint8Array(binary), { status: 200, headers });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[public-files] gagal:", logSafe(error));
    return NextResponse.json({ error: { code, message } }, { status });
  }
}

/**
 * API dokumen arsip organisasi.
 *
 * `GET /api/organization-documents` — daftar dokumen dengan pagination & filter.
 *   Query: page, size, q, category, accessLevel
 * `POST /api/organization-documents` — buat dokumen arsip baru.
 */
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { listOrganizationDocuments } from "@/modules/organization-documents/queries";
import { createOrganizationDocumentAction } from "@/modules/organization-documents/actions";
import { publicMessage, logSafe } from "@/lib/errors";
import { z } from "zod";
import { DocumentCategory, FileAccessLevel } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  category: z.nativeEnum(DocumentCategory).optional(),
  accessLevel: z.nativeEnum(FileAccessLevel).optional(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    await requirePermission("document:read");
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      q: searchParams.get("q"),
      category: searchParams.get("category"),
      accessLevel: searchParams.get("accessLevel"),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Parameter query tidak valid." } },
        { status: 400 },
      );
    }
    const data = await listOrganizationDocuments(parsed.data);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[org-documents] GET:", logSafe(error));
    return NextResponse.json({ ok: false, error: { code, message } }, { status });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = await createOrganizationDocumentAction(body);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error.code === "VALIDATION_ERROR" ? 422 : 400 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[org-documents] POST:", logSafe(error));
    return NextResponse.json({ ok: false, error: { code, message } }, { status });
  }
}

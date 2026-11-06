/**
 * API kategori keuangan.
 *
 * `GET /api/finance/categories` — daftar kategori (hanya yang aktif).
 * `POST /api/finance/categories` — buat kategori baru.
 */
import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { listFinancialCategories } from "@/server/modules/finance/queries";
import { createFinancialCategoryAction } from "@/server/modules/finance/actions";
import { publicMessage, logSafe } from "@/shared/errors";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await requirePermission("finance:read_transaction");
    const categories = await listFinancialCategories();
    return NextResponse.json({ ok: true, data: categories });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[finance/categories] GET:", logSafe(error));
    return NextResponse.json({ ok: false, error: { code, message } }, { status });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = await createFinancialCategoryAction(body);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error.code === "VALIDATION_ERROR" ? 422 : 400 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[finance/categories] POST:", logSafe(error));
    return NextResponse.json({ ok: false, error: { code, message } }, { status });
  }
}

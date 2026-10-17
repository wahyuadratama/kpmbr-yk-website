/**
 * API laporan keuangan.
 *
 * `GET /api/finance/reports` — daftar laporan agregat.
 * `POST /api/finance/reports` — buat laporan baru.
 */
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { listFinancialReports } from "@/modules/finance/queries";
import { createFinancialReportAction } from "@/modules/finance/actions";
import { publicMessage, logSafe } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    await requirePermission("finance:read_summary");
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const size = parseInt(searchParams.get("size") ?? "20", 10);
    const data = await listFinancialReports({ page, size });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[finance/reports] GET:", logSafe(error));
    return NextResponse.json({ ok: false, error: { code, message } }, { status });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = await createFinancialReportAction(body);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error.code === "VALIDATION_ERROR" ? 422 : 400 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[finance/reports] POST:", logSafe(error));
    return NextResponse.json({ ok: false, error: { code, message } }, { status });
  }
}

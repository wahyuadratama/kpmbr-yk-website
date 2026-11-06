/**
 * API transaksi keuangan.
 *
 * `GET /api/finance/transactions` — daftar transaksi dengan pagination & filter.
 *   Query: page, size, q, type, categoryId, dateFrom, dateTo
 * `POST /api/finance/transactions` — buat transaksi baru.
 */
import { NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { listFinancialTransactions } from "@/server/modules/finance/queries";
import { createFinancialTransactionAction } from "@/server/modules/finance/actions";
import { publicMessage, logSafe } from "@/shared/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    await requirePermission("finance:read_transaction");
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: searchParams.get("page"),
      size: searchParams.get("size"),
      q: searchParams.get("q"),
      type: searchParams.get("type"),
      categoryId: searchParams.get("categoryId"),
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Parameter query tidak valid." } },
        { status: 400 },
      );
    }
    const data = await listFinancialTransactions(parsed.data);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[finance/transactions] GET:", logSafe(error));
    return NextResponse.json({ ok: false, error: { code, message } }, { status });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = await createFinancialTransactionAction(body);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error.code === "VALIDATION_ERROR" ? 422 : 400 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[finance/transactions] POST:", logSafe(error));
    return NextResponse.json({ ok: false, error: { code, message } }, { status });
  }
}

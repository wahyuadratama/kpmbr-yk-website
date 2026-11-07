import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/guards";
import { markNotificationReadAction } from "@/server/modules/notifications/actions";
import { publicMessage, logSafe } from "@/shared/errors";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireSession();
    const { id } = await params;
    const result = await markNotificationReadAction({ id });
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[notifications] read:", logSafe(error));
    return NextResponse.json({ ok: false, error: { code, message } }, { status });
  }
}

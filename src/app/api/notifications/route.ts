import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/guards";
import { listNotificationsForUser } from "@/server/modules/notifications/queries";
import { publicMessage, logSafe } from "@/shared/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const principal = await requireSession();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const size = Math.min(50, Math.max(1, Number(searchParams.get("size") || "20")));
    const data = await listNotificationsForUser(principal.userId, { page, size });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[notifications] GET:", logSafe(error));
    return NextResponse.json({ ok: false, error: { code, message } }, { status });
  }
}

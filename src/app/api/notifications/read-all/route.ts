import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/guards";
import { markAllNotificationsReadAction } from "@/server/modules/notifications/actions";
import { publicMessage, logSafe } from "@/shared/errors";

export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  try {
    await requireSession();
    const result = await markAllNotificationsReadAction();
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    if (status >= 500) console.error("[notifications] read-all:", logSafe(error));
    return NextResponse.json({ ok: false, error: { code, message } }, { status });
  }
}

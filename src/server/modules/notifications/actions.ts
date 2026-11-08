/**
 * Server actions notifikasi in-app.
 */
import "server-only";
import { z } from "zod";
import { db } from "@/server/db/prisma";
import { requireSession } from "@/server/auth/guards";
import { parseOrThrow } from "@/shared/validation/parse";
import { cuidSchema } from "@/shared/validation/common";
import { runAction, type ActionResult } from "@/server/actions/result";

const idSchema = z.object({ id: cuidSchema });

/** Tandai satu notifikasi milik user yang login sebagai sudah dibaca. */
export async function markNotificationReadAction(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  return runAction("notification.read", async () => {
    const principal = await requireSession();
    const { id } = parseOrThrow(idSchema, raw);
    const result = await db.notification.updateMany({
      where: { id, userId: principal.userId, isRead: false },
      data: { isRead: true },
    });
    return { id, updated: result.count };
  });
}

/** Tandai semua notifikasi milik user yang login sebagai sudah dibaca. */
export async function markAllNotificationsReadAction(): Promise<ActionResult<{ count: number }>> {
  return runAction("notification.readAll", async () => {
    const principal = await requireSession();
    const result = await db.notification.updateMany({
      where: { userId: principal.userId, isRead: false },
      data: { isRead: true },
    });
    return { count: result.count };
  });
}

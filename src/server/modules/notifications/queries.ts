/**
 * Query notifikasi in-app. Selalu difilter per userId dari sesi (server-side).
 */
import "server-only";
import { db } from "@/server/db/prisma";

export async function listNotificationsForUser(
  userId: string,
  { page = 1, size = 20 }: { page?: number; size?: number } = {},
) {
  const skip = (page - 1) * size;
  const [items, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: size,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    }),
    db.notification.count({ where: { userId } }),
    db.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { items, total, unreadCount, page, size };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, isRead: false } });
}

export type NotificationItem = Awaited<
  ReturnType<typeof listNotificationsForUser>
>["items"][number];

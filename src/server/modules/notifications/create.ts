/**
 * Helper pembuatan notifikasi (dipanggil dari server actions/triggers lain).
 * Non-blocking terhadap alur utama: kegagalan dicatat, tidak melempar ke caller
 * kecuali diminta `required: true`.
 */
import "server-only";
import { db } from "@/server/db/prisma";
import { NotificationType, Role, UserStatus } from "@/generated/prisma/enums";
import { logSafe } from "@/shared/errors";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
};

export async function createNotification(
  input: CreateNotificationInput,
  { required = false }: { required?: boolean } = {},
): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      },
    });
  } catch (error) {
    console.error("[notification.create] gagal", logSafe(error));
    if (required) throw error;
  }
}

export async function notifyUserAndAdmins(input: {
  memberUserId: string;
  type: NotificationType;
  memberTitle: string;
  memberBody: string;
  adminTitle: string;
  adminBody: string;
  link?: string | null;
  adminLink?: string | null;
}): Promise<void> {
  const admins = await db.user.findMany({
    where: { role: Role.ADMIN, status: UserStatus.ACTIVE, deletedAt: null },
    select: { id: true },
  });
  const targets = new Map<string, CreateNotificationInput>();
  targets.set(input.memberUserId, {
    userId: input.memberUserId,
    type: input.type,
    title: input.memberTitle,
    body: input.memberBody,
    link: input.link ?? null,
  });
  for (const a of admins) {
    targets.set(a.id, {
      userId: a.id,
      type: input.type,
      title: input.adminTitle,
      body: input.adminBody,
      link: input.adminLink ?? input.link ?? null,
    });
  }
  await Promise.all([...targets.values()].map((t) => createNotification(t)));
}

/** Notifikasi pengumuman baru ke semua user aktif (semua role). */
export async function notifyAnnouncementPublished(input: {
  announcementId: string;
  title: string;
  link: string;
}): Promise<void> {
  try {
    const users = await db.user.findMany({
      where: { status: UserStatus.ACTIVE, deletedAt: null },
      select: { id: true },
    });
    if (users.length === 0) return;
    await db.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: NotificationType.PENGUMUMAN,
        title: "Pengumuman baru",
        body: input.title.slice(0, 480),
        link: input.link,
        isRead: false,
      })),
    });
  } catch (error) {
    console.error("[notification.announcement] gagal", logSafe(error));
  }
}

/** Query pengumuman untuk dashboard pengurus/admin. */
import { db } from "@/lib/db/prisma";
import { AnnouncementPriority } from "@/generated/prisma/enums";

export async function listAnnouncements({
  page = 1,
  size = 12,
  q,
}: { page?: number; size?: number; q?: string } = {}) {
  const skip = (page - 1) * size;

  const [items, total] = await Promise.all([
    db.announcement.findMany({
      where: {
        deletedAt: null,
        ...(q ? { title: { contains: q } } : {}),
      },
      orderBy: [{ priority: "asc" }, { publishedAt: "desc" }],
      skip,
      take: size,
      select: {
        id: true,
        title: true,
        body: true,
        priority: true,
        audience: true,
        publishedAt: true,
        expiresAt: true,
        createdAt: true,
        createdBy: { select: { email: true } },
      },
    }),
    db.announcement.count({
      where: {
        deletedAt: null,
        ...(q ? { title: { contains: q } } : {}),
      },
    }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      priority: item.priority ?? "NORMAL",
      expiresSoon:
        item.expiresAt && new Date(item.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })),
    total,
    page,
    size,
    pages: Math.ceil(total / size),
  };
}

export type AnnouncementListItem = Awaited<
  ReturnType<typeof listAnnouncements>
>["items"][number];

export const ANNOUNCEMENT_PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  NORMAL: "Biasa",
  PENTING: "Penting",
  MENDESAK: "Mendekat",
};

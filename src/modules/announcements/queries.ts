/** Query pengumuman untuk dashboard pengurus/admin. */
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db/prisma";
import {
  AnnouncementAudience,
  AnnouncementPriority,
} from "@/generated/prisma/enums";
import { parseParagraphs } from "@/lib/content/markdown";

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

/* -------------------------------------------------------------------------- */
/* PUBLIK                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Syarat pengumuman yang boleh tampil di halaman publik.
 *
 * Hanya pengumuman dengan `audience = PUBLIC`. Pengumuman bertipe ANGGOTA,
 * ALUMNI, atau PENGURUS tidak pernah bocor ke halaman tanpa sesi.
 */
function publicWhere(now: Date) {
  return {
    deletedAt: null,
    audience: AnnouncementAudience.PUBLIC,
    publishedAt: { lte: now },
    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
  };
}

/**
 * Daftar pengumuman publik dengan pagination.
 *
 * Dipakai halaman `/pengumuman`. Cache di-tag `announcements` supaya
 * `updateTag` dari server action structuring invalidated setelah pengumuman
 * berubah.
 */
export const listPublicAnnouncements = unstable_cache(
  async ({ page = 1, size = 10 }: { page?: number; size?: number } = {}) => {
    const now = new Date();
    const where = publicWhere(now);
    const skip = (page - 1) * size;

    const [items, total] = await Promise.all([
      db.announcement.findMany({
        where,
        orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
        skip,
        take: size,
        select: {
          id: true,
          title: true,
          body: true,
          priority: true,
          publishedAt: true,
          expiresAt: true,
        },
      }),
      db.announcement.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        body: parseParagraphs(item.body),
        expiresSoon:
          item.expiresAt !== null &&
          item.expiresAt.getTime() < now.getTime() + 7 * 24 * 60 * 60 * 1000,
      })),
      total,
      page,
      size,
      pages: Math.ceil(total / size),
    };
  },
  ["public", "announcements", "list"],
  { revalidate: 600, tags: ["announcements"] },
);

export type PublicAnnouncementItem = Awaited<
  ReturnType<typeof listPublicAnnouncements>
>["items"][number];

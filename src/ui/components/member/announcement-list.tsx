import * as React from "react";
import { db } from "@/server/db/prisma";
import { formatTanggalLengkap } from "@/shared/utils/format";
import { AnnouncementAudience } from "@/generated/prisma/enums";

/**
 * Daftar pengumuman untuk portal anggota dan alumni.
 *
 * `audience` disaring di query: anggota hanya melihat pengumuman untuk
 * publik dan anggota, alumni untuk publik dan alumni. Pengumuman untuk
 * pengurus tidak pernah bocor ke portal ini.
 */
export async function AnnouncementList({
  audience,
  limit = 20,
}: {
  audience: AnnouncementAudience[];
  limit?: number;
}) {
  const now = new Date();

  const announcements = await db.announcement.findMany({
    where: {
      deletedAt: null,
      audience: { in: audience },
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      body: true,
      priority: true,
      publishedAt: true,
      expiresAt: true,
    },
  });

  if (announcements.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-dashboard-text-muted">
        Belum ada pengumuman.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-dashboard-border">
      {announcements.map((item) => (
        <li key={item.id} className="py-3 first:pt-0 last:pb-0">
          <p className="text-sm font-medium text-dashboard-text">{item.title}</p>
          <p className="mt-0.5 text-xs text-dashboard-text-muted">
            {formatTanggalLengkap(item.publishedAt)}
            {item.expiresAt
              ? ` · berlaku sampai ${formatTanggalLengkap(item.expiresAt)}`
              : ""}
          </p>
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-dashboard-text-muted">
            {item.body}
          </p>
        </li>
      ))}
    </ul>
  );
}

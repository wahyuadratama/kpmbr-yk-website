/**
 * Query agenda untuk layer publik.
 *
 * Agenda `DRAFT` tidak pernah keluar ke publik. Agenda yang sudah lewat tetap
 * ditampilkan di halaman agenda (arsip kegiatan), tetapi tidak masuk daftar
 * "agenda terdekat" di homepage.
 */
import { unstable_cache } from "next/cache";
import { EventStatus, FileAccessLevel } from "@/generated/prisma/enums";
import { db } from "@/lib/db/prisma";
import { publicFileSrc } from "@/lib/files/public-url";
import type { AgendaEvent } from "@/types/public";

/** Status yang boleh tampil di halaman publik. */
const PUBLIC_STATUS = [
  EventStatus.TERJADWAL,
  EventStatus.BERLANGSUNG,
  EventStatus.SELESAI,
  EventStatus.DIBATALKAN,
] as const;

const SELECT = {
  slug: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  location: true,
  organizer: true,
  status: true,
  coverFile: { select: { id: true, storageKey: true, accessLevel: true, altText: true } },
} as const;

type EventRow = {
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string;
  organizer: string;
  status: EventStatus;
  coverFile: {
    id: string;
    storageKey: string;
    accessLevel: FileAccessLevel;
    altText: string | null;
  } | null;
};

export function toAgendaEvent(row: EventRow): AgendaEvent {
  const coverImageUrl = publicFileSrc(row.coverFile);
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString(),
    location: row.location,
    organizer: row.organizer,
    // Query publik tidak pernah mengambil DRAFT, jadi ini tidak pernah
    // mengganti status sebenarnya.
    status: row.status as AgendaEvent["status"],
    coverImageUrl,
    coverImageAlt: coverImageUrl ? (row.coverFile?.altText ?? "") : "",
  };
}

/** Seluruh agenda publik, dari yang paling lama ke yang akan datang. */
export const getEvents = unstable_cache(
  async (): Promise<AgendaEvent[]> => {
    const rows = await db.event.findMany({
      where: { deletedAt: null, status: { in: [...PUBLIC_STATUS] } },
      orderBy: { startsAt: "asc" },
      select: SELECT,
    });
    return rows.map(toAgendaEvent);
  },
  ["public", "events", "list"],
  { revalidate: 300, tags: ["events"] },
);

/** Agenda mendatang yang belum lewat, paling dekat lebih dulu. */
export const getUpcomingEvents = unstable_cache(
  async (limit = 3): Promise<AgendaEvent[]> => {
    const rows = await db.event.findMany({
      where: {
        deletedAt: null,
        status: { in: [EventStatus.TERJADWAL, EventStatus.BERLANGSUNG] },
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      take: limit,
      select: SELECT,
    });
    return rows.map(toAgendaEvent);
  },
  ["public", "events", "upcoming"],
  { revalidate: 300, tags: ["events"] },
);

/**
 * Pisahkan agenda menjadi "mendatang" dan "telah berlangsung".
 *
 * Pembagian dilakukan di sini, bukan di komponen, supaya komponen tetap
 * murni (tidak memanggil `Date.now()` saat render) dan hasil pembagian ikut
 * ter-cache bersama query.
 */
export const getAgendaSections = unstable_cache(
  async (): Promise<{ upcoming: AgendaEvent[]; past: AgendaEvent[] }> => {
    const rows = await db.event.findMany({
      where: { deletedAt: null, status: { in: [...PUBLIC_STATUS] } },
      orderBy: { startsAt: "asc" },
      select: SELECT,
    });
    const now = Date.now();
    const events = rows.map(toAgendaEvent);
    return {
      upcoming: events.filter((event) => {
        const finished =
          event.status === EventStatus.SELESAI ||
          event.status === EventStatus.DIBATALKAN;
        return !finished && new Date(event.startsAt).getTime() >= now;
      }),
      past: events.filter((event) => {
        const finished =
          event.status === EventStatus.SELESAI ||
          event.status === EventStatus.DIBATALKAN;
        return finished || new Date(event.startsAt).getTime() < now;
      }),
    };
  },
  ["public", "events", "sections"],
  { revalidate: 300, tags: ["events"] },
);

export const getEventBySlug = unstable_cache(
  async (slug: string): Promise<AgendaEvent | null> => {
    const row = await db.event.findFirst({
      where: { deletedAt: null, status: { in: [...PUBLIC_STATUS] }, slug },
      select: SELECT,
    });
    return row ? toAgendaEvent(row) : null;
  },
  ["public", "events", "bySlug"],
  { revalidate: 300, tags: ["events"] },
);

export const getEventSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await db.event.findMany({
      where: { deletedAt: null, status: { in: [...PUBLIC_STATUS] } },
      orderBy: { startsAt: "asc" },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  },
  ["public", "events", "slugs"],
  { revalidate: 3600, tags: ["events"] },
);

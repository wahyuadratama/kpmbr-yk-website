import * as React from "react";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { db } from "@/server/db/prisma";
import { formatTanggalLengkap, formatJam } from "@/shared/utils/format";
import { EventStatus } from "@/generated/prisma/enums";

/**
 * Daftar agenda untuk portal anggota dan alumni.
 *
 * Komponen server: data diambil langsung dari database, filter status dan
 * batas jumlah diterapkan di query.
 */
export async function EventList({ limit = 20 }: { limit?: number }) {
  const events = await db.event.findMany({
    where: {
      deletedAt: null,
      status: { in: [EventStatus.TERJADWAL, EventStatus.BERLANGSUNG] },
    },
    orderBy: { startsAt: "asc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      location: true,
      organizer: true,
    },
  });

  if (events.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-dashboard-text-muted">
        Belum ada agenda yang terjadwal.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-dashboard-border">
      {events.map((event) => (
        <li key={event.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href={`/agenda/${event.slug}`}
              className="min-w-0 flex-1 truncate text-sm font-medium text-dashboard-text hover:text-dashboard-primary"
            >
              {event.title}
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs text-dashboard-text-muted">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              {formatTanggalLengkap(event.startsAt)} · {formatJam(event.startsAt)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-dashboard-text-muted">
            {event.description}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-dashboard-text-muted">
            <MapPin aria-hidden="true" className="size-3.5" />
            {event.location} · {event.organizer}
          </p>
        </li>
      ))}
    </ul>
  );
}

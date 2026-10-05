import * as React from "react";
import Link from "next/link";
import { cn } from "cn";
import { Calendar, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  EVENT_STATUS_CLASS,
  EVENT_STATUS_LABEL,
  type AgendaEvent,
} from "@/types/public";
import {
  formatBulanSingkat,
  formatHari,
  formatJam,
} from "@/lib/utils/format";

type EventRowProps = {
  event: AgendaEvent;
  className?: string;
};

/**
 * Baris agenda: blok tanggal di kiri, detail di kanan.
 * Tanggal pada blok visual disembunyikan dari pembaca layar karena isinya
 * angka hari dan singkatan bulan; sebagai gantinya tersedia teks tanggal
 * lengkap di dalam `sr-only`.
 */
export function EventRow({ event, className }: EventRowProps) {
  const date = new Date(event.startsAt);

  return (
    <article
      className={cn(
        "group flex gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand/30 sm:gap-5 sm:p-5",
        className,
      )}
    >
      <div className="flex shrink-0 flex-col items-center justify-center rounded-md bg-brand-muted px-3 py-2 text-brand-muted-foreground sm:px-4 sm:py-3">
        <span className="sr-only">{formatTanggalLengkapAksesibel(date)}</span>
        <span
          aria-hidden="true"
          className="text-2xl leading-none font-semibold tabular-nums sm:text-3xl"
        >
          {formatHari(date)}
        </span>
        <span
          aria-hidden="true"
          className="mt-1 text-[0.65rem] font-medium tracking-[0.12em] uppercase"
        >
          {formatBulanSingkat(date)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "px-1.5 py-0 text-[0.65rem]",
              EVENT_STATUS_CLASS[event.status],
            )}
          >
            {EVENT_STATUS_LABEL[event.status]}
          </Badge>
        </div>

        <h3 className="mt-2 text-base font-semibold tracking-tight sm:text-lg">
          <Link
            href={`/agenda/${event.slug}`}
            className="rounded-sm outline-none after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {event.title}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {event.description}
        </p>

        <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar aria-hidden="true" className="size-3.5 shrink-0" />
            <dt className="sr-only">Waktu</dt>
            <dd>{formatJam(event.startsAt)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            <dt className="sr-only">Lokasi</dt>
            <dd className="truncate">{event.location}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Users aria-hidden="true" className="size-3.5 shrink-0" />
            <dt className="sr-only">Penyelenggara</dt>
            <dd className="truncate">{event.organizer}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function formatTanggalLengkapAksesibel(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}
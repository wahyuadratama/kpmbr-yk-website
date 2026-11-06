import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Badge } from "@/ui/components/ui/badge";
import { MockDataNotice } from "@/ui/components/public/mock-data-notice";
import { JsonLd } from "@/ui/components/public/json-ld";
import { getEventBySlug, getEvents, getEventSlugs } from "@/server/modules/events/queries";
import {
  EVENT_STATUS_CLASS,
  EVENT_STATUS_LABEL,
} from "@/shared/types/public";
import {
  formatJam,
  formatTanggalLengkap,
  truncate,
} from "@/shared/utils/format";
import { siteConfig } from "@/shared/site-config";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getEventSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Agenda tidak ditemukan" };

  return {
    title: event.title,
    description: truncate(event.description, 160),
    alternates: { canonical: `/agenda/${event.slug}` },
    openGraph: {
      title: event.title,
      description: truncate(event.description, 160),
      url: `${siteConfig.url}/agenda/${event.slug}`,
    },
  };
}

/**
 * Detail agenda kegiatan.
 *
 * REQUIREMENT §15: tanggal, jam, lokasi, penyelenggara, deskripsi, dan status.
 * RSVP tidak ada pada tahap awal, jadi tidak ada tombol pendaftaran di sini.
 */
export default async function AgendaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const others = (await getEvents())
    .filter((item) => item.slug !== event.slug)
    .slice(0, 3);

  return (
    <>
      <JsonLd
        type="Event"
        data={{
          name: event.title,
          description: truncate(event.description, 300),
          startDate: event.startsAt,
          endDate: event.endsAt ?? event.startsAt,
          eventStatus: event.status,
          location: {
            "@type": "Place",
            name: event.location,
            address: {
              "@type": "PostalAddress",
              addressLocality: siteConfig.address.city,
              addressRegion: siteConfig.address.region,
              addressCountry: siteConfig.address.country,
            },
          },
          organizer: { "@type": "Organization", name: event.organizer },
          url: `${siteConfig.url}/agenda/${event.slug}`,
        }}
      />

      <article>
        <header className="border-b border-border bg-surface-muted">
          <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/agenda">
                <ArrowLeft aria-hidden="true" />
                Semua agenda
              </Link>
            </Button>

            <div className="mt-4">
              <Badge
                variant="outline"
                className={`px-1.5 py-0 text-[0.65rem] ${EVENT_STATUS_CLASS[event.status]}`}
              >
                {EVENT_STATUS_LABEL[event.status]}
              </Badge>
            </div>

            <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              {event.title}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {event.description}
            </p>

            <dl className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar aria-hidden="true" className="size-3.5" />
                <dt className="sr-only">Tanggal</dt>
                <dd>{formatTanggalLengkap(event.startsAt)}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-3.5" />
                <dt className="sr-only">Waktu</dt>
                <dd className="tabular-nums">
                  {formatJam(event.startsAt)}
                  {event.endsAt ? ` - ${formatJam(event.endsAt)}` : ""}
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-3.5" />
                <dt className="sr-only">Lokasi</dt>
                <dd>{event.location}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Users aria-hidden="true" className="size-3.5" />
                <dt className="sr-only">Penyelenggara</dt>
                <dd>{event.organizer}</dd>
              </div>
            </dl>

            <MockDataNotice scope="detail agenda ini" className="mt-6" />
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <section aria-labelledby="penjelasan">
            <h2 id="penjelasan" className="text-xl font-semibold tracking-tight">
              Penjelasan
            </h2>
            <p className="mt-3 text-base leading-[1.8] text-foreground/90">
              {event.description}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Kegiatan terbuka untuk anggota. Untuk memastikan kehadiran atau
              meminta informasi lebih lanjut, hubungi Sekretariat melalui{" "}
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="font-medium underline underline-offset-4"
              >
                {siteConfig.contact.email}
              </a>
              .
            </p>
          </section>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-8">
            <Button asChild variant="outline" size="lg" className="h-10">
              <Link href="/agenda">
                <ArrowLeft aria-hidden="true" />
                Semua agenda
              </Link>
            </Button>
            <Button asChild size="lg" className="h-10">
              <Link href="/kontak">Hubungi Sekretariat</Link>
            </Button>
          </div>
        </div>
      </article>

      {others.length > 0 ? (
        <aside
          aria-labelledby="agenda-lain"
          className="border-t border-border bg-surface-muted"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <h2
              id="agenda-lain"
              className="text-xl font-semibold tracking-tight"
            >
              Agenda lainnya
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {others.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/agenda/${item.slug}`}
                    className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:border-brand/30 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-xs text-muted-foreground">
                      {formatTanggalLengkap(item.startsAt)}
                    </span>
                    <span className="text-sm font-medium tracking-tight group-hover:underline">
                      {item.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      ) : null}
    </>
  );
}

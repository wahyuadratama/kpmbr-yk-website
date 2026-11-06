import * as React from "react";
import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/ui/components/layout/page-header";
import { MockDataNotice } from "@/ui/components/public/mock-data-notice";
import { EventRow } from "@/ui/components/public/event-row";
import { EmptyState } from "@/ui/components/ui/empty-state";
import { getAgendaSections } from "@/server/modules/events/queries";

export const metadata: Metadata = {
  title: "Agenda",
  description:
    "Agenda kegiatan KPMBR-YK: rapat koordinasi, orientasi anggota, bakti sosial, diskusi, dan pertemuan tahunan.",
  alternates: { canonical: "/agenda" },
};

/**
 * Daftar agenda.
 *
 * REQUIREMENT §15: tampilkan tanggal, jam, lokasi, deskripsi, penyelenggara,
 * dan status. Fitur RSVP/registrasi TIDAK dibuat pada tahap awal.
 *
 * Pembagian agenda menjadi "mendatang" dan "telah berlangsung" dihitung di
 * server (`getAgendaSections`), bukan saat render.
 */
export default async function AgendaPage() {
  const { upcoming, past } = await getAgendaSections();

  return (
    <>
      <PageHeader
        eyebrow="Jadwal"
        title="Agenda kegiatan"
        description="Semua kegiatan yang sudah dijadwalkan beserta waktu, lokasi, dan penyelenggara."
      >
        <MockDataNotice scope="seluruh agenda" />
      </PageHeader>

      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <section aria-labelledby="agenda-mendatang">
          <h2
            id="agenda-mendatang"
            className="text-xl font-semibold tracking-tight"
          >
            Mendatang
          </h2>
          <div className="mt-6 flex flex-col gap-4">
            {upcoming.length > 0 ? (
              upcoming.map((event) => <EventRow key={event.slug} event={event} />)
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="Belum ada agenda terjadwal"
                description="Agenda kegiatan berikutnya belum ditetapkan. Pantau halaman ini secara berkala."
              />
            )}
          </div>
        </section>

        {past.length > 0 ? (
          <section aria-labelledby="agenda-selesai" className="mt-14">
            <h2
              id="agenda-selesai"
              className="text-xl font-semibold tracking-tight"
            >
              Telah berlangsung
            </h2>
            <div className="mt-6 flex flex-col gap-4">
              {past.map((event) => (
                <EventRow key={event.slug} event={event} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
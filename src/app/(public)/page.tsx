import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Images, Target, Users } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { SectionHeading } from "@/ui/components/layout/section-heading";
import { AlbumCard } from "@/ui/components/public/album-card";
import { EventRow } from "@/ui/components/public/event-row";
import { MockDataNotice } from "@/ui/components/public/mock-data-notice";
import { NewsCard } from "@/ui/components/public/news-card";
import { ProgramCard } from "@/ui/components/public/program-card";
import { EmptyState } from "@/ui/components/ui/empty-state";
import {
  getMisi,
  getNilai,
  getOrganizationStats,
  getVisi,
} from "@/server/modules/organization/queries";
import { getUpcomingEvents } from "@/server/modules/events/queries";
import { getPrograms } from "@/server/modules/programs/queries";
import { getAlbums } from "@/server/modules/documentation/queries";
import { getFeaturedNews, getPublishedNews } from "@/server/modules/news/queries";
import { formatNumber } from "@/shared/utils/format";
import { siteConfig } from "@/shared/site-config";

/**
 * Homepage KPMBR-YK.
 *
 * REQUIREMENT §12: homepage harus memprioritaskan aktivitas organisasi,
 * bukan sekadar hero section. Karena itu urutan bloknya:
 *   hero → statistik → berita → agenda → tentang → program kerja →
 *   dokumentasi → CTA bergabung
 *
 * Hero dibuat ringkas agar konten aktivitas tampil di atas lipatan.
 *
 * Seluruh angka dan konten dibaca dari database lewat query di
 * `src/modules/*`. Tidak ada data yang ditulis manual di komponen ini.
 */
export default async function HomePage() {
  const [
    featured,
    latestNews,
    upcomingEvents,
    featuredPrograms,
    recentAlbums,
    stats,
    visi,
    misi,
    nilai,
  ] = await Promise.all([
    getFeaturedNews(),
    getPublishedNews(4),
    getUpcomingEvents(3),
    getPrograms(3),
    getAlbums(3),
    getOrganizationStats(),
    getVisi(),
    getMisi(),
    getNilai(),
  ]);

  // Berita utama tidak diulang di daftar pendek di sebelahnya.
  const otherNews = latestNews
    .filter((article) => article.slug !== featured?.slug)
    .slice(0, 3);

  return (
    <>
      <Hero />
      <StatsStrip stats={stats} />

      {/* Berita — blok paling penting setelah hero. */}
      <Section id="berita" className="border-b border-border bg-background">
        <SectionHeading
          eyebrow="Kabar Terbaru"
          title="Berita dan kegiatan KPMBR-YK"
          description="Kabar terbaru mengenai program kerja, keputusan organisasi, dan kegiatan yang sedang maupun telah dilaksanakan."
          action={
            <Button asChild variant="outline" size="lg" className="h-10">
              <Link href="/berita">
                Semua berita
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {featured ? (
            <NewsCard article={featured} className="lg:col-span-2" />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Belum ada berita"
              description="Kabar organisasi akan tampil di sini setelah dipublikasikan pengurus."
              className="lg:col-span-2"
            />
          )}
          <div className="flex flex-col gap-4">
            {otherNews.length > 0 ? (
              otherNews.map((article) => (
                <NewsCard
                  key={article.slug}
                  article={article}
                  variant="compact"
                />
              ))
            ) : (
              <EmptyState
                title="Belum ada berita lain"
                description="Berita terbaru akan muncul di sini."
              />
            )}
          </div>
        </div>
      </Section>

      {/* Agenda — prioritize agenda terdekat. */}
      <Section id="agenda" className="border-b border-border bg-surface-muted">
        <SectionHeading
          eyebrow="Agenda"
          title="Agenda terdekat"
          description="Kegiatan yang sudah dijadwalkan. Datang langsung ke Sekretariat atau ikuti secara daring."
          action={
            <Button asChild variant="outline" size="lg" className="h-10">
              <Link href="/agenda">
                Semua agenda
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />

        <div className="mt-8 flex flex-col gap-4">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <EventRow key={event.slug} event={event} />
            ))
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Belum ada agenda terjadwal"
              description="Agenda kegiatan berikutnya belum ditetapkan. Pantau halaman ini secara berkala."
            />
          )}
        </div>
      </Section>

      {/* Tentang — visi, misi, nilai. */}
      <Section id="tentang" className="border-b border-border bg-background">
        <SectionHeading
          eyebrow="Tentang KPMBR-YK"
          title="Organisasi yang bergerak, bukan sekadar berstruktur"
          description={`${siteConfig.fullName} menghimpun pelajar dan mahasiswa dari berbagai perguruan tinggi di Yogyakarta dalam satu kesatuan yang saling menguatkan.`}
          action={
            <Button asChild variant="outline" size="lg" className="h-10">
              <Link href="/tentang">
                Selengkapnya tentang KPMBR-YK
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              <Target aria-hidden="true" className="size-4" />
              Visi
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              {visi}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              <Users aria-hidden="true" className="size-4" />
              Misi
            </h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {misi.slice(0, 3).map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 text-sm leading-relaxed text-foreground/90"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-brand/40"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              <Images aria-hidden="true" className="size-4" />
              Nilai
            </h3>
            <dl className="mt-3 flex flex-col gap-3">
              {nilai.map((value) => (
                <div key={value.title}>
                  <dt className="text-sm font-medium">{value.title}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {value.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      {/* Program kerja. */}
      <Section id="proker" className="border-b border-border bg-surface-muted">
        <SectionHeading
          eyebrow="Program Kerja"
          title="Program yang sedang berjalan"
          description="Setiap program punya penanggung jawab, jadwal, dan progres yang dapat dipantau."
          action={
            <Button asChild variant="outline" size="lg" className="h-10">
              <Link href="/proker">
                Semua program kerja
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredPrograms.length > 0 ? (
            featuredPrograms.map((program) => (
              <ProgramCard key={program.slug} program={program} />
            ))
          ) : (
            <EmptyState
              title="Belum ada program kerja"
              description="Program kerja akan tampil di sini setelah disusun pengurus."
              className="sm:col-span-2 lg:col-span-3"
            />
          )}
        </div>
      </Section>

      {/* Dokumentasi. */}
      <Section
        id="dokumentasi"
        className="border-b border-border bg-background"
      >
        <SectionHeading
          eyebrow="Dokumentasi"
          title="Jejak kegiatan"
          description="Arsip visual kegiatan organisasi. Bertahan sebagai bukti bahwa organisasi benar-benar bergerak."
          action={
            <Button asChild variant="outline" size="lg" className="h-10">
              <Link href="/dokumentasi">
                Semua dokumentasi
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recentAlbums.length > 0 ? (
            recentAlbums.map((album) => (
              <AlbumCard key={album.slug} album={album} />
            ))
          ) : (
            <EmptyState
              icon={Images}
              title="Belum ada dokumentasi"
              description="Album dokumentasi akan tampil di sini setelah diunggah pengurus."
              className="sm:col-span-2 lg:col-span-3"
            />
          )}
        </div>
      </Section>

      {/* CTA bergabung. */}
      <JoinCta />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {siteConfig.fullName}
          </p>
          <h1 className="mt-3 text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
            Ti Bandung Raya, Ngahiji di Yogyakarta.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            KPMBR-YK menjadi wadah kekeluargaan bagi pelajar dan mahasiswa asal
            Bandung Raya di Yogyakarta untuk mempererat persaudaraan,
            mengembangkan potensi, serta menjaga nilai dan budaya Sunda dalam
            semangat kebersamaan dan pengabdian.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-11 px-5">
              <Link href="/keanggotaan#bergabung">
                Gabung dengan KPMBR-YK
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-5">
              <Link href="/proker">Lihat program kerja</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsStrip({
  stats,
}: {
  stats: {
    newsCount: number;
    eventCount: number;
    activeProgramCount: number;
    albumCount: number;
    memberCount: number;
  };
}) {
  const rows = [
    { label: "Anggota terdaftar", value: stats.memberCount },
    { label: "Program kerja aktif", value: stats.activeProgramCount },
    { label: "Agenda mendatang", value: stats.eventCount },
    { label: "Album dokumentasi", value: stats.albumCount },
  ];

  return (
    <section
      aria-label="Ringkasan organisasi"
      className="border-b border-border bg-surface-muted"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {rows.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs tracking-wide text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {formatNumber(stat.value)}
              </dd>
            </div>
          ))}
        </dl>
        <MockDataNotice
          scope="ringkasan aktivitas di homepage"
          className="mt-6"
        />
      </div>
    </section>
  );
}

function JoinCta() {
  return (
    <section className="bg-primary">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-balance text-primary-foreground sm:text-3xl">
            Punya tempat di Yogyakarta yang ingin kamu bangun bersama?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            Keanggotaan KPMBR-YK terbuka untuk pelajar dan mahasiswa aktif pada
            perguruan tinggi di wilayah Yogyakarta. Tidak ada biaya pendaftaran.
            Pendaftaran dilakukan melalui Sekretariat.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="h-11 px-5">
              <Link href="/keanggotaan">
                Lihat syarat dan alur pendaftaran
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 border-primary-foreground/30 bg-transparent px-5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/kontak">Hubungi Sekretariat</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Section({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        {children}
      </div>
    </section>
  );
}

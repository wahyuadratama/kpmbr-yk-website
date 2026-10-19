import * as React from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { MockDataNotice } from "@/components/public/mock-data-notice";
import { SectionHeading } from "@/components/layout/section-heading";
import {
  getCurrentPositions,
  getDivisions,
  getMisi,
  getNilai,
  getSejarahParagraphs,
  getVisi,
} from "@/modules/organization/queries";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Tentang KPMBR-YK",
  description: `Sejarah, visi, misi, nilai, dan identitas ${siteConfig.fullName}.`,
  alternates: { canonical: "/tentang" },
};

export default async function TentangPage() {
  const [sejarah, visi, misi, nilai, divisi, jabatanInti] = await Promise.all([
    getSejarahParagraphs(),
    getVisi(),
    getMisi(),
    getNilai(),
    getDivisions(),
    getCurrentPositions(),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Profil Organisasi"
        title="Tentang KPMBR-YK"
        description={`${siteConfig.fullName} adalah organisasi yang menghimpun pelajar dan mahasiswa dari berbagai perguruan tinggi di Yogyakarta.`}
      >
        <MockDataNotice scope="seluruh isi halaman ini" />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <section aria-labelledby="sejarah">
              <h2
                id="sejarah"
                className="text-2xl font-semibold tracking-tight"
              >
                Sejarah
              </h2>
              <div className="mt-4 flex flex-col gap-4 text-base leading-[1.8] text-foreground/90">
                {sejarah.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section aria-labelledby="visi" className="mt-12">
              <h2 id="visi" className="text-2xl font-semibold tracking-tight">
                Visi
              </h2>
              <p className="mt-4 text-base leading-[1.8] text-foreground/90">
                {visi}
              </p>
            </section>

            <section aria-labelledby="misi" className="mt-12">
              <h2 id="misi" className="text-2xl font-semibold tracking-tight">
                Misi
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {misi.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 text-base leading-[1.8] text-foreground/90"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-3 size-1.5 shrink-0 rounded-full bg-brand/40"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Identitas organisasi
              </h2>
              <dl className="mt-4 flex flex-col gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Nama lengkap</dt>
                  <dd className="mt-0.5 font-medium">{siteConfig.fullName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sebutan</dt>
                  <dd className="mt-0.5 font-medium">{siteConfig.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Wilayah</dt>
                  <dd className="mt-0.5 font-medium">
                    {siteConfig.address.city}, {siteConfig.address.region}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sekretariat</dt>
                  <dd className="mt-0.5 font-medium">
                    {siteConfig.address.street}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Kontak</dt>
                  <dd className="mt-0.5 font-medium">
                    {siteConfig.contact.email}
                  </dd>
                </div>
              </dl>
            </div>

            <section
              id="nilai"
              aria-labelledby="nilai-judul"
              className="mt-6 rounded-lg border border-border bg-card p-5"
            >
              <h2
                id="nilai-judul"
                className="text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase"
              >
                Nilai organisasi
              </h2>
              <dl className="mt-4 flex flex-col gap-4">
                {nilai.map((value) => (
                  <div key={value.title}>
                    <dt className="text-sm font-medium">{value.title}</dt>
                    <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {value.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </aside>
        </div>

        <section aria-labelledby="pengurus" className="mt-16 border-t border-border pt-12">
          <SectionHeading
            eyebrow="Struktur"
            title="Kepengurusan"
            description="Jabatan inti dan divisi yang menjalankan program kerja."
          />
          <p id="pengurus" className="sr-only">
            Daftar jabatan kepengurusan
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {jabatanInti.map((position) => (
              <div
                key={position.code}
                className="rounded-lg border border-border bg-card p-4"
              >
                <dt className="text-sm font-semibold">{position.name}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {position.holderName}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-lg border border-border bg-surface-muted p-4">
            <h3 className="text-sm font-semibold">Divisi</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {divisi.map((division) => (
                <li
                  key={division}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {division}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
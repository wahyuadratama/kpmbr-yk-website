import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { PageHeader } from "@/ui/components/layout/page-header";
import { SectionHeading } from "@/ui/components/layout/section-heading";
import { MockDataNotice } from "@/ui/components/public/mock-data-notice";
import {
  getMembershipBenefits,
  getMembershipRequirements,
  getMembershipSteps,
} from "@/server/modules/organization/queries";
import { siteConfig } from "@/shared/site-config";

export const metadata: Metadata = {
  title: "Keanggotaan",
  description:
    "Cara bergabung menjadi anggota KPMBR-YK, persyaratan, manfaat menjadi anggota, dan alur pendaftaran.",
  alternates: { canonical: "/keanggotaan" },
};

/**
 * Informasi keanggotaan.
 *
 * REQUIREMENT §18: website publik harus memuat cara bergabung, persyaratan,
 * manfaat, dan alur pendaftaran. Pendaftaran daring (online registration)
 * TIDAK dibuat pada tahap awal — hanya informasi dan alur.
 */
export default async function KeanggotaanPage() {
  const [requirements, benefits, steps] = await Promise.all([
    getMembershipRequirements(),
    getMembershipBenefits(),
    getMembershipSteps(),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Keanggotaan"
        title="Bergabung dengan KPMBR-YK"
        description={`Keanggotaan terbuka untuk pelajar dan mahasiswa aktif pada perguruan tinggi di wilayah Yogyakarta. Tidak ada biaya pendaftaran.`}
      >
        <MockDataNotice scope="syarat, manfaat, dan alur pendaftaran" />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <section id="persyaratan" aria-labelledby="persyaratan-judul">
              <SectionHeading
                title="Persyaratan"
                description="Syarat minimal untuk dapat mendaftar sebagai anggota KPMBR-YK."
              />
              <p id="persyaratan-judul" className="sr-only">
                Persyaratan keanggotaan
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {requirements.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 rounded-lg border border-border bg-card p-4"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-4.5 shrink-0 text-brand"
                    />
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="manfaat" aria-labelledby="manfaat-judul" className="mt-14">
              <SectionHeading
                title="Manfaat menjadi anggota"
                description="Apa yang diperoleh anggota selama dan setelah menjadi bagian dari KPMBR-YK."
              />
              <p id="manfaat-judul" className="sr-only">
                Manfaat keanggotaan
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles
                        aria-hidden="true"
                        className="size-4 text-terra"
                      />
                      {benefit.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div
              id="bergabung"
              className="sticky top-20 rounded-lg border border-brand/20 bg-brand-muted/40 p-5 sm:p-6"
            >
              <h2 className="text-base font-semibold tracking-tight">
                Cara bergabung
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Datang langsung ke Sekretariat pada jam kerja, atau hubungi
                terlebih dahulu untuk memastikan jadwal pewawancara.
              </p>

              <dl className="mt-5 flex flex-col gap-3 text-sm">
                <div className="flex gap-2.5">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                  />
                  <div>
                    <dt className="font-medium">Sekretariat</dt>
                    <dd className="text-muted-foreground">
                      {siteConfig.address.street}, {siteConfig.address.city}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Mail
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                  />
                  <div>
                    <dt className="font-medium">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${siteConfig.contact.email}`}
                        className="text-muted-foreground underline underline-offset-4"
                      >
                        {siteConfig.contact.email}
                      </a>
                    </dd>
                  </div>
                </div>
              </dl>

              <Button asChild size="lg" className="mt-6 h-11 w-full">
                <a href={`mailto:${siteConfig.contact.email}`}>
                  Hubungi Sekretariat
                </a>
              </Button>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Pendaftaran keanggotaan diproses secara manual melalui verifikasi
                sekretariat/admin. Dengan mengajukan pendaftaran, kamu menyetujui{" "}
                <Link href="/syarat-ketentuan" className="underline underline-offset-4 hover:text-foreground">
                  Syarat &amp; Ketentuan
                </Link>.
              </p>
            </div>
          </aside>
        </div>

        <section aria-labelledby="alur-judul" className="mt-16 border-t border-border pt-12">
          <SectionHeading
            eyebrow="Langkah"
            title="Alur pendaftaran"
            description="Proses dari datang ke sekretariat hingga resmi menjadi anggota."
          />
          <p id="alur-judul" className="sr-only">
            Alur pendaftaran
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step) => (
              <li
                key={step.step}
                className="rounded-lg border border-border bg-card p-4"
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums"
                >
                  {step.step}
                </span>
                <span className="sr-only">Langkah </span>
                <h3 className="mt-3 text-sm font-semibold">
                  <span className="sr-only">{step.step}. </span>
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
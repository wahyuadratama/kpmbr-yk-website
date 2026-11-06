import * as React from "react";
import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { PageHeader } from "@/ui/components/layout/page-header";
import { MockDataNotice } from "@/ui/components/public/mock-data-notice";
import { siteConfig } from "@/shared/site-config";

export const metadata: Metadata = {
  title: "Kontak",
  description: `Hubungi Sekretariat ${siteConfig.fullName} melalui email, media sosial, atau datang ke sekretariat.`,
  alternates: { canonical: "/kontak" },
};

/**
 * Halaman kontak.
 *
 * Formulir kontak TIDAK dibuat pada tahap awal. Menambahkan form kontak berarti
 * butuh endpoint yang tahan spam, rate limiting, dan penyimpanan pesan — itu
 * masuk lingkup tahap berikutnya. Untuk sekarang ditampilkan kanal kontak
 * langsung yang memang sudah tersedia.
 */
export default function KontakPage() {
  const channels = [
    {
      icon: Mail,
      label: "Email Sekretariat",
      value: siteConfig.contact.email,
      href: `mailto:${siteConfig.contact.email}`,
      hint: "Untuk pertanyaan umum, kerja sama, dan permintaan dokumen.",
    },
    {
      icon: MessageCircle,
      label: "Instagram",
      value: "@kpmbr",
      href: siteConfig.contact.instagram,
      hint: "Kabar terbaru dan pengumuman cepat.",
    },
    {
      icon: MapPin,
      label: "Sekretariat",
      value: `${siteConfig.address.street}, ${siteConfig.address.city}, ${siteConfig.address.region}`,
      href: null,
      hint: "Kunjungi pada jam kerja untuk urusan pendaftaran.",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Hubungi Kami"
        title="Kontak"
        description={`Sampaikan pertanyaan, masukan, atau permintaan kerja sama. Sekretariat KPMBR-YK terbuka untuk komunikasi dari pelajar, mahasiswa, kampus, dan mitra.`}
      >
        <MockDataNotice scope="alamat sekretariat dan tautan sosial" />
      </PageHeader>

      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <ul className="grid gap-4 sm:grid-cols-2">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const content = (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-muted text-brand-muted-foreground">
                  <Icon aria-hidden="true" className="size-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {channel.label}
                  </span>
                  <span className="mt-0.5 block text-sm break-words text-muted-foreground underline-offset-4 group-hover:underline">
                    {channel.value}
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                    {channel.hint}
                  </span>
                </span>
              </>
            );

            return (
              <li key={channel.label}>
                {channel.href ? (
                  <a
                    href={channel.href}
                    target={
                      channel.href.startsWith("http") ? "_blank" : undefined
                    }
                    rel={
                      channel.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="group flex h-full gap-4 rounded-lg border border-border bg-card p-5 outline-none transition-colors hover:border-brand/30 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex h-full gap-4 rounded-lg border border-border bg-card p-5">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-12 rounded-lg border border-border bg-surface-muted p-5 sm:p-6">
          <h2 className="text-base font-semibold tracking-tight">
            Ingin menjadi anggota?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Untuk pertanyaan keanggotaan, cara yang paling pasti adalah datang
            langsung ke Sekretariat. Persyaratan dan alur pendaftaran ada di
            halaman keanggotaan.
          </p>
          <a
            href="/keanggotaan"
            className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
          >
            Lihat halaman keanggotaan
          </a>
        </div>
      </div>
    </>
  );
}
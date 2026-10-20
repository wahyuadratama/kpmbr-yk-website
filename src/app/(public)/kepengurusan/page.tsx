import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MockDataNotice } from "@/components/public/mock-data-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentPositions, getCurrentTerm, getDivisions, getOrganizationTerms } from "@/modules/organization/queries";
import { formatTanggal } from "@/lib/utils/format";
import { initials } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Kepengurusan",
  description:
    "Struktur kepengurusan KPMBR-YK beserta pemegang jabatan, periode, dan deskripsi tanggung jawab.",
  alternates: { canonical: "/kepengurusan" },
};

/** Struktur kepengurusan dan daftar divisi. */
export default async function KepengurusanPage() {
  const [positions, divisions, term, terms] = await Promise.all([
    getCurrentPositions(),
    getDivisions(),
    getCurrentTerm(),
    getOrganizationTerms(),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Struktur Organisasi"
        title="Kepengurusan"
        description="Jabatan inti beserta penanggung jawabnya, dan divisi yang menjalankan program kerja harian."
      >
        <MockDataNotice scope="nama pemegang jabatan dan periode" />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {positions.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada data kepengurusan"
            description="Struktur kepengurusan akan tampil di sini setelah dimuatkan pengurus."
          />
        ) : (
          <>
            <ol className="grid gap-4 sm:grid-cols-2">
                {positions.map((position) => (
                <li
                  key={position.code}
                  className="flex gap-4 rounded-lg border border-border bg-card p-5"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-muted text-sm font-semibold text-brand-muted-foreground"
                  >
                    {initials(position.holderName)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold tracking-tight">
                      {position.name}
                    </h2>
                    <p className="mt-0.5 text-sm font-medium">
                      {position.holderName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {position.termLabel}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {position.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <section aria-labelledby="divisi" className="mt-14">
              <h2
                id="divisi"
                className="text-xl font-semibold tracking-tight"
              >
                Divisi
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Anggota ditempatkan ke dalam satu divisi sesuai minat dan
                kebutuhan organisasi. Setiap divisi memiliki
                program kerja sendiri yang dilaporkan secara berkala.
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {divisions.map((division) => (
                  <li
                    key={division}
                    className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium"
                  >
                    {division}
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="periode"
              className="mt-14 rounded-lg border border-border bg-surface-muted p-5 sm:p-6"
            >
              <h2 id="periode" className="text-base font-semibold">
                Periode kepengurusan
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {term
                  ? `${term.name} berlangsung sejak ${formatTanggal(term.startDate)}. Setiap periode memiliki riwayat perubahan yang tersimpan, sehingga transisi kepengurusan dapat ditelusuri.`
                  : "Setiap periode memiliki riwayat perubahan yang tersimpan, sehingga transisi kepengurusan dapat ditelusuri."}
              </p>

              {terms.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-2">
                  {terms.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/kepengurusan/${item.slug}`}
                        className="flex flex-wrap items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="font-medium text-foreground">
                          {item.name}
                        </span>
                        {item.isCurrent ? (
                          <span className="rounded-full border border-brand/30 bg-brand-muted px-2 py-0.5 text-xs font-medium text-brand-muted-foreground">
                            Berjalan
                          </span>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {formatTanggal(item.startDate)} s.d.{" "}
                          {formatTanggal(item.endDate)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          </>
        )}

        <p className="mt-10 text-sm text-muted-foreground">
          Ingin menjadi bagian dari kepengurusan? Lihat{" "}
          <a
            href="/keanggotaan#bergabung"
            className="font-medium underline underline-offset-4"
          >
            informasi keanggotaan
          </a>
          .
        </p>
      </div>
    </>
  );
}

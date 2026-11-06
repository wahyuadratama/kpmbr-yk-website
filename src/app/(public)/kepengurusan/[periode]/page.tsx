import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarRange, Users } from "lucide-react";
import { PageHeader } from "@/ui/components/layout/page-header";
import { Button } from "@/ui/components/ui/button";
import { EmptyState } from "@/ui/components/ui/empty-state";
import {
  getOrganizationTerms,
  getTermBySlug,
} from "@/server/modules/organization/queries";
import { formatTanggal, initials } from "@/shared/utils/format";

type PageProps = {
  params: Promise<{ periode: string }>;
};

export async function generateStaticParams() {
  const terms = await getOrganizationTerms();
  return terms.map((term) => ({ periode: term.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { periode } = await params;
  const term = await getTermBySlug(periode);
  if (!term) return { title: "Periode tidak ditemukan" };

  return {
    title: `Kepengurusan — ${term.name}`,
    description: `Struktur dan pemegang jabatan KPMBR-YK pada ${term.name}.`,
    alternates: { canonical: `/kepengurusan/${term.slug}` },
  };
}

/**
 * Riwayat kepengurusan satu periode.
 *
 * Data diambil dari `position_assignments` yang tertaut ke periode tersebut,
 * sehingga riwayat tetap utuh meski periode sudah berakhir. Riwayat TIDAK
 * pernah dihapus.
 */
export default async function KepengurusanPeriodePage({ params }: PageProps) {
  const { periode } = await params;
  const term = await getTermBySlug(periode);
  if (!term) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Riwayat Kepemimpinan"
        title={term.name}
        description={`Periode kepengurusan berlangsung dari ${formatTanggal(term.startDate)} sampai ${formatTanggal(term.endDate)}.`}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/kepengurusan">
            <ArrowLeft aria-hidden="true" />
            Semua kepengurusan
          </Link>
        </Button>

        <section aria-labelledby="jabatan-periode" className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="jabatan-periode"
              className="text-xl font-semibold tracking-tight"
            >
              Jabatan pada periode ini
            </h2>
            {term.isCurrent ? (
              <span className="rounded-full border border-brand/30 bg-brand-muted px-2.5 py-0.5 text-xs font-medium text-brand-muted-foreground">
                Periode berjalan
              </span>
            ) : null}
          </div>

          {term.assignments.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada data pemegang jabatan"
              description={`Data pemegang jabatan untuk ${term.name} belum dimuatkan ke arsip organisasi.`}
              className="mt-6"
            />
          ) : (
            <ol className="mt-6 grid gap-4 sm:grid-cols-2">
              {term.assignments.map((assignment) => (
                <li
                  key={assignment.positionCode}
                  className="flex gap-4 rounded-lg border border-border bg-card p-5"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-muted text-sm font-semibold text-brand-muted-foreground"
                  >
                    {initials(assignment.holderName)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold tracking-tight">
                      {assignment.positionName}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium">
                      {assignment.holderName}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarRange aria-hidden="true" className="size-3.5" />
                      {formatTanggal(assignment.startDate)}
                      {assignment.endDate
                        ? ` s.d. ${formatTanggal(assignment.endDate)}`
                        : ""}
                    </p>
                    {assignment.positionDescription ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {assignment.positionDescription}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

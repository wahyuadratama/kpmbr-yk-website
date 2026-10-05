import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Target } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/layout/page-header";
import { MockDataNotice } from "@/components/public/mock-data-notice";
import { ProgramCard } from "@/components/public/program-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getPrograms } from "@/modules/programs/queries";
import {
  PROGRAM_STATUS_LABEL,
  type ProgramStatus,
} from "@/types/public";

export const metadata: Metadata = {
  title: "Program Kerja",
  description:
    "Program kerja KPMBR-YK beserta divisi penanggung jawab, tujuan, jadwal, status, dan progres.",
  alternates: { canonical: "/proker" },
};

/**
 * Penyaring status yang tampil di publik. `DRAFT` tidak pernah tampil karena
 * program draf belum disetujui pengurus.
 */
const FILTERS: { key: ProgramStatus | "SEMUA"; label: string }[] = [
  { key: "SEMUA", label: "Semua" },
  { key: "DIRANCANG", label: PROGRAM_STATUS_LABEL.DIRANCANG },
  { key: "BERJALAN", label: PROGRAM_STATUS_LABEL.BERJALAN },
  { key: "SELESAI", label: PROGRAM_STATUS_LABEL.SELESAI },
  { key: "DIBATALKAN", label: PROGRAM_STATUS_LABEL.DIBATALKAN },
];

function isValidFilter(value: string): value is ProgramStatus {
  return FILTERS.some((f) => f.key === value);
}

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

/**
 * Daftar program kerja dengan penyaring status.
 *
 * Penyaring bekerja di server: `?status=BERJALAN` difilter sebelum render.
 * Tidak ada JavaScript yang diperlukan, dan URL dapat dibagikan.
 */
export default async function ProgramKerjaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = params.status ?? "SEMUA";
  const active: ProgramStatus | "SEMUA" = isValidFilter(requested)
    ? requested
    : "SEMUA";

  const all = await getPrograms();
  const programs =
    active === "SEMUA"
      ? all
      : all.filter((program) => program.status === active);

  return (
    <>
      <PageHeader
        eyebrow="Rencana dan Realisasi"
        title="Program kerja"
        description="Setiap program kerja memiliki penanggung jawab, tujuan, jadwal, dan progres yang dapat dipantau anggota."
      >
        <MockDataNotice scope="seluruh program kerja" />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Saring program kerja berdasarkan status">
          <ul className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const isActive = filter.key === active;
              return (
                <li key={filter.key}>
                  <Link
                    href={
                      filter.key === "SEMUA"
                        ? "/proker"
                        : `/proker?status=${filter.key}`
                    }
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors outline-none hover:border-brand/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                      isActive &&
                        "border-brand/30 bg-brand-muted text-brand-muted-foreground",
                    )}
                  >
                    {filter.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {programs.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Tidak ada program pada status ini"
            description={
              active === "SEMUA"
                ? "Program kerja akan tampil di sini setelah disusun pengurus."
                : `Belum ada program kerja berstatus ${PROGRAM_STATUS_LABEL[active].toLowerCase()}.`
            }
            action={
              active === "SEMUA" ? undefined : { label: "Lihat semua", href: "/proker" }
            }
            className="mt-8"
          />
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard key={program.slug} program={program} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
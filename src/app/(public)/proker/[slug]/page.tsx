import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarRange, Target, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MockDataNotice } from "@/components/public/mock-data-notice";
import { JsonLd } from "@/components/public/json-ld";
import {
  getProgramBySlug,
  getPrograms,
  getProgramSlugs,
  getProgramUpdates,
} from "@/modules/programs/queries";
import { PROGRAM_STATUS_CLASS, PROGRAM_STATUS_LABEL } from "@/types/public";
import { formatTanggal, truncate } from "@/lib/utils/format";
import { siteConfig } from "@/lib/site-config";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getProgramSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) return { title: "Program kerja tidak ditemukan" };

  return {
    title: program.name,
    description: truncate(`${program.description} ${program.objective}`, 160),
    alternates: { canonical: `/proker/${program.slug}` },
    openGraph: {
      title: program.name,
      description: truncate(program.description, 160),
      url: `${siteConfig.url}/proker/${program.slug}`,
    },
  };
}

/**
 * Detail program kerja.
 *
 * REQUIREMENT §14: halaman program menampilkan tujuan, penanggung jawab,
 * jadwal, status, dan progres. Riwayat progres diambil dari `program_updates`
 * sehingga progres dapat ditelusuri, bukan hanya nilai terakhir.
 */
export default async function ProgramDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const [updates, otherPrograms] = await Promise.all([
    getProgramUpdates(program.slug),
    getPrograms(),
  ]);

  const related = otherPrograms
    .filter((item) => item.slug !== program.slug)
    .slice(0, 3);

  return (
    <>
      <JsonLd
        type="CreativeWork"
        data={{
          name: program.name,
          description: truncate(program.description, 300),
          url: `${siteConfig.url}/proker/${program.slug}`,
          creator: { "@type": "Organization", name: program.division },
        }}
      />

      <article>
        <header className="border-b border-border bg-surface-muted">
          <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/proker">
                <ArrowLeft aria-hidden="true" />
                Semua program kerja
              </Link>
            </Button>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`px-1.5 py-0 text-[0.65rem] ${PROGRAM_STATUS_CLASS[program.status]}`}
              >
                {PROGRAM_STATUS_LABEL[program.status]}
              </Badge>
              <span className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {program.division}
              </span>
            </div>

            <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              {program.name}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {program.description}
            </p>

            <dl className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <UserRound aria-hidden="true" className="size-3.5" />
                <dt className="sr-only">Penanggung jawab</dt>
                <dd>{program.picName}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarRange aria-hidden="true" className="size-3.5" />
                <dt className="sr-only">Timeline</dt>
                <dd className="tabular-nums">{program.timeline}</dd>
              </div>
            </dl>

            <MockDataNotice scope="isi program kerja ini" className="mt-6" />
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <section aria-labelledby="tujuan">
            <h2 id="tujuan" className="text-xl font-semibold tracking-tight">
              Tujuan
            </h2>
            <p className="mt-3 flex gap-3 text-base leading-[1.8] text-foreground/90">
              <Target aria-hidden="true" className="mt-2 size-4 shrink-0 text-brand" />
              <span>{program.objective}</span>
            </p>
          </section>

          <section aria-labelledby="progres" className="mt-10">
            <h2 id="progres" className="text-xl font-semibold tracking-tight">
              Progres
            </h2>
            <div className="mt-4 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Capaian program</span>
                <span className="font-semibold tabular-nums">
                  {program.progress}%
                </span>
              </div>
              <Progress
                value={program.progress}
                aria-label={`Progres ${program.name}`}
                className="mt-3"
              />
            </div>
          </section>

          {updates.length > 0 ? (
            <section aria-labelledby="riwayat" className="mt-10">
              <h2 id="riwayat" className="text-xl font-semibold tracking-tight">
                Riwayat progres
              </h2>
              <ol className="mt-4 flex flex-col gap-3">
                {updates.map((update, index) => (
                  <li
                    key={`${update.at}-${index}`}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <span className="text-sm font-semibold tabular-nums">
                      {update.progress}%
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatTanggal(update.at)}
                    </span>
                    {update.note ? (
                      <span className="w-full text-sm leading-relaxed text-muted-foreground">
                        {update.note}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-8">
            <Button asChild variant="outline" size="lg" className="h-10">
              <Link href="/proker">
                <ArrowLeft aria-hidden="true" />
                Semua program kerja
              </Link>
            </Button>
            <Button asChild size="lg" className="h-10">
              <Link href="/keanggotaan">Gabung dengan KPMBR-YK</Link>
            </Button>
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <aside
          aria-labelledby="program-terkait"
          className="border-t border-border bg-surface-muted"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <h2
              id="program-terkait"
              className="text-xl font-semibold tracking-tight"
            >
              Program kerja lainnya
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/proker/${item.slug}`}
                    className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:border-brand/30 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-xs text-muted-foreground">
                      {item.division} · {item.timeline}
                    </span>
                    <span className="text-sm font-medium tracking-tight group-hover:underline">
                      {item.name}
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

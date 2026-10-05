import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Tag, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MockDataNotice } from "@/components/public/mock-data-notice";
import { JsonLd } from "@/components/public/json-ld";
import {
  getNewsBySlug,
  getNewsSlugs,
  getRelatedNews,
} from "@/modules/news/queries";
import { formatTanggal, truncate } from "@/lib/utils/format";
import { siteConfig } from "@/lib/site-config";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getNewsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) {
    return { title: "Berita tidak ditemukan" };
  }

  return {
    title: article.title,
    description: truncate(article.excerpt, 160),
    alternates: { canonical: `/berita/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: truncate(article.excerpt, 160),
      url: `${siteConfig.url}/berita/${article.slug}`,
      publishedTime: article.publishedAt,
      authors: [article.authorName],
      section: article.category,
    },
  };
}

export default async function BeritaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);

  if (!article) notFound();

  const related = await getRelatedNews(article.slug, 3);

  return (
    <>
      <JsonLd
        type="NewsArticle"
        data={{
          headline: article.title,
          description: truncate(article.excerpt, 160),
          datePublished: article.publishedAt,
          author: { "@type": "Organization", name: article.authorName },
          articleSection: article.category,
          mainEntityOfPage: `${siteConfig.url}/berita/${article.slug}`,
        }}
      />

      <article>
        <header className="border-b border-border bg-surface-muted">
          <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/berita">
                <ArrowLeft aria-hidden="true" />
                Semua berita
              </Link>
            </Button>

            <div className="mt-4">
              <Badge
                variant="outline"
                className="border-brand/20 bg-brand-muted px-1.5 py-0 text-[0.65rem] text-brand-muted-foreground"
              >
                {article.category}
              </Badge>
            </div>

            <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              {article.title}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>

            <dl className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <UserRound aria-hidden="true" className="size-3.5" />
                <dt className="sr-only">Penulis</dt>
                <dd>{article.authorName}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag aria-hidden="true" className="size-3.5" />
                <dt className="sr-only">Kategori</dt>
                <dd>{article.category}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="tabular-nums">
                  {formatTanggal(article.publishedAt)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-3.5" />
                <dt className="sr-only">Estimasi waktu baca</dt>
                <dd className="tabular-nums">{article.readingMinutes} menit</dd>
              </div>
            </dl>

            <MockDataNotice scope="isi artikel ini" className="mt-6" />
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <div
            aria-hidden="true"
            className={`mb-8 aspect-[16/9] w-full rounded-lg bg-gradient-to-br ${article.coverGradient}`}
          />

          <div className="flex flex-col gap-5">
            {article.body.map((paragraph, index) => (
              <p
                key={index}
                className="text-base leading-[1.8] text-foreground/90"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-8">
            <Button asChild variant="outline" size="lg" className="h-10">
              <Link href="/berita">
                <ArrowLeft aria-hidden="true" />
                Semua berita
              </Link>
            </Button>
            <Button asChild size="lg" className="h-10">
              <Link href="/agenda">Lihat agenda</Link>
            </Button>
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <aside
          aria-labelledby="berita-terkait"
          className="border-t border-border bg-surface-muted"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <h2
              id="berita-terkait"
              className="text-xl font-semibold tracking-tight"
            >
              Berita terbaru lainnya
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/berita/${item.slug}`}
                    className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:border-brand/30 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-xs text-muted-foreground">
                      {item.category} · {formatTanggal(item.publishedAt)}
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
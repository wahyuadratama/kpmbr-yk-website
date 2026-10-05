import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MockDataNotice } from "@/components/public/mock-data-notice";
import { NewsCard } from "@/components/public/news-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getNewsCategories,
  getPublishedNews,
} from "@/modules/news/queries";
import { cn } from "cn";

type PageProps = {
  searchParams: Promise<{ kategori?: string }>;
};

export const metadata: Metadata = {
  title: "Berita",
  description:
    "Kabar terbaru KPMBR-YK: program kerja, keputusan organisasi, dan kegiatan yang sudah maupun sedang dilaksanakan.",
  alternates: { canonical: "/berita" },
};

/**
 * Daftar berita.
 *
 * Penyaring kategori bekerja di server lewat `?kategori=<slug>` sehingga URL
 * dapat dibagikan dan tidak memerlukan JavaScript. Kategori yang tidak dikenal
 * diperlakukan sebagai "semua".
 */
export default async function BeritaPage({ searchParams }: PageProps) {
  const { kategori } = await searchParams;
  const categories = await getNewsCategories();
  const known = categories.some((category) => category.slug === kategori);
  const active = kategori && known ? kategori : undefined;

  const all = await getPublishedNews();
  const articles = active
    ? all.filter((article) => article.categorySlug === active)
    : all;

  return (
    <>
      <PageHeader
        eyebrow="Kabar Organisasi"
        title="Berita"
        description="Kabar terbaru mengenai program kerja, keputusan organisasi, dan kegiatan KPMBR-YK."
      >
        <MockDataNotice scope="seluruh berita" />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Saring berita berdasarkan kategori">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href="/berita"
                aria-current={active ? undefined : "true"}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors outline-none hover:border-brand/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  !active &&
                    "border-brand/30 bg-brand-muted text-brand-muted-foreground",
                )}
              >
                Semua berita
              </Link>
            </li>
            {categories
              .filter((category) => category.count > 0)
              .map((category) => {
                const isActive = active === category.slug;
                return (
                  <li key={category.slug}>
                    <Link
                      href={`/berita?kategori=${category.slug}`}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors outline-none hover:border-brand/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                        isActive &&
                          "border-brand/30 bg-brand-muted text-brand-muted-foreground",
                      )}
                    >
                      {category.name}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>

        {articles.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="Belum ada berita"
            description="Belum ada berita yang dipublikasikan. Kembali lagi nanti."
            action={{ label: "Kembali ke beranda", href: "/" }}
            className="mt-8"
          />
        ) : (
          <>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <NewsCard key={article.slug} article={article} />
              ))}
            </div>

            <p className="mt-10 text-sm text-muted-foreground">
              Butuh informasi lebih lengkap? Lihat{" "}
              <Link
                href="/kontak"
                className="font-medium underline underline-offset-4"
              >
                halaman kontak
              </Link>{" "}
              atau agenda kegiatan mendatang.
            </p>
          </>
        )}
      </div>
    </>
  );
}
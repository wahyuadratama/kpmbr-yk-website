import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { Newspaper } from "lucide-react";
import { PageHeader } from "@/ui/components/layout/page-header";
import { MockDataNotice } from "@/ui/components/public/mock-data-notice";
import { NewsCard } from "@/ui/components/public/news-card";
import { EmptyState } from "@/ui/components/ui/empty-state";
import {
  getNewsCategories,
  getPublishedNews,
} from "@/server/modules/news/queries";

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
 * Penyaring kategori punya URL sendiri di `/berita/kategori/<slug>`. Tautan
 * lama `?kategori=<slug>` diarahkan permanen ke sana supaya setiap isi hanya
 * punya satu URL kanonik. Kategori yang tidak dikenal diperlakukan sebagai
 * "semua".
 */
export default async function BeritaPage({ searchParams }: PageProps) {
  const { kategori } = await searchParams;
  const categories = await getNewsCategories();
  const known = categories.find((category) => category.slug === kategori);

  // URL lama → URL kanonik kategori.
  if (kategori && known) {
    permanentRedirect(`/berita/kategori/${known.slug}`);
  }

  const articles = await getPublishedNews();

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
                aria-current="true"
                className="inline-flex h-8 items-center rounded-full border border-brand/30 bg-brand-muted px-3 text-xs font-medium text-brand-muted-foreground transition-colors outline-none hover:border-brand/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                Semua berita
              </Link>
            </li>
            {categories
              .filter((category) => category.count > 0)
              .map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/berita/kategori/${category.slug}`}
                    className="inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors outline-none hover:border-brand/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
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
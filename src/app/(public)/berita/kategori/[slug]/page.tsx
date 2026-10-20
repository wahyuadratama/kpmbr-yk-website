import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Newspaper } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NewsCard } from "@/components/public/news-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getNewsCategories,
  getPublishedNewsByCategory,
} from "@/modules/news/queries";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

/** Hanya kategori yang punya berita terbit yang perlu di-prender statis. */
export async function generateStaticParams() {
  const categories = await getNewsCategories();
  return categories
    .filter((category) => category.count > 0)
    .map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getNewsCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) return { title: "Kategori tidak ditemukan" };

  return {
    title: `Berita — ${category.name}`,
    description: `Kumpulan berita KPMBR-YK dalam kategori ${category.name}.`,
    alternates: { canonical: `/berita/kategori/${category.slug}` },
  };
}

/**
 * Daftar berita per kategori.
 *
 * Route ini menggantikan penyaring `?kategori=` pada `/berita` sebagai URL
 * kanonik — URL yang bisa dibagikan dan terindeks mesin pencari. Query
 * `?kategori=` lama tetap bekerja dan mengarah ke canonical yang sama.
 */
export default async function BeritaKategoriPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

  const categories = await getNewsCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const parsedPage = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const { items, total, pages } = await getPublishedNewsByCategory(slug, {
    page,
    size: 12,
  });

  return (
    <>
      <PageHeader
        eyebrow="Kategori Berita"
        title={category.name}
        description={`Kumpulan berita dan kabar terkini KPMBR-YK dalam kategori ${category.name}.`}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/berita">
            <ArrowLeft aria-hidden="true" />
            Semua berita
          </Link>
        </Button>

        {items.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="Belum ada berita pada kategori ini"
            description="Belum ada berita yang dipublikasikan pada kategori tersebut."
            action={{ label: "Lihat semua berita", href: "/berita" }}
            className="mt-8"
          />
        ) : (
          <>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((article) => (
                <NewsCard key={article.slug} article={article} />
              ))}
            </div>

            {pages > 1 ? (
              <nav
                aria-label="Navigasi halaman berita"
                className="mt-10 flex items-center justify-between gap-3"
              >
                <p className="text-sm text-muted-foreground">
                  Menampilkan {items.length} dari {total} berita
                </p>
                <div className="flex gap-2">
                  {page > 1 ? (
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/berita/kategori/${slug}?page=${page - 1}`}
                      >
                        Sebelumnya
                      </Link>
                    </Button>
                  ) : null}
                  {page < pages ? (
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/berita/kategori/${slug}?page=${page + 1}`}
                      >
                        Berikutnya
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockDataNotice } from "@/components/public/mock-data-notice";
import { JsonLd } from "@/components/public/json-ld";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getAlbumBySlug,
  getAlbumDetail,
  getAlbums,
  getAlbumSlugs,
} from "@/modules/documentation/queries";
import { formatTanggal, truncate } from "@/lib/utils/format";
import { siteConfig } from "@/lib/site-config";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getAlbumSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (!album) return { title: "Album tidak ditemukan" };

  return {
    title: album.title,
    description: truncate(
      `${album.description} Dokumentasi ${album.title} pada ${formatTanggal(album.eventDate)}.`,
      160,
    ),
    alternates: { canonical: `/dokumentasi/${album.slug}` },
    openGraph: {
      title: album.title,
      description: truncate(album.description, 160),
      url: `${siteConfig.url}/dokumentasi/${album.slug}`,
    },
  };
}

/**
 * Detail album dokumentasi.
 *
 * REQUIREMENT §16: album berisi foto/video kegiatan. Foto binary ada di
 * Cloudflare R2 dan hanya bisa dimuat lewat route server yang memeriksa
 * `access_level`, jadi sampai R2 terpasang halaman ini menampilkan
 * placeholder dan jumlah foto, bukan file gambar.
 */
export default async function DokumentasiDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const detail = await getAlbumDetail(slug);
  if (!detail) notFound();

  const { album, itemCount } = detail;
  const others = (await getAlbums())
    .filter((item) => item.slug !== album.slug)
    .slice(0, 3);

  return (
    <>
      <JsonLd
        type="ImageGallery"
        data={{
          name: album.title,
          description: truncate(album.description, 300),
          url: `${siteConfig.url}/dokumentasi/${album.slug}`,
          dateCreated: album.eventDate,
        }}
      />

      <article>
        <header className="border-b border-border bg-surface-muted">
          <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/dokumentasi">
                <ArrowLeft aria-hidden="true" />
                Semua dokumentasi
              </Link>
            </Button>

            <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              {album.title}
            </h1>

            <p className="mt-3 text-sm text-muted-foreground tabular-nums">
              {formatTanggal(album.eventDate)} · {album.photoCount} foto
            </p>

            {album.description ? (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {album.description}
              </p>
            ) : null}

            <MockDataNotice scope="isi album ini" className="mt-6" />
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          {itemCount === 0 ? (
            <EmptyState
              icon={Images}
              title="Foto belum tersedia"
              description="Berkas foto kegiatan disimpan di penyimpanan objek dan dimuat lewat route server yang memeriksa tingkat akses. Album ini belum memiliki berkas yang dapat ditunjukkan."
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Album ini berisi {itemCount} berkas. Penampil galeri akan
              ditambahkan setelah penyimpanan objek terhubung.
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-8">
            <Button asChild variant="outline" size="lg" className="h-10">
              <Link href="/dokumentasi">
                <ArrowLeft aria-hidden="true" />
                Semua dokumentasi
              </Link>
            </Button>
            <Button asChild size="lg" className="h-10">
              <Link href="/agenda">Lihat agenda</Link>
            </Button>
          </div>
        </div>
      </article>

      {others.length > 0 ? (
        <aside
          aria-labelledby="album-lain"
          className="border-t border-border bg-surface-muted"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <h2
              id="album-lain"
              className="text-xl font-semibold tracking-tight"
            >
              Album lainnya
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {others.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/dokumentasi/${item.slug}`}
                    className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:border-brand/30 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatTanggal(item.eventDate)}
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

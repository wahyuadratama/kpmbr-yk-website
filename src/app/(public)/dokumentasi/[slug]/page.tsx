import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Images, X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/ui/components/ui/button";
import { MockDataNotice } from "@/ui/components/public/mock-data-notice";
import { JsonLd } from "@/ui/components/public/json-ld";
import { EmptyState } from "@/ui/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/ui/components/ui/dialog";
import {
  getAlbumBySlug,
  getAlbumDetail,
  getAlbumItems,
  getAlbums,
  getAlbumSlugs,
} from "@/server/modules/documentation/queries";
import { formatTanggal, truncate } from "@/shared/utils/format";
import { siteConfig } from "@/shared/site-config";
import { publicFileSrc } from "@/server/files/public-url";

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
 * Detail album dokumentasi dengan galeri foto.
 */
export default async function DokumentasiDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const detail = await getAlbumDetail(slug);
  if (!detail) notFound();

  const { album, itemCount } = detail;
  const items = await getAlbumItems(slug);
  const others = (await getAlbums())
    .filter((item) => item.slug !== album.slug)
    .slice(0, 3);

  const hasRealPhotos = items.length > 0;

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

            {!hasRealPhotos && (
              <MockDataNotice scope="isi album ini" className="mt-6" />
            )}
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          {itemCount === 0 || !hasRealPhotos ? (
            <EmptyState
              icon={Images}
              title="Foto belum tersedia"
              description="Berkas foto kegiatan disimpan di penyimpanan objek dan dimuat lewat route server yang memeriksa tingkat akses. Album ini belum memiliki berkas yang dapat ditunjukkan."
            />
          ) : (
            <>
              <div
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                role="list"
                aria-label={`Foto dalam album ${album.title}`}
              >
                {items.map((item, index) => {
                  const src = publicFileSrc(item.file);
                  return (
                    <Dialog key={item.id}>
                      <DialogTrigger asChild>
                        <article
                          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted transition-shadow hover:shadow-lg"
                          role="listitem"
                        >
                          {src ? (
                            <Image
                              src={src}
                              alt={item.file.altText ?? `${album.title} - foto ${index + 1}`}
                              fill
                              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              aria-hidden="true"
                              className="grid size-full place-items-center bg-muted"
                            >
                              <Images className="size-8 text-muted-foreground/50" strokeWidth={1.5} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </article>
                      </DialogTrigger>
                      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                        {src && (
                          <div className="relative size-full flex items-center justify-center bg-black">
                            <Image
                              src={src}
                              alt={item.file.altText ?? `${album.title} - foto ${index + 1}`}
                              width={item.file.width ?? 1200}
                              height={item.file.height ?? 800}
                              className="max-w-full max-h-[80vh] object-contain"
                              priority
                            />
                            {item.caption && (
                              <div className="absolute bottom-4 left-4 right-4 px-4 py-2 bg-black/70 text-white text-sm">
                                {item.caption}
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>

              {items.length > 0 && (
                <p className="mt-6 text-sm text-muted-foreground text-center">
                  Klik foto untuk memperbesar. Total {items.length} foto.
                </p>
              )}
            </>
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
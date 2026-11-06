/**
 * Query berita untuk layer publik.
 *
 * Prinsip:
 * - Hanya baris `status = PUBLISHED` dan `deletedAt IS NULL` yang boleh
 *   keluar ke publik. Penegakan ada di query, bukan di komponen.
 * - Query dibungkus `unstable_cache` dengan tag `news` supaya dashboard
 *   nanti bisa memanggil `revalidateTag("news")` setelah publikasi.
 * - Row database dipetakan ke tipe di `src/types/public.ts`. Komponen publik
 *   tidak pernah menyentuh bentuk row Prisma.
 */
import { unstable_cache } from "next/cache";
import { FileAccessLevel, NewsStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db/prisma";
import { parseParagraphs } from "@/lib/content/markdown";
import { publicFileSrc } from "@/lib/files/public-url";
import type { NewsArticle } from "@/types/public";

/**
 * Token warna cover → kelas gradient. Database hanya menyimpan token, bukan
 * kelas Tailwind, supaya gaya tampilan tetap diatur di satu tempat. Literalnya
 * ditulis utuh di sini agar Tailwind memindai dan menghasilkan kelasnya.
 */
const NEWS_ACCENT: Record<string, string> = {
  brand: "from-brand to-brand-muted",
  terra: "from-terra/70 to-accent",
  info: "from-info to-brand-muted",
  success: "from-success/60 to-brand-muted",
  brandInfo: "from-brand to-info",
  terraInfo: "from-terra/60 to-info",
};

const ACCENT_DEFAULT = NEWS_ACCENT.brand;

/** Paragraf pertama `excerpt` untuk berita tanpa excerpt. */
function excerptFrom(body: string): string {
  const first = parseParagraphs(body)[0] ?? "";
  return first.length > 255 ? `${first.slice(0, 252)}...` : first;
}

/** Estimasi waktu baca: 200 kata per menit, minimal 1 menit. */
function readingMinutes(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.min(20, Math.max(1, Math.ceil(words / 200)));
}

type NewsRow = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverAccent: string;
  coverFile: {
    id: string;
    storageKey: string;
    accessLevel: FileAccessLevel;
    altText: string | null;
  } | null;
  authorName: string;
  publishedAt: Date | null;
  isFeatured: boolean;
  category: { name: string; slug: string } | null;
};

export function toNewsArticle(row: NewsRow): NewsArticle {
  const coverImageUrl = publicFileSrc(row.coverFile);
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || excerptFrom(row.body),
    body: parseParagraphs(row.body),
    category: row.category?.name ?? "Umum",
    categorySlug: row.category?.slug ?? "umum",
    authorName: row.authorName,
    publishedAt: (row.publishedAt ?? new Date(0)).toISOString(),
    readingMinutes: readingMinutes(row.body),
    coverGradient: NEWS_ACCENT[row.coverAccent] ?? ACCENT_DEFAULT,
    // Cover yang tidak publik (atau belum ada URLnya) TIDAK pernah bocor ke
    // halaman publik: pemanggil jatuh ke gradient accent.
    coverImageUrl,
    coverImageAlt: coverImageUrl ? (row.coverFile?.altText ?? "") : "",
    isFeatured: row.isFeatured,
  };
}

const SELECT = {
  slug: true,
  title: true,
  excerpt: true,
  body: true,
  coverAccent: true,
  coverFile: {
    select: { id: true, storageKey: true, accessLevel: true, altText: true },
  },
  authorName: true,
  publishedAt: true,
  isFeatured: true,
  category: { select: { name: true, slug: true } },
} as const;

const PUBLISHED = {
  deletedAt: null,
  status: NewsStatus.PUBLISHED,
  publishedAt: { not: null },
} as const;

/** Daftar berita terbit, terbaru lebih dulu. */
export const getPublishedNews = unstable_cache(
  async (limit?: number): Promise<NewsArticle[]> => {
    const rows = await db.news.findMany({
      where: PUBLISHED,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: SELECT,
    });
    return rows.map(toNewsArticle);
  },
  ["public", "news", "list"],
  { revalidate: 300, tags: ["news"] },
);

/** Berita pilihan untuk homepage. Fallback ke berita terbaru. */
export const getFeaturedNews = unstable_cache(
  async (): Promise<NewsArticle | null> => {
    const featured = await db.news.findFirst({
      where: { ...PUBLISHED, isFeatured: true },
      orderBy: { publishedAt: "desc" },
      select: SELECT,
    });
    if (featured) return toNewsArticle(featured);

    const latest = await db.news.findFirst({
      where: PUBLISHED,
      orderBy: { publishedAt: "desc" },
      select: SELECT,
    });
    return latest ? toNewsArticle(latest) : null;
  },
  ["public", "news", "featured"],
  { revalidate: 300, tags: ["news"] },
);

export const getNewsBySlug = unstable_cache(
  async (slug: string): Promise<NewsArticle | null> => {
    const row = await db.news.findFirst({
      where: { ...PUBLISHED, slug },
      select: SELECT,
    });
    return row ? toNewsArticle(row) : null;
  },
  ["public", "news", "bySlug"],
  { revalidate: 300, tags: ["news"] },
);

/** Berita lain sebagai "berita terkait", tanpa berita yang sedang dibuka. */
export const getRelatedNews = unstable_cache(
  async (slug: string, limit = 3): Promise<NewsArticle[]> => {
    const rows = await db.news.findMany({
      where: { ...PUBLISHED, slug: { not: slug } },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: SELECT,
    });
    return rows.map(toNewsArticle);
  },
  ["public", "news", "related"],
  { revalidate: 300, tags: ["news"] },
);

/** Daftar slug untuk `generateStaticParams` dan sitemap. */
export const getNewsSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await db.news.findMany({
      where: PUBLISHED,
      orderBy: { publishedAt: "desc" },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  },
  ["public", "news", "slugs"],
  { revalidate: 3600, tags: ["news"] },
);

/** Kategori berita beserta jumlah berita terbit. */
export const getNewsCategories = unstable_cache(
  async (): Promise<{ slug: string; name: string; count: number }[]> => {
    const rows = await db.newsCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        slug: true,
        name: true,
        _count: { select: { news: { where: PUBLISHED } } },
      },
    });
    return rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      count: row._count.news,
    }));
  },
  ["public", "news", "categories"],
  { revalidate: 3600, tags: ["news"] },
);

/**
 * Berita terbit dalam satu kategori, dengan pagination.
 *
 * Dipakai halaman `/berita/kategori/[slug]`. Query kosong bila kategori tidak
 * ada — pemanggil yang memutuskan `notFound()`.
 */
export const getPublishedNewsByCategory = unstable_cache(
  async (
    categorySlug: string,
    { page = 1, size = 12 }: { page?: number; size?: number } = {},
  ): Promise<{
    items: NewsArticle[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }> => {
    const where = { ...PUBLISHED, category: { slug: categorySlug } };
    const skip = (page - 1) * size;

    const [rows, total] = await Promise.all([
      db.news.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: size,
        select: SELECT,
      }),
      db.news.count({ where }),
    ]);

    return {
      items: rows.map(toNewsArticle),
      total,
      page,
      size,
      pages: Math.ceil(total / size),
    };
  },
  ["public", "news", "byCategory"],
  { revalidate: 300, tags: ["news"] },
);

/**
 * Query dokumentasi untuk layer publik.
 *
 * Album menyimpan `photoCount` sebagai cache jumlah foto supaya list album
 * tidak perlu `COUNT` per baris. Album tanpa foto (`photoCount = 0`) tidak
 * ditampilkan di halaman publik karena tidak ada yang bisa dilihat.
 */
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db/prisma";
import type { DocAlbum } from "@/types/public";

/** Token warna album → kelas Tailwind. Sama seperti berita: DB menyimpan
 * token, kelas diatur di satu tempat. */
const ALBUM_ACCENT: Record<string, string> = {
  brand: "bg-brand",
  brandMuted: "bg-brand-muted",
  terra: "bg-terra",
  info: "bg-info",
  success: "bg-success",
  foreground: "bg-foreground",
};

const ACCENT_DEFAULT = ALBUM_ACCENT.brand;

const SELECT = {
  slug: true,
  title: true,
  description: true,
  eventDate: true,
  photoCount: true,
  accent: true,
} as const;

type AlbumRow = {
  slug: string;
  title: string;
  description: string | null;
  eventDate: Date;
  photoCount: number;
  accent: string;
};

export function toDocAlbum(row: AlbumRow): DocAlbum {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    eventDate: row.eventDate.toISOString(),
    photoCount: row.photoCount,
    accent: ALBUM_ACCENT[row.accent] ?? ACCENT_DEFAULT,
  };
}

/** Album terbaru (berdasarkan tanggal kegiatan). */
export const getAlbums = unstable_cache(
  async (limit?: number): Promise<DocAlbum[]> => {
    const rows = await db.documentationAlbum.findMany({
      where: { deletedAt: null },
      orderBy: { eventDate: "desc" },
      take: limit,
      select: SELECT,
    });
    return rows.map(toDocAlbum);
  },
  ["public", "albums", "list"],
  { revalidate: 3600, tags: ["documentation"] },
);

export const getAlbumBySlug = unstable_cache(
  async (slug: string): Promise<DocAlbum | null> => {
    const row = await db.documentationAlbum.findFirst({
      where: { deletedAt: null, slug },
      select: SELECT,
    });
    return row ? toDocAlbum(row) : null;
  },
  ["public", "albums", "bySlug"],
  { revalidate: 3600, tags: ["documentation"] },
);

/** Satu album beserta jumlah foto hasil penghitungan di `documentation_items`. */
export const getAlbumDetail = unstable_cache(
  async (
    slug: string,
  ): Promise<{ album: DocAlbum; itemCount: number } | null> => {
    const row = await db.documentationAlbum.findFirst({
      where: { deletedAt: null, slug },
      select: {
        ...SELECT,
        _count: { select: { items: true } },
      },
    });
    if (!row) return null;
    return { album: toDocAlbum(row), itemCount: row._count.items };
  },
  ["public", "albums", "detail"],
  { revalidate: 3600, tags: ["documentation"] },
);

export const getAlbumSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await db.documentationAlbum.findMany({
      where: { deletedAt: null },
      orderBy: { eventDate: "desc" },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  },
  ["public", "albums", "slugs"],
  { revalidate: 3600, tags: ["documentation"] },
);

/** Album untuk dashboard pengurus/admin (dapatkan semua, dilengkapi pagination). */
export async function listDocumentationAlbums({
  page = 1,
  size = 12,
  q,
}: { page?: number; size?: number; q?: string } = {}) {
  const skip = (page - 1) * size;

  const [items, total] = await Promise.all([
    db.documentationAlbum.findMany({
      where: {
        deletedAt: null,
        ...(q ? { title: { contains: q } } : {}),
      },
      orderBy: { eventDate: "desc" },
      skip,
      take: size,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        eventDate: true,
        accent: true,
        photoCount: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    db.documentationAlbum.count({
      where: {
        deletedAt: null,
        ...(q ? { title: { contains: q } } : {}),
      },
    }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      itemCount: item._count.items,
    })),
    total,
    page,
    size,
    pages: Math.ceil(total / size),
  };
}

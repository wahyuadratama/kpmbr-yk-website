/**
 * Query dokumen arsip organisasi (Stage 7).
 *
 * Prinsip:
 * - Semua query menyaring `deleted_at IS NULL` (soft delete).
 * - `unstable_cache` dengan tag `org-documents` agar dashboard bisa
 *   `revalidateTag` setelah mutasi.
 */
import { unstable_cache } from "next/cache";
import { db } from "@/server/db/prisma";
import {
  DocumentCategory,
  FileAccessLevel,
} from "@/generated/prisma/enums";

export const ORG_DOC_TAGS = {
  list: "org-documents",
} as const;

type OrganizationDocumentWhere = {
  deletedAt: null;
  category?: DocumentCategory;
  accessLevel?: FileAccessLevel;
  title?: { contains: string };
};

/** Daftar dokumen arsip dengan pagination & filter. */
export async function listOrganizationDocuments({
  page = 1,
  size = 20,
  q,
  category,
  accessLevel,
}: {
  page?: number;
  size?: number;
  q?: string;
  category?: DocumentCategory;
  accessLevel?: FileAccessLevel;
} = {}) {
  const skip = (page - 1) * size;

  const where: OrganizationDocumentWhere = { deletedAt: null };

  if (q) {
    where.title = { contains: q };
  }
  if (category) {
    where.category = category;
  }
  if (accessLevel) {
    where.accessLevel = accessLevel;
  }

  const [items, total] = await Promise.all([
    db.organizationDocument.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: size,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        description: true,
        fileId: true,
        accessLevel: true,
        uploadedById: true,
        createdAt: true,
        file: {
          select: { id: true, fileName: true, mimeType: true, size: true },
        },
        uploadedBy: { select: { id: true, email: true } },
      },
    }),
    db.organizationDocument.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    size,
    pages: Math.ceil(total / size),
  };
}

export type OrganizationDocumentListItem = Awaited<
  ReturnType<typeof listOrganizationDocuments>
>["items"][number];

/** Satu dokumen lengkap. */
export async function getOrganizationDocument(id: string) {
  return db.organizationDocument.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      description: true,
      fileId: true,
      file: {
        select: {
          id: true,
          storageKey: true,
          fileName: true,
          mimeType: true,
          size: true,
          accessLevel: true,
        },
      },
      accessLevel: true,
      uploadedById: true,
      uploadedBy: { select: { id: true, email: true } },
      createdAt: true,
    },
  });
}

/** Daftar dokumen (cache) untuk dropdown/daftar publik. */
export const listOrganizationDocumentsCached = unstable_cache(
  async (): Promise<
    { id: string; title: string; slug: string; category: string }[]
  > => {
    const rows = await db.organizationDocument.findMany({
      where: { deletedAt: null },
      orderBy: [{ category: "asc" }, { title: "asc" }],
      select: { id: true, title: true, slug: true, category: true },
    });
    return rows;
  },
  ["public", "org-documents", "list"],
  { revalidate: 900, tags: [ORG_DOC_TAGS.list] },
);

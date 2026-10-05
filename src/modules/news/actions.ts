/**
 * Server action CMS untuk berita.
 *
 * Ini contoh acuan untuk seluruh mutasi CMS berikutnya (agenda, program,
 * dokumentasi, pengumuman): urutan guard, validasi, transaksi, audit, dan
 * invalidasi cache TIDAK BOLEH dilewati.
 *
 * Otorisasi ditegakkan di server pada setiap aksi. Menyembunyikan tombol
 * hapus di dashboard bukan kontrol akses.
 */
import "server-only";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db, Prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { parseOrThrow } from "@/lib/validation/parse";
import { newsCreateSchema, newsUpdateSchema } from "@/lib/validation/cms";
import { cuidSchema } from "@/lib/validation/common";
import { slugify } from "@/lib/utils/format";
import { conflict, forbidden, notFound } from "@/lib/errors";
import { runAction, type ActionResult } from "@/lib/actions/result";
import { writeAudit } from "@/lib/audit";
import { AuditAction, NewsStatus } from "@/generated/prisma/enums";

const idSchema = z.object({ id: cuidSchema });

/**
 * Invalidasi cache setelah mutasi.
 *
 * `updateTag()` (bukan `revalidateTag`) dipilih karena aksi ini berjalan di
 * Server Action: perubahan harus langsung terlihat pada permintaan berikutnya,
 * bukan setelah jendela stale berakhir.
 */
function refreshNewsCache(): void {
  updateTag("news");
  updateTag("content");
}

/** Slug dari judul; bila bentrok, tambahkan suffix angka (maks 100 percobaan). */
async function buildSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  const root = slugify(base).slice(0, 90) || "berita";
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = suffix === 1 ? root : `${root}-${suffix}`;
    const clash = await tx.news.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  throw conflict("Tidak dapat membuat slug unik untuk berita ini.");
}

export async function createNewsAction(
  raw: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  return runAction("news.create", async () => {
    // 1. Authentication + 2. Authorization (dari database, bukan dari klien).
    const principal = await requirePermission("news:create");
    // 3. Validation.
    const input = parseOrThrow(newsCreateSchema, raw);

    if (input.status === NewsStatus.PUBLISHED && !hasPermission(principal.role, "news:publish")) {
      throw forbidden("Anda tidak berwenang menerbitkan berita.");
    }

    const created = await db.$transaction(async (tx) => {
      const slug = input.slug ?? (await buildSlug(tx, input.title));
      if (input.slug) await assertSlugFree(tx, input.slug, null);

      return tx.news.create({
        data: {
          title: input.title,
          slug,
          excerpt: input.excerpt,
          body: input.body,
          categoryId: input.categoryId ?? null,
          coverAccent: input.coverAccent,
          isFeatured: input.isFeatured,
          status: input.status,
          authorId: principal.userId,
          // `publishedAt` hanya diisi saat benar-benar terbit agar query publik
          // tidak pernah membaca berita tanpa tanggal terbit.
          publishedAt: input.status === NewsStatus.PUBLISHED ? new Date() : null,
        },
        select: { id: true, slug: true },
      });
    });

    await writeAudit({
      action: AuditAction.CREATE,
      resource: "News",
      resourceId: created.id,
      actorUserId: principal.userId,
      metadata: { slug: created.slug, status: input.status },
    });

    refreshNewsCache();
    return created;
  });
}

export async function updateNewsAction(
  raw: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  return runAction("news.update", async () => {
    const principal = await requirePermission("news:update");
    const input = parseOrThrow(newsUpdateSchema, raw);

    const existing = await db.news.findUnique({
      where: { id: input.id },
      select: { id: true, slug: true, status: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Berita tidak ditemukan.");

    // Publicasi punya permission sendiri; mengubah status ke PUBLISHED
    // bukan sekadar "edit konten".
    if (
      input.status !== undefined &&
      input.status !== existing.status &&
      input.status === NewsStatus.PUBLISHED &&
      !hasPermission(principal.role, "news:publish")
    ) {
      throw forbidden("Anda tidak berwenang menerbitkan berita.");
    }

    const updated = await db.$transaction(async (tx) => {
      const slug =
        input.slug ??
        (input.title !== undefined && input.title !== existing.slug
          ? await buildSlug(tx, input.title)
          : undefined);
      if (input.slug && input.slug !== existing.slug) {
        await assertSlugFree(tx, input.slug, existing.id);
      }

      return tx.news.update({
        where: { id: existing.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(slug !== undefined ? { slug } : {}),
          ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
          ...(input.body !== undefined ? { body: input.body } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId ?? null } : {}),
          ...(input.coverAccent !== undefined ? { coverAccent: input.coverAccent } : {}),
          ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
          ...(input.status !== undefined
            ? {
                status: input.status,
                // Tanggal terbit diisi saat pertama kali terbit, tidak di-overwrite.
                publishedAt:
                  input.status === NewsStatus.PUBLISHED
                    ? existing.status === NewsStatus.PUBLISHED
                      ? undefined
                      : new Date()
                    : null,
              }
            : {}),
        },
        select: { id: true, slug: true },
      });
    });

    await writeAudit({
      action: AuditAction.UPDATE,
      resource: "News",
      resourceId: updated.id,
      actorUserId: principal.userId,
      metadata: { fields: Object.keys(input).filter((key) => key !== "id") },
    });

    refreshNewsCache();
    return updated;
  });
}

/**
 * Hapus berita (soft delete).
 *
 * `news:delete` TIDAK diberikan ke PENGURUS secara default; aksi yang
 * ditolak tetap tercatat lewat guard.
 */
export async function deleteNewsAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction("news.delete", async () => {
    const principal = await requirePermission("news:delete");
    const { id } = parseOrThrow(idSchema, raw);

    const existing = await db.news.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw notFound("Berita tidak ditemukan.");

    // `updateMany` bersyarat `deletedAt: null` → idempoten dan aman dari race.
    const result = await db.news.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), status: NewsStatus.ARCHIVED },
    });
    if (result.count === 0) throw notFound("Berita tidak ditemukan.");

    await writeAudit({
      action: AuditAction.DELETE,
      resource: "News",
      resourceId: id,
      actorUserId: principal.userId,
      metadata: { softDelete: true },
    });

    refreshNewsCache();
    return { id };
  });
}

async function assertSlugFree(
  tx: Prisma.TransactionClient,
  slug: string,
  ignoreId: string | null,
): Promise<void> {
  const clash = await tx.news.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== ignoreId) throw conflict(`Slug "${slug}" sudah dipakai berita lain.`);
}
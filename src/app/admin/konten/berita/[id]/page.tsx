import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/server/auth/guards";
import { db } from "@/server/db/prisma";
import { PageHeading } from "@/ui/components/dashboard/page-heading";
import { Panel } from "@/ui/components/dashboard/panel";
import { NewsEditorForm } from "@/ui/components/admin/news-editor-form";
import { updateNewsFormAction } from "@/server/modules/news/form-actions";
import { coverPreview } from "@/server/files/public-url";
import { formatTanggalPendek } from "@/shared/utils/format";

export const metadata: Metadata = { title: "Sunting Berita" };
export const dynamic = "force-dynamic";

/** Formulir menyunting berita yang sudah ada. */
export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("news:update");

  const { id } = await params;
  const [news, categories] = await Promise.all([
    db.news.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        title: true,
        excerpt: true,
        body: true,
        status: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        coverFile: { select: { id: true, accessLevel: true, altText: true } },
      },
    }),
    db.newsCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!news) notFound();

  return (
    <div className="space-y-5">
      <PageHeading
        title="Sunting Berita"
        description={`Terakhir diperbarui ${formatTanggalPendek(news.updatedAt)}.`}
      />

      <Panel title="Detail Berita" className="max-w-4xl">
        <NewsEditorForm
          initial={{
            id: news.id,
            title: news.title,
            excerpt: news.excerpt,
            body: news.body,
            categoryId: news.categoryId ?? "",
            status: news.status,
            cover: coverPreview(news.coverFile),
          }}
          categories={categories}
          action={updateNewsFormAction}
          submitLabel="Simpan perubahan"
        />
      </Panel>
    </div>
  );
}

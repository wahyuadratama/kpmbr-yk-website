import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import { NewsEditorForm } from "@/components/admin/news-editor-form";
import { updateNewsFormAction } from "@/modules/news/form-actions";
import { formatTanggalPendek } from "@/lib/utils/format";

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
          }}
          categories={categories}
          action={updateNewsFormAction}
          submitLabel="Simpan perubahan"
        />
      </Panel>
    </div>
  );
}

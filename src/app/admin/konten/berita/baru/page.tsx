import type { Metadata } from "next";
import { requirePermissionPage } from "@/server/auth/guards";
import { db } from "@/server/db/prisma";
import { PageHeading } from "@/ui/components/dashboard/page-heading";
import { Panel } from "@/ui/components/dashboard/panel";
import { NewsEditorForm } from "@/ui/components/admin/news-editor-form";
import { createNewsFormAction } from "@/server/modules/news/form-actions";

export const metadata: Metadata = { title: "Tulis Berita" };
export const dynamic = "force-dynamic";

/** Formulir membuat berita baru. */
export default async function NewNewsPage() {
  await requirePermissionPage("news:create");

  const categories = await db.newsCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-5">
      <PageHeading
        title="Tulis Berita"
        description="Buat artikel baru. Status draf tidak tampil di website sampai diterbitkan."
      />

      <Panel
        title="Detail Berita"
        description="Isi disimpan sebagai Markdown polos — paragraf dipisahkan satu baris kosong."
        className="max-w-4xl"
      >
        <NewsEditorForm
          initial={{
            title: "",
            excerpt: "",
            body: "",
            categoryId: "",
            status: "DRAFT",
          }}
          categories={categories}
          action={createNewsFormAction}
          submitLabel="Simpan berita"
        />
      </Panel>
    </div>
  );
}

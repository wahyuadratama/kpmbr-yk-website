import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";
import { NewsStatus } from "@/generated/prisma/enums";
import { createNewsAction, deleteNewsAction, updateNewsAction } from "@/modules/news/actions";
import CreateNewsForm from "@/components/pengurus/create-news-form";
import { Button } from "@/components/ui/button";
import { formatTanggalPendek } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Kelola Berita" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<NewsStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Terbit",
  ARCHIVED: "Arsip",
};

export default async function BeritaPage() {
  const principal = await requirePortalPage("/pengurus");

  const canUpdate = hasPermission(principal.role, "news:update");
  const canDelete = hasPermission(principal.role, "news:delete");

  const items = await db.news.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, title: true, slug: true, status: true, publishedAt: true,
      createdAt: true, authorName: true, isFeatured: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Kelola Berita</h1>
          <p className="text-sm text-muted-foreground">
            Semua berita (draft, terbit, arsip). Perubahan dicatat audit log.
          </p>
        </div>
        <CreateNewsForm createAction={createNewsAction} />
      </div>

      <section className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-3">Judul</th>
              <th className="p-3">Status</th>
              <th className="p-3">Penulis</th>
              <th className="p-3">Dibuat</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((n) => (
              <tr key={n.id} className="p-3">
                <td className="font-medium">{n.title}</td>
                <td>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${
                      n.status === NewsStatus.PUBLISHED
                        ? "border-emerald/20 bg-emerald/50 text-emerald-700"
                        : n.status === NewsStatus.DRAFT
                        ? "border-amber/20 bg-amber/50 text-amber-700"
                        : "border-slate/20 bg-slate/50 text-slate-700"
                    }`}
                  >
                    {STATUS_LABEL[n.status]}
                  </span>
                </td>
                <td className="text-muted-foreground">{n.authorName ?? "—"}</td>
                <td className="text-muted-foreground">
                  {formatTanggalPendek(n.createdAt)}
                </td>
                <td className="text-right space-x-1">
                  {canUpdate && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const s =
                          n.status === NewsStatus.PUBLISHED
                            ? NewsStatus.ARCHIVED
                            : NewsStatus.PUBLISHED;
                        void updateNewsAction({ id: n.id, status: s });
                      }}
                    >
                      {n.status === NewsStatus.PUBLISHED ? "Arsipkan" : "Terbitkan"}
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => void deleteNewsAction({ id: n.id })}
                    >
                      Hapus
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Belum ada berita.
          </div>
        )}
      </section>
    </div>
  );
}

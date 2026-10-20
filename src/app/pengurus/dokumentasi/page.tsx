import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import {
  createDocumentationAlbumFormAction,
  deleteDocumentationAlbumFormAction,
} from "@/modules/documentation/form-actions";
import { listDocumentationAlbums } from "@/modules/documentation/queries";
import CreateAlbumForm from "@/components/pengurus/create-album-form";
import { ConfirmActionForm } from "@/components/internal/confirm-action-form";
import { formatTanggalPendek } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Kelola Dokumentasi" };
export const dynamic = "force-dynamic";

export default async function DokumentasiPage() {
  const principal = await requirePortalPage("/pengurus");

  const canDelete = hasPermission(principal.role, "documentation:delete");

  const { items } = await listDocumentationAlbums({ size: 50 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Kelola Dokumentasi</h1>
          <p className="text-sm text-muted-foreground">
            Album foto kegiatan. Perubahan dicatat audit log.
          </p>
        </div>
        <CreateAlbumForm createAction={createDocumentationAlbumFormAction} />
      </div>

      <section className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-3">Judul</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3 text-right">Foto</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((a) => (
              <tr key={a.id} className="p-3">
                <td className="font-medium">{a.title}</td>
                <td className="text-muted-foreground">
                  {formatTanggalPendek(a.eventDate)}
                </td>
                <td className="text-right text-muted-foreground">{a.itemCount}</td>
                <td className="text-right">
                  {canDelete ? (
                    <ConfirmActionForm
                      action={deleteDocumentationAlbumFormAction}
                      id={a.id}
                      confirmMessage={`Hapus album "${a.title}"?`}
                    >
                      Hapus
                    </ConfirmActionForm>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Belum ada album dokumentasi.
          </div>
        )}
      </section>
    </div>
  );
}

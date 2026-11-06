/**
 * Tampilan CMS dokumentasi — dipakai bersama oleh portal `/admin` dan
 * `/pengurus`.
 *
 * Lihat penjelasan pemisahan di `modules/programs/admin-view.tsx`.
 */
import { hasPermission } from "@/server/auth/permissions";
import type { Principal } from "@/server/auth/principal";
import {
  createDocumentationAlbumFormAction,
  deleteDocumentationAlbumFormAction,
} from "@/server/modules/documentation/form-actions";
import { listDocumentationAlbums } from "@/server/modules/documentation/queries";
import CreateAlbumForm from "@/ui/components/pengurus/create-album-form";
import { ConfirmActionForm } from "@/ui/components/internal/confirm-action-form";
import { PageHeading } from "@/ui/components/dashboard/page-heading";
import { Panel } from "@/ui/components/dashboard/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/ui/table";
import { formatTanggalPendek } from "@/shared/utils/format";
import { todayInOrganizationTimezone } from "@/shared/utils/datetime";

export async function DokumentasiAdminView({
  principal,
}: {
  principal: Principal;
}) {
  const canDelete = hasPermission(principal.role, "documentation:delete");

  const { items } = await listDocumentationAlbums({ size: 50 });

  return (
    <div className="space-y-5">
      <PageHeading
        title="Kelola Dokumentasi"
        description="Album foto kegiatan. Perubahan dicatat audit log."
      />

      <Panel
        title="Album Dokumentasi"
        description="Jumlah foto dihitung dari isi album, bukan diisi manual."
        actions={
          <CreateAlbumForm
            createAction={createDocumentationAlbumFormAction}
            defaultDate={todayInOrganizationTimezone()}
          />
        }
        bodyClassName="p-0"
      >
        {items.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-dashboard-text-muted">
            Belum ada album dokumentasi.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Foto</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((album) => (
                <TableRow key={album.id}>
                  <TableCell className="max-w-[320px] truncate font-medium">
                    {album.title}
                  </TableCell>
                  <TableCell className="text-sm text-dashboard-text-muted">
                    {formatTanggalPendek(album.eventDate)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-dashboard-text-muted">
                    {album.itemCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {canDelete ? (
                      <ConfirmActionForm
                        action={deleteDocumentationAlbumFormAction}
                        id={album.id}
                        confirmMessage={`Hapus album "${album.title}"?`}
                      >
                        Hapus
                      </ConfirmActionForm>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}

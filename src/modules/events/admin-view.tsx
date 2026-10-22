/**
 * Tampilan CMS agenda — dipakai bersama oleh portal `/admin` dan `/pengurus`.
 *
 * Lihat penjelasan pemisahan di `modules/programs/admin-view.tsx`.
 */
import { db } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/auth/permissions";
import type { Principal } from "@/lib/auth/principal";
import { EventStatus } from "@/generated/prisma/enums";
import {
  createEventFormAction,
  deleteEventFormAction,
} from "@/modules/events/form-actions";
import CreateEventForm from "@/components/pengurus/create-event-form";
import { ConfirmActionForm } from "@/components/internal/confirm-action-form";
import { PageHeading } from "@/components/dashboard/page-heading";
import { Panel } from "@/components/dashboard/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTanggalPendek } from "@/lib/utils/format";

const STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: "Draft",
  TERJADWAL: "Terjadwal",
  BERLANGSUNG: "Berlangsung",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export async function AgendaAdminView({ principal }: { principal: Principal }) {
  const canDelete = hasPermission(principal.role, "event:delete");

  const items = await db.event.findMany({
    where: { deletedAt: null },
    orderBy: { startsAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      startsAt: true,
      location: true,
    },
  });

  return (
    <div className="space-y-5">
      <PageHeading
        title="Kelola Agenda"
        description="Daftar kegiatan organisasi. Perubahan dicatat audit log."
      />

      <Panel
        title="Agenda"
        description="Agenda berstatus draf tidak tampil di halaman publik."
        actions={<CreateEventForm createAction={createEventFormAction} />}
        bodyClassName="p-0"
      >
        {items.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-dashboard-text-muted">
            Belum ada agenda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="max-w-[320px] truncate font-medium">
                    {event.title}
                  </TableCell>
                  <TableCell className="text-xs text-dashboard-text-muted">
                    {STATUS_LABEL[event.status]}
                  </TableCell>
                  <TableCell className="text-sm text-dashboard-text-muted">
                    {formatTanggalPendek(event.startsAt)}
                  </TableCell>
                  <TableCell className="text-sm text-dashboard-text-muted">
                    {event.location ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canDelete ? (
                      <ConfirmActionForm
                        action={deleteEventFormAction}
                        id={event.id}
                        confirmMessage={`Hapus agenda "${event.title}"?`}
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

import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";
import { EventStatus } from "@/generated/prisma/enums";
import { createEventAction, deleteEventAction } from "@/modules/events/actions";
import CreateEventForm from "@/components/pengurus/create-event-form";
import { Button } from "@/components/ui/button";
import { formatTanggalPendek } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Kelola Agenda" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: "Draft",
  TERJADWAL: "Terjadwal",
  BERLANGSUNG: "Berlangsung",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export default async function AgendaPage() {
  const principal = await requirePortalPage("/pengurus");

  const canDelete = hasPermission(principal.role, "event:delete");

  const items = await db.event.findMany({
    where: { deletedAt: null },
    orderBy: { startsAt: "desc" },
    take: 50,
    select: { id: true, title: true, slug: true, status: true, startsAt: true, location: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Kelola Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Daftar kegiatan. Perubahan dicatat audit log.
          </p>
        </div>
        <CreateEventForm createAction={createEventAction} />
      </div>

      <section className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-3">Judul</th>
              <th className="p-3">Status</th>
              <th className="p-3">Waktu</th>
              <th className="p-3">Lokasi</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((e) => (
              <tr key={e.id} className="p-3">
                <td className="font-medium">{e.title}</td>
                <td className="text-xs text-muted-foreground">{STATUS_LABEL[e.status]}</td>
                <td className="text-muted-foreground">
                  {formatTanggalPendek(e.startsAt)}
                </td>
                <td className="text-muted-foreground">{e.location ?? "—"}</td>
                <td className="text-right space-x-1">
                  {canDelete && (
                    <Button size="sm" variant="destructive" onClick={() => void deleteEventAction({ id: e.id })}>
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
            Belum ada agenda.
          </div>
        )}
      </section>
    </div>
  );
}

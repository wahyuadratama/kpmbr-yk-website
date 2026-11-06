import type { Metadata } from "next";
import { requirePortalPage } from "@/server/auth/guards";
import { hasPermission } from "@/server/auth/permissions";
import {
  createAnnouncementFormAction,
  deleteAnnouncementFormAction,
} from "@/server/modules/announcements/form-actions";
import { listAnnouncements } from "@/server/modules/announcements/queries";
import CreateAnnouncementForm from "@/ui/components/pengurus/create-announcement-form";
import { ConfirmActionForm } from "@/ui/components/internal/confirm-action-form";
import { formatTanggalPendek } from "@/shared/utils/format";

export const metadata: Metadata = { title: "Kelola Pengumuman" };
export const dynamic = "force-dynamic";

const PRIORITY_LABEL: Record<string, string> = {
  NORMAL: "Biasa",
  PENTING: "Penting",
  MENDESAK: "Mendekat",
};

const AUDIENCE_LABEL: Record<string, string> = {
  PUBLIC: "Publik",
  ANGGOTA: "Anggota",
  ALUMNI: "Alumni",
  PENGURUS: "Pengurus",
};

export default async function PengumumanPage() {
  const principal = await requirePortalPage("/pengurus");

  const canDelete = hasPermission(principal.role, "announcement:delete");

  const { items } = await listAnnouncements({ size: 50 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Kelola Pengumuman</h1>
          <p className="text-sm text-muted-foreground">
            Pengumuman organisasi. Perubahan dicatat audit log.
          </p>
        </div>
        <CreateAnnouncementForm createAction={createAnnouncementFormAction} />
      </div>

      <section className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-3">Judul</th>
              <th className="p-3">Prioritas</th>
              <th className="p-3">Audiens</th>
              <th className="p-3">Terbit</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((a) => (
              <tr key={a.id} className="p-3">
                <td className="font-medium">{a.title}</td>
                <td className="text-xs text-muted-foreground">{PRIORITY_LABEL[a.priority]}</td>
                <td className="text-xs text-muted-foreground">{AUDIENCE_LABEL[a.audience]}</td>
                <td className="text-muted-foreground">
                  {formatTanggalPendek(a.publishedAt)}
                </td>
                <td className="text-right">
                  {canDelete ? (
                    <ConfirmActionForm
                      action={deleteAnnouncementFormAction}
                      id={a.id}
                      confirmMessage={`Hapus pengumuman "${a.title}"?`}
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
            Belum ada pengumuman.
          </div>
        )}
      </section>
    </div>
  );
}

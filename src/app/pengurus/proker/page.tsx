import type { Metadata } from "next";
import { requirePortalPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";
import { ProgramStatus } from "@/generated/prisma/enums";
import {
  advanceProgramProgressFormAction,
  createProgramFormAction,
  deleteProgramFormAction,
} from "@/modules/programs/form-actions";
import CreateProgramForm from "@/components/pengurus/create-program-form";
import { ConfirmActionForm } from "@/components/internal/confirm-action-form";

export const metadata: Metadata = { title: "Kelola Program Kerja" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ProgramStatus, string> = {
  DRAFT: "Draft",
  DIRANCANG: "Dirancang",
  BERJALAN: "Berjalan",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

const PROGRESS_STEPS = [0, 25, 50, 75, 100] as const;

export default async function ProkerPage() {
  const principal = await requirePortalPage("/pengurus");

  const canUpdate = hasPermission(principal.role, "program:update");
  const canDelete = hasPermission(principal.role, "program:delete");

  const items = await db.program.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, name: true, slug: true, status: true, progress: true,
      divisionName: true, createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Kelola Program Kerja</h1>
          <p className="text-sm text-muted-foreground">
            Daftar program kerja dan progresnya. Perubahan dicatat audit log.
          </p>
        </div>
        <CreateProgramForm createAction={createProgramFormAction} />
      </div>

      <section className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-3">Program</th>
              <th className="p-3">Divisi PIC</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Progres</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((p) => (
              <tr key={p.id} className="p-3">
                <td className="font-medium">{p.name}</td>
                <td className="text-muted-foreground">{p.divisionName ?? "—"}</td>
                <td className="text-xs text-muted-foreground">{STATUS_LABEL[p.status]}</td>
                <td className="text-right text-muted-foreground">{p.progress}%</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {canUpdate && (
                      <ConfirmActionForm
                        action={advanceProgramProgressFormAction}
                        id={p.id}
                        fields={{
                          progress: String(
                            PROGRESS_STEPS[
                              (PROGRESS_STEPS.indexOf(
                                p.progress as (typeof PROGRESS_STEPS)[number],
                              ) +
                                1) %
                              PROGRESS_STEPS.length
                            ],
                          ),
                        }}
                        variant="outline"
                      >
                        Ubah progres
                      </ConfirmActionForm>
                    )}
                    {canDelete && (
                      <ConfirmActionForm
                        action={deleteProgramFormAction}
                        id={p.id}
                        confirmMessage={`Hapus program kerja "${p.name}"?`}
                      >
                        Hapus
                      </ConfirmActionForm>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Belum ada program kerja.
          </div>
        )}
      </section>
    </div>
  );
}

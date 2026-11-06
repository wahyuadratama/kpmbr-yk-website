/**
 * Tampilan CMS program kerja — dipakai bersama oleh portal `/admin` dan
 * `/pengurus`.
 *
 * Dipisah dari file route supaya ada SATU implementasi tampilan. Route admin
 * dan route pengurus hanya berbeda pada guard portalnya; isi, aksi, dan
 * permission-nya identik. Duplikasi akan membuat dua tempat harus diubah
 * setiap kali ada perubahan.
 */
import { db } from "@/server/db/prisma";
import { hasPermission } from "@/server/auth/permissions";
import type { Principal } from "@/server/auth/principal";
import { ProgramStatus } from "@/generated/prisma/enums";
import {
  advanceProgramProgressFormAction,
  createProgramFormAction,
  deleteProgramFormAction,
} from "@/server/modules/programs/form-actions";
import CreateProgramForm from "@/ui/components/pengurus/create-program-form";
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

const STATUS_LABEL: Record<ProgramStatus, string> = {
  DRAFT: "Draft",
  DIRANCANG: "Dirancang",
  BERJALAN: "Berjalan",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

const PROGRESS_STEPS = [0, 25, 50, 75, 100] as const;

export async function ProgramKerjaAdminView({
  principal,
}: {
  principal: Principal;
}) {
  const canUpdate = hasPermission(principal.role, "program:update");
  const canDelete = hasPermission(principal.role, "program:delete");

  const items = await db.program.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      progress: true,
      divisionName: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-5">
      <PageHeading
        title="Kelola Program Kerja"
        description="Daftar program kerja dan progresnya. Perubahan dicatat audit log."
      />

      <Panel
        title="Program Kerja"
        description="Progres hanya bergerak pada kelipatan 25 persen."
        actions={<CreateProgramForm createAction={createProgramFormAction} />}
        bodyClassName="p-0"
      >
        {items.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-dashboard-text-muted">
            Belum ada program kerja.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Divisi PIC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Progres</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="max-w-[280px] truncate font-medium">
                    {program.name}
                  </TableCell>
                  <TableCell className="text-sm text-dashboard-text-muted">
                    {program.divisionName ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-dashboard-text-muted">
                    {STATUS_LABEL[program.status]}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-dashboard-text-muted">
                    {program.progress}%
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {canUpdate ? (
                        <ConfirmActionForm
                          action={advanceProgramProgressFormAction}
                          id={program.id}
                          fields={{
                            progress: String(
                              PROGRESS_STEPS[
                                (PROGRESS_STEPS.indexOf(
                                  program.progress as (typeof PROGRESS_STEPS)[number],
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
                      ) : null}
                      {canDelete ? (
                        <ConfirmActionForm
                          action={deleteProgramFormAction}
                          id={program.id}
                          confirmMessage={`Hapus program kerja "${program.name}"?`}
                        >
                          Hapus
                        </ConfirmActionForm>
                      ) : null}
                    </div>
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

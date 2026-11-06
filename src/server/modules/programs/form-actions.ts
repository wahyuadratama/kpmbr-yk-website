"use server";

/**
 * Server Action untuk form React pada modul program kerja.
 *
 * Lihat penjelasan pemisahan file di `modules/news/form-actions.ts`.
 */
import {
  createProgramAction,
  deleteProgramAction,
  updateProgramAction,
} from "@/server/modules/programs/actions";
import type { ActionResult } from "@/server/actions/result";
import { ProgramStatus } from "@/generated/prisma/enums";

/** Buat program kerja baru dari form. */
export async function createProgramFormAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return createProgramAction({
    name: formData.get("name"),
    description: formData.get("description"),
    objective: formData.get("objective"),
    divisionName: formData.get("divisionName"),
    coverFileId:
      formData.get("coverFileId") === "" ? null : formData.get("coverFileId"),
    status: formData.get("status") ?? ProgramStatus.DIRANCANG,
    progress: formData.get("progress") ?? 0,
  });
}

/** Hapus program kerja (soft delete). */
export async function deleteProgramFormAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;
  await deleteProgramAction({ id });
}

/** Geser progres program ke langkah berikutnya. */
export async function advanceProgramProgressFormAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  const progress = formData.get("progress");
  if (typeof id !== "string" || typeof progress !== "string") return;
  await updateProgramAction({ id, progress: Number(progress) });
}

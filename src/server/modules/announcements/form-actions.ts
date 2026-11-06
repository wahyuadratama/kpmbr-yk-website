"use server";

/**
 * Server Action untuk form React pada modul pengumuman.
 *
 * Lihat penjelasan pemisahan file di `modules/news/form-actions.ts`.
 */
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateAnnouncementAction,
} from "@/modules/announcements/actions";
import type { ActionResult } from "@/lib/actions/result";
import {
  AnnouncementAudience,
  AnnouncementPriority,
} from "@/generated/prisma/enums";

/** Buat pengumuman baru dari form. */
export async function createAnnouncementFormAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return createAnnouncementAction({
    title: formData.get("title"),
    body: formData.get("body"),
    coverFileId:
      formData.get("coverFileId") === "" ? null : formData.get("coverFileId"),
    priority: formData.get("priority") ?? AnnouncementPriority.NORMAL,
    audience: formData.get("audience") ?? AnnouncementAudience.PUBLIC,
  });
}

/** Hapus pengumuman (soft delete). */
export async function deleteAnnouncementFormAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;
  await deleteAnnouncementAction({ id });
}

/** Perbarui isi pengumuman dari form. */
export async function updateAnnouncementFormAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Id pengumuman tidak valid.");
  }
  return updateAnnouncementAction({
    id,
    title: formData.get("title"),
    body: formData.get("body"),
    coverFileId:
      formData.get("coverFileId") === "" ? null : formData.get("coverFileId"),
    priority: formData.get("priority") ?? AnnouncementPriority.NORMAL,
    audience: formData.get("audience") ?? AnnouncementAudience.PUBLIC,
  });
}

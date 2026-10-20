"use server";

/**
 * Server Action untuk form React pada modul dokumentasi.
 *
 * Lihat penjelasan pemisahan file di `modules/news/form-actions.ts`.
 */
import {
  createDocumentationAlbumAction,
  deleteDocumentationAlbumAction,
} from "@/modules/documentation/actions";
import type { ActionResult } from "@/lib/actions/result";

/** Buat album dokumentasi baru dari form. */
export async function createDocumentationAlbumFormAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return createDocumentationAlbumAction({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    eventDate: formData.get("eventDate"),
    accent: formData.get("accent") ?? undefined,
  });
}

/** Hapus album dokumentasi (soft delete). */
export async function deleteDocumentationAlbumFormAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;
  await deleteDocumentationAlbumAction({ id });
}

"use server";

/**
 * Server Action untuk form React pada modul dokumen arsip organisasi.
 *
 * Lihat penjelasan pemisahan file di `modules/news/form-actions.ts`.
 */
import { deleteOrganizationDocumentAction } from "@/server/modules/organization-documents/actions";

/** Hapus dokumen arsip (soft delete). */
export async function deleteOrganizationDocumentFormAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;
  await deleteOrganizationDocumentAction({ id });
}

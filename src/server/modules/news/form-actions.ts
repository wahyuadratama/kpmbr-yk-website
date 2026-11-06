"use server";

/**
 * Server Action untuk form React pada modul berita.
 *
 * Kenapa file terpisah dari `modules/news/actions.ts`:
 *
 * - `useActionState` memanggil aksi dengan `(prevState, formData)`, sedangkan
 *   aksi modul menerima objek biasa. Tanpa adapter ini, aksi akan menerima
 *   `prevState` alih-alih data form.
 * - File dengan `"use server"` mendaftarkan seluruh ekspornya sebagai Server
 *   Action yang sah, sehingga boleh diteruskan ke Client Component. Modul
 *   `actions.ts` memakai `import "server-only"` (bukan `"use server"`) karena
 *   isinya juga dipanggil langsung dari server.
 */
import {
  createNewsAction,
  deleteNewsAction,
  updateNewsAction,
} from "@/server/modules/news/actions";
import type { ActionResult } from "@/server/actions/result";
import { NewsStatus } from "@/generated/prisma/enums";

/** Buat berita baru dari form. */
export async function createNewsFormAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string; slug: string }>> {
  return createNewsAction({
    title: formData.get("title"),
    excerpt: formData.get("excerpt") ?? undefined,
    body: formData.get("body"),
    // Placeholder "Tanpa kategori" bernilai "none" dan harus jadi null.
    categoryId:
      formData.get("categoryId") === "none" ? null : formData.get("categoryId"),
    coverFileId:
      formData.get("coverFileId") === "" ? null : formData.get("coverFileId"),
    status: formData.get("status") ?? NewsStatus.DRAFT,
  });
}

/** Hapus berita (soft delete). */
export async function deleteNewsFormAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;
  await deleteNewsAction({ id });
}

/** Terbitkan atau arsipkan berita. */
export async function setNewsStatusFormAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || typeof status !== "string") return;
  await updateNewsAction({ id, status: status as NewsStatus });
}

/** Perbarui isi berita dari form. */
export async function updateNewsFormAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Id berita tidak valid.");
  }
  return updateNewsAction({
    id,
    title: formData.get("title"),
    excerpt: formData.get("excerpt") ?? undefined,
    body: formData.get("body"),
    categoryId:
      formData.get("categoryId") === "none" ? null : formData.get("categoryId"),
    coverFileId:
      formData.get("coverFileId") === "" ? null : formData.get("coverFileId"),
    status: formData.get("status") ?? NewsStatus.DRAFT,
  });
}

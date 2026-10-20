"use server";

/**
 * Server Action untuk form React pada modul agenda.
 *
 * Lihat penjelasan pemisahan file di `modules/news/form-actions.ts`.
 */
import {
  createEventAction,
  deleteEventAction,
} from "@/modules/events/actions";
import type { ActionResult } from "@/lib/actions/result";
import { EventStatus } from "@/generated/prisma/enums";

/** Buat agenda baru dari form. */
export async function createEventFormAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return createEventAction({
    title: formData.get("title"),
    description: formData.get("description"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") ?? undefined,
    location: formData.get("location"),
    organizer: formData.get("organizer"),
    status: formData.get("status") ?? EventStatus.TERJADWAL,
  });
}

/** Hapus agenda (soft delete). */
export async function deleteEventFormAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;
  await deleteEventAction({ id });
}

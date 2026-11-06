"use client";

/**
 * Formulir editor pengumuman.
 *
 * `audience` menentukan siapa yang boleh membaca pengumuman; penerbitannya
 * ditegakkan di query, bukan dengan menyembunyikan di frontend.
 */
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { Textarea } from "@/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/ui/select";
import type { ActionResult } from "@/server/actions/result";
import {
  AnnouncementAudience,
  AnnouncementPriority,
} from "@/generated/prisma/enums";
import { ImagePicker, type PickedImage } from "@/ui/components/admin/image-picker";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Menyimpan..." : label}
    </Button>
  );
}

export type AnnouncementEditorValues = {
  id?: string;
  title: string;
  body: string;
  priority: string;
  audience: string;
  cover?: PickedImage | null;
};

export function AnnouncementEditorForm({
  initial,
  action,
  submitLabel = "Simpan pengumuman",
  cancelHref = "/admin/konten",
}: {
  initial: AnnouncementEditorValues;
  action: (
    prev: unknown,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string }>>;
  submitLabel?: string;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState(action, {
    ok: false,
    error: { code: "BAD_REQUEST", message: "" },
  } as ActionResult<{ id: string }>);

  const error = state.ok ? "" : state.error.message;

  return (
    <form action={formAction} className="space-y-4">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Judul pengumuman</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={initial.title}
          placeholder="Judul pengumuman"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="audience">Audiens</Label>
          <Select name="audience" defaultValue={initial.audience}>
            <SelectTrigger id="audience">
              <SelectValue placeholder="Pilih audiens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AnnouncementAudience.PUBLIC}>Publik</SelectItem>
              <SelectItem value={AnnouncementAudience.ANGGOTA}>Anggota</SelectItem>
              <SelectItem value={AnnouncementAudience.ALUMNI}>Alumni</SelectItem>
              <SelectItem value={AnnouncementAudience.PENGURUS}>Pengurus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Prioritas</Label>
          <Select name="priority" defaultValue={initial.priority}>
            <SelectTrigger id="priority">
              <SelectValue placeholder="Pilih prioritas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AnnouncementPriority.NORMAL}>Biasa</SelectItem>
              <SelectItem value={AnnouncementPriority.PENTING}>Penting</SelectItem>
              <SelectItem value={AnnouncementPriority.MENDESAK}>Mendekat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">Isi pengumuman</Label>
        <Textarea
          id="body"
          name="body"
          rows={8}
          required
          defaultValue={initial.body}
          placeholder="Isi pengumuman"
        />
      </div>

      <ImagePicker name="coverFileId" initial={initial.cover ?? null} />

      {error ? (
        <p role="alert" className="text-xs text-dashboard-danger">
          {error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-xs text-dashboard-success">
          Pengumuman berhasil disimpan.
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton label={submitLabel} />
        <Button asChild variant="outline" size="sm">
          <a href={cancelHref}>Batal</a>
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { type ActionResult } from "@/server/actions/result";
import { AnnouncementPriority } from "@/generated/prisma/enums";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { Textarea } from "@/ui/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/ui/select";

type CreateAnnouncementFormProps = {
  createAction: typeof import("@/server/modules/announcements/form-actions").createAnnouncementFormAction;
};

export default function CreateAnnouncementForm({ createAction }: CreateAnnouncementFormProps) {
  const [state, formAction] = useActionState(
    createAction,
    { ok: false } as ActionResult<{ id: string }>,
  );

  return (
    <section id="form-create" className="rounded-lg border p-4 space-y-4">
      <h2 className="text-lg font-semibold">Buat pengumuman baru</h2>
      <form action={formAction} className="space-y-4">
        {state.ok === false && state.error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/50 p-3 text-sm text-destructive">
            {state.error.message}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" name="title" required defaultValue="" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="priority">Prioritas</Label>
            <Select name="priority" defaultValue={AnnouncementPriority.NORMAL}>
                            <SelectTrigger id="priority">
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                {[
                  AnnouncementPriority.NORMAL,
                  AnnouncementPriority.PENTING,
                  AnnouncementPriority.MENDESAK,
                ].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="audience">Audiens</Label>
            <Select name="audience" defaultValue="PUBLIC">
                            <SelectTrigger id="audience">
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "PUBLIC",
                  "ANGGOTA",
                  "ALUMNI",
                  "PENGURUS",
                ].map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="body">Isi</Label>
          <Textarea id="body" name="body" rows={5} required defaultValue="" />
        </div>
        <Button type="submit">Simpan</Button>
      </form>
    </section>
  );
}

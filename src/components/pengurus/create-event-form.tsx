"use client";

import { useActionState } from "react";
import { type ActionResult } from "@/lib/actions/result";
import { EventStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateEventFormProps = {
  createAction: typeof import("@/modules/events/form-actions").createEventFormAction;
};

export default function CreateEventForm({ createAction }: CreateEventFormProps) {
  const [state, formAction] = useActionState(
    createAction,
    { ok: false } as ActionResult<{ id: string }>,
  );

  return (
    <section id="form-create" className="rounded-lg border p-4 space-y-4">
      <h2 className="text-lg font-semibold">Buat agenda baru</h2>
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
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={EventStatus.TERJADWAL}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EventStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="startsAt">Waktu mulai</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required defaultValue="" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endsAt">Waktu selesai</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" defaultValue="" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location">Lokasi</Label>
          <Input id="location" name="location" defaultValue="" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="organizer">Penyelenggara</Label>
          <Input id="organizer" name="organizer" defaultValue="" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea id="description" name="description" rows={4} defaultValue="" />
        </div>
        <Button type="submit">Simpan</Button>
      </form>
    </section>
  );
}

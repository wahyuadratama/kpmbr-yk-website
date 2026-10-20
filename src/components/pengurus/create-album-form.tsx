"use client";

import { useActionState } from "react";
import { type ActionResult } from "@/lib/actions/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateAlbumFormProps = {
  createAction: typeof import("@/modules/documentation/form-actions").createDocumentationAlbumFormAction;
};

export default function CreateAlbumForm({ createAction }: CreateAlbumFormProps) {
  const [state, formAction] = useActionState(
    createAction,
    { ok: false } as ActionResult<{ id: string }>,
  );

  return (
    <section id="form-create" className="rounded-lg border p-4 space-y-4">
      <h2 className="text-lg font-semibold">Buat album baru</h2>
      <form action={formAction} className="space-y-4">
        {state.ok === false && state.error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/50 p-3 text-sm text-destructive">
            {state.error.message}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="title">Judul album</Label>
            <Input id="title" name="title" required defaultValue="" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="accent">Aksen warna</Label>
            <Select name="accent" defaultValue="brand">
              <SelectTrigger>
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "brand",
                  "brandMuted",
                  "terra",
                  "info",
                  "success",
                  "foreground",
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
          <Label htmlFor="eventDate">Tanggal acara</Label>
          <Input id="eventDate" name="eventDate" type="date" required defaultValue="" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea id="description" name="description" rows={3} defaultValue="" />
        </div>
        <Button type="submit">Simpan</Button>
      </form>
    </section>
  );
}

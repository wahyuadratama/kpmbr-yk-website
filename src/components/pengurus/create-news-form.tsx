"use client";

import { useActionState } from "react";
import { type ActionResult } from "@/lib/actions/result";
import { NewsStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateNewsFormProps = {
  createAction: typeof import("@/modules/news/actions").createNewsAction;
};

export default function CreateNewsForm({ createAction }: CreateNewsFormProps) {
  const [state, formAction] = useActionState(
    createAction,
    { ok: false } as ActionResult<{ id: string; slug: string }>,
  );

  return (
    <section id="form-create" className="rounded-lg border p-4 space-y-4">
      <h2 className="text-lg font-semibold">Buat berita baru</h2>
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
            <Select name="status" defaultValue={NewsStatus.DRAFT}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NewsStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={NewsStatus.PUBLISHED}>Terbit</SelectItem>
                <SelectItem value={NewsStatus.ARCHIVED}>Arsip</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="excerpt">Ringkasan</Label>
          <Input id="excerpt" name="excerpt" defaultValue="" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="body">Isi</Label>
          <Textarea id="body" name="body" rows={6} defaultValue="" />
        </div>
        <Button type="submit">Simpan</Button>
      </form>
    </section>
  );
}

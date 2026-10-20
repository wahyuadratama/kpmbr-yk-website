"use client";

import { useActionState } from "react";
import { type ActionResult } from "@/lib/actions/result";
import { ProgramStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateProgramFormProps = {
  createAction: typeof import("@/modules/programs/form-actions").createProgramFormAction;
};

export default function CreateProgramForm({ createAction }: CreateProgramFormProps) {
  const [state, formAction] = useActionState(
    createAction,
    { ok: false } as ActionResult<{ id: string }>,
  );

  return (
    <section id="form-create" className="rounded-lg border p-4 space-y-4">
      <h2 className="text-lg font-semibold">Buat program kerja baru</h2>
      <form action={formAction} className="space-y-4">
        {state.ok === false && state.error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/50 p-3 text-sm text-destructive">
            {state.error.message}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="name">Nama program</Label>
            <Input id="name" name="name" required defaultValue="" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="divisionName">Divisi PIC</Label>
            <Input id="divisionName" name="divisionName" defaultValue="" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={ProgramStatus.DIRANCANG}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ProgramStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="progress">Progres</Label>
            <Select name="progress" defaultValue="0">
              <SelectTrigger>
                <SelectValue placeholder="0" />
              </SelectTrigger>
              <SelectContent>
                {[0, 25, 50, 75, 100].map((p) => (
                  <SelectItem key={String(p)} value={String(p)}>
                    {p}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea id="description" name="description" rows={4} defaultValue="" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="objective">Tujuan</Label>
          <Textarea id="objective" name="objective" rows={3} defaultValue="" />
        </div>
        <Button type="submit">Simpan</Button>
      </form>
    </section>
  );
}

"use client";

import { useActionState } from "react";
import { type TransisiResult } from "@/server/actions/alumni";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/ui/select";
import { MembershipEndReason } from "@/generated/prisma/enums";

type TransisiFormProps = {
  transisiAction: typeof import("@/server/actions/alumni").transisiKeanggotaanAction;
};

export default function TransisiForm({ transisiAction }: TransisiFormProps) {
  const [state, formAction] = useActionState(
    transisiAction,
    { ok: false } as TransisiResult,
  );

  return (
    <section className="rounded-lg border p-4 space-y-4">
      <h2 className="text-lg font-semibold">Transisi Keanggotaan</h2>
      <p className="text-sm text-muted-foreground">
        Tandai anggota sebagai lulusan. Role akan diubah menjadi ALUMNI dan
        status keanggotaan menjadi LULUS.
      </p>

      <form action={formAction} className="space-y-4">
        {state.ok === false && state.error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/50 p-3 text-sm text-destructive">
            {state.error.message}
          </div>
        )}
        {state.ok === true && (
          <div className="rounded-md border border-emerald/20 bg-emerald/50 p-3 text-sm text-emerald-900">
            Transisi berhasil. Role diubah menjadi ALUMNI.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="memberId">Kode / ID anggota</Label>
            <Input id="memberId" name="memberId" required defaultValue="" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="graduationYear">Tahun lulus</Label>
            <Input
              id="graduationYear"
              name="graduationYear"
              type="number"
              required
              defaultValue={new Date().getFullYear().toString()}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endReason">Alasan keluar</Label>
            <Select name="endReason" defaultValue={MembershipEndReason.LULUS}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MembershipEndReason).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Catatan</Label>
            <Input id="notes" name="notes" defaultValue="" />
          </div>
          <Button type="submit">Tandai sebagai Lulusan</Button>
        </div>
        </form>
      </section>
  );
}

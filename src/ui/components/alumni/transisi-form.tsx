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
      <h2 className="text-lg font-semibold">Transisi Keanggotaan (Manual)</h2>
      <p className="text-sm text-muted-foreground">
        Alur: AKTIF → LULUS → ALUMNI. Tidak bisa loncat/mundur. Setiap transisi tercatat audit log.
        Kartu anggota dinonaktifkan saat menjadi ALUMNI.
      </p>

      <form action={formAction} className="space-y-4">
        {state.ok === false && state.error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {state.error.message}
          </div>
        )}
        {state.ok === true && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Transisi berhasil → {state.data?.toStatus} (role: {state.data?.role}).
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div className="space-y-1">
            <Label htmlFor="memberId">ID anggota (cuid)</Label>
            <Input id="memberId" name="memberId" required placeholder="cm..." />
          </div>
          <div className="space-y-1">
            <Label htmlFor="action">Aksi</Label>
            <Select name="action" defaultValue="MARK_LULUS">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MARK_LULUS">AKTIF → LULUS</SelectItem>
                <SelectItem value="MARK_ALUMNI">LULUS → ALUMNI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="graduationYear">Tahun lulus (wajib utk LULUS)</Label>
            <Input id="graduationYear" name="graduationYear" type="number" defaultValue={new Date().getFullYear().toString()} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endReason">Alasan</Label>
            <Select name="endReason" defaultValue={MembershipEndReason.LULUS}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {Object.values(MembershipEndReason).map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Catatan</Label>
            <Input id="notes" name="notes" />
          </div>
        </div>
        <Button type="submit">Jalankan Transisi</Button>
      </form>
    </section>
  );
}

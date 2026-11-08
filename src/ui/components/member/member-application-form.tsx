"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitMemberApplicationAction } from "@/server/actions/member-application";
import type { ActionResult } from "@/server/actions/result";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/ui/select";
import { Textarea } from "@/ui/components/ui/textarea";

type FormState = ActionResult<{ id: string }>;

export default function MemberApplicationForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    submitMemberApplicationAction,
    { ok: false, error: { code: "INTERNAL", message: "" } } as any,
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state?.ok, router]);

  const fieldError = (field: string) =>
    state && !state.ok ? state.error.fields?.find((f) => f.field === field)?.message : undefined;
  const showError = state && !state.ok && state.error.message;

  return (
    <form action={formAction} className="space-y-4" id="member-application-form">
      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Lengkapi Data Anggota</h2>
          <p className="text-sm text-muted-foreground">
            Kirim pengajuan data keanggotaan. Pengajuan <strong>bukan</strong> aktivasi otomatis —
            sekretariat/admin akan meninjau dan menyetujui. Akun tetap belum terhubung sampai disetujui.
          </p>
        </div>

        {showError ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {state!.error.message}
          </div>
        ) : null}
        {state?.ok ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Pengajuan terkirim. Menunggu persetujuan sekretariat/admin.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="fullName">Nama lengkap <span className="text-destructive">*</span></Label>
            <Input id="fullName" name="fullName" required disabled={isPending} aria-invalid={!!fieldError("fullName")} />
            {fieldError("fullName") && <span className="text-xs text-destructive">{fieldError("fullName")}</span>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="nickname">Nama panggilan</Label>
            <Input id="nickname" name="nickname" disabled={isPending} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="gender">Jenis kelamin</Label>
            <Select name="gender" disabled={isPending}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Nomor telepon</Label>
            <Input id="phone" name="phone" type="tel" placeholder="0812..." disabled={isPending} aria-invalid={!!fieldError("phone")} />
            {fieldError("phone") && <span className="text-xs text-destructive">{fieldError("phone")}</span>}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="city">Kota</Label>
          <Input id="city" name="city" disabled={isPending} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bio">Bio singkat</Label>
          <Textarea id="bio" name="bio" rows={3} disabled={isPending} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="addressDetail">Alamat detail</Label>
          <Textarea id="addressDetail" name="addressDetail" rows={2} disabled={isPending} placeholder="Tidak ditampilkan ke publik" />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Mengirim..." : "Kirim Pengajuan"}
        </Button>
      </div>
    </form>
  );
}

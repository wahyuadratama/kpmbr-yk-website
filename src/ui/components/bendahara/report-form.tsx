"use client";

/** Formulir penyusunan laporan keuangan. */
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
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
import type { ActionResult } from "@/server/actions/result";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Menyimpan..." : "Susun laporan"}
    </Button>
  );
}

export function ReportForm({
  action,
  currentYear,
}: {
  action: (
    prev: unknown,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string }>>;
  currentYear: number;
}) {
  const [state, formAction] = useActionState(action, {
    ok: false,
    error: { code: "BAD_REQUEST", message: "" },
  } as ActionResult<{ id: string }>);

  const error = state.ok ? "" : state.error.message;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="periodYear">Tahun</Label>
          <Input
            id="periodYear"
            name="periodYear"
            type="number"
            required
            defaultValue={currentYear}
            min={1900}
            max={2100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="periodMonth">Bulan</Label>
          <Select name="periodMonth" defaultValue="none">
            <SelectTrigger id="periodMonth">
              <SelectValue placeholder="Pilih bulan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tahunan (12 bulan)</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <SelectItem key={month} value={String(month)}>
                  {new Intl.DateTimeFormat("id-ID", { month: "long" }).format(
                    new Date(2020, month - 1, 1),
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="periodType">Jenis laporan</Label>
          <Select name="periodType" defaultValue="MONTHLY">
            <SelectTrigger id="periodType">
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Bulanan</SelectItem>
              <SelectItem value="YEARLY">Tahunan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="visibility">Siapa yang boleh melihat</Label>
        <Select name="visibility" defaultValue="MEMBER_ONLY">
          <SelectTrigger id="visibility">
            <SelectValue placeholder="Pilih audiens" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">Publik</SelectItem>
            <SelectItem value="MEMBER_ONLY">Anggota</SelectItem>
            <SelectItem value="PENGURUS_ONLY">Pengurus</SelectItem>
            <SelectItem value="ADMIN_ONLY">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-dashboard-danger">
          {error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-xs text-dashboard-success">
          Laporan tersusun dengan status draf. Ajukan untuk pemeriksaan saat siap.
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

"use client";

/** Formulir pembuatan kategori keuangan. */
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
import { FinancialTransactionType } from "@/generated/prisma/enums";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Menyimpan..." : "Simpan kategori"}
    </Button>
  );
}

export function CategoryForm({
  action,
}: {
  action: (
    prev: unknown,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string }>>;
}) {
  const [state, formAction] = useActionState(action, {
    ok: false,
    error: { code: "BAD_REQUEST", message: "" },
  } as ActionResult<{ id: string }>);

  const error = state.ok ? "" : state.error.message;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama kategori</Label>
          <Input id="name" name="name" required placeholder="Iuran Anggota" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            required
            placeholder="iuran-anggota"
            className="font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">Jenis</Label>
        <Select name="type" defaultValue={FinancialTransactionType.EXPENSE}>
          <SelectTrigger id="type">
            <SelectValue placeholder="Pilih jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FinancialTransactionType.INCOME}>
              Pemasukan
            </SelectItem>
            <SelectItem value={FinancialTransactionType.EXPENSE}>
              Pengeluaran
            </SelectItem>
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
          Kategori berhasil dibuat.
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

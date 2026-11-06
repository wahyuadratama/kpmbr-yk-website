"use client";

/**
 * Formulir pencatatan transaksi keuangan.
 *
 * Nominal dikirim sebagai string agar angka besar tidak kehilangan presisi di
 * JavaScript Number; server yang mengubahnya menjadi BigInt.
 */
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { Textarea } from "@/ui/components/ui/textarea";
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
      {pending ? "Menyimpan..." : "Simpan transaksi"}
    </Button>
  );
}

export function TransactionForm({
  categories,
  action,
  defaultDate = "",
}: {
  categories: { id: string; name: string; type: string }[];
  action: (
    prev: unknown,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string }>>;
  /** Tanggal default (WIB) dari server, mis. "2026-10-21". */
  defaultDate?: string;
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

        <div className="space-y-1.5">
          <Label htmlFor="date">Tanggal</Label>
          <Input id="date" name="date" type="date" required defaultValue={defaultDate} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount">Nominal (Rp)</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="numeric"
            required
            placeholder="250000"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Kategori</Label>
          <Select name="categoryId" defaultValue="none">
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.length === 0 ? (
                <SelectItem value="none" disabled>
                  Belum ada kategori
                </SelectItem>
              ) : (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Keterangan singkat transaksi"
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs text-dashboard-danger">
          {error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-xs text-dashboard-success">
          Transaksi berhasil dicatat.
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

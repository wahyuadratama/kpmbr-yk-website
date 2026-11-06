"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Category = {
  id: string;
  name: string;
  slug: string;
  type: string;
};

type FinanceFormProps = {
  categories: Category[];
};

const TYPE_OPTIONS = [
  { value: "INCOME", label: "Pemasukan" },
  { value: "EXPENSE", label: "Pengeluaran" },
] as const;

export function FinanceCategoryForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const raw = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      type: formData.get("type"),
    };

    try {
      const res = await fetch("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(raw),
      });
      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message ?? "Gagal menyimpan kategori.");
        return;
      }

      setSuccess("Kategori tersimpan.");
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError("Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle>Kategori Keuangan Baru</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/50 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-emerald/10 border border-emerald/50 p-3 text-xs text-emerald-700">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nama kategori</Label>
              <Input
                name="name"
                placeholder="Mis. Iuran Anggota"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                name="slug"
                placeholder="Mis. iuran"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tipe</Label>
            <Select name="type" defaultValue="EXPENSE">
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Menyimpan..." : "Simpan Kategori"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function FinanceTransactionForm({ categories }: FinanceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const raw = {
      date: formData.get("date"),
      amount: formData.get("amount"),
      type: formData.get("type"),
      categoryId: formData.get("categoryId"),
      description: formData.get("description") || undefined,
    };

    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(raw),
      });
      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message ?? "Gagal menyimpan transaksi.");
        return;
      }

      setSuccess("Transaksi tersimpan.");
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError("Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle>Transaksi Keuangan Baru</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/50 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-emerald/10 border border-emerald/50 p-3 text-xs text-emerald-700">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" name="date" required />
            </div>
            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select name="type" defaultValue="EXPENSE">
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select name="categoryId">
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Jumlah (Rupiah)</Label>
            <Input type="text" name="amount" placeholder="1.500.000" required />
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea name="description" rows={2} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Menyimpan..." : "Simpan Transaksi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/ui/card";

const CATEGORY_OPTIONS = [
  { value: "LPJ", label: "LPJ" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "SK", label: "SK" },
  { value: "NOTULEN", label: "Notulen" },
  { value: "AD_ART", label: "AD/ART" },
  { value: "LAINNYA", label: "Lainnya" },
] as const;

const ACCESS_LEVEL_OPTIONS = [
  { value: "PUBLIC", label: "Publik" },
  { value: "MEMBER_ONLY", label: "Hanya Anggota" },
  { value: "PENGURUS_ONLY", label: "Hanya Pengurus" },
  { value: "ADMIN_ONLY", label: "Hanya Admin" },
] as const;

export function ArsipUploadForm() {
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
    const file = formData.get("file") as File | null;
    if (!file) {
      setError("File wajib dipilih.");
      setLoading(false);
      return;
    }

    try {
      // 1. Unggah file ke /api/files
      const fileFormData = new FormData();
      fileFormData.append("file", file);
      fileFormData.append("accessLevel", String(formData.get("accessLevel")));
      fileFormData.append("kind", "DOCUMENT");

      const fileRes = await fetch("/api/files", {
        method: "POST",
        body: fileFormData,
      });
      const fileJson = await fileRes.json();
      if (!fileJson.ok) {
        setError(fileJson.error?.message ?? "Gagal mengunggah file.");
        return;
      }

      // 2. Buat entri dokumen arsip
      const docRes = await fetch("/api/organization-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          slug: formData.get("slug"),
          category: formData.get("category"),
          description: formData.get("description") || undefined,
          fileId: fileJson.file.id,
          accessLevel: formData.get("accessLevel"),
        }),
      });
      const docJson = await docRes.json();
      if (!docJson.ok) {
        setError(docJson.error?.message ?? "Gagal menyimpan dokumen arsip.");
        return;
      }

      setSuccess("Dokumen arsip tersimpan.");
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
        <CardTitle>Unggah Dokumen Arsip</CardTitle>
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
          <div className="space-y-2">
            <Label>Judul dokumen</Label>
            <Input name="title" placeholder="Mis. LPJ Keuangan 2025" required />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input name="slug" placeholder="Mis. lpj-keuangan-2025" required />
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select name="category" defaultValue="LAINNYA">
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tingkat akses</Label>
            <Select name="accessLevel" defaultValue="MEMBER_ONLY">
              <SelectTrigger>
                <SelectValue placeholder="Pilih tingkat akses" />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_LEVEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea name="description" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>File</Label>
            <input type="file" name="file" required className="block w-full text-sm text-muted-foreground" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Mengunggah..." : "Simpan Dokumen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

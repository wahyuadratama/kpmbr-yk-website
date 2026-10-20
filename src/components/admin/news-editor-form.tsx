"use client";

/**
 * Formulir editor berita.
 *
 * Dipakai untuk membuat berita baru maupun menyunting berita yang sudah ada.
 * Status ditentukan di server: aksi publish tetap memakai permission
 * `news:publish`.
 */
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/lib/actions/result";
import { NewsStatus } from "@/generated/prisma/enums";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Menyimpan..." : label}
    </Button>
  );
}

export type NewsEditorValues = {
  id?: string;
  title: string;
  excerpt: string;
  body: string;
  categoryId: string;
  status: string;
};

export function NewsEditorForm({
  initial,
  categories,
  action,
  submitLabel = "Simpan berita",
  cancelHref = "/admin/konten",
}: {
  initial: NewsEditorValues;
  categories: { id: string; name: string }[];
  action: (
    prev: unknown,
    formData: FormData,
  ) => Promise<ActionResult<{ id: string; slug: string }>>;
  submitLabel?: string;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState(action, {
    ok: false,
    error: { code: "BAD_REQUEST", message: "" },
  } as ActionResult<{ id: string; slug: string }>);

  const error = state.ok ? "" : state.error.message;

  return (
    <form action={formAction} className="space-y-4">
      {initial.id ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title">Judul</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={initial.title}
            placeholder="Judul berita"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Kategori</Label>
          <Select name="categoryId" defaultValue={initial.categoryId || "none"}>
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tanpa kategori</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={initial.status}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NewsStatus.DRAFT}>Draf</SelectItem>
              <SelectItem value={NewsStatus.PUBLISHED}>Terbit</SelectItem>
              <SelectItem value={NewsStatus.ARCHIVED}>Diarsipkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="excerpt">Ringkasan</Label>
        <Input
          id="excerpt"
          name="excerpt"
          defaultValue={initial.excerpt}
          placeholder="Ringkasan singkat yang tampil di daftar berita"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">Isi Berita</Label>
        <Textarea
          id="body"
          name="body"
          rows={12}
          required
          defaultValue={initial.body}
          placeholder="Isi berita. Paragraf dipisahkan satu baris kosong."
        />
        <p className="text-xs text-dashboard-text-muted">
          Paragraf dipisahkan satu baris kosong. Baris yang diawali{" "}
          <code className="font-mono">- </code> menjadi butir daftar.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-dashboard-danger">
          {error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="text-xs text-dashboard-success">
          Berita berhasil disimpan.
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <SubmitButton label={submitLabel} />
        <Button asChild variant="outline" size="sm">
          <a href={cancelHref}>Batal</a>
        </Button>
      </div>
    </form>
  );
}

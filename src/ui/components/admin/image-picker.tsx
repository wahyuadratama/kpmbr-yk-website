"use client";

/**
 * Pemilih gambar sampul — dipakai bersama oleh seluruh form CMS.
 *
 * Cara kerja:
 * 1. Pengguna memilih berkas lokal.
 * 2. Berkas diunggah ke `POST /api/files` (validasi MIME, ukuran, dan magic
 *    bytes dilakukan di server). Level aksesnya `PUBLIC` karena gambar sampul
 *    sengaja ditampilkan di halaman publik.
 * 3. Id berkas disimpan pada input tersembunyi, lalu ikut terkirim bersama
 *    form utama.
 *
 * Pratinjau memakai `/api/files/<id>`, yang tersedia untuk berkas `PUBLIC`
 * dan sudah mengizinkan akses dari sesi management.
 */
import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";

export type PickedImage = {
  id: string;
  /** URL pratinjau. */
  url: string;
  altText: string;
};

export function ImagePicker({
  name,
  initial,
  label = "Gambar sampul",
  hint = "JPG, PNG, WebP, atau AVIF. Maksimal 8 MB.",
  disabled = false,
}: {
  /** Nama field input tersembunyi, mis. `coverFileId`. */
  name: string;
  /** Berkas yang sudah terlampir, bila ada. */
  initial?: PickedImage | null;
  label?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const [picked, setPicked] = React.useState<PickedImage | null>(initial ?? null);
  const [altText, setAltText] = React.useState(initial?.altText ?? "");
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("accessLevel", "PUBLIC");
      body.append("kind", "IMAGE");
      body.append("altText", altText);

      const res = await fetch("/api/files", { method: "POST", body });
      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message ?? "Gagal mengunggah gambar.");
        return;
      }

      setPicked({
        id: json.file.id,
        url: `/api/files/${json.file.id}`,
        altText,
      });
    } catch {
      setError("Terjadi kesalahan saat mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={`${name}-file`}>{label}</Label>

      <input type="hidden" name={name} value={picked?.id ?? ""} />

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-lg border border-dashboard-border bg-dashboard-canvas">
          {picked ? (
            <>
              <Image
                src={picked.url}
                alt={picked.altText || "Pratinjau gambar sampul"}
                fill
                sizes="112px"
                className="object-cover"
              />
            </>
          ) : (
            <span className="grid size-full place-items-center text-dashboard-text-muted">
              <ImagePlus aria-hidden="true" className="size-5" />
            </span>
          )}
        </div>

        <div className="min-w-[220px] flex-1 space-y-2">
          <input
            id={`${name}-file`}
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={disabled || uploading}
            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-dashboard-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-dashboard-primary/90"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          <Input
            value={altText}
            onChange={(event) => {
              setAltText(event.target.value);
              setPicked((current) => (current ? { ...current, altText: event.target.value } : current));
            }}
            placeholder="Teks alternatif (deskripsi gambar)"
            aria-label="Teks alternatif gambar"
            disabled={disabled}
          />

          <div className="flex items-center gap-2">
            {uploading ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                Mengunggah...
              </span>
            ) : null}
            {picked && !uploading ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setPicked(null);
                  setAltText("");
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <Trash2 aria-hidden="true" />
                Hapus gambar
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-dashboard-danger">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-dashboard-text-muted">{hint}</p>
    </div>
  );
}

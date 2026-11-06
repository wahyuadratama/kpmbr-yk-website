"use client";

/**
 * Formulir aksi tabel di portal internal.
 *
 * Kenapa komponen ini ada:
 *
 * 1. Server Component TIDAK boleh mengoper event handler ke Client Component
 *    ("Event handlers cannot be passed to Client Component props"). Jadi
 *    `onSubmit` untuk konfirmasi harus berada di Client Component.
 * 2. Pemanggilan Server Action pada Server Component harus lewat
 *    `<form action={...}>`, bukan `onClick` — `onClick` dengan closure inline
 *    membuat render halaman gagal dengan status 500.
 *
 * Komponen ini menggabungkan keduanya: form yang memanggil Server Action,
 * dengan konfirmasi sebelum dikirim.
 */
import * as React from "react";
import { Button } from "@/ui/components/ui/button";

type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";
type ButtonSize = "default" | "xs" | "sm" | "lg";

export type ConfirmActionFormProps = {
  /**
   * Server Action yang dijalankan. Harus berupa referensi fungsi Server
   * Action — bukan closure inline.
   */
  action: (formData: FormData) => void | Promise<void>;
  /** Nilai id yang dikirim sebagai field `id`. */
  id: string;
  /** Field tambahan, mis. `status` atau `progress`. */
  fields?: Record<string, string>;
  /** Pesan konfirmasi. Kosongkan untuk aksi tanpa konfirmasi. */
  confirmMessage?: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Tampilkan pemisah antaraksi di dalam sel tabel. */
  className?: string;
};

export function ConfirmActionForm({
  action,
  id,
  fields,
  confirmMessage,
  children,
  variant = "destructive",
  size = "sm",
  className,
}: ConfirmActionFormProps) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      {fields
        ? Object.entries(fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))
        : null}
      <Button type="submit" size={size} variant={variant}>
        {children}
      </Button>
    </form>
  );
}

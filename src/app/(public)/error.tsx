"use client";

import * as React from "react";
import { ErrorState } from "@/ui/components/ui/empty-state";

/**
 * Error boundary untuk seluruh website publik.
 * Menampilkan pesan yang bisa ditindaklanjuti, tanpa membocorkan detail
 * internal (stack trace, nama tabel, kredensial).
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Catat di sisi klien untuk keperluan debugging. Detail server tetap
    // terlihat lewat log platform, bukan melalui pesan di layar pengguna.
    console.error("Kesalahan pada halaman publik:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <ErrorState
        title="Halaman gagal dimuat"
        description="Terjadi kesalahan yang tidak terduga. Coba muat ulang halaman ini."
      />
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}
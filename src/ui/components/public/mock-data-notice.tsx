import * as React from "react";
import { cn } from "cn";
import { FlaskConical } from "lucide-react";

/**
 * Penanda bahwa isi halaman memakai data contoh, bukan data produksi.
 *
 * REQUIREMENT §40: "Data boleh menggunakan mock data. Jangan menganggap mock
 * data sebagai production data." Banner ini membuat status tersebut terlihat
 * oleh Pengembang, editor, dan pengulas.
 *
 * Hapus komponen ini beserta data seed di `prisma/seed.ts` setelah organisasi
 * menyediakan data asli.
 */
export function MockDataNotice({
  scope,
  className,
}: {
  /** Cakupan data contoh, mis. "berita, agenda, dan program kerja". */
  scope: string;
  className?: string;
}) {
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/8 px-3 py-2.5 text-xs leading-relaxed text-warning-foreground",
        className,
      )}
    >
      <FlaskConical aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span>
        <span className="font-medium">Data contoh.</span> Isi {scope} pada
        halaman ini masih placeholder dan belum merujuk pada data KPMBR-YK yang
        sebenarnya.
      </span>
    </p>
  );
}
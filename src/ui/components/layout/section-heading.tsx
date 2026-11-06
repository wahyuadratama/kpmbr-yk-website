import * as React from "react";
import { cn } from "cn";

type SectionHeadingProps = {
  /** Label kecil di atas judul, mis. "Program Kerja". */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Aksi di sisi kanan, mis. link "Lihat semua". */
  action?: React.ReactNode;
  align?: "left" | "center";
  /** Heading level. Halaman hanya boleh punya satu `h1`. */
  as?: "h1" | "h2" | "h3";
  className?: string;
};

/**
 * Judul seksi yang konsisten. `align="center"` dipakai pada bagian yang
 * di tengah halaman; default `left` untuk menjaga alur baca.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <Heading className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </Heading>
        {description ? (
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
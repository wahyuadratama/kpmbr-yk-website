import Link from "next/link";
import { cn } from "cn";
import { siteConfig } from "@/lib/site-config";

type BrandProps = {
  /** `mark` untuk sidebar/footer ringkas, `full` untuk lockup lengkap. */
  variant?: "full" | "mark";
  className?: string;
  /** Dipakai saat logo sudah tersedia sebagai gambar (belum ada aset brand). */
  href?: string;
};

/**
 * Lockup teks organisasi.
 *
 * Nama diambil dari `siteConfig` (lihat `ORGANIZATION` di `src/lib/site-config.ts`)
 * supaya tidak ada nama organisasi yang ditulis harfiah di komponen.
 *
 * Logo resmi belum ditetapkan oleh organisasi — lihat REQUIRES DECISION di
 * docs/design-system.md § 11. Selama belum ada, lockup teks dipakai sebagai
 * identitas, dan dapat diganti dengan aset logo resmi saat tersedia.
 */
export function Brand({ variant = "full", className, href = "/" }: BrandProps) {
  const content =
    variant === "mark" ? (
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold tracking-tight text-primary-foreground"
      >
        K
      </span>
    ) : (
      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold tracking-tight">
          {siteConfig.name}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          {siteConfig.fullName}
        </span>
      </span>
    );

  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} — beranda`}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {content}
    </Link>
  );
}
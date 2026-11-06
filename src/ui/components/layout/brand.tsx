import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { siteConfig } from "@/shared/site-config";
import logo from "@/assets/kpmbr-logo.png";

type BrandProps = {
  /** `mark` hanya logo (sidebar/footer ringkas), `full` logo + nama. */
  variant?: "full" | "mark";
  className?: string;
  href?: string;
  /**
   * Tandai `true` untuk logo yang berada di atas lipatan (header). Hanya satu
   * instance yang boleh diberi prioritas agar tidak-request ganda.
   */
  priority?: boolean;
};

/**
 * Lockup identitas organisasi: logo resmi + nama dari `siteConfig`.
 *
 * Nama diambil dari `siteConfig` (lihat `ORGANIZATION` di `src/lib/site-config.ts`)
 * supaya tidak ada nama organisasi yang ditulis harfiah di komponen.
 *
 * Aset logo dihasilkan oleh `scripts/build-brand-assets.ts` dari
 * `src/assets/kpmbr-logo-source.png`. Ganti berkas sumbernya bila organisasi
 * memberikan logo revisi, lalu jalankan ulang script tersebut — tidak perlu
 * menyentuh komponen ini.
 */
export function Brand({ variant = "full", className, href = "/", priority = false }: BrandProps) {
  // Logo sudah dipotong rapi pada kanvas persegi transparan oleh pipeline
  // aset, jadi tidak perlu menambahkan border-radius secara manual.
  const mark = (
    <Image
      src={logo}
      alt=""
      width={192}
      height={192}
      priority={priority}
      // Tanpa `sizes`, next/image mengira lebar gambar adalah 100vw dan
      // mengunduh versi yang jauh lebih besar dari yang ditampilkan.
      sizes="40px"
      className={cn("shrink-0", variant === "mark" ? "size-9" : "size-10")}
    />
  );

  const content =
    variant === "mark" ? (
      mark
    ) : (
      <>
        {mark}
        <span className="flex flex-col leading-none">
          <span className="text-base font-semibold tracking-tight">
            {siteConfig.name}
          </span>
          <span className="mt-1 hidden text-xs text-muted-foreground sm:block">
            {siteConfig.fullName}
          </span>
        </span>
      </>
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

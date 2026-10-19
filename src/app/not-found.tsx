import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { flattenNavLinks, publicNav } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: false },
};

/** 404 untuk seluruh situs. */
export default function NotFound() {
  // Semua tautan navbar diratakan supaya pengunjung 404 tetap punya jalan
  // menuju halaman yang benar-benar ada.
  const suggestions = flattenNavLinks(publicNav).slice(1, 8);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Error 404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Alamat yang Anda buka tidak tersedia, sudah dipindahkan, atau memang
        tidak pernah ada.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="h-11 px-5">
          <Link href="/">Kembali ke beranda</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 px-5">
          <Link href="/kontak">Laporkan tautan rusak</Link>
        </Button>
      </div>

      <nav aria-label="Halaman lain" className="mt-12 w-full">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Mungkin kamu mencari
        </p>
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors outline-none hover:border-brand/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
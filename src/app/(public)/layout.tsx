import * as React from "react";
import { SiteFooter } from "@/ui/components/layout/site-footer";
import { SiteHeader } from "@/ui/components/layout/site-header";

/**
 * Layout website publik.
 *
 * Route group `(public)` tidak menambah prefix URL, sehingga
 * `(public)/page.tsx` → `/` dan `(public)/berita/page.tsx` → `/berita`.
 *
 * Layout ini TIDAK dipakai oleh portal internal (/admin, /pengurus, /member,
 * /alumni) maupun halaman login, karena masing-masing punya chrome sendiri.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#konten-utama" className="skip-link">
        Lewati ke konten utama
      </a>
      <SiteHeader />
      <main id="konten-utama" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
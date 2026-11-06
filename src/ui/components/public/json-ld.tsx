import * as React from "react";

/**
 * Sematkan data terstruktur JSON-LD ke halaman.
 *
 * Isi `data` selalu berasal dari server (query atau config), bukan dari input
 * pengguna di browser, dan di-render lewat `<script type="application/ld+json">`
 * sehingga isinya tidak di-escape sebagai HTML. Tanda `<` diganti agar aman
 * kalau nanti ada nilai yang memuat karakter tersebut.
 */
export function JsonLd({
  type,
  data,
}: {
  /** `@type` JSON-LD, mis. `NewsArticle`, `Organization`, `Event`. */
  type: string;
  data: Record<string, unknown>;
}) {
  const json = JSON.stringify({ "@context": "https://schema.org", "@type": type, ...data })
    .replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // Data sudah diserialisasi di server dan tidak berasal dari input pengguna.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
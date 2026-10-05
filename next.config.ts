import type { NextConfig } from "next";

/**
 * Host aset gambar yang boleh di-optimasi `next/image`.
 *
 * Aset publik disimpan di Cloudflare R2, jadi hostnya berasal dari
 * `R2_PUBLIC_URL`. Kalau env itu kosong (seperti pada pengembangan awal),
 * daftar di bawah kosong dan `next/image` hanya boleh memuat aset lokal —
 * komponen akan jatuh ke placeholder gradient sampai URL publik diisi.
 */
function r2RemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const base = process.env.R2_PUBLIC_URL?.trim();
  if (!base) return [];

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    console.warn(
      `[next.config] R2_PUBLIC_URL bukan URL yang valid, remotePatterns dilewati: ${base}`,
    );
    return [];
  }

  return [
    {
      protocol: url.protocol.replace(":", "") as "https" | "http",
      hostname: url.hostname,
      port: url.port,
      pathname: "/**",
    },
  ];
}

const nextConfig: NextConfig = {
  experimental: {
    // Mengaktifkan `forbidden()` / `unauthorized()` dari `next/navigation`,
    // sehingga penolakan akses menghasilkan status HTTP 403/401 sungguhan
    // lewat `src/app/forbidden.tsx` — bukan halaman error 500.
    authInterrupts: true,
  },
  images: {
    remotePatterns: r2RemotePatterns(),
    // AVIF lalu WebP: hemat bandwidth, dan browser lama tetap dapat WebP.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [64, 96, 128, 192, 256, 384],
    // Gambar organisasi jarang berubah, jadi cache optimizer cukup lama.
    minimumCacheTTL: 86400,
  },
};

export default nextConfig;

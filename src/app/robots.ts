import type { MetadataRoute } from "next";
import { siteConfig } from "@/shared/site-config";

/**
 * robots.txt.
 *
 * Portal internal dikecualikan agar tidak pernah terindeks. Verifikasi kartu
 * anggota digital juga dikecualikan karena halaman tersebut menampilkan status
 * validitas kartu.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/pengurus",
          "/member",
          "/alumni",
          "/api/",
          "/member-card/",
          "/login",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
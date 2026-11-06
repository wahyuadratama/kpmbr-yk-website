import type { MetadataRoute } from "next";
import { siteConfig } from "@/shared/site-config";
import { getNewsSlugs, getPublishedNews } from "@/server/modules/news/queries";
import { getEventSlugs } from "@/server/modules/events/queries";
import { getProgramSlugs } from "@/server/modules/programs/queries";
import { getAlbumSlugs } from "@/server/modules/documentation/queries";

/**
 * Sitemap XML otomatis, sumbernya database.
 *
 * Hanya halaman publik yang dimasukkan. Portal internal (/admin, /pengurus,
 * /member, /alumni) tidak boleh terindeks — lihat docs/sitemap.md § 6.
 * Semua query sudah menyaring baris yang belum terbit, jadi halaman draf tidak
 * pernah bocor lewat sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const [news, newsSlugs, eventSlugs, programSlugs, albumSlugs] = await Promise.all([
    getPublishedNews(),
    getNewsSlugs(),
    getEventSlugs(),
    getProgramSlugs(),
    getAlbumSlugs(),
  ]);

  const publishedAt = new Map(news.map((article) => [article.slug, article.publishedAt]));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/berita`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/tentang`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/kepengurusan`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/proker`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/agenda`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/dokumentasi`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/keanggotaan`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/kontak`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  const newsRoutes: MetadataRoute.Sitemap = newsSlugs.map((slug) => ({
    url: `${base}/berita/${slug}`,
    lastModified: new Date(publishedAt.get(slug) ?? now),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const programRoutes: MetadataRoute.Sitemap = programSlugs.map((slug) => ({
    url: `${base}/proker/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const eventRoutes: MetadataRoute.Sitemap = eventSlugs.map((slug) => ({
    url: `${base}/agenda/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const albumRoutes: MetadataRoute.Sitemap = albumSlugs.map((slug) => ({
    url: `${base}/dokumentasi/${slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...newsRoutes, ...programRoutes, ...eventRoutes, ...albumRoutes];
}

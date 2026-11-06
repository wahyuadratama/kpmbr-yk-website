/**
 * Model baca terpadu untuk daftar "Semua Konten" di dashboard admin.
 *
 * Satu query ini menggabungkan lima jenis konten (berita, pengumuman,
 * program kerja, agenda, dokumentasi) menjadi satu daftar seragam. Tujuannya
 * agar pengelola bisa memantau seluruh konten publik dari satu halaman
 * alih-alih membuka lima modul terpisah.
 *
 * Penyaringan dan pengurutan tetap dilakukan di server lewat query string,
 * sehingga URL dapat dibagikan dan tidak memerlukan JavaScript.
 */
import { db } from "@/server/db/prisma";
import {
  AnnouncementAudience,
  AnnouncementPriority,
  EventStatus,
  NewsStatus,
  ProgramStatus,
} from "@/generated/prisma/enums";

export type ContentKind = "berita" | "pengumuman" | "proker" | "agenda" | "dokumentasi";

export type ContentRow = {
  id: string;
  kind: ContentKind;
  title: string;
  /** Keterangan pendukung: kategori, divisi, lokasi, atau jumlah foto. */
  subtitle: string;
  /** Label status untuk badge. */
  status: string;
  /** Nada badge: success / warning / danger / info / neutral. */
  tone: "success" | "warning" | "danger" | "info" | "neutral";
  /** Pembuat atau penanggung jawab. */
  author: string;
  date: Date;
  /** Alamat halaman pengelolaan. Kosong bila belum ada halaman suntingan. */
  editHref: string | null;
};

export const CONTENT_KINDS: { key: ContentKind; label: string }[] = [
  { key: "berita", label: "Berita" },
  { key: "pengumuman", label: "Pengumuman" },
  { key: "proker", label: "Program Kerja" },
  { key: "agenda", label: "Agenda" },
  { key: "dokumentasi", label: "Dokumentasi" },
];

const NEWS_STATUS: Record<NewsStatus, { label: string; tone: ContentRow["tone"] }> = {
  DRAFT: { label: "Draf", tone: "warning" },
  PUBLISHED: { label: "Terbit", tone: "success" },
  ARCHIVED: { label: "Diarsipkan", tone: "neutral" },
};

const EVENT_STATUS: Record<EventStatus, { label: string; tone: ContentRow["tone"] }> = {
  DRAFT: { label: "Draf", tone: "warning" },
  TERJADWAL: { label: "Terjadwal", tone: "info" },
  BERLANGSUNG: { label: "Berlangsung", tone: "info" },
  SELESAI: { label: "Selesai", tone: "neutral" },
  DIBATALKAN: { label: "Dibatalkan", tone: "danger" },
};

const PROGRAM_STATUS: Record<ProgramStatus, { label: string; tone: ContentRow["tone"] }> = {
  DRAFT: { label: "Draf", tone: "warning" },
  DIRANCANG: { label: "Dirancang", tone: "info" },
  BERJALAN: { label: "Berjalan", tone: "success" },
  SELESAI: { label: "Selesai", tone: "neutral" },
  DIBATALKAN: { label: "Dibatalkan", tone: "danger" },
};

const PRIORITY: Record<AnnouncementPriority, { label: string; tone: ContentRow["tone"] }> = {
  NORMAL: { label: "Biasa", tone: "neutral" },
  PENTING: { label: "Penting", tone: "warning" },
  MENDESAK: { label: "Mendekat", tone: "danger" },
};

const AUDIENCE: Record<AnnouncementAudience, string> = {
  PUBLIC: "Publik",
  ANGGOTA: "Anggota",
  ALUMNI: "Alumni",
  PENGURUS: "Pengurus",
};

/** Batas baris yang diambil per jenis sebelum digabung dan dipaginasi. */
const FETCH_LIMIT = 200;

/**
 * Daftar seluruh konten untuk halaman "Semua Konten".
 *
 * `kind` membatasi jenis yang ditampilkan; `null` berarti semua jenis.
 */
export async function listAllContent({
  kind = null,
  q = "",
  page = 1,
  size = 15,
}: {
  kind?: ContentKind | null;
  q?: string;
  page?: number;
  size?: number;
} = {}): Promise<{
  items: ContentRow[];
  total: number;
  page: number;
  size: number;
  pages: number;
}> {
  const query = q.trim().toLowerCase();
  const match = (title: string) => (query ? title.toLowerCase().includes(query) : true);

  const [news, announcements, programs, events, albums] = await Promise.all([
    kind === null || kind === "berita"
      ? db.news.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: FETCH_LIMIT,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            publishedAt: true,
            authorName: true,
            category: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    kind === null || kind === "pengumuman"
      ? db.announcement.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: FETCH_LIMIT,
          select: {
            id: true,
            title: true,
            priority: true,
            audience: true,
            publishedAt: true,
            createdBy: { select: { email: true } },
          },
        })
      : Promise.resolve([]),
    kind === null || kind === "proker"
      ? db.program.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: FETCH_LIMIT,
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
            divisionName: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
    kind === null || kind === "agenda"
      ? db.event.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: FETCH_LIMIT,
          select: {
            id: true,
            title: true,
            status: true,
            startsAt: true,
            location: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    kind === null || kind === "dokumentasi"
      ? db.documentationAlbum.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: FETCH_LIMIT,
          select: {
            id: true,
            title: true,
            eventDate: true,
            createdAt: true,
            _count: { select: { items: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const rows: ContentRow[] = [];

  for (const item of news) {
    if (!match(item.title)) continue;
    const status = NEWS_STATUS[item.status];
    rows.push({
      id: item.id,
      kind: "berita",
      title: item.title,
      subtitle: item.category?.name ?? "Tanpa kategori",
      status: status.label,
      tone: status.tone,
      author: item.authorName,
      date: item.publishedAt ?? item.createdAt,
      editHref: `/admin/konten/berita/${item.id}`,
    });
  }

  for (const item of announcements) {
    if (!match(item.title)) continue;
    const priority = PRIORITY[item.priority];
    rows.push({
      id: item.id,
      kind: "pengumuman",
      title: item.title,
      subtitle: AUDIENCE[item.audience],
      status: priority.label,
      tone: priority.tone,
      author: item.createdBy?.email ?? "Sistem",
      date: item.publishedAt,
      editHref: `/admin/konten/pengumuman/${item.id}`,
    });
  }

  for (const item of programs) {
    if (!match(item.name)) continue;
    const status = PROGRAM_STATUS[item.status];
    rows.push({
      id: item.id,
      kind: "proker",
      title: item.name,
      subtitle: `${item.divisionName} · ${item.progress}%`,
      status: status.label,
      tone: status.tone,
      author: "Sekretariat",
      date: item.updatedAt,
      editHref: `/admin/proker`,
    });
  }

  for (const item of events) {
    if (!match(item.title)) continue;
    const status = EVENT_STATUS[item.status];
    rows.push({
      id: item.id,
      kind: "agenda",
      title: item.title,
      subtitle: item.location,
      status: status.label,
      tone: status.tone,
      author: "Sekretariat",
      date: item.startsAt,
      editHref: `/admin/agenda`,
    });
  }

  for (const item of albums) {
    if (!match(item.title)) continue;
    rows.push({
      id: item.id,
      kind: "dokumentasi",
      title: item.title,
      subtitle: `${item._count.items} foto`,
      status: "Album",
      tone: "neutral",
      author: "Sekretariat",
      date: item.eventDate,
      editHref: `/admin/dokumentasi`,
    });
  }

  rows.sort((a, b) => b.date.getTime() - a.date.getTime());

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(page, pages);
  const items = rows.slice((safePage - 1) * size, safePage * size);

  return { items, total, page: safePage, size, pages };
}

/**
 * Query organisasi untuk layer publik: konten statis, struktur kepengurusan,
 * dan angka ringkasan untuk homepage.
 *
 * `organization_contents` memakai satu blok per `key`. Semua blok punya
 * `isPublished`; yang belum terbit tidak boleh tampil.
 */
import { unstable_cache } from "next/cache";
import { PositionLevel } from "@/generated/prisma/enums";
import { db } from "@/lib/db/prisma";
import { parseList, parseParagraphs, parseTitledList } from "@/lib/content/markdown";
import type {
  MembershipBenefit,
  MembershipStep,
  OrgPosition,
  OrgValue,
} from "@/types/public";

/** Kunci konten statis. Dipakai bersama oleh seed dan query. */
export const CONTENT_KEYS = {
  sejarah: "sejarah",
  visi: "visi",
  misi: "misi",
  nilai: "nilai",
  identitas: "identitas",
  divisi: "struktur.divisi",
  persyaratan: "keanggotaan.persyaratan",
  manfaat: "keanggotaan.manfaat",
  langkah: "keanggotaan.langkah",
} as const;

type ContentRow = { title: string; body: string };

async function fetchContent(key: string): Promise<ContentRow | null> {
  const row = await db.organizationContent.findFirst({
    where: { key, isPublished: true },
    select: { title: true, body: true },
  });
  return row;
}

function cachedContent(key: string) {
  return unstable_cache(
    async () => fetchContent(key),
    ["public", "content", key],
    { revalidate: 3600, tags: ["content"] },
  );
}

export const getSejarah = cachedContent(CONTENT_KEYS.sejarah);
export const getIdentitas = cachedContent(CONTENT_KEYS.identitas);

/** Sejarah sebagai daftar paragraf; kosong bila blok belum diisi. */
export const getSejarahParagraphs = unstable_cache(
  async (): Promise<string[]> => {
    const row = await fetchContent(CONTENT_KEYS.sejarah);
    return row ? parseParagraphs(row.body) : [];
  },
  ["public", "content", "sejarah-paragraf"],
  { revalidate: 3600, tags: ["content"] },
);

export const getVisi = unstable_cache(
  async (): Promise<string> => {
    const row = await fetchContent(CONTENT_KEYS.visi);
    return row ? (parseParagraphs(row.body)[0] ?? "") : "";
  },
  ["public", "content", "visi-teks"],
  { revalidate: 3600, tags: ["content"] },
);

export const getMisi = unstable_cache(
  async (): Promise<string[]> => {
    const row = await fetchContent(CONTENT_KEYS.misi);
    return row ? parseList(row.body) : [];
  },
  ["public", "content", "misi-butir"],
  { revalidate: 3600, tags: ["content"] },
);

export const getNilai = unstable_cache(
  async (): Promise<OrgValue[]> => {
    const row = await fetchContent(CONTENT_KEYS.nilai);
    return row ? parseTitledList(row.body) : [];
  },
  ["public", "content", "nilai-butir"],
  { revalidate: 3600, tags: ["content"] },
);

/** Daftar divisi. Falls back ke divisi yang punya program kerja. */
export const getDivisions = unstable_cache(
  async (): Promise<string[]> => {
    const row = await fetchContent(CONTENT_KEYS.divisi);
    if (row) return parseList(row.body);

    const rows = await db.program.findMany({
      where: { deletedAt: null },
      orderBy: { divisionName: "asc" },
      distinct: ["divisionName"],
      select: { divisionName: true },
    });
    return rows.map((item) => item.divisionName);
  },
  ["public", "content", "divisi"],
  { revalidate: 3600, tags: ["content", "programs"] },
);

export const getMembershipRequirements = unstable_cache(
  async (): Promise<string[]> => {
    const row = await fetchContent(CONTENT_KEYS.persyaratan);
    return row ? parseList(row.body) : [];
  },
  ["public", "content", "persyaratan"],
  { revalidate: 3600, tags: ["content"] },
);

export const getMembershipBenefits = unstable_cache(
  async (): Promise<MembershipBenefit[]> => {
    const row = await fetchContent(CONTENT_KEYS.manfaat);
    return row ? parseTitledList(row.body) : [];
  },
  ["public", "content", "man'sfaat"],
  { revalidate: 3600, tags: ["content"] },
);

/** Alur pendaftaran. Nomor langkah mengikuti urutan butir di database. */
export const getMembershipSteps = unstable_cache(
  async (): Promise<MembershipStep[]> => {
    const row = await fetchContent(CONTENT_KEYS.langkah);
    if (!row) return [];
    return parseTitledList(row.body).map((item, index) => ({
      step: index + 1,
      title: item.title,
      description: item.description,
    }));
  },
  ["public", "content", "langkah"],
  { revalidate: 3600, tags: ["content"] },
);

/** Jabatan inti beserta pemegang dan periode berjalan. */
export const getCurrentPositions = unstable_cache(
  async (): Promise<OrgPosition[]> => {
    const rows = await db.positionAssignment.findMany({
      where: {
        isCurrent: true,
        position: {
          isActive: true,
          level: {
            in: [
              PositionLevel.KETUA,
              PositionLevel.WAKIL_KETUA,
              PositionLevel.SEKRETARIS,
              PositionLevel.BENDAHARA,
            ],
          },
        },
        member: { deletedAt: null },
      },
      select: {
        member: { select: { fullName: true } },
        term: { select: { name: true } },
        position: {
          select: {
            code: true,
            name: true,
            description: true,
            level: true,
            sortOrder: true,
          },
        },
      },
    });

    return rows
      .map((row) => ({ row, sortOrder: row.position.sortOrder }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ row }) => ({
        code: row.position.code,
        name: row.position.name,
        holderName: row.member.fullName,
        level: row.position.level as OrgPosition["level"],
        termLabel: row.term?.name ?? "Periode berjalan",
        description: row.position.description ?? "",
      }));
  },
  ["public", "positions", "current"],
  { revalidate: 3600, tags: ["organization"] },
);

/** Periode kepengurusan yang sedang berjalan. */
export const getCurrentTerm = unstable_cache(
  async (): Promise<{ name: string; startDate: string; endDate: string } | null> => {
    const row = await db.organizationTerm.findFirst({
      where: { isCurrent: true },
      orderBy: { startDate: "desc" },
      select: { name: true, startDate: true, endDate: true },
    });
    if (!row) return null;
    return {
      name: row.name,
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
    };
  },
  ["public", "terms", "current"],
  { revalidate: 3600, tags: ["organization"] },
);

/**
 * Angka ringkasan untuk homepage. Semua dihitung dari database; tidak ada
 * angka yang ditulis manual di komponen.
 */
export const getOrganizationStats = unstable_cache(
  async (): Promise<{
    newsCount: number;
    eventCount: number;
    activeProgramCount: number;
    albumCount: number;
    memberCount: number;
  }> => {
    const [newsCount, eventCount, activeProgramCount, albumCount, memberCount] =
      await Promise.all([
        db.news.count({
          where: {
            deletedAt: null,
            status: "PUBLISHED",
            publishedAt: { not: null },
          },
        }),
        db.event.count({
          where: {
            deletedAt: null,
            status: { in: ["TERJADWAL", "BERLANGSUNG"] },
          },
        }),
        db.program.count({
          where: { deletedAt: null, status: { in: ["DIRANCANG", "BERJALAN"] } },
        }),
        db.documentationAlbum.count({ where: { deletedAt: null } }),
        db.member.count({ where: { deletedAt: null } }),
      ]);

    return { newsCount, eventCount, activeProgramCount, albumCount, memberCount };
  },
  ["public", "stats"],
  { revalidate: 3600, tags: ["news", "events", "programs", "documentation"] },
);

/** Pengumuman publik yang belum kedaluwarsa. */
export const getPublicAnnouncements = unstable_cache(
  async (): Promise<{ id: string; title: string; body: string[] }[]> => {
    const now = new Date();
    const rows = await db.announcement.findMany({
      where: {
        deletedAt: null,
        audience: "PUBLIC",
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
      take: 3,
      select: { id: true, title: true, body: true },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      body: parseParagraphs(row.body),
    }));
  },
  ["public", "announcements"],
  { revalidate: 600, tags: ["announcements"] },
);

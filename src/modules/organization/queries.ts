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
import { slugify } from "@/lib/utils/format";
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
 * Seluruh periode kepengurusan, terbaru lebih dulu.
 *
 * `slug` diturunkan dari `name` memakai `slugify()` supaya URL periode stabil
 * dan bebas karakter khusus.
 */
export const getOrganizationTerms = unstable_cache(
  async (): Promise<
    {
      id: string;
      name: string;
      slug: string;
      startDate: string;
      endDate: string;
      isCurrent: boolean;
    }[]
  > => {
    const rows = await db.organizationTerm.findMany({
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isCurrent: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: slugify(row.name),
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      isCurrent: row.isCurrent,
    }));
  },
  ["public", "terms", "list"],
  { revalidate: 3600, tags: ["organization"] },
);

/**
 * Satu periode beserta jabatan yang dipegang pada periode tersebut.
 *
 * Mengembalikan `null` bila periode tidak ada — pemanggil yang memutuskan
 * `notFound()`. Penugasan diambil dari `position_assignments`, sehingga riwayat
 * kepengurusan tetap dapat ditelusuri meski periode sudah berakhir.
 */
export const getTermBySlug = unstable_cache(
  async (
    slug: string,
  ): Promise<{
    name: string;
    slug: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    assignments: {
      positionName: string;
      positionCode: string;
      positionDescription: string;
      holderName: string;
      memberCode: string;
      startDate: string;
      endDate: string | null;
    }[];
  } | null> => {
    const terms = await db.organizationTerm.findMany({
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isCurrent: true,
      },
    });
    const term = terms.find((item) => slugify(item.name) === slug);
    if (!term) return null;

    const assignments = await db.positionAssignment.findMany({
      where: { termId: term.id },
      orderBy: { position: { sortOrder: "asc" } },
      select: {
        startDate: true,
        endDate: true,
        position: {
          select: { code: true, name: true, description: true },
        },
        member: { select: { fullName: true, memberCode: true } },
      },
    });

    return {
      name: term.name,
      slug,
      startDate: term.startDate.toISOString(),
      endDate: term.endDate.toISOString(),
      isCurrent: term.isCurrent,
      assignments: assignments.map((assignment) => ({
        positionName: assignment.position.name,
        positionCode: assignment.position.code,
        positionDescription: assignment.position.description ?? "",
        holderName: assignment.member.fullName,
        memberCode: assignment.member.memberCode,
        startDate: assignment.startDate.toISOString(),
        endDate: assignment.endDate ? assignment.endDate.toISOString() : null,
      })),
    };
  },
  ["public", "terms", "bySlug"],
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


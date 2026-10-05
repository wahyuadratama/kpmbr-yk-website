/**
 * Query program kerja untuk layer publik.
 *
 * Program `DRAFT` tidak ditampilkan. Progres dibatasi pada 0/25/50/75/100
 * (lihat `prisma/schema.prisma`); nilai lain dipetakan ke langkah terdekat
 * supaya UI tidak pernah menampilkan persen yang tidak lazim.
 */
import { unstable_cache } from "next/cache";
import { ProgramStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db/prisma";
import { formatTanggalPendek } from "@/lib/utils/format";
import type { ProgramProgress, WorkProgram } from "@/types/public";

const PUBLIC_STATUS = [
  ProgramStatus.DIRANCANG,
  ProgramStatus.BERJALAN,
  ProgramStatus.SELESAI,
  ProgramStatus.DIBATALKAN,
] as const;

const STEPS: ProgramProgress[] = [0, 25, 50, 75, 100];

/** Nilai progres terdekat dari 0/25/50/75/100. */
export function toProgramProgress(value: number): ProgramProgress {
  let closest: ProgramProgress = 0;
  for (const step of STEPS) {
    if (Math.abs(step - value) < Math.abs(closest - value)) closest = step;
  }
  return closest;
}

/** Label timeline dari tanggal mulai dan selesai. */
export function formatTimeline(
  startDate: Date | null,
  endDate: Date | null,
): string {
  if (startDate && endDate) {
    return `${formatTanggalPendek(startDate)} - ${formatTanggalPendek(endDate)}`;
  }
  if (startDate) return `Sejak ${formatTanggalPendek(startDate)}`;
  if (endDate) return `Sampai ${formatTanggalPendek(endDate)}`;
  return "Belum ditetapkan";
}

const SELECT = {
  slug: true,
  name: true,
  description: true,
  objective: true,
  divisionName: true,
  status: true,
  progress: true,
  startDate: true,
  endDate: true,
  picMember: { select: { fullName: true } },
} as const;

type ProgramRow = {
  slug: string;
  name: string;
  description: string;
  objective: string;
  divisionName: string;
  status: ProgramStatus;
  progress: number;
  startDate: Date | null;
  endDate: Date | null;
  picMember: { fullName: string } | null;
};

export function toWorkProgram(row: ProgramRow): WorkProgram {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    objective: row.objective,
    division: row.divisionName,
    picName: row.picMember?.fullName ?? "Belum ditetapkan",
    // Query publik tidak pernah mengambil DRAFT, jadi nilai di sini selalu
    // salah satu dari empat status yang tampil di publik.
    status: row.status as WorkProgram["status"],
    progress: toProgramProgress(row.progress),
    timeline: formatTimeline(row.startDate, row.endDate),
  };
}

/** Daftar program kerja publik. `limit` dipakai homepage untuk 3 teratas. */
export const getPrograms = unstable_cache(
  async (limit?: number): Promise<WorkProgram[]> => {
    const rows = await db.program.findMany({
      where: { deletedAt: null, status: { in: [...PUBLIC_STATUS] } },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      take: limit,
      select: SELECT,
    });
    return rows.map(toWorkProgram);
  },
  ["public", "programs", "list"],
  { revalidate: 600, tags: ["programs"] },
);

export const getProgramBySlug = unstable_cache(
  async (slug: string): Promise<WorkProgram | null> => {
    const row = await db.program.findFirst({
      where: { deletedAt: null, status: { in: [...PUBLIC_STATUS] }, slug },
      select: SELECT,
    });
    return row ? toWorkProgram(row) : null;
  },
  ["public", "programs", "bySlug"],
  { revalidate: 600, tags: ["programs"] },
);

/** Riwayat progres sebuah program, terbaru lebih dulu. */
export const getProgramUpdates = unstable_cache(
  async (slug: string): Promise<{ progress: number; note: string | null; at: string }[]> => {
    const rows = await db.programUpdate.findMany({
      where: { program: { slug, deletedAt: null, status: { in: [...PUBLIC_STATUS] } } },
      orderBy: { createdAt: "desc" },
      select: { progress: true, note: true, createdAt: true },
    });
    return rows.map((row) => ({
      progress: row.progress,
      note: row.note,
      at: row.createdAt.toISOString(),
    }));
  },
  ["public", "programs", "updates"],
  { revalidate: 600, tags: ["programs"] },
);

export const getProgramSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await db.program.findMany({
      where: { deletedAt: null, status: { in: [...PUBLIC_STATUS] } },
      orderBy: { name: "asc" },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  },
  ["public", "programs", "slugs"],
  { revalidate: 3600, tags: ["programs"] },
);

/** Nama divisi yang punya program kerja, untuk ringkasan homepage. */
export const getProgramDivisions = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await db.program.findMany({
      where: { deletedAt: null, status: { in: [...PUBLIC_STATUS] } },
      orderBy: { divisionName: "asc" },
      distinct: ["divisionName"],
      select: { divisionName: true },
    });
    return rows.map((row) => row.divisionName);
  },
  ["public", "programs", "divisions"],
  { revalidate: 3600, tags: ["programs"] },
);
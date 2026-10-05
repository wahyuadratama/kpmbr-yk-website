/**
 * Tipe domain untuk layer publik.
 * Sengaja terpisah dari tipe generated Prisma agar komponen publik tidak
 * terikat langsung pada bentuk row database. Pada tahap berikutnya, mapper
 * di `src/modules/*` mengubah row Prisma → tipe di bawah.
 */

/** Status program kerja. */
export type ProgramStatus =
  | "DRAFT"
  | "DIRANCANG"
  | "BERJALAN"
  | "SELESAI"
  | "DIBATALKAN";

/** Kemajuan program kerja dalam persen. */
export type ProgramProgress = 0 | 25 | 50 | 75 | 100;

export type NewsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  category: string;
  /** Slug kategori untuk filter di URL, mis. `program-kerja`. */
  categorySlug: string;
  authorName: string;
  publishedAt: string;
  readingMinutes: number;
  coverGradient: string;
  /**
   * URL absolut cover bila sudah ada file publiknya.
   * `null` berarti belum ada aset — pemakai harus render `coverGradient`.
   */
  coverImageUrl: string | null;
  /** Alt text cover; kosong berarti dekoratif. */
  coverImageAlt: string;
  isFeatured: boolean;
};

export type AgendaEvent = {
  slug: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  organizer: string;
  status: "TERJADWAL" | "BERLANGSUNG" | "SELESAI" | "DIBATALKAN";
};

export type WorkProgram = {
  slug: string;
  name: string;
  description: string;
  objective: string;
  division: string;
  picName: string;
  status: ProgramStatus;
  progress: ProgramProgress;
  timeline: string;
};

export type DocAlbum = {
  slug: string;
  title: string;
  description: string;
  eventDate: string;
  photoCount: number;
  accent: string;
};

export type OrgPosition = {
  code: string;
  name: string;
  holderName: string;
  level: "KETUA" | "WAKIL_KETUA" | "SEKRETARIS" | "BENDAHARA";
  termLabel: string;
  description: string;
};

export type OrgValue = {
  title: string;
  description: string;
};

export type MembershipBenefit = {
  title: string;
  description: string;
};

export type MembershipStep = {
  step: number;
  title: string;
  description: string;
};

/** Peta label + warna badge untuk status program kerja. */
export const PROGRAM_STATUS_LABEL: Record<ProgramStatus, string> = {
  DRAFT: "Draf",
  DIRANCANG: "Dirancang",
  BERJALAN: "Berjalan",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

/** Kelas badge untuk status program kerja, memakai token design system. */
export const PROGRAM_STATUS_CLASS: Record<ProgramStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  DIRANCANG: "bg-info/10 text-info border-info/25",
  BERJALAN: "bg-brand-muted text-brand-muted-foreground border-brand/20",
  SELESAI: "bg-success/10 text-success border-success/25",
  DIBATALKAN: "bg-destructive/10 text-destructive border-destructive/25",
};

/** Label status agenda. */
export const EVENT_STATUS_LABEL: Record<AgendaEvent["status"], string> = {
  TERJADWAL: "Terjadwal",
  BERLANGSUNG: "Berlangsung",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export const EVENT_STATUS_CLASS: Record<AgendaEvent["status"], string> = {
  TERJADWAL: "bg-brand-muted text-brand-muted-foreground border-brand/20",
  BERLANGSUNG: "bg-terra/10 text-terra-foreground border-terra/30",
  SELESAI: "bg-muted text-muted-foreground border-border",
  DIBATALKAN: "bg-destructive/10 text-destructive border-destructive/25",
};
/**
 * Direktori Alumni Publik — Stage 5.
 *
 * Hanya menampilkan anggota yang:
 *  - `isDirectoryVisible = true` (opt-in, default false)
 *  - `user.status = ACTIVE`, belum soft-delete
 *  - Sudah lulus (`graduationYear` terisi) atau role ALUMNI
 *
 * Data sensitif (HP, email, alamat) TIDAK ditampilkan publik.
 */
import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { Users } from "lucide-react";
import { db } from "@/server/db/prisma";
import { PageHeader } from "@/ui/components/layout/page-header";
import { Button } from "@/ui/components/ui/button";
import { EmptyState, NoResultsState } from "@/ui/components/ui/empty-state";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";

/**
 * Angka opsional.
 *
 * `z.coerce.number()` mengubah string kosong menjadi `0`, sehingga `?angkatan=`
 * akan menyaringursed angkatan 0 dan membuat halaman kosong tanpa alasan.
 * String kosong diubah menjadi `undefined` sebelum dikonversi.
 */
const optionalNumber = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().int().optional().nullable(),
);

const filterSchema = z.object({
  q: z.string().trim().optional(),
  angkatan: optionalNumber,
  universitas: z.string().trim().optional().nullable(),
  prodi: z.string().trim().optional().nullable(),
  tahunLulus: optionalNumber,
});

/** Batas baris per halaman. */
const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Direktori Alumni",
  description:
    "Direktori anggota KPMBR-YK yang telah lulus dan memilih menampilkannya di direktori publik.",
  alternates: { canonical: "/alumni-direktori" },
};

export default async function AlumniDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = await searchParams;
  const parsed = filterSchema.safeParse(raw);
  const f = parsed.success ? parsed.data : {};
  const hasFilter = Boolean(
    f.q || f.angkatan || f.universitas || f.prodi || f.tahunLulus,
  );

  const where: Record<string, unknown> = {
    deletedAt: null,
    isDirectoryVisible: true,
    user: {
      status: "ACTIVE",
      deletedAt: null,
    },
    OR: [
      { graduationYear: { not: null } },
      { user: { role: "ALUMNI" } },
    ],
  };

  if (f.q) where.fullName = { contains: f.q };
  if (f.angkatan) where.angkatan = f.angkatan;
  if (f.universitas) where.university = { contains: f.universitas };
  if (f.prodi) where.studyProgram = { contains: f.prodi };
  if (f.tahunLulus) where.graduationYear = f.tahunLulus;

  const [members, total] = await Promise.all([
    db.member.findMany({
      where,
      orderBy: [{ angkatan: "desc" }, { fullName: "asc" }],
      take: PAGE_SIZE,
      select: {
        memberCode: true,
        fullName: true,
        nickname: true,
        angkatan: true,
        university: true,
        studyProgram: true,
        graduationYear: true,
        city: true,
      },
    }),
    db.member.count({ where }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Alumni"
        title="Direktori Alumni"
        description="Anggota yang telah lulus dan memilih menampilkan datanya di direktori publik. Nomor telepon dan email tidak ditampilkan di sini."
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section
          aria-label="Saring direktori alumni"
          className="rounded-lg border border-border bg-card p-5"
        >
          <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="q">Cari nama</Label>
              <Input
                id="q"
                name="q"
                className="h-10"
                defaultValue={f.q ?? ""}
                placeholder="Nama anggota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="angkatan">Angkatan</Label>
              <Input
                id="angkatan"
                name="angkatan"
                className="h-10"
                type="number"
                inputMode="numeric"
                defaultValue={f.angkatan?.toString() ?? ""}
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="universitas">Universitas</Label>
              <Input
                id="universitas"
                name="universitas"
                className="h-10"
                defaultValue={f.universitas ?? ""}
                placeholder="Nama kampus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prodi">Prodi</Label>
              <Input
                id="prodi"
                name="prodi"
                className="h-10"
                defaultValue={f.prodi ?? ""}
                placeholder="Program studi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tahunLulus">Tahun lulus</Label>
              <Input
                id="tahunLulus"
                name="tahunLulus"
                className="h-10"
                type="number"
                inputMode="numeric"
                defaultValue={f.tahunLulus?.toString() ?? ""}
                placeholder="2024"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-5">
              <Button type="submit" size="lg" className="h-10">
                Terapkan
              </Button>
              {hasFilter ? (
                <Button asChild variant="outline" size="lg" className="h-10">
                  <Link href="/alumni-direktori">Reset filter</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </section>

        <section aria-labelledby="daftar-alumni" className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="daftar-alumni" className="text-lg font-semibold tracking-tight">
              Daftar alumni
            </h2>
            <p className="text-sm text-muted-foreground">
              {total > 0
                ? `Menampilkan ${members.length} dari ${total} anggota`
                : "Belum ada anggota yang ditampilkan"}
            </p>
          </div>

          {members.length === 0 ? (
            hasFilter ? (
              <NoResultsState query={f.q} />
            ) : (
              <EmptyState
                icon={Users}
                title="Belum ada data alumni"
                description="Direktori terisi setelah anggota yang telah lulus memilih menampilkannya di pengaturan profilnya."
                className="mt-8"
              />
            )
          ) : (
            <>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                  <li
                    key={member.memberCode}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium tracking-tight truncate">
                          {member.fullName}
                        </p>
                        {member.nickname ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {member.nickname}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {member.memberCode}
                      </span>
                    </div>

                    <dl className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
                      {member.angkatan ? (
                        <div className="flex gap-1.5">
                          <dt className="sr-only">Angkatan</dt>
                          <dd>Angkatan {member.angkatan}</dd>
                        </div>
                      ) : null}
                      {member.university ? (
                        <div className="flex gap-1.5">
                          <dt className="sr-only">Perguruan tinggi</dt>
                          <dd className="min-w-0 truncate">{member.university}</dd>
                        </div>
                      ) : null}
                      {member.studyProgram ? (
                        <div className="flex gap-1.5">
                          <dt className="sr-only">Program studi</dt>
                          <dd className="min-w-0 truncate">
                            {member.studyProgram}
                          </dd>
                        </div>
                      ) : null}
                      {member.graduationYear ? (
                        <div className="flex gap-1.5">
                          <dt className="sr-only">Tahun lulus</dt>
                          <dd>Lulus {member.graduationYear}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </li>
                ))}
              </ul>

              {total > members.length ? (
                <p className="mt-6 text-sm text-muted-foreground">
                  Menampilkan {members.length} anggota pertama. Gunakan filter
                  untuk mempersempit pencarian.
                </p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </>
  );
}

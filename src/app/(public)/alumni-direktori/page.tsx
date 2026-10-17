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
import type { Metadata } from "next";
import { z } from "zod";
import { db } from "@/lib/db/prisma";

const filterSchema = z.object({
  q: z.string().trim().optional(),
  angkatan: z.coerce.number().int().optional().nullable(),
  universitas: z.string().trim().optional().nullable(),
  prodi: z.string().trim().optional().nullable(),
  tahunLulus: z.coerce.number().int().optional().nullable(),
});

export const metadata: Metadata = {
  title: "Direktori Alumni",
};

export default async function AlumniDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = await searchParams;
  const parsed = filterSchema.safeParse(raw);
  const f = parsed.success ? parsed.data : {};

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
      orderBy: { fullName: "asc" },
      take: 50,
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
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Direktori Alumni</h1>
        <p className="text-sm text-muted-foreground">
          Data lulusan yang Izin ditampilkan dalam direktori publik. Nomor HP
          dan email tidak tampil di sini.
        </p>
      </section>

      <section className="rounded-lg border p-4">
        <form className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground block">Cari nama</label>
              <input
                name="q"
                defaultValue={f.q ?? ""}
                className="input input-sm w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground block">Angkatan</label>
              <input
                name="angkatan"
                type="number"
                defaultValue={f.angkatan?.toString() ?? ""}
                className="input input-sm w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground block">Universitas</label>
              <input
                name="universitas"
                defaultValue={f.universitas ?? ""}
                className="input input-sm w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground block">Prodi</label>
              <input
                name="prodi"
                defaultValue={f.prodi ?? ""}
                className="input input-sm w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground block">Tahun lulus</label>
              <input
                name="tahunLulus"
                type="number"
                defaultValue={f.tahunLulus?.toString() ?? ""}
                className="input input-sm w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="btn btn-sm"
              >
                Terapkan
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Daftar Alumni ({total})</h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tidak ada data alumni yang cocok dengan filter.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {members.map((m) => (
              <li key={m.memberCode} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">{m.fullName}</p>
                  {m.nickname && (
                    <p className="text-xs text-muted-foreground">
                      “{m.nickname}”
                    </p>
                  )}
                </div>
                <div className="hidden sm:flex flex-col gap-1 text-sm">
                  {m.angkatan && (
                    <span className="text-muted-foreground">Angkatan {m.angkatan}</span>
                  )}
                  {m.university && (
                    <span className="text-muted-foreground">{m.university}</span>
                  )}
                  {m.studyProgram && (
                    <span className="text-muted-foreground">{m.studyProgram}</span>
                  )}
                  {m.graduationYear && (
                    <span className="text-muted-foreground">
                      Lulus {m.graduationYear}
                    </span>
                  )}
                  {m.city && <span className="text-muted-foreground">{m.city}</span>}
                </div>
                <div className="text-right text-xs font-mono text-muted-foreground">
                  {m.memberCode}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

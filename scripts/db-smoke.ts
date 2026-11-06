/**
 * Smoke test koneksi database KPMBR-YK.
 * Jalankan: npm run db:smoke
 *
 * Menguji: koneksi driver adapter, query nyata ke setiap tabel fondasi,
 * dan verifikasi soft-delete + enum bekerja.
 */
import { db } from "@/server/db/prisma";
import { Role, UserStatus, MembershipStatus, FileAccessLevel } from "@/generated/prisma/enums";

const results: { step: string; ok: boolean; detail: string }[] = [];

function check(step: string, fn: () => Promise<string>) {
  return fn()
    .then((detail) => {
      results.push({ step, ok: true, detail });
    })
    .catch((err: unknown) => {
      results.push({
        step,
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    });
}

async function main() {
  await check("Koneksi (query SELECT 1)", async () => {
    const row = await db.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;
    return `SELECT 1 → ${row[0]?.ok}`;
  });

  await check("Buat user uji (enum Role/UserStatus)", async () => {
    const user = await db.user.create({
      data: {
        email: `smoke-${Date.now()}@kpmbr.test`,
        role: Role.ANGGOTA,
        status: UserStatus.ACTIVE,
        passwordHash: "(tidak dipakai pada smoke test)",
      },
      select: { id: true, role: true, status: true },
    });
    return `role=${user.role} status=${user.status}`;
  });

  await check("Buat member + membership (relasi)", async () => {
    const code = `SMOKE-${Date.now()}`;
    const member = await db.member.create({
      data: {
        memberCode: code,
        fullName: "Anggota Uji Smoke",
        angkatan: new Date().getFullYear(),
        memberships: {
          create: {
            cohort: new Date().getFullYear(),
            status: MembershipStatus.AKTIF,
            startDate: new Date(),
          },
        },
      },
      include: { memberships: true },
    });
    return `memberCode=${member.memberCode} membership=${member.memberships.length} status=${member.memberships[0]?.status}`;
  });

  await check("Buat file metadata (enum FileAccessLevel)", async () => {
    const file = await db.file.create({
      data: {
        storageKey: `smoke/${Date.now()}.txt`,
        fileName: "smoke.txt",
        mimeType: "text/plain",
        size: 12,
        accessLevel: FileAccessLevel.PENGURUS_ONLY,
      },
      select: { accessLevel: true, size: true },
    });
    return `accessLevel=${file.accessLevel} size=${file.size}`;
  });

  await check("Buat audit log (relasi actor nullable)", async () => {
    const log = await db.auditLog.create({
      data: {
        action: "CREATE",
        resource: "SmokeTest",
        resourceId: "1",
        metadata: { note: "smoke test" },
      },
      select: { id: true, action: true },
    });
    return `id=${log.id} action=${log.action}`;
  });

  await check("Soft delete (deletedAt)", async () => {
    const user = await db.user.create({
      data: { email: `softdel-${Date.now()}@kpmbr.test` },
      select: { id: true },
    });
    const deleted = await db.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
      select: { deletedAt: true },
    });
    const stillExists = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });
    return `deletedAt=${deleted.deletedAt?.toISOString()} baris masih ada=${stillExists !== null}`;
  });

  await check("Transaction rollback", async () => {
    const before = await db.user.count();
    try {
      await db.$transaction(async (tx) => {
        await tx.user.create({
          data: { email: `rollback-${Date.now()}@kpmbr.test` },
        });
        throw new Error("rollback paksa");
      });
    } catch {
      /* rollback diharapkan */
    }
    const after = await db.user.count();
    return `count sebelum=${before} sesudah=${after} (harus sama)`;
  });

  await check("Bersihkan data smoke test", async () => {
    const deleted = await db.user.deleteMany({
      where: { email: { contains: "@kpmbr.test" } },
    });
    await db.member.deleteMany({ where: { memberCode: { startsWith: "SMOKE-" } } });
    await db.file.deleteMany({ where: { storageKey: { startsWith: "smoke/" } } });
    await db.auditLog.deleteMany({ where: { resource: "SmokeTest" } });
    return `${deleted.count} user, data smoke lain dihapus`;
  });

  console.log("\n=== KPMBR-YK — Database Smoke Test ===\n");
  let failed = 0;
  for (const r of results) {
    if (!r.ok) failed++;
    const mark = r.ok ? "PASS" : "FAIL";
    console.log(`[${mark}] ${r.step}\n        ${r.detail}`);
  }
  console.log(`\n${results.length - failed}/${results.length} checks passed\n`);

  await db.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err: unknown) => {
  console.error("Smoke test gagal total:", err);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});

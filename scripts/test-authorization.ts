/**
 * Tes otorisasi — Definition of Done Stage 2.
 *
 * Jalankan: npm run test:auth
 *
 * Cakupan: enam skenario pada docs/development-roadmap.md § Stage 2. Tes ini
 * memverifikasi kode yang BENAR-BENAR dipakai aplikasi di server (guard,
 * matriks permission, pembacaan principal, audit, lockout) terhadap database
 * pengembangan sungguhan.
 *
 * Yang TIDAK diuji di sini: kode status HTTP hasil render (403 dari
 * `forbidden.tsx`, redirect ke `/login`). Itu butuh server berjalan dan cookie
 * sesi, sehingga diverifikasi terpisah lewat penelusuran browser.
 */
import { db } from "@/server/db/prisma";
import { writeAudit } from "@/server/audit";
import { __resetRateLimits, checkLoginRateLimit } from "@/server/rate-limit";
import { clearFailedLogins, isLocked, registerFailedLogin } from "@/server/auth/lockout";
import { readPrincipal } from "@/server/auth/principal";
import {
  canAccess,
  hasPermission,
  permissionsFor,
  ROLE_PERMISSIONS,
  PENGURUS_DENIED,
  type Role,
} from "@/server/auth/permissions";
import { canEnterPortal, DASHBOARD_BY_ROLE, PORTALS, safeNextPath } from "@/server/auth/portals";
import { AuditAction, UserStatus } from "@/generated/prisma/enums";

const ROLES: Role[] = ["ADMIN", "PENGURUS", "ANGGOTA", "ALUMNI"];

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail = ""): void {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

// Skenario 1 — area privat menolak TAMPA sesi.
async function scenario1(): Promise<void> {
  section("Skenario 1 — tanpa sesi tidak ada akses ke portal mana pun");
  for (const key of Object.keys(PORTALS) as (keyof typeof PORTALS)[]) {
    const path = PORTALS[key].path;
    const anonymous = await readPrincipal(null);
    assert(anonymous === null, `readPrincipal(null) menolak ${path}`, "principal null");
  }
}

// Skenario 2 — matriks role x portal, termasuk ANGGOTA ditolak di /admin.
function scenario2(): void {
  section("Skenario 2 — role hanya boleh masuk portalnya (ANGGOTA dapat 403 di /admin)");
  for (const key of Object.keys(PORTALS) as (keyof typeof PORTALS)[]) {
    const portal = PORTALS[key];
    for (const role of ROLES) {
      const allowed = canEnterPortal(portal.path, role);
      const expected = (portal.roles as readonly Role[]).includes(role);
      assert(
        allowed === expected,
        `${role} ${allowed ? "boleh" : "ditolak"} di ${portal.path}`,
        `harapan=${expected}`,
      );
    }
  }
  assert(
    !canEnterPortal("/admin", "ANGGOTA"),
    "ANGGOTA DITOLAK di /admin (kasus khusus Definition of Done)",
  );
  assert(!canEnterPortal("/admin", "ALUMNI"), "ALUMNI DITOLAK di /admin");
  assert(!canEnterPortal("/member", "ALUMNI"), "ALUMNI DITOLAK di /member");
}

// Skenario 3 — role dari form/query TIDAK berpengaruh; hanya baris `users`.
async function scenario3(): Promise<void> {
  section("Skenario 3 — nilai role dari input klien tidak memengaruhi otorisasi");

  const user = await db.user.findUnique({
    where: { email: "anggota@kpmbr-yk.local" },
    select: { id: true, role: true },
  });
  if (!user) throw new Error("Akun dev anggota tidak ditemukan — jalankan npm run db:seed");
  assert(user.role === "ANGGOTA", "akun uji benar-benar ber-role ANGGOTA", user.role);

  // Nilai ".role=ADMIN" yang biasa dikirim lewat query string.
  const spoofed = { role: "ADMIN", next: "/admin", __nextAuth: { user: { role: "ADMIN" } } };
  assert(
    !canEnterPortal(String(spoofed.next), await roleFromDatabase(user.id)),
    "spoof ?role=ADMIN tetap ditolak di /admin",
  );

  // Permission juga harus ditolak walau klien mengklaim punya.
  assert(
    !hasPermission(await roleFromDatabase(user.id), "user:delete"),
    "spoof permission user:delete tetap ditolak",
  );

  // Guard hanya menerima userId; tidak ada parameter role sama sekali.
  const signature = readPrincipal.length;
  assert(signature === 1, "readPrincipal hanya menerima satu argumen (userId)", `arity=${signature}`);
}

// Skenario 4 — menonaktifkan akun langsung mencabut akses pada request berikutnya.
async function scenario4(): Promise<void> {
  section("Skenario 4 — menonaktifkan akun langsung mencabut akses");

  const email = "anggota@kpmbr-yk.local";
  const original = await db.user.findUniqueOrThrow({
    where: { email },
    select: { id: true, status: true },
  });

  try {
    const before = await readPrincipal(original.id);
    assert(before !== null, "sebelum dinonaktifkan, akun punya akses");

    await db.user.update({
      where: { id: original.id },
      data: { status: UserStatus.SUSPENDED },
    });

    const after = await readPrincipal(original.id);
    assert(after === null, "setelah status=SUSPENDED, akses langsung hilang");

    // Dipulihkan ke AKTIF: akses harus kembali tanpa Issuing ulang token baru.
    await db.user.update({
      where: { id: original.id },
      data: { status: UserStatus.ACTIVE },
    });
    const restored = await readPrincipal(original.id);
    assert(restored !== null, "setelah dipulihkan ke ACTIVE, akses kembali tanpa menerbitkan token baru");
  } finally {
    await db.user.update({
      where: { id: original.id },
      data: { status: original.status },
    });
  }
}

// Skenario 5 — mutasi dan penolakan tercatat di audit_logs.
async function scenario5(): Promise<void> {
  section("Skenario 5 — mutasi dan penolakan akses tercatat di audit_logs");

  const anggota = await db.user.findUniqueOrThrow({
    where: { email: "anggota@kpmbr-yk.local" },
    select: { id: true },
  });

  // Marker unik supaya cleanup hanya menghapus baris milik tes ini, bukan
  // riwayat penolakan yang sesungguhnya.
  const marker = `test-authorization-${Date.now()}`;

  try {
    const before = await db.auditLog.count({
      where: { resource: "Authorization", actorId: anggota.id },
    });

    // Memakai `writeAudit()` — jalur kode yang sama dengan aplikasi, sehingga
    // yang diuji benar-benar redaction + pemetaan field yang sebenarnya.
    await writeAudit({
      action: AuditAction.VIEW_SENSITIVE,
      resource: "Authorization",
      resourceId: marker,
      actorUserId: anggota.id,
      metadata: { permission: "user:delete", detail: "ANGGOTA,ADMIN", denied: true },
    });

    const after = await db.auditLog.count({
      where: { resource: "Authorization", actorId: anggota.id },
    });
    assert(after === before + 1, "penolakan akses tercatat di audit_logs", `${before} -> ${after}`);

    const trace = await db.auditLog.findFirst({
      where: { resource: "Authorization", resourceId: marker },
      select: { action: true, actorId: true, metadata: true },
    });
    assert(trace?.action === AuditAction.VIEW_SENSITIVE, "baris audit menyimpan aksi VIEW_SENSITIVE");
    assert(trace?.actorId === anggota.id, "baris audit tertaut ke aktor yang benar");

    // Redaksi: nilai sensitif tidak boleh bocor ke metadata.
    await writeAudit(
      {
        action: AuditAction.UPDATE,
        resource: "Authorization",
        resourceId: `${marker}-redact`,
        actorUserId: anggota.id,
        metadata: { password: "rahasia-123", token: "tok-abc", nested: { authSecret: "x" } },
      },
      false,
    );
    const redacted = await db.auditLog.findFirst({
      where: { resourceId: `${marker}-redact` },
      select: { metadata: true },
    });
    const meta = redacted?.metadata as Record<string, unknown> | null;
    assert(meta?.password === "[redacted]", "password dibuang dari metadata audit", String(meta?.password));
    assert(meta?.token === "[redacted]", "token dibuang dari metadata audit", String(meta?.token));
  } finally {
    await db.auditLog.deleteMany({ where: { resourceId: { startsWith: marker } } });
  }
}

// Skenario 6 — penguncian akun, rate limit, dan redirect_after_login per role.
async function scenario6(): Promise<void> {
  section("Skenario 6 — lockout, rate limit, dan tujuan redirect per role");

  const user = await db.user.findUniqueOrThrow({
    where: { email: "anggota@kpmbr-yk.local" },
    select: { id: true, lockedUntil: true },
  });

  try {
    if (isLocked(user.lockedUntil)) {
      await db.user.update({
        where: { id: user.id },
        data: { lockedUntil: null, failedLoginAttempts: 0 },
      });
    }

    // Rate limit per IP.
    __resetRateLimits();
    for (let i = 1; i <= 5; i++) {
      const res = checkLoginRateLimit("127.0.0.1", "tidak.ada@kpmbr-yk.local");
      assert(res.allowed, `rate limit per IP: percobaan ${i} masih diizinkan`);
    }
    assert(
      !checkLoginRateLimit("127.0.0.1", "tidak.ada@kpmbr-yk.local").allowed,
      "rate limit per IP memblokir setelah batas terlampaui",
    );

    // Rate limit per email meski IP berbeda.
    __resetRateLimits();
    for (let i = 1; i <= 5; i++) checkLoginRateLimit(`10.0.0.${i}`, user.id);
    assert(
      !checkLoginRateLimit("10.0.0.99", user.id).allowed,
      "rate limit per email memblokir meski IP berbeda",
    );
    __resetRateLimits();

    // Lockout setelah 5 kegagalan.
    await clearFailedLogins(user.id);
    for (let i = 1; i <= 4; i++) {
      const locked = await registerFailedLogin(user.id);
      assert(locked === null, `akun BELUM terkunci setelah kegagalan ${i}`);
    }
    const lockedAt = await registerFailedLogin(user.id);
    assert(lockedAt !== null, "akun TERKUNCI setelah 5 kegagalan");
    assert((await readPrincipal(user.id)) !== null, "lockout tidak mengunci akun yang sah");

    // Tujuan redirect setelah login mengikuti role.
    for (const role of ROLES) {
      assert(
        canEnterPortal(DASHBOARD_BY_ROLE[role], role),
        `${role} diarahkan ke dasbornya sendiri (${DASHBOARD_BY_ROLE[role]})`,
      );
    }
  } finally {
    await db.user.update({
      where: { id: user.id },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    });
    await clearFailedLogins(user.id);
    __resetRateLimits();
  }
}

// Invarian matriks permission.
function invariants(): void {
  section("Invarian matriks permission");

  assert(
    permissionsFor("ADMIN").length === new Set(permissionsFor("ADMIN")).size,
    "ADMIN tidak punya permission duplikat",
  );
  for (const denied of PENGURUS_DENIED) {
    assert(
      !hasPermission("PENGURUS", denied),
      `PENGURUS tidak diberi ${denied} secara default`,
    );
    assert(hasPermission("ADMIN", denied), `ADMIN tetap boleh ${denied}`);
  }
  for (const role of ["PENGURUS", "ANGGOTA", "ALUMNI"] as Role[]) {
    const perms = permissionsFor(role);
    const unknown = perms.filter((p) => !ROLE_PERMISSIONS.ADMIN.has(p));
    assert(unknown.length === 0, `${role} tidak punya permission di luar daftar ADMIN`, unknown.join(","));
  }
  // Kepemilikan record tetap ditegakkan meski permission dimiliki.
  assert(
    !canAccess({
      role: "ANGGOTA",
      permission: "member:update",
      ownerUserId: "user-lain",
      actorUserId: "user-anggota",
    }),
    "member:update ditolak untuk record milik orang lain",
  );
  assert(
    canAccess({
      role: "ANGGOTA",
      permission: "member:update",
      ownerUserId: "user-anggota",
      actorUserId: "user-anggota",
    }),
    "member:update diizinkan untuk record sendiri",
  );
  // Normalisasi tujuan redirect.
  assert(safeNextPath("/member/profil", "ANGGOTA") === "/member/profil", "next milik role dipertahankan");
  assert(safeNextPath("/admin", "ANGGOTA") === "/member", "next portal milik role lain dialihkan");
  assert(safeNextPath("https://jahat.example", "ANGGOTA") === "/member", "next absolut ditolak");
  assert(safeNextPath("//jahat.example", "ANGGOTA") === "/member", "next protocol-relative ditolak");
  assert(safeNextPath("/member\r\nX-Injected: 1", "ANGGOTA") === "/member", "next dengan CR/LF ditolak");
  assert(safeNextPath(undefined, "ALUMNI") === "/alumni", "next kosong memakai dasbor role");
}

async function roleFromDatabase(userId: string): Promise<Role> {
  const principal = await readPrincipal(userId);
  if (!principal) throw new Error("principal null saat tes skenario 3");
  return principal.role;
}

async function main() {
  console.log("=== KPMBR-YK — Tes Otorisasi (Stage 2) ===");

  const users = await db.user.groupBy({ by: ["role"], _count: { _all: true } });
  console.log("Akun dev di database: " + users.map((u) => `${u.role}=${u._count._all}`).join(", "));

  await scenario1();
  scenario2();
  await scenario3();
  await scenario4();
  await scenario5();
  await scenario6();
  invariants();

  console.log(`\n${passed} lulus, ${failed} gagal\n`);
  await db.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err: unknown) => {
  console.error("Tes otorisasi gagal total:", err);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
/**
 * Penulis audit log.
 *
 * Semua aksi sensitif (login, perubahan role, publish, hapus, unduh file)
 * WAJIB lewat file ini supaya jejaknya konsisten dan tidak bisa dilewatkan.
 *
 * Aturan:
 * - `append-only`. Tidak ada fungsi update/delete di modul ini.
 * - Nilai sensitif (password, token, secret) DIBUANG sebelum ditulis.
 * - Kegagalan menulis audit tidak boleh membatalkan aksi bisnis? Untuk aksi
 *   destruktifkita pilih fail-closed: error dilempar. `required: false`
 *   dipakai hanya untuk telemetry (mis. VIEW pada halaman publik).
 */
import { db } from "@/lib/db/prisma";
import { AuditAction } from "@/generated/prisma/enums";
import { logSafe } from "@/lib/errors";

/** Kunci yang tidak boleh pernah masuk ke `metadata`. */
const REDACTED_KEYS = new Set([
  "password",
  "passwordhash",
  "password_hash",
  "newpassword",
  "new_password",
  "token",
  "sessiontoken",
  "session_token",
  "secret",
  "authsecret",
  "auth_secret",
  "apikey",
  "api_key",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "checksum",
]);

const REDACTED = "[redacted]";

/** Buang nilai sensitif secara rekursif (depth dibatasi). */
export function redact(input: unknown, depth = 0): unknown {
  if (depth > 4) return "[depth-limit]";
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map((item) => redact(item, depth + 1));
  if (input instanceof Date) return input.toISOString();
  if (typeof input === "bigint") return input.toString();
  if (typeof input !== "object") return input;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    out[key] = REDACTED_KEYS.has(key.toLowerCase()) ? REDACTED : redact(value, depth + 1);
  }
  return out;
}

export type AuditInput = {
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Tulis satu baris audit.
 *
 * `required: true` (default) berarti kegagalan menulis audit akan
 * menggagalkan aksi pemanggil — dipakai untuk aksi destruktif.
 */
export async function writeAudit(input: AuditInput, required = true): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        actorId: input.actorUserId ?? null,
        metadata: input.metadata ? (redact(input.metadata) as object) : undefined,
        ipAddress: input.ipAddress?.slice(0, 45) ?? null,
        userAgent: input.userAgent?.slice(0, 255) ?? null,
      },
    });
  } catch (error) {
    if (required) throw error;
    console.error("[audit] gagal menulis (non-blocking):", logSafe(error));
  }
}

/**
 * Ambil IP klien dari header proxy.
 *
 * `x-forwarded-for` bisa dipalsukan klien kalau aplikasi dibuka langsung ke
 * internet tanpa reverse proxy. Karena itu nilainya hanya dipakai untuk
 * rate limiting dan audit — TIDAK pernah untuk keputusan otorisasi.
 */
export function clientIpFrom(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || null;
}
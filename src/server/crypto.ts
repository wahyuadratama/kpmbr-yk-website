/**
 * Utilitas kriptografi ringan untuk kartu anggota digital.
 *
 * Prinsip: token mentah TIDAK pernah disimpan di database. Hanya hash-nya
 * yang tersimpan, sehingga bocornya database tidak membocorkan token verifikasi.
 */
import { createHash, randomBytes } from "node:crypto";

/** Buat token opaque acak (URL-safe, tanpa padding). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Hash SHA-256 token (hex). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Bandingkan token mentah dengan hash (constant-ish). */
export function compareToken(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}

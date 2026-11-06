/**
 * Hash password.
 *
 * Memakai `bcryptjs` (pure JavaScript) supaya tidak butuh toolchain native
 * di environment Laragon/Windows. Cost default 10 — naikkan hanya setelah
 * mengukur beban CPU server.
 *
 * Password TIDAK PERNAH disimpan plaintext, dan tidak pernah masuk ke log
 * maupun `audit_logs.metadata` (lihat redactor di `src/lib/audit.ts`).
 */
import bcrypt from "bcryptjs";

const COST = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Bandingkan secara waktu-konstan agar panjang hash tidak membocorkan
 * informasi lewat perbedaan waktu proses.
 */
export function fakeVerifyDelay(): void {
  bcrypt.compareSync("dummy-password", "$2a$10$abcdefghijklmnopqrstuv");
}
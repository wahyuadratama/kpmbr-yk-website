/**
 * Error domain — SATU SUMBER KEBENARAN untuk pemetaan error → HTTP status.
 *
 * Aturan:
 * - Pesan yang sampai ke klien TIDAK BOLEH membocorkan stack trace, SQL,
 *   credential, atau path filesystem.
 * - `AppError` selalu punya `code` stabil (untuk log & tes) dan `message`
 *   yang aman ditampilkan.
 * - Detailinternal disimpan pada `cause` dan hanya ditulis ke log server.
 */

export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  /** Detail untuk log server. TIDAK pernah dikirim ke klien. */
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }
}

export const badRequest = (m: string, d?: unknown) => new AppError("BAD_REQUEST", m, d);
export const validationError = (m: string, d?: unknown) =>
  new AppError("VALIDATION_ERROR", m, d);
export const unauthorized = (m = "Anda harus masuk terlebih dahulu.") =>
  new AppError("UNAUTHORIZED", m);
export const forbidden = (m = "Anda tidak memiliki izin untuk aksi ini.") =>
  new AppError("FORBIDDEN", m);
export const notFound = (m = "Data tidak ditemukan.") => new AppError("NOT_FOUND", m);
export const conflict = (m: string, d?: unknown) => new AppError("CONFLICT", m, d);
export const tooLarge = (m: string) => new AppError("PAYLOAD_TOO_LARGE", m);
export const unsupportedMedia = (m: string) => new AppError("UNSUPPORTED_MEDIA_TYPE", m);
export const rateLimited = (m = "Terlalu banyak permintaan. Coba lagi nanti.") =>
  new AppError("RATE_LIMITED", m);
export const internalError = (m = "Terjadi kesalahan pada server.") =>
  new AppError("INTERNAL_ERROR", m);

/**
 * Pesan generik untuk client. Semua error 5xx diseragamkan agar detail
 * internal (SQL, path, credential) tidak bocor.
 */
export function publicMessage(error: unknown): {
  status: number;
  code: ErrorCode;
  message: string;
} {
  if (error instanceof AppError) {
    return { status: error.status, code: error.code, message: error.message };
  }
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Terjadi kesalahan pada server.",
  };
}

/**
 * Ubah error apa pun menjadi `AppError` yang aman.
 * `ZodError` dikenali tanpa meng-import zod di file ini (dicek dari nama).
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return internalError();
}

/** Ringkasan aman untuk log server (tanpa message mentah dari driver). */
export function logSafe(error: unknown): string {
  if (error instanceof AppError) {
    return `${error.code}: ${error.message}${
      error.details === undefined ? "" : ` | details=${safeJson(error.details)}`
    }`;
  }
  if (error instanceof Error) {
    // Nama error + kode generik. Message mentah bisa memuat host/user/DSN.
    return `${error.name} (internal)`;
  }
  return "UnknownError (internal)";
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value)?.slice(0, 500) ?? "unserializable";
  } catch {
    return "unserializable";
  }
}
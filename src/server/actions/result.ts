/**
 * Pembungkus server action.
 *
 * Server action tidak boleh melempar error mentah ke klien: Next.js akan
 * mengirim stack trace ke browser pada mode development, dan pada produksi
 * bisa membocorkan detail internal. Semua aksi karena itu dibungkus fungsi
 * ini yang mengembalikan `ActionResult` dengan pesan aman.
 *
 * Alur dalam satu aksi:
 *   authentication → authorization → validation → business logic → audit
 */
import "server-only";
import { AppError, logSafe, publicMessage, type ErrorCode } from "@/shared/errors";
import { fieldErrors, type FieldError } from "@/shared/validation/parse";

export type ActionError = {
  code: ErrorCode;
  message: string;
  fields?: FieldError[];
};

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

/**
 * Jalankan `fn` dan ubah hasilnya menjadi `ActionResult`.
 * Error 5xx tetap tercatat penuh di log server, tetapi ke klien hanya
 * delivers pesan generik.
 */
export async function runAction<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    const { status, code, message } = publicMessage(error);
    const fields =
      error instanceof AppError && error.code === "VALIDATION_ERROR"
        ? (error.details as FieldError[] | undefined)
        : undefined;
    // 4xx = kesalahan pemanggil (aman ditampilkan). 5xx = bug/server.
    if (status >= 500) console.error(`[action:${label}]`, logSafe(error));
    else console.info(`[action:${label}] ditolak: ${code}`);
    return { ok: false, error: { code, message, fields } };
  }
}

/** Bentuk gagal yang sudah jadi, untuk kasus tanpa error. */
export function actionFail(
  code: ErrorCode,
  message: string,
  fields?: FieldError[],
): ActionResult<never> {
  return { ok: false, error: { code, message, fields } };
}

/** Bentuk sukses tanpa payload. */
export function actionOk(): ActionResult<undefined> {
  return { ok: true, data: undefined };
}

export { fieldErrors };
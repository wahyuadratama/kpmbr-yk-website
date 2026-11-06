/**
 * Helperparsing input yang konsisten.
 *
 * Satu-satunya jalan dari "input tidak dipercaya" ke "data typed":
 * `parseOrThrow`. Kegagalan Zod dibungkus menjadi `AppError` 422 dengan
 * pesan per-field yang aman ditampilkan, tanpa membocorkan stack trace.
 */
import { z } from "zod";
import { validationError } from "@/shared/errors";

export type FieldError = { field: string; message: string };

/** Ambil daftar kesalahan field dari ZodError, datar dan deterministik. */
export function fieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "_",
    message: issue.message,
  }));
}

/**
 * Parse atau lempar `VALIDATION_ERROR` (422).
 * Input boleh berupa `unknown`: itulah inti dari validasi server-side.
 */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw validationError("Data yang dikirim tidak valid.", fieldErrors(result.error));
}
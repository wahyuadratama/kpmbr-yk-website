/**
 * Route handler Auth.js.
 *
 * Tidak dipakai untuk alur login (login memakai Server Action di
 * `src/app/(auth)/login/actions.ts`), tapi tetap diperlukan agar endpoint
 * `/api/auth/*` tersedia — termasuk untuk `signOut()` dan purge session.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
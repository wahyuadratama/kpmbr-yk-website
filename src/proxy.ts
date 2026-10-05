import { NextResponse, type NextRequest } from "next/server";

/**
 * Gerbang kasar untuk area privat.
 *
 * PENTING: ini BUKAN batas keamanan. Middleware hanya memeriksa apakah
 * cookie sesi ada, tanpa memverifikasinya, karena verifikasi membutuhkan
 * kunci dan database.
 *
 * Penegakan yang sebenarnya ada di server:
 * - `requireSessionPage()` pada layout `/admin`
 * - `requirePermission()` pada setiap server action
 * - `getCurrentPrincipal()` + `authorizeFileAccess()` pada route file
 *
 * Middleware ada agar pengunjung tidak sampai ke halaman yang sama sekali
 * tidak bisa mereka buka (menghemat render dan memudahkan pesan error),
 * dan agar `robots`/cache tidak mengindeks area privat.
 */

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => request.cookies.has(name));
}

/** Prefix yang butuh sesi. */
const PRIVATE_PREFIXES = ["/admin", "/pengurus", "/member", "/alumni", "/api/files"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isPrivate = PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isPrivate) return NextResponse.next();

  if (hasSessionCookie(request)) return NextResponse.next();

  // API tidak boleh dialihkan ke HTML; jawab 401 agar jelas.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Anda harus masuk terlebih dahulu." } },
      { status: 401 },
    );
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/pengurus/:path*", "/member/:path*", "/alumni/:path*", "/api/files/:path*"],
};
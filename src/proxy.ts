import { NextResponse, type NextRequest } from "next/server";
import { isMaintenanceActive } from "@/lib/settings/website";

/**
 * Gerbang kasar untuk area privat + status pemeliharaan website.
 *
 * PENTING: ini BUKAN batas keamanan. Middleware hanya memeriksa apakah
 * cookie sesi ada, tanpa memverifikasinya, karena verifikasi membutuhkan
 * kunci dan database.
 *
 * Penegakan yang sebenarnya ada di server:
 * - `requireSessionPage()` pada layout tiap portal
 * - `requirePermission()` pada setiap server action
 * - `getCurrentPrincipal()` + `authorizeFileAccess()` pada route file
 *
 * Middleware ada agar pengunjung tidak sampai ke halaman yang sama sekali
 * tidak bisa mereka buka (menghemat render dan memudahkan pesan error),
 * dan agar `robots`/cache tidak mengindeks area privat.
 *
 * Mode pemeliharaan ditegakkan DI LAPISAN REQUEST, bukan dengan menyembunyikan
 * elemen di frontend. Halaman privat (portal CMS) tetap dapat diakses karena
 * masing-masing punya guard sendiri — maintenance tidak boleh mematikan
 * perlindungan keamanan.
 */

/** Prefix yang butuh sesi. */
const PRIVATE_PREFIXES = ["/admin", "/pengurus", "/bendahara", "/member", "/alumni", "/api/files"];

/**
 * Prefix yang TIDAK affected oleh mode pemeliharaan.
 *
 * - Portal privat: guard masing-masing tetap berlaku, sehingga admin dan
 *   pengurus bisa tetap mengelola website saat pemeliharaan.
 * - Endpoint API: punya autentikasi sendiri; mengarahkan API ke halaman HTML
 *   akan merusak klien.
 * - Halaman login dan halaman maintenance itu sendiri.
 */
const MAINTENANCE_EXEMPT_PREFIXES = [
  ...PRIVATE_PREFIXES,
  "/api",
  "/login",
  "/maintenance",
];

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => request.cookies.has(name));
}

function isPrivate(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isMaintenanceExempt(pathname: string): boolean {
  return MAINTENANCE_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const privateArea = isPrivate(pathname);

  if (privateArea) {
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

  // Mode pemeliharaan: hanya halaman publik yang diblokir.
  if (!isMaintenanceExempt(pathname)) {
    const maintenance = await isMaintenanceActive();
    if (maintenance) {
      const target = new URL("/maintenance", request.url);
      return NextResponse.redirect(target);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Proxy di Next.js 16 selalu berjalan di Node.js runtime, jadi status
  // maintenance dapat dibaca langsung dari database.
  matcher: [
    "/admin/:path*",
    "/pengurus/:path*",
    "/bendahara/:path*",
    "/member/:path*",
    "/alumni/:path*",
    "/api/files/:path*",
    "/:path*",
  ],
};

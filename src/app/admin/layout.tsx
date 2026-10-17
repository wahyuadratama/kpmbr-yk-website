import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { requirePortalPage } from "@/lib/auth/guards";
import { permissionsFor } from "@/lib/auth/permissions";
import { siteConfig } from "@/lib/site-config";
import { logoutAction } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import logo from "@/assets/kpmbr-logo.png";

/**
 * Layout area privat.
 *
 * `requirePortalPage("/admin")` membungkus seluruh subtree: tanpa sesi valid
 * pengunjung ke `/login`, dan role selain ADMIN mendapat HTTP 403. Keduanya
 * DI SERVER, bukan sekadar menyembunyikan menu.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const principal = await requirePortalPage("/admin");
  const permissions = permissionsFor(principal.role);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <Image
              src={logo}
              alt=""
              width={192}
              height={192}
              sizes="32px"
              className="size-8 shrink-0"
            />
            <span>
              {siteConfig.name}
              <span className="ml-2 text-xs font-normal text-muted-foreground">Portal</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="hover:text-foreground">
              Dasbor
            </Link>
            <Link href="/admin/users" className="hover:text-foreground">
              Pengguna
            </Link>
            <Link href="/admin/anggota" className="hover:text-foreground">
              Anggota
            </Link>
            <Link href="/admin/alumni" className="hover:text-foreground">
              Alumni
            </Link>
            <Link href="/admin/keuangan" className="hover:text-foreground">
              Keuangan
            </Link>
            <Link href="/" className="hover:text-foreground">
              Situs publik
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="rounded-md border px-2 py-1 text-xs font-medium">
              {principal.role}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {principal.email}
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t px-4 py-4 text-xs text-muted-foreground">
        <p>{permissions.length} permission aktif untuk peran {principal.role}.</p>
      </footer>
    </div>
  );
}
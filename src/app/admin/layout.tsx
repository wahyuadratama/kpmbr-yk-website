import Link from "next/link";
import type { ReactNode } from "react";
import { requireSessionPage } from "@/lib/auth/guards";
import { permissionsFor } from "@/lib/auth/permissions";
import { siteConfig } from "@/lib/site-config";
import { logoutAction } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";

/**
 * Layout area privat.
 *
 * `requireSessionPage()` membungkus seluruh subtree: tanpa sesi valid, tidak
 * ada satu pun halaman di bawah layout ini yang dirender. Ini pemeriksaan
 * DI SERVER, bukan sekadar menyembunyikan menu.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const principal = await requireSessionPage("/admin");
  const permissions = permissionsFor(principal.role);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/admin" className="font-semibold tracking-tight">
            {siteConfig.name}
            <span className="ml-2 text-xs font-normal text-muted-foreground">Portal</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="hover:text-foreground">
              Dasbor
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
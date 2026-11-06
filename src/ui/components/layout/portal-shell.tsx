import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { permissionsFor } from "@/lib/auth/permissions";
import { DASHBOARD_BY_ROLE, PORTALS } from "@/lib/auth/portals";
import { siteConfig } from "@/lib/site-config";
import type { Principal } from "@/lib/auth/guards";
import logo from "@/assets/kpmbr-logo.png";

type PortalShellProps = {
  /** Path portal aktif, mis. `/pengurus`. Harus ada di `PORTALS`. */
  path: keyof typeof PORTALS;
  principal: Principal;
  children: ReactNode;
};

/**
 * Kerangka halaman untuk portal tertutup: `/pengurus`, `/member`, `/alumni`.
 *
 * Portal `/admin` punya versinya sendiri karena isinya lebih lengkap. Keduanya
 * sengaja berbagi komponen presentasi yang sama: navigasi daftar portal di
 * header membuat pengguna yang salah mendarat langsung melihat batasannya.
 *
 * Komponen ini TIDAK melakukan pemeriksaan akses apa pun. Guard dijalankan di
 * `layout.tsx` tiap portal lewat `requirePortalPage()` sebelum render.
 */
export function PortalShell({ path, principal, children }: PortalShellProps) {
  const current = PORTALS[path];
  const permissions = permissionsFor(principal.role);

  // Tampilkan hanya portal yang boleh dimasuki role ini.
  const reachable = Object.values(PORTALS).filter((portal) =>
    (portal.roles as readonly string[]).includes(principal.role),
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link
            href={DASHBOARD_BY_ROLE[principal.role]}
            className="flex items-center gap-2.5 font-semibold tracking-tight"
          >
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

          <nav aria-label="Navigasi portal" className="flex flex-wrap items-center gap-1 text-sm">
            {reachable.map((portal) => (
              <Link
                key={portal.path}
                href={portal.path}
                aria-current={portal.path === current.path ? "page" : undefined}
                className={
                  portal.path === current.path
                    ? "rounded-md bg-accent px-3 py-2 font-medium text-accent-foreground"
                    : "rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
                }
              >
                {portal.label}
              </Link>
            ))}
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
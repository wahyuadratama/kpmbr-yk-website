"use client";

/**
 * Kerangka dashboard (CMS).
 *
 * Satu kerangka untuk semua portal internal: admin, pengurus, bendahara,
 * anggota, dan alumni. Sidebar navy gelap, header putih, area kerja abu-abu
 * sangat muda.
 *
 * Komponen ini Client Component karena:
 * - menu aktif mengikuti URL saat ini (`usePathname`),
 * - sidebar berubah menjadi drawer pada layar kecil.
 *
 * Menu yang ditampilkan sudah disaring di server berdasarkan permission, jadi
 * kemunculan item di sini BUKAN satu-satunya pengaman — Pekingan akses tetap
 * ditegakkan di server pada setiap aksi dan query.
 */
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/ui/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/components/ui/sheet";
import { Brand } from "@/ui/components/layout/brand";
import { ROLE_LABEL, type Role } from "@/server/auth/permissions";
import { DASHBOARD_ICONS } from "@/ui/dashboard/icons";
import type { DashboardNavGroup } from "@/ui/dashboard/nav";
import { logoutAction } from "@/app/(auth)/login/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/ui/dropdown-menu";

export type DashboardShellProps = {
  /** Subjudul di bawah nama organisasi, mis. "CMS Administrator". */
  portalLabel: string;
  /** Menu yang sudah disaring server berdasarkan permission. */
  nav: DashboardNavGroup[];
  role: Role;
  email: string;
  children: React.ReactNode;
  /** Elemen tambahan di sisi kanan header. */
  headerActions?: React.ReactNode;
};

/** Aktif bila path sama persis atau berada di bawah path menu. */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({
  portalLabel,
  nav,
  role,
  email,
  children,
  headerActions,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const navContent = (
    <nav aria-label="Navigasi dashboard" className="flex flex-col gap-5 px-3 py-4">
      {nav.map((group, groupIndex) => {
        if (group.items.length === 0) return null;
        return (
          <div key={group.label ?? `grup-${groupIndex}`} className="flex flex-col gap-1">
            {group.label ? (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-dashboard-sidebar-muted">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = DASHBOARD_ICONS[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-dashboard-sidebar-active",
                    active
                      ? "bg-dashboard-sidebar-active font-medium text-white"
                      : "text-dashboard-sidebar-foreground hover:bg-white/10",
                  )}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-dashboard-canvas text-dashboard-text">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col bg-dashboard-sidebar lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white p-1">
            <Brand variant="mark" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-white">KPMBR-YK</p>
            <p className="truncate text-[11px] text-dashboard-sidebar-muted">
              {portalLabel}
            </p>
          </div>
        </div>
        <div className="mx-5 h-px bg-white/10" />
        <div className="flex-1 overflow-y-auto">{navContent}</div>
      </aside>

      <div className="lg:pl-[236px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-dashboard-border bg-white px-4 sm:px-6">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Buka menu navigasi"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-[268px] gap-0 border-r-0 bg-dashboard-sidebar p-0"
            >
              <SheetHeader className="border-b border-white/10 px-5 py-4">
                <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white p-1">
                    <Brand variant="mark" />
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm font-semibold text-white">
                      KPMBR-YK
                    </p>
                    <p className="truncate text-[11px] text-dashboard-sidebar-muted">
                      {portalLabel}
                    </p>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">{navContent}</div>
            </SheetContent>
          </Sheet>

            <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white p-0.5">
                <Brand variant="mark" />
              </span>
              <span className="truncate text-sm font-semibold text-dashboard-text">
                KPMBR-YK
              </span>
            </div>

            <div className="ml-auto flex items-center gap-3">
            {headerActions}
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-dashboard-primary text-xs font-semibold text-white"
              >
                {email.slice(0, 2).toUpperCase()}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="truncate text-sm font-medium text-dashboard-text">
                  {email}
                </p>
                <p className="text-[11px] text-dashboard-text-muted">
                  {ROLE_LABEL[role]}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="ml-1"
                    aria-label="Menu akun"
                  >
                    <ChevronDown aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <span className="block truncate text-sm font-medium text-dashboard-text">
                      {email}
                    </span>
                    <span className="block text-xs text-dashboard-text-muted">
                      {ROLE_LABEL[role]}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={logoutAction}>
                      <button type="submit" className="w-full text-left">
                        Keluar
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Area kerja */}
        <main className="px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}

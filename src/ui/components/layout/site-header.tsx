"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/components/ui/accordion";
import { Brand } from "@/ui/components/layout/brand";
import { siteConfig } from "@/shared/site-config";
import {
  activeChildHref,
  isHrefActive,
  joinCta,
  publicNav,
  type NavChild,
  type NavEntry,
} from "@/ui/navigation";

/**
 * Header website publik.
 *
 * Desktop: tautan langsung + kategori dropdown (dibuka lewat klik, memakai
 * `DropdownMenu` radix sehingga keyboard, Escape, dan klik di luar sudah
 * ditangani pustaka).
 * Mobile: navigasi penuh dalam `Sheet`, dengan `Accordion` untuk kategori.
 *
 * Konfigurasi menu dibaca dari `src/lib/navigation.ts` — tidak ada daftar
 * tautan yang ditulis ulang di dalam komponen ini.
 */

/** Entri yang dirender sebagai tautan langsung (tanpa submenu). */
function isPlainLink(entry: NavEntry): entry is Extract<NavEntry, { type: "link" }> {
  return entry.type === "link";
}

/** Class tombol pemicu dropdown agar terlihat seragam dengan tautan biasa. */
function triggerClass(active: boolean): string {
  return cn(
    "group flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "font-medium text-foreground"
      : "text-muted-foreground hover:text-foreground",
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const plainLinks = publicNav.filter(isPlainLink);
  const dropdowns = publicNav.filter(
    (entry): entry is Extract<NavEntry, { type: "dropdown" }> => entry.type === "dropdown",
  );

  const renderChild = (child: NavChild, activeHref: string | null) => (
    <DropdownMenuItem key={child.href} asChild className="px-3 py-2">
      <Link
        href={child.href}
        aria-current={child.href === activeHref ? "page" : undefined}
        className="flex flex-col items-start gap-0.5 outline-none"
      >
        <span className="text-sm font-medium">{child.title}</span>
        {child.description ? (
          <span className="text-xs text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground">
            {child.description}
          </span>
        ) : null}
      </Link>
    </DropdownMenuItem>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Brand priority className="shrink-0" />

        <nav
          aria-label="Navigasi utama"
          className="ml-auto hidden items-center gap-0.5 xl:flex"
        >
          {plainLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isHrefActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isHrefActive(pathname, item.href)
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.title}
            </Link>
          ))}

          {dropdowns.map((item) => {
            const activeHref = activeChildHref(pathname, item.children);
            const active = activeHref !== null;
            return (
              <DropdownMenu key={item.title} modal={false}>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={triggerClass(active)}>
                    {item.title}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-3.5 transition-transform duration-150 group-data-[state=open]:rotate-180"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  sideOffset={6}
                  className="w-64 min-w-64 p-1.5"
                >
                  {item.children.map((child) => renderChild(child, activeHref))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <Button asChild size="lg" className="hidden h-10 px-4 sm:inline-flex">
            <Link href={joinCta.href}>{joinCta.title}</Link>
          </Button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-lg"
                className="size-10 xl:hidden"
                aria-label="Buka menu navigasi"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[min(21rem,90vw)] gap-0 border-l p-0"
            >
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
                <SheetClose asChild>
                  <Brand variant="mark" />
                </SheetClose>
              </SheetHeader>

              <nav
                aria-label="Navigasi utama mobile"
                className="flex-1 overflow-y-auto overscroll-contain p-3"
              >
                {plainLinks.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isHrefActive(pathname, item.href) ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center rounded-md px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isHrefActive(pathname, item.href)
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {item.title}
                    </Link>
                  </SheetClose>
                ))}

                {dropdowns.length > 0 && (
                  <Accordion type="single" collapsible className="mt-1">
                    {dropdowns.map((item) => {
                      const activeHref = activeChildHref(pathname, item.children);
                      const active = activeHref !== null;
                      return (
                        <AccordionItem key={item.title} value={item.title}>
                          <AccordionTrigger
                            className={cn(
                              "min-h-11 items-center rounded-md px-3 py-2.5 text-sm hover:bg-muted hover:no-underline",
                              active
                                ? "font-medium text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {item.title}
                          </AccordionTrigger>
                          <AccordionContent className="pb-2 pl-3">
                            <ul className="flex flex-col">
                              {item.children.map((child) => (
                                <li key={child.href}>
                                  <SheetClose asChild>
                                    <Link
                                      href={child.href}
                                      aria-current={
                                        child.href === activeHref ? "page" : undefined
                                      }
                                      className={cn(
                                        "flex min-h-11 flex-col justify-center rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        child.href === activeHref
                                          ? "bg-accent font-medium text-accent-foreground"
                                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                      )}
                                    >
                                      <span>{child.title}</span>
                                      {child.description ? (
                                        <span className="text-xs text-muted-foreground">
                                          {child.description}
                                        </span>
                                      ) : null}
                                    </Link>
                                  </SheetClose>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </nav>

              <div className="border-t border-border p-4">
                <Button asChild size="lg" className="h-11 w-full">
                  <Link href={joinCta.href}>
                    Gabung dengan {siteConfig.name}
                  </Link>
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  {siteConfig.contact.email}
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

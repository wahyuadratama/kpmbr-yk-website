"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Brand } from "@/components/layout/brand";
import { mainNav, siteConfig } from "@/lib/site-config";

/**
 * Header website publik.
 * Desktop: navigasi horizontal. Mobile: navigasi penuh dalam Sheet.
 *
 * Navigasi mobile memakai <nav> + daftar link, bukan menu dropdown, agar
 * mudah diakses dengan keyboard dan pembaca layar. Setiap tautan dibungkus
 * `SheetClose` sehingga panel tertutup saat link dipilih — tanpa perlu
 * useEffect yang memanggil setState.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Brand />

        <nav
          aria-label="Navigasi utama"
          className="ml-auto hidden items-center gap-1 lg:flex"
        >
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive(item.href)
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button asChild size="lg" className="hidden h-10 px-4 sm:inline-flex">
            <Link href="/keanggotaan#bergabung">Gabung</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-lg"
                className="size-10 lg:hidden"
                aria-label="Buka menu navigasi"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[min(20rem,88vw)] gap-0 border-l p-0"
            >
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
                <Brand variant="mark" />
              </SheetHeader>

              <nav
                aria-label="Navigasi utama mobile"
                className="flex flex-col gap-0.5 p-3"
              >
                {mainNav.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(
                        "rounded-md px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive(item.href)
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {item.title}
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-auto border-t border-border p-4">
                <Button asChild size="lg" className="h-11 w-full">
                  <Link href="/keanggotaan#bergabung">Gabung dengan KPMBR-YK</Link>
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
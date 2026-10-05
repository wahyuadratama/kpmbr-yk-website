import * as React from "react";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";
import { Brand } from "@/components/layout/brand";
import { footerNav, siteConfig } from "@/lib/site-config";

/** Footer website publik: identitas, peta situs, dan kontak. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Brand />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {siteConfig.fullName}. Platform digital resmi untuk informasi
              organisasi, program kerja, agenda, dokumentasi, dan keanggotaan.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 text-sm text-muted-foreground">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="inline-flex items-center gap-2 rounded-md outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Mail aria-hidden="true" className="size-4 shrink-0" />
                {siteConfig.contact.email}
              </a>
              <p className="inline-flex items-start gap-2">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>
                  {siteConfig.address.street}, {siteConfig.address.city},{" "}
                  {siteConfig.address.region}
                </span>
              </p>
              <a
                href={siteConfig.contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <InstagramIcon className="size-4 shrink-0" />
                Instagram
              </a>
            </div>
          </div>

          {footerNav.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-semibold">{group.title}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {year} {siteConfig.fullName}. Seluruh hak cipta dilindungi.
          </p>
          <p className="text-xs text-muted-foreground">
            Situs ini sedang dalam tahap pengembangan.
          </p>
        </div>
      </div>
    </footer>
  );
}
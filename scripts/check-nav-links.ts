/**
 * Validasi tautan navigasi publik.
 *
 * Memastikan setiap `href` pada `src/lib/navigation.ts` dan `footerNav` benar-benar
 * menuju route yang ada di `src/app/(public)`, dan setiap anchor memiliki
 * elemen tujuan dengan `id` yang sesuai.
 *
 * Jalankan: npx tsx scripts/check-nav-links.ts
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { publicNav, joinCta } from "../src/lib/navigation";
import { footerNav } from "../src/lib/site-config";

const ROOT = process.cwd();
const PUBLIC_DIR = join(ROOT, "src", "app", "(public)");

type Issue = { href: string; problem: string };

const issues: Issue[] = [];

/** Kumpulkan semua route yang tersedia di app/(public). */
function collectRoutes(dir: string, prefix = ""): Set<string> {
  const routes = new Set<string>();

  // Halaman pada direktori ini sendiri (mis. `page.tsx` di akar route group).
  if (existsSync(join(dir, "page.tsx"))) routes.add(prefix || "/");

  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;

    if (entry.startsWith("(") && entry.endsWith(")")) {
      // Route group: tidak menambah prefix URL.
      for (const route of collectRoutes(full, prefix)) routes.add(route);
      continue;
    }

    if (entry.startsWith("[")) {
      // Route dinamis: cocokkan sebagai wildcard.
      for (const route of collectRoutes(full, `${prefix}/${entry}`)) routes.add(route);
      continue;
    }

    const next = `${prefix}/${entry}`;
    for (const route of collectRoutes(full, next)) routes.add(route);
  }
  return routes;
}

/** Kumpulkan seluruh `id` yang ada di sebuah file. */
function collectIds(file: string): Set<string> {
  const content = readFileSync(file, "utf8");
  const ids = new Set<string>();
  const pattern = /\bid=["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    if (match[1]) ids.add(match[1]);
  }
  return ids;
}

/** File sumber untuk sebuah path route (untuk memeriksa anchor). */
function pageFileFor(path: string): string | null {
  const candidate = join(PUBLIC_DIR, path.replace(/^\//, ""), "page.tsx");
  return existsSync(candidate) ? candidate : null;
}

const routes = collectRoutes(PUBLIC_DIR);

function checkHref(href: string, source: string) {
  const [pathPart, hash] = href.split("#");
  const path = pathPart && pathPart.length > 0 ? pathPart : "/";

  // Route harus ada (izinkan wildcard untuk route dinamis).
  const exists =
    routes.has(path) ||
    [...routes].some((route) => route.includes("[") && matchesDynamic(route, path));

  if (!exists) {
    issues.push({ href, problem: `route tidak ada (${source})` });
    return;
  }

  if (hash) {
    const file = pageFileFor(path);
    if (!file) {
      issues.push({ href, problem: `anchor tanpa sumber halaman (${source})` });
      return;
    }
    if (!collectIds(file).has(hash)) {
      issues.push({ href, problem: `id "${hash}" tidak ditemukan di halaman (${source})` });
    }
  }
}

function matchesDynamic(route: string, path: string): boolean {
  const routeParts = route.split("/");
  const pathParts = path.split("/");
  if (routeParts.length !== pathParts.length) return false;
  return routeParts.every((part, i) => part.startsWith("[") || part === pathParts[i]);
}

console.log("\n=== Validasi tautan navigasi publik ===\n");
console.log(`Route terdeteksi: ${[...routes].sort().join(", ")}\n`);

const seen = new Set<string>();

for (const entry of publicNav) {
  if (entry.type === "link") {
    checkHref(entry.href, "navbar");
    seen.add(entry.href);
  } else {
    for (const child of entry.children) {
      checkHref(child.href, `navbar:${entry.title}`);
      if (seen.has(child.href)) {
        issues.push({
          href: child.href,
          problem: `duplikat di navbar (${entry.title})`,
        });
      }
      seen.add(child.href);
    }
  }
}

checkHref(joinCta.href, "navbar:CTA");
seen.add(joinCta.href);

for (const group of footerNav) {
  for (const item of group.items) {
    checkHref(item.href, `footer:${group.title}`);
  }
}

if (issues.length === 0) {
  console.log("OK — semua tautan navigasi menuju route/anchor yang valid.\n");
  process.exit(0);
}

for (const issue of issues) {
  console.log(`[MASALAH] ${issue.href} — ${issue.problem}`);
}
console.log(`\n${issues.length} tautan bermasalah.\n`);
process.exit(1);

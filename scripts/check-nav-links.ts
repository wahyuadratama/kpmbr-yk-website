/**
 * Validasi tautan navigasi.
 *
 * Memastikan:
 * 1. Setiap tautan navbar publik dan footer menuju route yang benar-benar ada.
 * 2. Tautan navbar publik TIDAK pernah menuju route privat (CMS/portal).
 * 3. Setiap tautan sidebar dashboard menuju route yang benar-benar ada.
 * 4. Tidak ada tautan navbar yang duplikat.
 *
 * Jalankan: npm run check:nav
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { publicNav, joinCta } from "../src/lib/navigation";
import { footerNav } from "../src/lib/site-config";
import {
  ADMIN_NAV,
  ALUMNI_NAV,
  BENDAHARA_NAV,
  MEMBER_NAV,
  PENGURUS_NAV,
} from "../src/lib/dashboard/nav";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "src", "app");
const PUBLIC_DIR = join(APP_DIR, "(public)");

type Issue = { href: string; problem: string };

const issues: Issue[] = [];

/** Kumpulkan semua route yang tersedia di bawah sebuah direktori. */
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
      // Route dinamis: dicatat sebagai wildcard.
      for (const route of collectRoutes(full, `${prefix}/${entry}`)) routes.add(route);
      continue;
    }

    const next = `${prefix}/${entry}`;
    if (existsSync(join(full, "page.tsx"))) routes.add(next);
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
  const relative = path.replace(/^\//, "");
  // Halaman publik berada di route group `(public)`, portal di luar group.
  for (const base of [PUBLIC_DIR, APP_DIR]) {
    const candidate = join(base, relative, "page.tsx");
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const allRoutes = collectRoutes(APP_DIR);
const publicRoutes = collectRoutes(PUBLIC_DIR);

function matchesDynamic(route: string, path: string): boolean {
  const routeParts = route.split("/");
  const pathParts = path.split("/");
  if (routeParts.length !== pathParts.length) return false;
  return routeParts.every((part, i) => part.startsWith("[") || part === pathParts[i]);
}

function routeExists(path: string, pool: Set<string>): boolean {
  if (pool.has(path)) return true;
  return [...pool].some(
    (route) => route.includes("[") && matchesDynamic(route, path),
  );
}

/** Periksa satu `href`. */
function checkHref(
  href: string,
  source: string,
  options: { mustBePublic?: boolean } = {},
) {
  const [pathPart, hash] = href.split("#");
  const path = pathPart && pathPart.length > 0 ? pathPart : "/";

  if (!routeExists(path, allRoutes)) {
    issues.push({ href, problem: `route tidak ada (${source})` });
    return;
  }

  if (options.mustBePublic && !routeExists(path, publicRoutes)) {
    issues.push({
      href,
      problem: `navbar publik menunjuk route yang bukan halaman publik (${source})`,
    });
  }

  if (hash) {
    const file = pageFileFor(path);
    if (!file) {
      issues.push({ href, problem: `anchor tanpa sumber halaman (${source})` });
      return;
    }
    if (!collectIds(file).has(hash)) {
      issues.push({
        href,
        problem: `id "${hash}" tidak ditemukan di halaman (${source})`,
      });
    }
  }
}

console.log("\n=== Validasi tautan navigasi ===\n");
console.log(`Route publik : ${[...publicRoutes].sort().join(", ")}\n`);

const seen = new Set<string>();

for (const entry of publicNav) {
  if (entry.type === "link") {
    checkHref(entry.href, "navbar", { mustBePublic: true });
    seen.add(entry.href);
  } else {
    for (const child of entry.children) {
      checkHref(child.href, `navbar:${entry.title}`, { mustBePublic: true });
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

checkHref(joinCta.href, "navbar:CTA", { mustBePublic: true });
seen.add(joinCta.href);

for (const group of footerNav) {
  for (const item of group.items) {
    checkHref(item.href, `footer:${group.title}`, { mustBePublic: true });
  }
}

/* ---------------- Sidebar dashboard ---------------- */

const DASHBOARD_NAV = [
  { source: "admin", groups: ADMIN_NAV },
  { source: "pengurus", groups: PENGURUS_NAV },
  { source: "bendahara", groups: BENDAHARA_NAV },
  { source: "member", groups: MEMBER_NAV },
  { source: "alumni", groups: ALUMNI_NAV },
];

for (const { source, groups } of DASHBOARD_NAV) {
  for (const group of groups) {
    for (const item of group.items) {
      checkHref(item.href, `sidebar:${source}`);
    }
  }
}

if (issues.length === 0) {
  console.log("OK — semua tautan navigasi menuju route/anchor yang valid.\n");
  console.log(
    "     Navbar publik hanya menuju halaman publik; sidebar dashboard menuju route privat.\n",
  );
  process.exit(0);
}

for (const issue of issues) {
  console.log(`[MASALAH] ${issue.href} — ${issue.problem}`);
}
console.log(`\n${issues.length} tautan bermasalah.\n`);
process.exit(1);

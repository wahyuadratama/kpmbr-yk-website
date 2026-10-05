// Script pemeriksaan kualitas teks sumber.
// Menandai karakter non-ASCII yang TIDAK ada dalam daftar putih.
// Jalankan: npm run check:text

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const DIRS = ["src", "docs", "scripts", "prisma"];
const FILES = ["package.json", "components.json", "prisma7.config.ts", ".env.example"];

// Karakter yang legitimately memakai non-ASCII dalam bahasa Indonesia,
// simbol tipografi, dan karakter gambar ASCII untuk diagram Markdown.
const ALLOWED_RANGES: [number, number][] = [
  [0x2010, 0x2027], // tanda baca tipografi: – — ‘ ’ “ ” † ‡ • …
  [0x2030, 0x205e], // ‰ ‹ › ⁿ ≤ ≥ ≈ ≠ ≡ ∴ ∵
  [0x2070, 0x209f], // superskrip: ¹ ² ³ ⁴ ⁵
  [0x2190, 0x21ff], // panah
  [0x2200, 0x22ff], // operator matematika
  [0x2500, 0x257f], // box drawing untuk diagram ASCII
  [0x25a0, 0x25ff], // bentuk geometris
  [0x2600, 0x27bf], // simbol: ★ ✅ ✗ ※
  [0x00a0, 0x00ff], // Latin-1 Supplement (ç, ñ, ×, §, °, ±)
];

// Direktori yang isinya dibuat otomatis dan tidak boleh diedit tangan.
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "generated"]);

function isAllowed(code: number): boolean {
  if (code < 128) return true;
  return ALLOWED_RANGES.some(([start, end]) => code >= start && code <= end);
}

const EXTENSIONS = new Set([
  ".ts", ".tsx", ".md", ".prisma", ".css", ".json", ".mjs", ".js",
]);

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(extname(entry))) out.push(full);
  }
  return out;
}

const targets = [
  ...DIRS.flatMap((d) => walk(join(ROOT, d))),
  ...FILES.map((f) => join(ROOT, f)).filter((f) => {
    try {
      statSync(f);
      return true;
    } catch {
      return false;
    }
  }),
];

let totalBad = 0;

for (const file of targets) {
  const content = readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);
  const seen = new Set<number>();

  lines.forEach((line, index) => {
    for (const ch of line) {
      const code = ch.codePointAt(0)!;
      if (isAllowed(code)) continue;
      const key = index;
      if (!seen.has(key)) {
        seen.add(key);
        totalBad++;
        console.log(
          `${relative(ROOT, file)}:${index + 1}  U+${code.toString(16).toUpperCase().padStart(4, "0")}  ${line.trim().slice(0, 110)}`,
        );
      }
    }
  });
}

console.log(
  totalBad === 0
    ? `\nOK — tidak ada karakter asing di ${targets.length} berkas.`
    : `\n${totalBad} baris bermasalah di ${targets.length} berkas.`,
);
process.exit(totalBad === 0 ? 0 : 1);
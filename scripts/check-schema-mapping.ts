/**
 * Validasi pemetaan kolom Prisma <-> MySQL.
 *
 * Skema Prisma memakai `snake_case` di database lewat `@map`. Kalau satu
 * field lupa `@map`, Prisma akan mencari kolom `periodType` padahal di
 * database ada `period_type` — dan query gagal dengan `ColumnNotFound` yang
 * membingungkan.
 *
 * Skrip ini membandingkan nama kolom yang BENAR-BENAR ada di MySQL dengan
 * nama yang diharapkan Prisma.
 *
 * Cara parsing: `model` dan `enum` dari `prisma/schema.prisma` dibaca sebagai
 * teks. Field bertipe model lain adalah RELASI (bukan kolom) sehingga
 * dilewati; field bertipe enum atau tipe dasar adalah kolom.
 *
 * Jalankan: npm run check:schema
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@/lib/db/prisma";

const ROOT = process.cwd();
const SCHEMA = join(ROOT, "prisma", "schema.prisma");

const SCALAR_KEYWORDS = new Set([
  "String",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "Boolean",
  "DateTime",
  "Json",
  "Bytes",
]);

type Field = { name: string; column: string };
type Model = { name: string; table: string; fields: Field[] };

/** Parse skema Prisma menjadi daftar model + kolomnya. */
function parseSchema(): Model[] {
  const source = readFileSync(SCHEMA, "utf8");

  const modelNames = new Set<string>();
  for (const match of source.matchAll(/^model\s+(\w+)\s*\{/gm)) {
    modelNames.add(match[1] as string);
  }
  const enumNames = new Set<string>();
  for (const match of source.matchAll(/^enum\s+(\w+)\s*\{/gm)) {
    enumNames.add(match[1] as string);
  }

  const models: Model[] = [];
  for (const match of source.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
    const name = match[1] as string;
    const body = match[2] ?? "";

    const table = /@@map\("([^"]+)"\)/.exec(body)?.[1] ?? name;

    const fields: Field[] = [];
    for (const line of body.split("\n")) {
      const fieldMatch = /^\s{2}(\w+)\s+([A-Za-z][\w.]*)(\[\])?\s*(.*)$/.exec(line);
      if (!fieldMatch) continue;

      const fieldName = fieldMatch[1] as string;
      const baseType = (fieldMatch[2] as string).split(".")[0] as string;
      const rest = fieldMatch[4] ?? "";

      if (rest.includes("@relation")) continue;
      // Tipe model lain berarti relasi, bukan kolom.
      if (modelNames.has(baseType)) continue;
      if (!SCALAR_KEYWORDS.has(baseType) && !enumNames.has(baseType)) continue;

      const column = /@map\("([^"]+)"\)/.exec(rest)?.[1] ?? fieldName;
      fields.push({ name: fieldName, column });
    }

    models.push({ name, table, fields });
  }

  return models;
}

async function main() {
  const models = parseSchema();
  const problems: string[] = [];
  let checked = 0;
  let tables = 0;

  for (const model of models) {
    if (model.fields.length === 0) continue;

    const rows = await db.$queryRaw<Array<{ COLUMN_NAME: string }>>`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${model.table}
    `;
    if (rows.length === 0) continue;

    tables += 1;
    const actual = new Set(rows.map((row) => row.COLUMN_NAME));

    for (const field of model.fields) {
      checked += 1;
      if (!actual.has(field.column)) {
        problems.push(
          `${model.name}.${field.name} -> kolom "${field.column}" tidak ada di tabel "${model.table}"`,
        );
      }
    }
  }

  console.log(
    `\n=== Validasi pemetaan kolom (${checked} field, ${tables} tabel) ===\n`,
  );

  if (problems.length === 0) {
    console.log("OK — semua kolom Prisma cocok dengan tabel di database.\n");
    await db.$disconnect();
    process.exit(0);
  }

  for (const problem of problems) console.log(`[MASALAH] ${problem}`);
  console.log(`\n${problems.length} pemetaan kolom bermasalah.\n`);
  await db.$disconnect();
  process.exit(1);
}

main().catch(async (error: unknown) => {
  console.error("Pemeriksaan pemetaan gagal:", error);
  await db.$disconnect().catch(() => undefined);
  process.exit(1);
});

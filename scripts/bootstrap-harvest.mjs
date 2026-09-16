/**
 * Bootstrap: copy canonical tables from new_plas SQLite into data/harvest/.
 * Usage: node scripts/bootstrap-harvest.mjs [/path/to/plas.sqlite]
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data", "harvest");
const DEFAULT_DB = path.resolve(ROOT, "../new_plas/data/plas.sqlite");

const TABLES = [
  "faculty",
  "faculty_aliases",
  "faculty_lines",
  "research_line_keywords",
  "research_lines",
  "publications",
  "people",
  "publication_authors",
  "theses",
  "thesis_advisors",
  "thesis_authors",
  "thesis_lines",
  "students",
];

function rowToStrings(row) {
  const o = {};
  for (const [k, v] of Object.entries(row)) o[k] = v == null ? "" : String(v);
  return o;
}

const dbPath = process.argv[2] || DEFAULT_DB;
await mkdir(OUT, { recursive: true });
const db = new DatabaseSync(dbPath, { readOnly: true });
for (const table of TABLES) {
  const rows = db.prepare(`SELECT * FROM "${table}"`).all().map(rowToStrings);
  await writeFile(path.join(OUT, `${table}.json`), JSON.stringify(rows, null, 2) + "\n", "utf8");
  console.log(`${table}: ${rows.length}`);
}
db.close();
console.log(`wrote ${OUT}`);

/**
 * Canonical harvest store as JSON files (no SQLite).
 * Root: data/harvest/*.json
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");
export const HARVEST_DIR = path.join(ROOT, "data", "harvest");
export const SITE_DATA_DIR = path.join(ROOT, "src", "data");
export const PIPELINE_TEST_DIR = path.join(ROOT, "data", "pipeline_test");

export function rowToStrings(row) {
  const o = {};
  for (const [k, v] of Object.entries(row)) {
    o[k] = v == null ? "" : String(v);
  }
  return o;
}

export async function readJson(filePath, fallback = null) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === "ENOENT" && fallback !== null) return fallback;
    throw err;
  }
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

export function harvestPath(table) {
  return path.join(HARVEST_DIR, `${table}.json`);
}

/** Load a harvest table (array of string-valued rows). */
export async function readTable(table) {
  const rows = await readJson(harvestPath(table), []);
  if (!Array.isArray(rows)) {
    throw new Error(`Expected array in ${table}.json`);
  }
  return rows.map(rowToStrings);
}

/** Replace an entire harvest table. */
export async function writeTable(table, rows) {
  const normalized = rows.map(rowToStrings);
  await writeJson(harvestPath(table), normalized);
  return normalized.length;
}

export async function writeTables(map) {
  for (const [table, rows] of Object.entries(map)) {
    await writeTable(table, rows);
  }
}

export async function ensureHarvestDir() {
  await mkdir(HARVEST_DIR, { recursive: true });
  try {
    await access(harvestPath("faculty"));
  } catch {
    throw new Error(
      `Missing harvest data at ${HARVEST_DIR}. Expected faculty.json and related tables.`,
    );
  }
}

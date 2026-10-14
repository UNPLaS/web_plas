#!/usr/bin/env node
/**
 * Convierte PNG/JPG de public/images a WebP redimensionado y actualiza las rutas
 * que los citan (src/ y los CREDITS.txt). Los originales se borran: quedan en git.
 *
 *   npm run images:optimize            # convierte y reescribe
 *   npm run images:optimize -- --dry   # solo muestra qué haría
 *
 * public/images/og/ se excluye: las vistas previas de redes sociales necesitan JPG/PNG.
 */
import { readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const IMAGES = path.join(PUBLIC, 'images');
const SKIP_DIRS = new Set([path.join(IMAGES, 'og')]);
const REWRITE_ROOTS = [path.join(ROOT, 'src'), IMAGES];
const REWRITE_EXT = /\.(astro|css|json|md|mdx|mjs|ts|txt)$/;
const RASTER = /\.(png|jpe?g)$/i;
const dry = process.argv.includes('--dry');

/** Lado mayor máximo según carpeta: retratos y logos no necesitan más. */
function maxSide(rel) {
  if (/\/(profesores|estudiantes)\//.test(rel)) return 640;
  if (rel.includes('/catalog-sources/')) return 480;
  return 1600;
}

async function walk(dir, filter) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(full)) out.push(...(await walk(full, filter)));
    } else if (filter(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const kb = (n) => `${Math.round(n / 1024)} KB`;

const sources = await walk(IMAGES, (name) => RASTER.test(name));
const renames = [];
let before = 0;
let after = 0;

for (const file of sources) {
  const rel = `/${path.relative(PUBLIC, file).split(path.sep).join('/')}`;
  const target = file.replace(RASTER, '.webp');
  const relTarget = rel.replace(RASTER, '.webp');
  if (sources.includes(target) || (await stat(target).catch(() => null))) {
    throw new Error(`${relTarget} ya existe; renombra ${rel} antes de convertir.`);
  }

  const side = maxSide(rel);
  const image = sharp(file).rotate();
  const { hasAlpha } = await image.metadata();
  const buffer = await image
    .resize({ width: side, height: side, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: hasAlpha ? 90 : 80, effort: 6 })
    .toBuffer();
  const { size } = await stat(file);
  if (buffer.length > size * 0.9) {
    console.log(`${rel}  se queda igual (WebP ${kb(buffer.length)} vs ${kb(size)})`);
    continue;
  }
  before += size;
  after += buffer.length;
  console.log(`${rel} → ${relTarget}  ${kb(size)} → ${kb(buffer.length)}`);

  if (!dry) {
    await writeFile(target, buffer);
    await unlink(file);
  }
  renames.push({ dir: path.dirname(file), from: rel.slice(1), to: relTarget.slice(1) });
}

const textFiles = (
  await Promise.all(REWRITE_ROOTS.map((dir) => walk(dir, (name) => REWRITE_EXT.test(name))))
).flat();
let touched = 0;
for (const file of textFiles) {
  const original = await readFile(file, 'utf8');
  const isCredits = path.basename(file) === 'CREDITS.txt';
  let next = original;
  for (const { dir, from, to } of renames) {
    next = next.split(from).join(to);
    if (isCredits && path.dirname(file) === dir) {
      next = next.split(path.basename(from)).join(path.basename(to));
    }
  }
  if (next !== original) {
    touched += 1;
    console.log(`  rutas actualizadas: ${path.relative(ROOT, file)}`);
    if (!dry) await writeFile(file, next);
  }
}

console.log(
  `\n${renames.length} de ${sources.length} imágenes convertidas, ${kb(before)} → ${kb(after)}; ${touched} archivos con rutas actualizadas${dry ? ' (dry run)' : ''}.`,
);

/**
 * Lógica pura de la malla flotante (testeable sin DOM).
 */

export type MeshLayout = {
  cx: number;
  cy: number;
  halfW: number;
  halfH: number;
};

export type Point = [number, number];

export const SEED_COUNT = 3;
export const NODE_COUNT_DESKTOP = 200;
export const NODE_COUNT_MOBILE = 140;

/** Límites de unión local (mismos que el renderer). */
export function linkLimits(layout: MeshLayout) {
  const { halfW, halfH } = layout;
  return {
    maxLink: Math.min(halfW * 1.85, halfH * 0.32, 175),
    maxDy: halfH * 0.34,
    maxDx: halfW * 1.75,
  };
}

export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dist2(a: Point, b: Point): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

export function edgeLength(a: Point, b: Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function meshLayoutForPage(
  W: number,
  H: number,
  compact = false,
): MeshLayout {
  const halfW = Math.min(W * (compact ? 0.38 : 0.32), compact ? 200 : 340);
  const halfH = H * (compact ? 0.38 : 0.44);
  const cx = W * (compact ? 0.64 : 0.68);
  const cy = H * 0.5;
  return { cx, cy, halfW, halfH };
}

export function sampleVerticalPoints(
  layout: MeshLayout,
  count: number,
  rand: () => number,
): Point[] {
  const { cx, cy, halfW, halfH } = layout;
  const points: Point[] = [];
  let guard = 0;
  while (points.length < count && guard < count * 14) {
    guard += 1;
    const t = rand() * Math.PI * 2;
    const u = Math.sqrt(rand());
    const x = cx + Math.cos(t) * halfW * (0.12 + u * 0.88);
    const y = cy + Math.sin(t) * halfH * (0.12 + u * 0.88);
    points.push([x, y]);
  }
  return points;
}

/** Perturbación local: mantiene correspondencia de vecinos entre semillas. */
export function jitterPoints(
  base: Point[],
  layout: MeshLayout,
  rand: () => number,
  /** fracción del semieje (≈ movimiento local, no reordenamiento). */
  amount = 0.12,
): Point[] {
  const { cx, cy, halfW, halfH } = layout;
  return base.map(([x, y]) => {
    let nx = x + (rand() - 0.5) * 2 * halfW * amount;
    let ny = y + (rand() - 0.5) * 2 * halfH * amount;
    // proyectar dentro de la elipse si se sale
    const ex = (nx - cx) / halfW;
    const ey = (ny - cy) / halfH;
    const d2 = ex * ex + ey * ey;
    if (d2 > 1) {
      const d = Math.sqrt(d2);
      nx = cx + (ex / d) * halfW * 0.98;
      ny = cy + (ey / d) * halfH * 0.98;
    }
    return [nx, ny] as Point;
  });
}

export function edgePairsFor(
  points: Point[],
  layout: MeshLayout,
  neighbors: number,
): Array<[number, number]> {
  const { maxLink, maxDy, maxDx } = linkLimits(layout);
  const maxLink2 = maxLink * maxLink;
  const n = points.length;
  const seen = new Set<string>();
  const pairs: Array<[number, number]> = [];

  for (let i = 0; i < n; i += 1) {
    const scored: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < n; j += 1) {
      if (i === j) continue;
      const dx = Math.abs(points[i][0] - points[j][0]);
      const dy = Math.abs(points[i][1] - points[j][1]);
      if (dx > maxDx || dy > maxDy) continue;
      const d = dist2(points[i], points[j]);
      if (d > maxLink2 || d < 1) continue;
      scored.push({ j, d });
    }
    scored.sort((a, b) => a.d - b.d);
    for (const { j } of scored.slice(0, neighbors)) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([i, j]);
    }
  }
  return pairs;
}

export function edgeIsLocal(
  a: Point,
  b: Point,
  layout: MeshLayout,
): boolean {
  const { maxLink, maxDy, maxDx } = linkLimits(layout);
  const dx = Math.abs(a[0] - b[0]);
  const dy = Math.abs(a[1] - b[1]);
  if (dx > maxDx || dy > maxDy) return false;
  return edgeLength(a, b) <= maxLink;
}

/**
 * Semillas correlacionadas: la 0 es muestreo libre; 1 y 2 son jitter de la 0.
 * Así la topología de aristas de la semilla 0 sigue siendo local en todas.
 */
export function buildCorrelatedSeeds(
  layout: MeshLayout,
  count: number,
  rootSeed: number,
  jitterAmount = 0.08,
): Point[][] {
  const baseRand = seededRandom((rootSeed >>> 0) || 42);
  const seeds: Point[][] = [sampleVerticalPoints(layout, count, baseRand)];
  for (let s = 1; s < SEED_COUNT; s += 1) {
    const rand = seededRandom(((rootSeed >>> 0) + s * 9973) >>> 0);
    seeds.push(jitterPoints(seeds[0], layout, rand, jitterAmount));
  }
  return seeds;
}

/** Conserva solo aristas que siguen siendo locales en todas las semillas. */
export function filterPairsLocalInAllSeeds(
  pairs: Array<[number, number]>,
  seeds: Point[][],
  layout: MeshLayout,
): Array<[number, number]> {
  return pairs.filter(([i, j]) =>
    seeds.every((seed) => {
      const a = seed[i];
      const b = seed[j];
      return a && b && edgeIsLocal(a, b, layout);
    }),
  );
}

export function buildMeshPlan(
  layout: MeshLayout,
  count: number,
  rootSeed: number,
  neighbors: number,
) {
  const seeds = buildCorrelatedSeeds(layout, count, rootSeed);
  const rawPairs = edgePairsFor(seeds[0], layout, neighbors);
  const pairs = filterPairsLocalInAllSeeds(rawPairs, seeds, layout);
  return { seeds, pairs, rawPairCount: rawPairs.length };
}

/** Variante defectuosa (histórica): 3 muestreos independientes con mismos índices. */
export function buildIndependentSeeds(
  layout: MeshLayout,
  count: number,
  rootSeed: number,
): Point[][] {
  const seeds: Point[][] = [];
  for (let s = 0; s < SEED_COUNT; s += 1) {
    const rand = seededRandom(((rootSeed >>> 0) + s * 9973) >>> 0);
    seeds.push(sampleVerticalPoints(layout, count, rand));
  }
  return seeds;
}

export type EdgeStats = {
  count: number;
  maxLen: number;
  meanLen: number;
  longCount: number;
  maxDy: number;
};

export function edgeStatsForSeed(
  points: Point[],
  pairs: Array<[number, number]>,
  layout: MeshLayout,
): EdgeStats {
  const { maxLink, maxDy } = linkLimits(layout);
  let maxLen = 0;
  let sum = 0;
  let longCount = 0;
  let maxEdgeDy = 0;
  for (const [i, j] of pairs) {
    const a = points[i];
    const b = points[j];
    const len = edgeLength(a, b);
    const dy = Math.abs(a[1] - b[1]);
    maxLen = Math.max(maxLen, len);
    maxEdgeDy = Math.max(maxEdgeDy, dy);
    sum += len;
    if (len > maxLink || dy > maxDy) longCount += 1;
  }
  return {
    count: pairs.length,
    maxLen,
    meanLen: pairs.length ? sum / pairs.length : 0,
    longCount,
    maxDy: maxEdgeDy,
  };
}

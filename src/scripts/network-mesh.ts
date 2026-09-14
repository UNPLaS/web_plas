/** Malla vertical (~200 nodos) + 3 semillas correlacionadas; restore por snap. */

import {
  buildMeshPlan,
  meshLayoutForPage as layoutForPage,
  SEED_COUNT,
  type MeshLayout,
  type Point,
} from './network-mesh-core';

export type { MeshLayout } from './network-mesh-core';
export { DRIFT_MARGIN } from './network-mesh-constants';

const SVG_NS = 'http://www.w3.org/2000/svg';

const NODE_SPEED_MIN = 0.022;
const NODE_SPEED_MAX = 0.055;
const DOM_EVERY_N_FRAMES = 4;
/** Subir al cambiar reglas de topología para forzar rebuild. */
const MESH_REV = 6;

type LiveNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  el: SVGCircleElement;
};

type LiveEdge = {
  a: number;
  b: number;
  el: SVGLineElement;
};

let liveNodes: LiveNode[] = [];
let liveEdges: LiveEdge[] = [];
let liveLayout: MeshLayout | null = null;
let driftFrame = 0;

let seeds: Point[][] = [];
let activeSeed = 0;

let builtW = 0;
let builtH = 0;
let builtRev = 0;

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clearGroup(group: SVGGElement): void {
  while (group.firstChild) group.removeChild(group.firstChild);
}

export function meshLayoutForPage(W: number, H: number): MeshLayout {
  const compact =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  return layoutForPage(W, H, compact);
}

function applyPositions(points: Point[]): void {
  for (let i = 0; i < liveNodes.length; i += 1) {
    const p = points[i];
    if (!p) continue;
    const node = liveNodes[i];
    node.x = p[0];
    node.y = p[1];
    node.el.setAttribute('cx', p[0].toFixed(2));
    node.el.setAttribute('cy', p[1].toFixed(2));
  }
  for (const edge of liveEdges) {
    const a = liveNodes[edge.a];
    const b = liveNodes[edge.b];
    if (!a || !b) continue;
    edge.el.setAttribute('x1', a.x.toFixed(2));
    edge.el.setAttribute('y1', a.y.toFixed(2));
    edge.el.setAttribute('x2', b.x.toFixed(2));
    edge.el.setAttribute('y2', b.y.toFixed(2));
  }
}

function writeLayoutDataset(mesh: SVGGElement, layout: MeshLayout): void {
  mesh.dataset.cx = String(layout.cx);
  mesh.dataset.cy = String(layout.cy);
  mesh.dataset.halfW = String(layout.halfW);
  mesh.dataset.halfH = String(layout.halfH);
}

/**
 * Construye (o reutiliza) la malla: 3 semillas correlacionadas + DOM estable.
 */
export function renderNetworkMesh(
  mesh: SVGGElement,
  W: number,
  H: number,
  layout?: MeshLayout,
  baseSeed = 42,
): MeshLayout {
  const nextLayout = layout ?? meshLayoutForPage(W, H);

  const sameSize = Math.abs(W - builtW) < 3 && Math.abs(H - builtH) < 3;
  const sameShape =
    liveLayout &&
    Math.abs(liveLayout.halfW - nextLayout.halfW) < 2 &&
    Math.abs(liveLayout.halfH - nextLayout.halfH) < 2;
  if (
    sameSize &&
    sameShape &&
    builtRev === MESH_REV &&
    liveNodes.length > 0 &&
    seeds.length === SEED_COUNT
  ) {
    liveLayout = nextLayout;
    writeLayoutDataset(mesh, nextLayout);
    return nextLayout;
  }

  clearGroup(mesh);
  liveNodes = [];
  liveEdges = [];
  driftFrame = 0;
  liveLayout = nextLayout;
  builtW = W;
  builtH = H;
  builtRev = MESH_REV;

  const compact = window.matchMedia('(max-width: 767px)').matches;
  const count = compact ? 140 : 200;
  const neighbors = compact ? 4 : 5;

  const rootSeed = (baseSeed >>> 0) || 42;
  const plan = buildMeshPlan(nextLayout, count, rootSeed, neighbors);
  seeds = plan.seeds;
  activeSeed = 0;

  const points = seeds[0];
  const pairs = plan.pairs;

  const edgesG = document.createElementNS(SVG_NS, 'g');
  edgesG.setAttribute('class', 'float-graphs__edges');
  const nodesG = document.createElementNS(SVG_NS, 'g');
  nodesG.setAttribute('class', 'float-graphs__nodes');

  for (const [i, j] of pairs) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[j];
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    edgesG.appendChild(line);
    liveEdges.push({ a: i, b: j, el: line });
  }

  const nodeR = compact ? '4.2' : '5';
  const rand = seededRandom(rootSeed ^ 0x9e3779b9);
  for (const [x, y] of points) {
    const el = document.createElementNS(SVG_NS, 'circle');
    el.setAttribute('cx', String(x));
    el.setAttribute('cy', String(y));
    el.setAttribute('r', nodeR);
    nodesG.appendChild(el);

    const angle = rand() * Math.PI * 2;
    const speed = NODE_SPEED_MIN + rand() * (NODE_SPEED_MAX - NODE_SPEED_MIN);
    liveNodes.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      el,
    });
  }

  mesh.appendChild(edgesG);
  mesh.appendChild(nodesG);
  writeLayoutDataset(mesh, nextLayout);

  return nextLayout;
}

/**
 * Snap instantáneo a una semilla (corrige drift local).
 * `cycle: true` avanza a la siguiente semilla; si no, restaura la activa.
 */
export function snapToSeed(opts?: { cycle?: boolean }): boolean {
  if (seeds.length < SEED_COUNT || liveNodes.length === 0) return false;
  const target = opts?.cycle ? (activeSeed + 1) % SEED_COUNT : activeSeed;
  activeSeed = target;
  applyPositions(seeds[activeSeed]);
  return true;
}

function containInEllipse(node: LiveNode, layout: MeshLayout): void {
  const { cx, cy, halfW, halfH } = layout;
  const nx = (node.x - cx) / halfW;
  const ny = (node.y - cy) / halfH;
  const d2 = nx * nx + ny * ny;
  if (d2 <= 1 || d2 < 1e-8) return;

  const d = Math.sqrt(d2);
  const ux = nx / d;
  const uy = ny / d;
  const wx = node.vx / halfW;
  const wy = node.vy / halfH;
  const radial = wx * ux + wy * uy;
  if (radial > 0) {
    node.vx -= 2 * radial * ux * halfW;
    node.vy -= 2 * radial * uy * halfH;
  }
  node.x = cx + ux * halfW * 0.995;
  node.y = cy + uy * halfH * 0.995;
}

export function tickNodeDrift(): void {
  if (liveNodes.length === 0) return;
  const layout = liveLayout;
  if (!layout) return;

  for (const node of liveNodes) {
    node.x += node.vx;
    node.y += node.vy;
    containInEllipse(node, layout);
  }

  driftFrame += 1;
  if (driftFrame % DOM_EVERY_N_FRAMES !== 0) return;

  for (const node of liveNodes) {
    node.el.setAttribute('cx', node.x.toFixed(2));
    node.el.setAttribute('cy', node.y.toFixed(2));
  }
  for (const edge of liveEdges) {
    const a = liveNodes[edge.a];
    const b = liveNodes[edge.b];
    if (!a || !b) continue;
    edge.el.setAttribute('x1', a.x.toFixed(2));
    edge.el.setAttribute('y1', a.y.toFixed(2));
    edge.el.setAttribute('x2', b.x.toFixed(2));
    edge.el.setAttribute('y2', b.y.toFixed(2));
  }
}

export function readMeshLayout(mesh: SVGGElement): MeshLayout | null {
  const cx = Number(mesh.dataset.cx);
  const cy = Number(mesh.dataset.cy);
  const halfW = Number(mesh.dataset.halfW);
  const halfH = Number(mesh.dataset.halfH);
  if (![cx, cy, halfW, halfH].every((n) => Number.isFinite(n) && n > 0)) return null;
  return { cx, cy, halfW, halfH };
}

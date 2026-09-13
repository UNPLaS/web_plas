/** Malla circular a escala de página (nodos + aristas) + deriva interna. */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Velocidad interna por nodo (px/frame) — lenta, un poco más viva. */
const NODE_SPEED_MIN = 0.028;
const NODE_SPEED_MAX = 0.07;
/** Escribir al DOM cada N frames (la física corre en todos). */
const DOM_EVERY_N_FRAMES = 4;

export type MeshLayout = {
  cx: number;
  cy: number;
  radius: number;
};

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
let liveCx = 0;
let liveCy = 0;
let liveR2 = 0;
let driftFrame = 0;

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

function dist2(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

/**
 * Disco a escala del lienzo completo (presencia ≈ malla full-page anterior).
 */
export function meshLayoutForPage(W: number, H: number): MeshLayout {
  const cx = W * 0.62;
  const cy = H * 0.48;
  const radius = Math.hypot(W, H) * 0.58;
  return { cx, cy, radius };
}

/**
 * Red irregular en forma de círculo a escala de página.
 * Cada nodo recibe una dirección aleatoria de deriva lenta.
 */
export function renderNetworkMesh(
  mesh: SVGGElement,
  W: number,
  H: number,
  layout?: MeshLayout,
  seed = 42,
): MeshLayout {
  clearGroup(mesh);
  liveNodes = [];
  liveEdges = [];
  driftFrame = 0;

  const { cx, cy, radius } = layout ?? meshLayoutForPage(W, H);
  liveCx = cx;
  liveCy = cy;
  liveR2 = radius * radius;

  const compact = window.matchMedia('(max-width: 767px)').matches;
  const rand = seededRandom(seed >>> 0 || 42);
  const count = compact ? 360 : 650;
  const radius2 = liveR2;

  const points: Array<[number, number]> = [];
  let guard = 0;
  while (points.length < count && guard < count * 10) {
    guard += 1;
    const t = rand() * Math.PI * 2;
    const u = Math.sqrt(rand());
    const r = radius * (0.08 + u * 0.92);
    points.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
  }

  const core = compact ? 5 : 8;
  for (let i = 0; i < core; i++) {
    const t = (i / core) * Math.PI * 2 + rand() * 0.35;
    const r = radius * (0.04 + rand() * 0.1);
    points.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]);
  }

  const cell = radius / Math.sqrt(count / Math.PI);
  const maxLink = cell * (compact ? 2.2 : 2.4);
  const maxLink2 = maxLink * maxLink;
  const neighbors = compact ? 3 : 4;
  const seen = new Set<string>();
  const edgePairs: Array<[number, number]> = [];

  const edgesG = document.createElementNS(SVG_NS, 'g');
  edgesG.setAttribute('class', 'float-graphs__edges');
  const nodesG = document.createElementNS(SVG_NS, 'g');
  nodesG.setAttribute('class', 'float-graphs__nodes');

  for (let i = 0; i < points.length; i++) {
    const scored: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const d = dist2(points[i], points[j]);
      if (d > maxLink2 || d < 1) continue;
      const midX = (points[i][0] + points[j][0]) / 2;
      const midY = (points[i][1] + points[j][1]) / 2;
      if ((midX - cx) ** 2 + (midY - cy) ** 2 > radius2 * 1.05) continue;
      scored.push({ j, d });
    }
    scored.sort((a, b) => a.d - b.d);
    for (const { j } of scored.slice(0, neighbors)) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edgePairs.push([i, j]);
    }
  }

  for (const [i, j] of edgePairs) {
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

  const nodeR = compact ? '4.5' : '5.5';
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

  mesh.dataset.cx = String(cx);
  mesh.dataset.cy = String(cy);
  mesh.dataset.radius = String(radius);

  return { cx, cy, radius };
}

/** Avanza la deriva interna; el DOM se actualiza cada N frames. */
export function tickNodeDrift(): void {
  if (liveNodes.length === 0) return;

  const cx = liveCx;
  const cy = liveCy;
  const r2 = liveR2;

  for (const node of liveNodes) {
    node.x += node.vx;
    node.y += node.vy;

    const dx = node.x - cx;
    const dy = node.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 > r2 && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const ny = dy / d;
      const radial = node.vx * nx + node.vy * ny;
      if (radial > 0) {
        node.vx -= 2 * radial * nx;
        node.vy -= 2 * radial * ny;
      }
      const r = Math.sqrt(r2) * 0.998;
      node.x = cx + nx * r;
      node.y = cy + ny * r;
    }
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

/**
 * Layout responsivo + deriva lenta de nodos en grafos de temas:
 * canvas alto en mobile, etiquetas legibles, sin solaparse.
 */

type SimNode = {
  el: SVGGElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pad: number;
  halfW: number;
};

type SimEdge = {
  line: SVGLineElement;
  a: number;
  b: number;
};

type GraphSim = {
  root: HTMLElement;
  svg: SVGSVGElement;
  nodes: SimNode[];
  edges: SimEdge[];
  w: number;
  h: number;
  mobile: boolean;
};

const DESKTOP = { w: 1100, h: 460, padX: 72, padY: 48 } as const;
const MOBILE = { w: 420, h: 680, padX: 48, padY: 40 } as const;

const SPEED = 0.055;
const DAMP = 0.992;
const MAX_V = 0.22;
const JITTER = 0.012;
const EDGE_PAD = 8;
const MOBILE_MQ = '(max-width: 767px)';

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobile() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function radiusFor(weight: number, mobile: boolean) {
  const base = mobile ? 15 : 12;
  const step = mobile ? 3.2 : 2.6;
  return base + Math.min(weight, 5) * step;
}

function labelMetrics(el: SVGGElement, r: number, mobile: boolean) {
  const label = el.querySelector('text')?.textContent?.trim() || '';
  const charW = mobile ? 8.2 : 6.4;
  const halfW = Math.max(r + 10, (label.length * charW) / 2 + 4);
  const pad = r + (mobile ? 22 : 16);
  return { halfW, pad };
}

function placeFromNormalized(
  nx: number,
  ny: number,
  w: number,
  h: number,
  padX: number,
  padY: number,
) {
  return {
    x: padX + nx * (w - padX * 2),
    y: padY + ny * (h - padY * 2),
  };
}

function applyStaticLayout(root: HTMLElement, mobile: boolean) {
  const svg = root.querySelector<SVGSVGElement>('.topic-graph__svg');
  if (!svg) return null;

  const box = mobile ? MOBILE : DESKTOP;
  svg.setAttribute('viewBox', `0 0 ${box.w} ${box.h}`);
  root.classList.toggle('topic-graph--mobile', mobile);

  const nodeEls = [...svg.querySelectorAll<SVGGElement>('.topic-graph__node')];
  const indexById = new Map<string, number>();
  const positions: { x: number; y: number; r: number; pad: number; halfW: number }[] = [];

  nodeEls.forEach((el, i) => {
    const id = el.dataset.nodeId || String(i);
    indexById.set(id, i);
    const nx = Number(el.dataset.nx ?? 0.5);
    const ny = Number(el.dataset.ny ?? 0.5);
    const weight = Number(el.dataset.weight ?? 3);
    const r = radiusFor(weight, mobile);
    const { x, y } = placeFromNormalized(nx, ny, box.w, box.h, box.padX, box.padY);
    const { halfW, pad } = labelMetrics(el, r, mobile);

    const circle = el.querySelector('circle');
    const text = el.querySelector('text');
    if (circle) circle.setAttribute('r', String(r));
    if (text) {
      text.setAttribute('y', String(r + (mobile ? 20 : 16)));
      text.setAttribute('font-size', mobile ? '18' : '13');
    }
    el.setAttribute('transform', `translate(${x} ${y})`);
    positions.push({ x, y, r, pad, halfW });
  });

  svg.querySelectorAll<SVGLineElement>('.topic-graph__edges line').forEach((line) => {
    const aId = line.dataset.source || '';
    const bId = line.dataset.target || '';
    const ai = indexById.get(aId);
    const bi = indexById.get(bId);
    if (ai == null || bi == null) return;
    const a = positions[ai];
    const b = positions[bi];
    line.setAttribute('x1', String(a.x));
    line.setAttribute('y1', String(a.y));
    line.setAttribute('x2', String(b.x));
    line.setAttribute('y2', String(b.y));
    if (mobile) {
      const sw = Number(line.getAttribute('stroke-width') || 2);
      line.setAttribute('stroke-width', String(Math.max(sw, 2.2)));
    }
  });

  return { svg, nodeEls, indexById, positions, box, mobile };
}

function buildSim(root: HTMLElement): GraphSim | null {
  const mobile = isMobile();
  const layout = applyStaticLayout(root, mobile);
  if (!layout) return null;

  const { svg, nodeEls, indexById, positions, box } = layout;
  const sepBoost = mobile ? 1.55 : 1.35;

  const nodes: SimNode[] = nodeEls.map((el, i) => {
    const p = positions[i];
    const angle = (i / nodeEls.length) * Math.PI * 2;
    const speed = mobile ? SPEED * 0.55 : SPEED;
    return {
      el,
      x: p.x,
      y: p.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: p.r,
      pad: p.pad * (mobile ? 1.08 : 1),
      halfW: p.halfW,
    };
  });

  const edges: SimEdge[] = [];
  svg.querySelectorAll<SVGLineElement>('.topic-graph__edges line').forEach((line) => {
    const aId = line.dataset.source || '';
    const bId = line.dataset.target || '';
    const a = indexById.get(aId);
    const b = indexById.get(bId);
    if (a == null || b == null) return;
    edges.push({ line, a, b });
  });

  // stash separation factor on root for step
  root.dataset.sep = String(sepBoost);

  return { root, svg, nodes, edges, w: box.w, h: box.h, mobile };
}

function applyBounds(n: SimNode, w: number, h: number) {
  const minX = n.halfW + EDGE_PAD;
  const maxX = w - n.halfW - EDGE_PAD;
  const minY = n.r + EDGE_PAD + 6;
  const maxY = h - n.pad - EDGE_PAD;

  if (n.x < minX) {
    n.x = minX;
    n.vx = Math.abs(n.vx) * 0.8;
  } else if (n.x > maxX) {
    n.x = maxX;
    n.vx = -Math.abs(n.vx) * 0.8;
  }

  if (n.y < minY) {
    n.y = minY;
    n.vy = Math.abs(n.vy) * 0.8;
  } else if (n.y > maxY) {
    n.y = maxY;
    n.vy = -Math.abs(n.vy) * 0.8;
  }
}

function separate(nodes: SimNode[], sep: number) {
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const minDist = (a.pad + b.pad) * sep * 0.72;
      const labelClash =
        Math.abs(dx) < (a.halfW + b.halfW) * 0.9 &&
        Math.abs(dy) < (a.pad + b.pad) * 0.5;
      if (dist >= minDist && !labelClash) continue;
      const target = labelClash ? Math.max(minDist, dist + 12) : minDist;
      const push = ((target - dist) / dist) * 0.05;
      const ox = dx * push;
      const oy = dy * push;
      a.x -= ox;
      a.y -= oy;
      b.x += ox;
      b.y += oy;
      a.vx -= ox * 0.08;
      a.vy -= oy * 0.08;
      b.vx += ox * 0.08;
      b.vy += oy * 0.08;
    }
  }
}

function clampVelocity(n: SimNode, mobile: boolean) {
  const maxV = mobile ? MAX_V * 0.65 : MAX_V;
  const speed = mobile ? SPEED * 0.55 : SPEED;
  const sp = Math.hypot(n.vx, n.vy);
  if (sp > maxV) {
    n.vx = (n.vx / sp) * maxV;
    n.vy = (n.vy / sp) * maxV;
  }
  if (sp < speed * 0.35) {
    const angle = Math.random() * Math.PI * 2;
    n.vx += Math.cos(angle) * speed * 0.25;
    n.vy += Math.sin(angle) * speed * 0.25;
  }
}

function paint(sim: GraphSim) {
  for (const n of sim.nodes) {
    n.el.setAttribute('transform', `translate(${n.x.toFixed(2)} ${n.y.toFixed(2)})`);
  }
  for (const e of sim.edges) {
    const a = sim.nodes[e.a];
    const b = sim.nodes[e.b];
    e.line.setAttribute('x1', a.x.toFixed(2));
    e.line.setAttribute('y1', a.y.toFixed(2));
    e.line.setAttribute('x2', b.x.toFixed(2));
    e.line.setAttribute('y2', b.y.toFixed(2));
  }
}

function step(sim: GraphSim) {
  const sep = Number(sim.root.dataset.sep || 1.35);
  for (const n of sim.nodes) {
    n.vx += (Math.random() - 0.5) * (sim.mobile ? JITTER * 0.7 : JITTER);
    n.vy += (Math.random() - 0.5) * (sim.mobile ? JITTER * 0.7 : JITTER);
    n.vx *= DAMP;
    n.vy *= DAMP;
    clampVelocity(n, sim.mobile);
    n.x += n.vx;
    n.y += n.vy;
  }
  separate(sim.nodes, sep);
  for (const n of sim.nodes) applyBounds(n, sim.w, sim.h);
  paint(sim);
}

let raf = 0;
let sims: GraphSim[] = [];
let visibilityBound = false;
let resizeBound = false;
let resizeTimer = 0;

function onVisibility() {
  if (document.hidden) {
    window.cancelAnimationFrame(raf);
    raf = 0;
  } else if (!raf && sims.length > 0 && !reducedMotion()) {
    raf = window.requestAnimationFrame(loop);
  }
}

function loop() {
  for (const sim of sims) step(sim);
  raf = window.requestAnimationFrame(loop);
}

export function stopTopicGraphMotion() {
  window.cancelAnimationFrame(raf);
  raf = 0;
  sims = [];
}

function startMotion() {
  if (reducedMotion() || sims.length === 0) return;
  if (!raf) raf = window.requestAnimationFrame(loop);
}

export function initTopicGraphMotion() {
  stopTopicGraphMotion();

  const roots = [...document.querySelectorAll<HTMLElement>('.topic-graph')];
  // Always apply layout (even with reduced motion) so mobile stays readable
  if (reducedMotion()) {
    for (const root of roots) applyStaticLayout(root, isMobile());
    return;
  }

  sims = roots.map(buildSim).filter((s): s is GraphSim => Boolean(s));
  if (sims.length === 0) return;

  if (!visibilityBound) {
    visibilityBound = true;
    document.addEventListener('visibilitychange', onVisibility);
  }

  if (!resizeBound) {
    resizeBound = true;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        initTopicGraphMotion();
      }, 180);
    });
  }

  startMotion();
}

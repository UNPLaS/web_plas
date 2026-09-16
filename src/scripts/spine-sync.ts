import {
  SPINE_DX_PER_DY,
  SPINE_MAX_BOUNCES,
  SPINE_START_X_FRAC,
} from '../data/spine-geometry';
import { renderNetworkMesh } from './network-mesh';
import { syncNetworkDriftLayout } from './network-drift';

function yRelativeToShell(el: HTMLElement, shell: HTMLElement): number {
  const s = shell.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return r.top - s.top + shell.scrollTop;
}

function xRelativeToShell(el: HTMLElement, shell: HTMLElement): number {
  const s = shell.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return r.left - s.left + shell.scrollLeft;
}

/**
 * Polilínea con |pendiente| constante: al tocar un borde lateral
 * solo se invierte la dirección horizontal (mismo ángulo).
 */
function buildSpinePoints(
  startX: number,
  startY: number,
  W: number,
  H: number,
  k: number,
  maxBounces: number,
): Array<[number, number]> {
  const points: Array<[number, number]> = [[startX, startY]];
  let x = startX;
  let y = startY;
  /** -1 izquierda, +1 derecha */
  let dir = -1;
  let bounces = 0;

  while (bounces < maxBounces && y < H - 0.5) {
    const xEdge = dir < 0 ? 0 : W;
    const dxToEdge = Math.abs(xEdge - x);
    const dyToEdge = dxToEdge / k;
    const yHit = y + dyToEdge;

    if (yHit >= H) {
      const dy = H - y;
      const xEnd = x + dir * dy * k;
      points.push([Math.max(0, Math.min(W, xEnd)), H]);
      break;
    }

    x = xEdge;
    y = yHit;
    points.push([x, y]);
    dir *= -1;
    bounces += 1;
  }

  return points;
}

/** Región a la izquierda de la espina (cerrada por borde izq. / pie). */
function leftFillD(points: Array<[number, number]>, W: number, H: number): string {
  if (points.length < 2) return '';
  const [sx, sy] = points[0];
  let d = `M 0,0 L ${sx},0 L ${sx},${sy}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]},${points[i][1]}`;
  }
  const [lx, ly] = points[points.length - 1];
  if (ly < H - 0.5) {
    d += ` L ${lx},${H}`;
  }
  d += ` L 0,${H} L 0,0 Z`;
  return d;
}

/** Región a la derecha de la espina (cerrada por borde der. / pie). */
function rightFillD(points: Array<[number, number]>, W: number, H: number): string {
  if (points.length < 2) return '';
  const [sx, sy] = points[0];
  let d = `M ${W},0 L ${sx},0 L ${sx},${sy}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]},${points[i][1]}`;
  }
  const [lx, ly] = points[points.length - 1];
  if (ly < H - 0.5) {
    d += ` L ${lx},${H}`;
  }
  d += ` L ${W},${H} L ${W},0 Z`;
  return d;
}

function syncFloatNetwork(W: number, H: number, rightD: string): void {
  const floatSvg = document.querySelector<SVGSVGElement>('.float-graphs');
  const clip = document.querySelector<SVGPathElement>('.float-graphs__clip');
  const mesh = document.querySelector<SVGGElement>('.float-graphs__mesh');
  if (!floatSvg || !clip || !mesh) return;

  floatSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  clip.setAttribute('d', rightD);
  renderNetworkMesh(mesh, W, H);
  syncNetworkDriftLayout();
}

export function syncSpineAndHeroPanel(): void {
  const shell = document.querySelector<HTMLElement>('.page-shell');
  const svg = document.querySelector<SVGSVGElement>('.spine');
  const path = document.querySelector<SVGPolylineElement>('.spine__path');
  const fillLeft = document.querySelector<SVGPathElement>('.spine__fill--left');
  const fillRight = document.querySelector<SVGPathElement>('.spine__fill--right');
  const hero = document.querySelector<HTMLElement>('.hero');
  const panel = document.querySelector<HTMLElement>('.hero__panel');

  if (!shell || !svg || !path) return;

  shell.classList.add('page-shell--split');

  const W = shell.offsetWidth;
  const H = Math.max(shell.offsetHeight, window.innerHeight);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const startX = W * SPINE_START_X_FRAC;
  let startY = 0;

  if (hero) {
    // Origen de la diagonal = borde superior del hero dentro del shell
    startY = Math.max(0, yRelativeToShell(hero, shell));
    const heroH = hero.offsetHeight;
    const heroX = xRelativeToShell(hero, shell);
    const heroW = hero.offsetWidth || W;

    if (panel && window.matchMedia('(min-width: 1200px)').matches && heroW > 0) {
      // Misma pendiente que el spine: x = startX - (y - startY) * k
      const topX = startX;
      const bottomX = startX - heroH * SPINE_DX_PER_DY;
      const topPct = ((topX - heroX) / heroW) * 100;
      const bottomPct = ((bottomX - heroX) / heroW) * 100;
      panel.style.clipPath = `polygon(0% 0%, ${topPct}% 0%, ${bottomPct}% 100%, 0% 100%)`;
    } else if (panel) {
      panel.style.clipPath = '';
    }
  }

  const points = buildSpinePoints(
    startX,
    startY,
    W,
    H,
    SPINE_DX_PER_DY,
    SPINE_MAX_BOUNCES,
  );

  path.setAttribute('points', points.map(([px, py]) => `${px},${py}`).join(' '));

  const leftD = leftFillD(points, W, H);
  const rightD = rightFillD(points, W, H);
  if (fillLeft) fillLeft.setAttribute('d', leftD);
  if (fillRight) fillRight.setAttribute('d', rightD);

  syncFloatNetwork(W, H, rightD);
}

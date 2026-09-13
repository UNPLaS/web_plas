import {
  SPINE_DX_PER_DY,
  SPINE_MAX_BOUNCES,
  SPINE_START_X_FRAC,
} from '../data/spine-geometry';

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

export function syncSpineAndHeroPanel(): void {
  const shell = document.querySelector<HTMLElement>('.page-shell');
  const svg = document.querySelector<SVGSVGElement>('.spine');
  const path = document.querySelector<SVGPolylineElement>('.spine__path');
  const hero = document.querySelector<HTMLElement>('.hero');
  const panel = document.querySelector<HTMLElement>('.hero__panel');

  if (!shell || !svg || !path) return;

  const W = shell.offsetWidth;
  const H = Math.max(shell.offsetHeight, window.innerHeight);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const startX = W * SPINE_START_X_FRAC;
  let startY = 0;

  if (hero) {
    startY = yRelativeToShell(hero, shell);
    const heroH = hero.offsetHeight;
    const heroX = xRelativeToShell(hero, shell);
    const heroW = hero.offsetWidth;

    if (panel && window.matchMedia('(min-width: 768px)').matches) {
      const topPct = ((startX - heroX) / heroW) * 100;
      const bottomX = startX - heroH * SPINE_DX_PER_DY;
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
}

/**
 * Deriva continua a velocidad fija.
 * Dirección = última del mouse (sin dependender de su velocidad).
 * Restore por umbral de deriva: fade → ancla → fade in.
 */

import { renderNetworkMesh, tickNodeDrift, type MeshLayout } from './network-mesh';

const SPEED = 0.16;
const MAX_DRIFT = 130;
const RESTORE_AT = MAX_DRIFT * 0.92;
const FADE_MS = 1100;
const MIN_DIR_DELTA = 0.5;

let offsetX = 0;
let offsetY = 0;
let dirX = 0.55;
let dirY = -0.25;
let lastX = 0;
let lastY = 0;
let hasPoint = false;
let raf = 0;
let mesh: SVGGElement | null = null;
let layout: MeshLayout | null = null;
let running = false;
let restoring = false;

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function normalize(x: number, y: number): [number, number] | null {
  const len = Math.hypot(x, y);
  if (len < 1e-6) return null;
  return [x / len, y / len];
}

function applyTransform(): void {
  if (!mesh) return;
  mesh.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0)`;
}

function readLayoutFromMesh(): MeshLayout | null {
  if (!mesh) return null;
  const cx = Number(mesh.dataset.cx);
  const cy = Number(mesh.dataset.cy);
  const radius = Number(mesh.dataset.radius);
  if (![cx, cy, radius].every((n) => Number.isFinite(n))) return null;
  return { cx, cy, radius };
}

function pageSizeFromSvg(): { W: number; H: number } | null {
  if (!mesh) return null;
  const svg = mesh.ownerSVGElement;
  if (!svg) return null;
  const vb = svg.viewBox.baseVal;
  if (!vb.width || !vb.height) return null;
  return { W: vb.width, H: vb.height };
}

function reshuffleMesh(): void {
  if (!mesh) return;
  const size = pageSizeFromSvg();
  if (!size) return;
  const seed = (Math.random() * 0xffffffff) >>> 0;
  layout = renderNetworkMesh(mesh, size.W, size.H, layout ?? undefined, seed || 1);
}

function driftDistance(): number {
  return Math.hypot(offsetX, offsetY);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function restoreToAnchor(): Promise<void> {
  if (!mesh || restoring) return;
  restoring = true;

  mesh.classList.add('float-graphs__mesh--fading');
  await wait(FADE_MS);

  offsetX = 0;
  offsetY = 0;
  applyTransform();
  reshuffleMesh();
  hasPoint = false;
  await wait(48);

  mesh.classList.remove('float-graphs__mesh--fading');
  await wait(FADE_MS);

  restoring = false;
}

function tick(): void {
  if (!running || !mesh) return;

  if (!reducedMotion()) {
    tickNodeDrift();

    if (!restoring) {
      offsetX += dirX * SPEED;
      offsetY += dirY * SPEED;
      applyTransform();

      if (driftDistance() >= RESTORE_AT) {
        void restoreToAnchor();
      }
    }
  }

  raf = requestAnimationFrame(tick);
}

function onPointerMove(event: PointerEvent): void {
  if (!running || reducedMotion()) return;

  if (!hasPoint) {
    lastX = event.clientX;
    lastY = event.clientY;
    hasPoint = true;
    return;
  }

  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;
  lastX = event.clientX;
  lastY = event.clientY;

  if (Math.hypot(dx, dy) < MIN_DIR_DELTA) return;

  const next = normalize(dx, dy);
  if (!next) return;
  dirX = next[0];
  dirY = next[1];
}

export function syncNetworkDriftLayout(): void {
  mesh = document.querySelector<SVGGElement>('.float-graphs__mesh');
  layout = readLayoutFromMesh();
}

export function startNetworkDrift(): void {
  mesh = document.querySelector<SVGGElement>('.float-graphs__mesh');
  layout = readLayoutFromMesh();
  if (!mesh || running) return;

  if (reducedMotion()) {
    mesh.style.transform = '';
    mesh.classList.remove('float-graphs__mesh--fading');
    return;
  }

  running = true;
  applyTransform();
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  raf = requestAnimationFrame(tick);
}

export function stopNetworkDrift(): void {
  running = false;
  hasPoint = false;
  restoring = false;
  window.removeEventListener('pointermove', onPointerMove);
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  if (mesh) {
    mesh.style.transform = '';
    mesh.classList.remove('float-graphs__mesh--fading');
  }
}

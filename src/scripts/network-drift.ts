/**
 * Deriva del grupo: margen 140 en ancho y alto.
 * Al umbral: fade → snap a semilla (corrige drift) → fade in.
 * Cada N restores cicla a la siguiente semilla.
 */

import {
  DRIFT_MARGIN,
  readMeshLayout,
  snapToSeed,
  tickNodeDrift,
  type MeshLayout,
} from './network-mesh';

const SPEED = 0.16;
const FADE_MS = 900;
const MIN_DIR_DELTA = 0.5;
/** Ciclar semilla cada N restores (el resto solo corrige drift). */
const CYCLE_EVERY = 2;

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
let restoreCount = 0;

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

function pastDriftMargin(): boolean {
  return Math.abs(offsetX) >= DRIFT_MARGIN || Math.abs(offsetY) >= DRIFT_MARGIN;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function restoreToSeed(): Promise<void> {
  if (!mesh || restoring) return;
  restoring = true;

  mesh.classList.add('float-graphs__mesh--fading');
  await wait(FADE_MS * 0.45);

  offsetX = 0;
  offsetY = 0;
  applyTransform();
  hasPoint = false;

  restoreCount += 1;
  const cycle = restoreCount % CYCLE_EVERY === 0;
  snapToSeed({ cycle });

  await wait(48);
  mesh.classList.remove('float-graphs__mesh--fading');
  await wait(FADE_MS * 0.35);

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

      if (pastDriftMargin()) {
        void restoreToSeed();
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
  layout = mesh ? readMeshLayout(mesh) : null;
}

export function startNetworkDrift(): void {
  const next = document.querySelector<SVGGElement>('.float-graphs__mesh');
  if (!next) {
    stopNetworkDrift();
    return;
  }

  if (running && mesh === next) return;
  stopNetworkDrift();

  mesh = next;
  layout = readMeshLayout(mesh);
  offsetX = 0;
  offsetY = 0;
  restoreCount = 0;

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

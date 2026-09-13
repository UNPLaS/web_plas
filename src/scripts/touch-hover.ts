/**
 * En touch: aplica .is-touch-hover al elemento bajo el dedo
 * (también durante scroll), y lo quita al soltar.
 */

const HOVERABLES =
  '.news-card, .works-card, .project-slide, .faculty-card, .lines-card, .blog-card, .btn, .door-link';

let current: Element | null = null;

function clearTouchHover(): void {
  if (!current) return;
  current.classList.remove('is-touch-hover');
  current = null;
}

function setTouchHover(el: Element | null): void {
  if (el === current) return;
  clearTouchHover();
  if (!el) return;
  current = el;
  current.classList.add('is-touch-hover');
}

function targetFromTouch(touch: Touch): Element | null {
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!el) return null;
  return el.closest(HOVERABLES);
}

function onTouchUpdate(event: TouchEvent): void {
  if (event.touches.length !== 1) {
    clearTouchHover();
    return;
  }
  setTouchHover(targetFromTouch(event.touches[0]));
}

function shouldEnable(): boolean {
  return (
    window.matchMedia('(hover: none)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export function startTouchHover(): void {
  if (!shouldEnable()) return;

  document.addEventListener('touchstart', onTouchUpdate, { passive: true });
  document.addEventListener('touchmove', onTouchUpdate, { passive: true });
  document.addEventListener('touchend', clearTouchHover, { passive: true });
  document.addEventListener('touchcancel', clearTouchHover, { passive: true });
}

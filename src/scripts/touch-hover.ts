/**
 * Solo mobile: aplica .is-touch-hover al hoverable en el centro de la ventana.
 * Se refresca al scroll y cuando cambian galerías/carruseles.
 */

const HOVERABLES =
  '.news-card, .works-card, .project-slide, .faculty-card, .lines-card, .blog-card, .student-card, .door-link, .resource-card, .quote-block';

const GALLERY_ROOTS =
  '[data-carousel], .carousel__track, .news-gallery, .lines-gallery, .faculty-gallery, .works-gallery, .blog-list';

/** Alineado a “teléfono”; tablet/desktop no usan este hover. */
const MOBILE_MQ = '(max-width: 767px)';

/** Franja vertical alrededor del centro (± fracción de la altura). */
const CENTER_BAND = 0.2;

let current: Element | null = null;
let raf = 0;
let bound = false;
let galleryObserver: MutationObserver | null = null;

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

function pickCenterHoverable(): Element | null {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const band = Math.max(72, window.innerHeight * CENTER_BAND);

  let best: Element | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  document.querySelectorAll(HOVERABLES).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    if (r.bottom < cy - band || r.top > cy + band) return;
    if (r.right < 0 || r.left > window.innerWidth) return;

    const elCx = r.left + r.width / 2;
    const elCy = r.top + r.height / 2;
    const dist = Math.hypot(elCx - cx, elCy - cy);
    if (dist < bestDist) {
      bestDist = dist;
      best = el;
    }
  });

  return best;
}

function updateCenterHover(): void {
  if (!shouldEnable()) {
    clearTouchHover();
    return;
  }
  setTouchHover(pickCenterHoverable());
}

function scheduleUpdate(): void {
  if (raf) return;
  raf = window.requestAnimationFrame(() => {
    raf = 0;
    updateCenterHover();
  });
}

/** Forzar recálculo (p. ej. al cambiar slide de un carrusel). */
export function refreshTouchHover(): void {
  if (!shouldEnable()) {
    clearTouchHover();
    return;
  }
  scheduleUpdate();
}

function shouldEnable(): boolean {
  return window.matchMedia(MOBILE_MQ).matches;
}

function observeGalleries(): void {
  galleryObserver?.disconnect();
  galleryObserver = null;
  if (!shouldEnable()) return;

  galleryObserver = new MutationObserver(scheduleUpdate);
  document.querySelectorAll(GALLERY_ROOTS).forEach((node) => {
    galleryObserver?.observe(node, {
      attributes: true,
      attributeFilter: ['style', 'class', 'aria-selected', 'aria-hidden'],
      childList: true,
      subtree: true,
    });
  });
}

function onViewportModeChange(): void {
  if (!shouldEnable()) {
    clearTouchHover();
    galleryObserver?.disconnect();
    galleryObserver = null;
    return;
  }
  observeGalleries();
  scheduleUpdate();
}

export function startTouchHover(): void {
  if (!bound) {
    bound = true;
    window.addEventListener('scroll', scheduleUpdate, { passive: true, capture: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    document.addEventListener('scroll', scheduleUpdate, { passive: true, capture: true });
    document.addEventListener('astro:before-preparation', clearTouchHover);
    document.addEventListener('plas:gallery-update', scheduleUpdate);
    document.addEventListener('transitionend', (event) => {
      const t = event.target;
      if (!(t instanceof Element)) return;
      if (t.closest(GALLERY_ROOTS)) scheduleUpdate();
    });

    const mq = window.matchMedia(MOBILE_MQ);
    mq.addEventListener('change', onViewportModeChange);
  }

  onViewportModeChange();
}

/**
 * Selector ES/EN del encabezado UNAL.
 * - El encabezado persiste entre páginas del mismo idioma, así que su enlace se reapunta en cada
 *   navegación desde `<html data-lang-alt>` (la misma página en el otro idioma).
 * - Elegir idioma lo guarda en `localStorage` (`plas-lang`); la redirección de primera visita
 *   (script inline del Layout) ya no vuelve a actuar.
 * - Cruzar de idioma recarga la página completa: el chrome UNAL cambia de DOM y `unal-chrome.js`
 *   solo engancha sus eventos al cargar.
 */

export const LANG_KEY = 'plas-lang';

function langOfPath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const p = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return p === '/en' || p.startsWith('/en/') ? 'en' : 'es';
}

let listening = false;

export function initLangSwitch() {
  const root = document.documentElement;
  const alt = root.dataset.langAlt;
  document.querySelectorAll<HTMLAnchorElement>('[data-lang-switch]').forEach((a) => {
    if (alt) a.href = alt;
  });

  if (listening) return;
  listening = true;

  document.addEventListener(
    'click',
    (event) => {
      const a = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.origin !== location.origin) return;
      const target = langOfPath(a.pathname);
      if (a.hasAttribute('data-lang-switch')) {
        try {
          localStorage.setItem(LANG_KEY, target);
        } catch {
          /* almacenamiento bloqueado: la elección vale solo para esta visita */
        }
      }
      if (target !== langOfPath(location.pathname)) a.setAttribute('data-astro-reload', '');
    },
    { capture: true },
  );
}

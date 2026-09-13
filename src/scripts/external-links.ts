const CHROME_ROOT =
  '[data-unal-chrome], #unal-header, #unal-footer, #unal-services, #unal-main-nav, .site-header, .site-footer';

/** Marca enlaces externos del contenido para abrir en pestaña nueva.
 *  Nav, header y footer institucionales navegan en la misma pestaña. */
export function markExternalLinks(root: ParentNode = document) {
  root.querySelectorAll('a[href]').forEach((node) => {
    const a = node as HTMLAnchorElement;
    if (a.closest(CHROME_ROOT)) return;

    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    try {
      const url = new URL(href, window.location.href);
      if (url.origin === window.location.origin) return;

      a.target = '_blank';
      const rel = new Set((a.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      rel.add('noreferrer');
      a.rel = [...rel].join(' ');
    } catch {
      /* href inválido */
    }
  });
}

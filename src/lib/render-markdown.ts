import { Marked } from 'marked';
import { withBase } from './with-base';
import { DEFAULT_LANG, localePath, type Lang } from '../i18n';

/** Instancia local: evita contaminar el singleton global de marked. */
const marked = new Marked({
  gfm: true,
  breaks: false,
});

/**
 * Prefija rutas absolutas del sitio en HTML generado (`/images/…`, `/contact`). Los enlaces a
 * páginas (sin extensión de archivo) van además a la versión en `lang`.
 */
function rebaseSiteUrls(html: string, lang: Lang): string {
  return html.replace(/\b(src|href)="(\/[^"]*)"/g, (_match, attr: string, path: string) => {
    const isPage = attr === 'href' && !/\.[a-z0-9]+(?:[?#]|$)/i.test(path);
    return `${attr}="${isPage ? localePath(lang, path) : withBase(path)}"`;
  });
}

/** Compila markdown a HTML seguro para `set:html` en páginas de detalle. */
export function renderMarkdown(source: string, lang: Lang = DEFAULT_LANG): string {
  const md = source.trim();
  if (!md) return '';
  const html = marked.parse(md, { async: false }) as string;
  return rebaseSiteUrls(html, lang);
}

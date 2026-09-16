import { Marked } from 'marked';
import { withBase } from './with-base';

/** Instancia local: evita contaminar el singleton global de marked. */
const marked = new Marked({
  gfm: true,
  breaks: false,
});

/** Prefija rutas absolutas del sitio en HTML generado (`/images/…`, `/contact`). */
function rebaseSiteUrls(html: string): string {
  return html.replace(/\b(src|href)="(\/[^"]*)"/g, (_match, attr: string, path: string) => {
    return `${attr}="${withBase(path)}"`;
  });
}

/** Compila markdown a HTML seguro para `set:html` en páginas de detalle. */
export function renderMarkdown(source: string): string {
  const md = source.trim();
  if (!md) return '';
  const html = marked.parse(md, { async: false }) as string;
  return rebaseSiteUrls(html);
}

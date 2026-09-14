import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: false,
});

/** Compila markdown a HTML seguro para `set:html` en páginas de detalle. */
export function renderMarkdown(source: string): string {
  const md = source.trim();
  if (!md) return '';
  return marked.parse(md, { async: false }) as string;
}

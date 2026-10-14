/**
 * Idiomas del sitio: español en la raíz (`/lines`) e inglés bajo `/en` (`/en/lines`).
 * Las páginas viven en `src/pages/[...lang]/`; `lang` es `undefined` para español.
 */
import { stripBase, withBase } from '../lib/with-base';
import es from './es';
import en from './en';

export const LANGS = ['es', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'es';
export type Dict = typeof es;

const dictionaries: Record<Lang, Dict> = { es, en };

export function t(lang: Lang): Dict {
  return dictionaries[lang];
}

export function langFromParam(param: string | undefined): Lang {
  return param === 'en' ? 'en' : DEFAULT_LANG;
}

/** `getStaticPaths` de una página sin parámetros propios: una ruta por idioma. */
export function langPaths() {
  return LANGS.map((lang) => ({ params: { lang: lang === DEFAULT_LANG ? undefined : lang } }));
}

/** Ruta interna en `lang`, con la base de GitHub Pages. Enlaces externos y `#hash` pasan igual. */
export function localePath(lang: Lang, path: string): string {
  if (!path.startsWith('/')) return path;
  if (lang === DEFAULT_LANG) return withBase(path);
  return withBase(path === '/' ? `/${lang}/` : `/${lang}${path}`);
}

/** Idioma y ruta sin prefijo de un pathname: `/web_plas/en/lines` → `en`, `/lines`. */
export function splitLocale(pathname: string): { lang: Lang; path: string } {
  const p = stripBase(pathname);
  for (const lang of LANGS) {
    if (lang === DEFAULT_LANG) continue;
    if (p === `/${lang}`) return { lang, path: '/' };
    if (p.startsWith(`/${lang}/`)) return { lang, path: p.slice(lang.length + 1) };
  }
  return { lang: DEFAULT_LANG, path: p };
}

/** Idioma de la página que se está renderizando (para componentes: `langOf(Astro.url)`). */
export function langOf(url: URL): Lang {
  return splitLocale(url.pathname).lang;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'es' ? 'en' : 'es';
}

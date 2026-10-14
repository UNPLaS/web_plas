/** Punto de entrada de datos del sitio: navegación y view-models de `content.ts`. */

import { localePath, t, type Lang } from '../i18n';

export { getContent, group, type Content } from './content';

const NAV_PATHS = [
  ['/about', 'about'],
  ['/lines', 'lines'],
  ['/projects', 'projects'],
  ['/blog', 'blog'],
  ['/catalog', 'catalog'],
  ['/resources', 'resources'],
  ['/people', 'people'],
  ['/contact', 'contact'],
] as const;

export function getNav(lang: Lang) {
  const labels = t(lang).nav;
  return NAV_PATHS.map(([path, key]) => ({ path, href: localePath(lang, path), label: labels[key] }));
}

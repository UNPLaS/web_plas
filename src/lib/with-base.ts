/** Prefijo de rutas/assets para GitHub Pages (`base` en astro.config). */

export function withBase(path: string): string {
  if (!path) return path;
  if (/^(https?:|mailto:|tel:|data:)/i.test(path)) return path;
  if (path.startsWith('#')) return path;
  let base = import.meta.env.BASE_URL || '/';
  if (!base.endsWith('/')) base += '/';
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
}

/** Pathname sin el base del sitio (siempre empieza por `/`, sin slash final salvo raíz). */
export function stripBase(pathname: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  let p = pathname || '/';
  if (base && (p === base || p.startsWith(`${base}/`))) {
    p = p.slice(base.length) || '/';
  }
  p = p.replace(/\/$/, '') || '/';
  return p.startsWith('/') ? p : `/${p}`;
}

/** ¿La ruta actual corresponde a este href (ambos pueden ir con base)? */
export function isActivePath(pathname: string, href: string): boolean {
  const p = stripBase(pathname);
  const h = stripBase(href);
  if (h === '/') return p === '/';
  return p === h || p.startsWith(`${h}/`);
}

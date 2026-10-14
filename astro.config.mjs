// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Despliegues:
 * - UNAL (default): https://plas.unal.edu.co → DocumentRoot /var/www/html/plas
 * - GitHub Pages: PLAS_SITE=https://unplas.github.io PLAS_BASE=/web_plas
 */
const site = process.env.PLAS_SITE || 'https://plas.unal.edu.co';
const rawBase = process.env.PLAS_BASE || '/';
const base = rawBase === '/' ? '/' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;

/** Reescribe url("/…") en CSS para respetar `base` (p. ej. chrome UNAL). */
function rebaseCssPublicUrls() {
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  return {
    name: 'rebase-css-public-urls',
    enforce: 'pre',
    /**
     * @param {string} code
     * @param {string} id
     */
    transform(code, id) {
      if (!prefix || !/\.css([?#]|$)/.test(id)) return null;
      let next = code;
      next = next.replace(/url\(\s*(['"])\//g, `url($1${prefix}/`);
      next = next.replace(/url\(\s*\//g, `url(${prefix}/`);
      return next === code ? null : next;
    },
  };
}

const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

/**
 * Fuentes servidas desde el propio sitio (paquetes @fontsource-variable),
 * sin pedir nada a Google en build ni en el navegador.
 * @param {string} pkg
 * @param {string} file prefijo dentro de files/, p. ej. "onest-{subset}-wght"
 * @param {string} weight
 * @param {Array<'normal' | 'italic'>} styles
 */
function fontsourceVariants(pkg, file, weight, styles) {
  const variants = styles.flatMap((style) =>
    [
      ['latin', LATIN],
      ['latin-ext', LATIN_EXT],
    ].map(([subset, unicodeRange]) => ({
      src: /** @type {[string]} */ ([
        `@fontsource-variable/${pkg}/files/${file.replace('{subset}', subset)}-${style}.woff2`,
      ]),
      weight,
      style,
      unicodeRange: /** @type {[string, ...string[]]} */ (unicodeRange.split(',')),
      display: /** @type {const} */ ('swap'),
    })),
  );
  return /** @type {[typeof variants[number], ...typeof variants]} */ (variants);
}

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [
    sitemap({
      filter: (page) => !/\/404\/?$/.test(page),
      i18n: { defaultLocale: 'es', locales: { es: 'es', en: 'en' } },
    }),
  ],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Onest',
      cssVariable: '--font-onest',
      fallbacks: ['Segoe UI', 'system-ui', 'sans-serif'],
      options: { variants: fontsourceVariants('onest', 'onest-{subset}-wght', '100 900', ['normal']) },
    },
    {
      provider: fontProviders.local(),
      name: 'Source Sans 3',
      cssVariable: '--font-source-sans',
      fallbacks: ['Segoe UI', 'system-ui', 'sans-serif'],
      options: {
        variants: fontsourceVariants('source-sans-3', 'source-sans-3-{subset}-wght', '200 900', [
          'normal',
          'italic',
        ]),
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Source Serif 4',
      cssVariable: '--font-source-serif',
      fallbacks: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
      options: {
        variants: fontsourceVariants('source-serif-4', 'source-serif-4-{subset}-opsz', '200 900', [
          'normal',
          'italic',
        ]),
      },
    },
  ],
  vite: {
    plugins: [tailwindcss(), rebaseCssPublicUrls()],
  },
});

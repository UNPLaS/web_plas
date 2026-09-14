// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const site = 'https://vethariel.github.io';
const base = '/Front_plas';

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

// https://astro.build/config
export default defineConfig({
  site,
  base,
  vite: {
    plugins: [tailwindcss(), rebaseCssPublicUrls()],
  },
});

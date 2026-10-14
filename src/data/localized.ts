/**
 * Datos por idioma: los JSON de `src/data/` son la fuente (español) y `src/data/en/` solo
 * guarda los campos traducidos. Lo que falte en la traducción se muestra en español.
 *
 * Formato de las traducciones: un objeto por `id` del registro original; dentro, los campos
 * traducidos. Las listas de objetos con `id` (temas, nodos) se traducen igual, por `id`; las
 * demás listas de objetos (formación, cursos) van por posición y las de texto se reemplazan.
 */
import blogJson from './blog.json';
import facultyJson from './faculty.json';
import homeQuotesJson from './home-quotes.json';
import linesJson from './lines.json';
import lineTopicGraphsJson from './line-topic-graphs.json';
import projectsJson from './projects.json';
import blogEn from './en/blog.json';
import facultyEn from './en/faculty.json';
import homeQuotesEn from './en/home-quotes.json';
import linesEn from './en/lines.json';
import lineTopicGraphsEn from './en/line-topic-graphs.json';
import projectsEn from './en/projects.json';
import type { Lang } from '../i18n';

type Patch = Record<string, unknown>;

const isObject = (value: unknown): value is Patch =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function overlay<T>(base: T, patch: unknown): T {
  if (patch === undefined || patch === null) return base;
  if (Array.isArray(base)) {
    if (isObject(patch) && base.every((item) => isObject(item) && typeof item.id === 'string')) {
      return base.map((item) => overlay(item, patch[(item as Patch).id as string])) as T;
    }
    if (Array.isArray(patch) && base.every(isObject)) {
      return base.map((item, i) => overlay(item, patch[i])) as T;
    }
    return patch as T;
  }
  if (isObject(base) && isObject(patch)) {
    const out: Patch = { ...base };
    for (const [key, value] of Object.entries(patch)) out[key] = overlay(base[key], value);
    return out as T;
  }
  return patch as T;
}

/**
 * Registros por `id` (líneas, docentes, proyectos, blog). `contentLang` dice en qué idioma
 * quedó el texto: los que aún no tienen traducción siguen en español.
 */
function byId<T extends { id: string }>(
  rows: T[],
  patch: Record<string, unknown>,
  lang: Lang,
): (T & { contentLang: Lang })[] {
  return rows.map((row) => ({
    ...overlay(row, patch[row.id]),
    contentLang: patch[row.id] ? lang : 'es',
  }));
}

export function localizedData(lang: Lang) {
  const none = {};
  const en = lang !== 'es';
  return {
    lines: byId(linesJson, en ? linesEn : none, lang),
    faculty: byId(facultyJson, en ? facultyEn : none, lang),
    lineTopicGraphs: en ? overlay(lineTopicGraphsJson, lineTopicGraphsEn) : lineTopicGraphsJson,
    projects: byId(projectsJson, en ? projectsEn : none, lang),
    blog: byId(blogJson, en ? blogEn : none, lang),
    homeQuotes: en && homeQuotesEn.length ? homeQuotesEn : homeQuotesJson,
  };
}

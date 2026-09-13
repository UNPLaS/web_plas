/**
 * View-models desde JSON exportado de new_plas.
 * Rutas internas: convención Front_plas (/projects, /blog, …).
 */
import blogJson from './blog.json';
import facultyJson from './faculty.json';
import groupJson from './group.json';
import linesJson from './lines.json';
import projectsJson from './projects.json';
import publicationsJson from './publications.json';
import resourcesJson from './resources.json';
import studentsJson from './students.json';
import thesesJson from './theses.json';
import { resolveTypology } from './typologies';

const degreeLabel: Record<string, string> = {
  pregrado: 'Pregrado',
  maestria: 'Maestría',
  doctorado: 'Doctorado',
};

/** Reescribe hrefs de new_plas a rutas Front_plas. */
export function mapHref(href: string): string {
  if (!href) return href;
  const [path, hash] = href.split('#');
  let next = path
    .replace(/^\/proyectos(\/|$)/, '/projects$1')
    .replace(/^\/eventos(\/|$)/, '/blog$1')
    .replace(/^\/events(\/|$)/, '/blog$1')
    .replace(/^\/publicaciones(\/|$)/, '/catalog$1')
    .replace(/^\/integrantes(\/|$)/, '/people$1')
    .replace(/^\/investigacion(\/|$)/, '/lines$1')
    .replace(/^\/contacto(\/|$)/, '/contact$1')
    .replace(/^\/sobre(\/|$)/, '/about$1')
    .replace(/^\/recursos(\/|$)/, '/resources$1');

  // /blog#id → /blog/<param>
  if (next === '/blog' && hash) {
    return `/blog/${blogParam(decodeURIComponent(hash))}`;
  }
  return hash ? `${next}#${hash}` : next;
}

export function blogParam(id: string): string {
  return id.replace(/:/g, '--');
}

export function blogIdFromParam(param: string): string {
  return param.replace(/--/g, ':');
}

/** @deprecated usar blogParam */
export const eventParam = blogParam;
/** @deprecated usar blogIdFromParam */
export const eventIdFromParam = blogIdFromParam;

export const group = groupJson;

export const site = {
  name: groupJson.name,
  nameFull: groupJson.name_full,
  tagline: 'Investigamos construyendo herramientas, no solo publicando.',
  subtitle:
    'En PLaS las líneas no son islas: lo que se prueba en el lab se enseña, se evalúa y se lleva a herramientas reales.',
  logo: '/images/PLaS/Logo_PLaS.png',
};

/** Color de chip por id o nombre de línea (desde lines.json). */
const lineColorById = Object.fromEntries(linesJson.map((l) => [l.id, l.color]));
const lineColorByName = Object.fromEntries(linesJson.map((l) => [l.name, l.color]));

function resolveLineColor(lineId?: string, lineName?: string) {
  if (lineId && lineColorById[lineId]) return lineColorById[lineId];
  if (lineName && lineColorByName[lineName]) return lineColorByName[lineName];
  return '';
}

/** Azules por tipología de publicación / nivel de tesis / tipo de estudiante. */
const NIVEL_BLUES: Record<string, string> = {
  journal_article: '#1a8cff',
  book_chapter: '#3b5bdb',
  conference_paper: '#0bb4e8',
  conference_paper_intl: '#0088cc',
  pregrado: '#5eb0ff',
  maestria: '#4c7cf0',
  doctorado: '#1557d6',
  default: '#2f89ef',
};

function resolveNivelColor(opts: {
  typology?: string;
  levelLabel?: string;
  degree?: string;
}) {
  const label = (opts.levelLabel || '').toLowerCase();
  if (label.includes('internacional')) return NIVEL_BLUES.conference_paper_intl;
  if (opts.degree && NIVEL_BLUES[opts.degree]) return NIVEL_BLUES[opts.degree];
  if (opts.typology && NIVEL_BLUES[opts.typology]) return NIVEL_BLUES[opts.typology];
  return NIVEL_BLUES.default;
}

export const projectItems = [...projectsJson]
  .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
  .map((p) => ({
    id: p.slug,
    rawId: p.id,
    title: p.title_short || p.title_full,
    titleFull: p.title_full,
    meta: `Proyecto · ${p.line_name}`,
    summary: p.summary,
    outcome: p.line_name,
    href: `/projects/${p.slug}`,
    image: p.image_path || '',
    sections: p.sections ?? [],
    links: p.links ?? [],
    assets: p.assets ?? [],
    lineId: p.line_id || '',
    lineName: p.line_name,
    lineColor: resolveLineColor(p.line_id, p.line_name),
    lineChip: p.line_name
      ? { id: 'linea' as const, label: p.line_name, color: resolveLineColor(p.line_id, p.line_name) }
      : null,
  }));

export const featuredProjects = projectItems.slice(0, 6).map((p) => ({
  id: p.id,
  title: p.title,
  text: p.summary,
  href: p.href,
  image: p.image,
  lineChip: p.lineChip,
}));

export const blogItems = [...blogJson]
  .sort((a, b) => String(b.date_from).localeCompare(String(a.date_from)))
  .map((post) => {
    const place =
      post.place && post.place !== 'No informado' ? ` · ${post.place}` : '';
    const summary =
      post.summary ||
      [post.participation, post.ambito, post.place !== 'No informado' ? post.place : '']
        .filter(Boolean)
        .join(' · ');
    const typology = resolveTypology(post.typology);
    const meta =
      [post.participation, post.year].filter(Boolean).join(' · ') + place;
    return {
      id: blogParam(post.id),
      rawId: post.id,
      title: post.title,
      meta,
      summary: summary || post.event_type || '',
      body: post.body || '',
      outcome: post.participation || post.event_type || '',
      href: `/blog/${blogParam(post.id)}`,
      image: '',
      year: post.year,
      place: post.place,
      dateFrom: post.date_from,
      dateTo: post.date_to,
      ambito: post.ambito,
      participation: post.participation,
      eventType: post.event_type,
      typology,
    };
  });

/** Últimas novedades = posts recientes del blog (tipología según cada publicación). */
export const newsItems = blogItems.slice(0, 3).map((item) => ({
  id: item.id,
  title: item.title,
  meta: item.meta,
  typology: item.typology,
  href: item.href,
  image: item.image,
}));

/** @deprecated usar blogItems */
export const eventItems = blogItems;
export const facultyItems = facultyJson.map((f) => {
  const isFelipe = f.id === 'docente:ferestrepoca';
  const groupRole = f.group_role || (isFelipe ? 'Líder del grupo' : f.rank || 'Profesor asociado');
  return {
    id: f.id,
    name: f.name_display,
    role: groupRole,
    rank: f.rank,
    href: '/people',
    image: f.image_path || '',
    meta: f.line_names?.length ? `Líneas: ${f.line_names.join(', ')}` : '',
    email: f.email,
    profiles: f.profiles ?? [],
    roleChip: {
      id: isFelipe ? 'rol-amber' : 'rol-mid',
      label: groupRole,
    },
  };
});

export const people = facultyItems.map((f) => ({
  id: f.id,
  name: f.name,
  role: f.role,
  rank: f.rank,
  meta: f.meta,
  image: f.image,
  roleChip: f.roleChip,
}));

export const students = [...studentsJson]
  .sort((a, b) => Number(b.active) - Number(a.active) || a.name_sort.localeCompare(b.name_sort))
  .map((s) => {
    const typeLabel = s.role_label || degreeLabel[s.degree_highest] || s.degree_highest;
    const lineName = s.lines || '';
    return {
      id: s.id,
      name: s.name_display,
      role: typeLabel,
      meta: s.status,
      image: s.image_path || '',
      active: s.active,
      chips: [
        {
          id: 'nivel',
          label: typeLabel,
          color: resolveNivelColor({ degree: s.degree_highest, levelLabel: typeLabel }),
        },
        ...(lineName
          ? [{ id: 'linea', label: lineName, color: resolveLineColor(undefined, lineName) }]
          : []),
      ],
    };
  });

export const researchLines = linesJson.map((line) => ({
  id: line.id,
  title: line.name,
  summary: line.summary,
  text: line.description,
  href: '/lines',
  slug: line.slug,
  color: line.color,
  topics: line.topics ?? [],
}));

const pubItems = publicationsJson.map((p) => {
  const lineId = p.line_ids?.[0] || '';
  const line = p.line_names?.[0] || '';
  const level = p.typology_label_es || 'Publicación';
  return {
    id: p.id,
    kind: 'pub' as const,
    title: p.title,
    author: p.authors,
    year: String(p.year),
    level,
    lineId,
    line,
    lineColor: resolveLineColor(lineId, line),
    meta: `${level} · ${p.year}`,
    href: p.url || p.doi ? `https://doi.org/${p.doi}` : '',
    outcome: p.venue_title || '',
  };
});

const thesisItems = thesesJson.map((t) => {
  const lineId = t.line_ids?.[0] || t.line_id_primary || '';
  const line = t.line_names?.[0] || '';
  const level = degreeLabel[t.degree] ?? t.degree;
  return {
    id: t.id,
    kind: 'thesis' as const,
    title: t.title,
    author: t.authors,
    year: String(t.year),
    level,
    lineId,
    line,
    lineColor: resolveLineColor(lineId, line),
    meta: `Tesis · ${level} · ${t.year}`,
    href: t.item_url || '',
    outcome: '',
  };
});

export const catalogItems = [...pubItems, ...thesisItems]
  .sort((a, b) => Number(b.year) - Number(a.year) || a.title.localeCompare(b.title))
  .map((item) => ({
    ...item,
    lineChip: item.line
      ? { id: 'linea' as const, label: item.line, color: item.lineColor }
      : null,
  }));

export const recentWorks = catalogItems.slice(0, 3).map((item) => ({
  id: item.id,
  title: item.title,
  author: item.author,
  meta: item.meta,
  outcome: item.outcome,
  href: item.href || '/catalog',
  image: '',
  lineChip: item.lineChip,
}));

export const contactFields = [
  {
    label: 'Correo',
    value: groupJson.email,
    href: `mailto:${groupJson.email}`,
  },
  {
    label: 'Teléfono',
    value: groupJson.phone,
  },
  {
    label: 'Ubicación',
    value: `${groupJson.address} · ${groupJson.city}`,
  },
];

export const contactIntro = {
  title: 'Escríbenos',
  lede: 'Ideas de tesis, colaboraciones o preguntas sobre el grupo: leemos con criterio y respondemos cuando hay un camino claro.',
  ctaLabel: 'Enviar correo',
  ctaHref: `mailto:${groupJson.email}`,
};

export const aboutIntro = {
  title: 'Sobre el grupo',
  lede: groupJson.description_short.split('\n\n')[0] ?? groupJson.description_short,
  statement:
    'No separamos el laboratorio del aula: lo que investigamos se prueba, se enseña y se lleva a producción con calidad.',
};

export const aboutBlocks = [
  {
    title: 'Quiénes somos',
    body: `${groupJson.name} (${groupJson.name_full}) es un grupo de la ${groupJson.institution}, clasificación Minciencias ${groupJson.minciencias_class}.`,
  },
  {
    title: 'Cómo trabajamos',
    body: groupJson.description_short.split('\n\n')[1] ?? groupJson.description_short,
  },
  {
    title: 'Con quiénes',
    body: 'Estudiantes, docentes e instituciones que comparten problemas concretos de enseñanza, evaluación y sistemas confiables.',
  },
];

const RESOURCE_SECTION_ORDER = ['group_presentation', 'templates', 'talks_recordings'];

export const resourceSections = (() => {
  const sections = RESOURCE_SECTION_ORDER.map((key) => {
    const items = resourcesJson.filter((r) => r.section_key === key);
    if (!items.length) return null;
    return {
      key,
      title: items[0].section,
      items: items.map((r) => ({
        id: r.id,
        title: r.title,
        author: r.byline_raw || (r.authors_display ? `Por: ${r.authors_display}` : ''),
        href: r.url_primary || r.links?.[0]?.url || '',
        links: r.links ?? [],
      })),
    };
  }).filter((s): s is NonNullable<typeof s> => s !== null);

  const orphan = resourcesJson.filter((r) => !RESOURCE_SECTION_ORDER.includes(r.section_key));
  if (orphan.length) {
    sections.push({
      key: 'other',
      title: 'Otros',
      items: orphan.map((r) => ({
        id: r.id,
        title: r.title,
        author: r.byline_raw || (r.authors_display ? `Por: ${r.authors_display}` : ''),
        href: r.url_primary || r.links?.[0]?.url || '',
        links: r.links ?? [],
      })),
    });
  }
  return sections;
})();

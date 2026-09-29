/**
 * View-models desde JSON exportado de new_plas.
 * Rutas internas: convención web_plas (/projects, /blog, …).
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
import lineTopicGraphs from './line-topic-graphs.json';
import { resolveCatalogSource } from './catalog-sources';
import { resolveTypology } from './typologies';
import { withBase } from '../lib/with-base';

const degreeLabel: Record<string, string> = {
  pregrado: 'Pregrado',
  maestria: 'Maestría',
  doctorado: 'Doctorado',
};

/** Reescribe hrefs de new_plas a rutas web_plas (+ base de GitHub Pages). */
export function mapHref(href: string): string {
  if (!href) return href;
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
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
    return withBase(`/blog/${blogParam(decodeURIComponent(hash))}`);
  }
  const joined = hash ? `${next}#${hash}` : next;
  return next.startsWith('/') ? withBase(joined) : joined;
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

const numberWords = [
  'cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete',
  'dieciocho', 'diecinueve', 'veinte',
];

/** Años cumplidos a la fecha del build (el sitio es estático). */
function groupAgeYears(founded: string, now = new Date()): number {
  const [y, m, d] = founded.split('-').map(Number);
  let years = now.getUTCFullYear() - y;
  const beforeAnniversary =
    now.getUTCMonth() + 1 < m || (now.getUTCMonth() + 1 === m && now.getUTCDate() < d);
  if (beforeAnniversary) years -= 1;
  return years;
}

const groupAge = groupAgeYears(groupJson.founded);
const groupAgeLabel = `${numberWords[groupAge] ?? groupAge} ${groupAge === 1 ? 'año' : 'años'}`;

export const site = {
  name: groupJson.name,
  nameFull: groupJson.name_full,
  tagline: 'Investigamos construyendo, y construimos en equipo.',
  subtitle: `Llevamos ${groupAgeLabel} creando herramientas que otros pueden usar, y con gusto compartimos el camino con quien quiera sumarse.`,
  logo: withBase('/images/PLaS/Logo_PLaS.png'),
};

/** Color de chip por id o nombre de línea (desde lines.json). */
const lineColorById = Object.fromEntries(linesJson.map((l) => [l.id, l.color]));
const lineColorByName = Object.fromEntries(
  linesJson.flatMap((l) => [
    [l.name, l.color],
    [l.short_name, l.color],
  ]),
);
/** Nombre corto (chips, filtros, metadatos); el nombre completo va en /lines. */
const lineNameById: Record<string, string> = Object.fromEntries(
  linesJson.map((l) => [l.id, l.short_name]),
);

function lineNamesFor(ids: string[] = []) {
  return ids.map((id) => lineNameById[id]).filter(Boolean);
}

function resolveLineColor(lineId?: string, lineName?: string) {
  if (lineId && lineColorById[lineId]) return lineColorById[lineId];
  if (lineName && lineColorByName[lineName]) return lineColorByName[lineName];
  return '';
}

/** Enlaces de perfiles académicos (ORCID, Scholar, etc.). */
function profileLinks(profiles: { label: string; url: string }[] = []) {
  return profiles
    .filter((p) => p.label && p.url)
    .map((p) => ({
      label: p.label,
      href: p.url,
    }));
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
  .map((p) => {
    const lineName = lineNameById[p.line_id] ?? '';
    return {
    id: p.slug,
    rawId: p.id,
    title: p.title_short || p.title_full,
    titleFull: p.title_full,
    meta: `Proyecto · ${lineName}`,
    summary: p.summary,
    content: typeof p.content === 'string' ? p.content : '',
    outcome: lineName,
    href: withBase(`/projects/${p.slug}`),
    image: p.image_path ? withBase(p.image_path) : '',
    sections: p.sections ?? [],
    links: p.links ?? [],
    assets: (p.assets ?? []).map((a) => ({
      ...a,
      path: a.path ? withBase(a.path) : a.path,
    })),
    lineId: p.line_id || '',
    lineName,
    lineColor: resolveLineColor(p.line_id, lineName),
    lineChip: lineName
      ? { id: 'linea' as const, label: lineName, color: resolveLineColor(p.line_id, lineName) }
      : null,
    };
  });

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
      content:
        typeof post.content === 'string' && post.content.trim()
          ? post.content
          : post.body || '',
      body: post.body || '',
      outcome: post.participation || post.event_type || '',
      href: withBase(`/blog/${blogParam(post.id)}`),
      image: typeof post.image === 'string' && post.image ? withBase(post.image) : '',
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
function facultyAnchor(id: string) {
  return id.replace('docente:', '');
}

export const facultyItems = facultyJson.map((f) => {
  const isFelipe = f.id === 'docente:ferestrepoca';
  const groupRole = f.group_role || (isFelipe ? 'Líder del grupo' : f.rank || 'Profesor asociado');
  const lineNames = lineNamesFor(f.line_ids);
  return {
    id: f.id,
    anchor: facultyAnchor(f.id),
    name: f.name_display,
    role: groupRole,
    rank: f.rank,
    href: withBase(`/people#${facultyAnchor(f.id)}`),
    image: f.image_path ? withBase(f.image_path) : '',
    meta: lineNames.length ? `Líneas: ${lineNames.join(', ')}` : '',
    email: f.email,
    profiles: f.profiles ?? [],
    roleChip: {
      id: isFelipe ? 'rol-amber' : 'rol-mid',
      label: groupRole,
    },
    profileLinks: profileLinks(f.profiles ?? []),
  };
});

export const people = facultyItems.map((f) => ({
  id: f.id,
  anchor: f.anchor,
  name: f.name,
  role: f.role,
  rank: f.rank,
  meta: f.meta,
  image: f.image,
  roleChip: f.roleChip,
  profileLinks: f.profileLinks,
}));

/** `plas_catalog_source: "rejected"` oculta la tesis (y el harvest no la re-agrega). */
const visibleTheses = thesesJson.filter((t) => t.plas_catalog_source !== 'rejected');

const DEGREE_RANK: Record<string, number> = { doctorado: 3, maestria: 2, pregrado: 1 };
const DEGREE_BY_ROLE_GROUP: Record<string, string> = {
  estudiante_doctorado: 'doctorado',
  estudiante_maestria: 'maestria',
  estudiante_pregrado: 'pregrado',
};
const ROLE_LABEL_BY_DEGREE: Record<string, string> = {
  doctorado: 'Estudiante de doctorado',
  maestria: 'Estudiante de maestría',
  pregrado: 'Estudiante de pregrado',
};

function thesisUrl(itemUrl: string) {
  if (!itemUrl) return '';
  return /^https?:\/\//i.test(itemUrl) ? itemUrl : `/${itemUrl.replace(/^\//, '')}`;
}

/** Tesis de mayor grado (y más reciente) del estudiante; con tesis pasa a Inactivo. */
const resolvedStudents = studentsJson.map((s) => {
  const thesis = visibleTheses
    .filter((t) => t.student_ids.includes(s.id))
    .sort(
      (a, b) =>
        (DEGREE_RANK[b.degree] ?? 0) - (DEGREE_RANK[a.degree] ?? 0) ||
        String(b.year).localeCompare(String(a.year)),
    )[0];
  const status = thesis ? 'Inactivo' : s.status;
  const roleDegree = DEGREE_BY_ROLE_GROUP[s.role_group] ?? '';
  return {
    ...s,
    line_ids: thesis ? thesis.line_ids : s.line_ids,
    topic_ids: thesis ? thesis.topic_ids : [],
    status,
    active: !thesis && status === 'Activo',
    exit_year: thesis?.year ?? '',
    degree_highest: thesis?.degree || roleDegree,
    role_label: ROLE_LABEL_BY_DEGREE[roleDegree || thesis?.degree || ''] ?? '',
    thesis: thesis
      ? { title: thesis.title, year: thesis.year, degree: thesis.degree, url: thesisUrl(thesis.item_url) }
      : null,
  };
});

export const students = resolvedStudents
  .sort((a, b) => Number(b.active) - Number(a.active) || a.name_sort.localeCompare(b.name_sort))
  .map((s) => {
    const degree = s.thesis?.degree || s.degree_highest;
    const typeLabel = s.role_label || degreeLabel[degree] || degree;
    const lineId = s.line_ids[0] || '';
    const lineName = lineNamesFor(s.line_ids).join(', ');
    const thesisUrl = s.thesis?.url || '';
    return {
      id: s.id,
      name: s.name_display,
      role: typeLabel,
      meta: s.status,
      image: s.image_path ? withBase(s.image_path) : '',
      active: Boolean(s.active),
      degree,
      exitYear: s.exit_year || s.thesis?.year || '',
      thesisTitle: s.thesis?.title || '',
      thesisYear: s.thesis?.year || s.exit_year || '',
      thesisHref: thesisUrl,
      chips: [
        {
          id: 'nivel',
          label: typeLabel,
          color: resolveNivelColor({ degree, levelLabel: typeLabel }),
        },
        ...(lineName
          ? [{ id: 'linea', label: lineName, color: resolveLineColor(lineId, lineName) }]
          : []),
      ],
    };
  });

export const activeStudents = students.filter((s) => s.active);

export const historicalStudentSections = (
  [
    {
      title: 'Doctorado',
      items: students.filter(
        (s) => !s.active && /doctorado/i.test(s.degree || s.role || ''),
      ),
    },
    {
      title: 'Maestría',
      items: students.filter(
        (s) => !s.active && /maestria|maestría/i.test(s.degree || s.role || ''),
      ),
    },
  ] as const
).map((sec) => ({
  ...sec,
  items: [...sec.items].sort(
    (a, b) =>
      String(b.thesisYear).localeCompare(String(a.thesisYear)) ||
      a.name.localeCompare(b.name),
  ),
})).filter((sec) => sec.items.length > 0);

export interface GraphNode {
  id: string;
  label: string;
  weight: number;
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export const researchLines = linesJson.map((line) => {
  const graph = (lineTopicGraphs as Record<string, { nodes: GraphNode[]; edges: GraphEdge[] }>)[
    line.id
  ];
  const imagePath = typeof line.image_path === 'string' ? line.image_path : '';
  return {
    id: line.id,
    title: line.name,
    shortTitle: line.short_name,
    summary: line.summary,
    paragraphs: line.description,
    href: withBase(`/lines/${line.slug}`),
    slug: line.slug,
    color: line.color,
    image: imagePath ? withBase(imagePath) : '',
    imageCredit: typeof line.image_credit === 'string' ? line.image_credit : '',
    imageSource: typeof line.image_source === 'string' ? line.image_source : '',
    /** Punto de enfoque (object-position) para el recorte del banner. */
    imagePosition: typeof line.image_position === 'string' ? line.image_position : 'center',
    topics: line.topics ?? [],
    topicGraph: graph
      ? {
          nodes: graph.nodes,
          edges: graph.edges,
        }
      : null,
  };
});

const TYPE_ORDER = [
  'journal_article',
  'conference_paper',
  'book_chapter',
  'book',
  'thesis',
  'preprint',
  'software',
  'report',
  'unknown',
];

/** `plas_catalog_source: "rejected"` oculta la publicación (y el harvest no la re-agrega). */
const visiblePublications = publicationsJson.filter((p) => p.plas_catalog_source !== 'rejected');

function normName(s: string) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const facultyMatchers = facultyJson.map((f) => {
  const [surname = '', given = ''] = f.name_sort.split(',').map(normName);
  return { id: f.id, surname: surname.split(' ')[0], given: given.split(' ')[0] };
});

/** Docentes entre los autores: primer apellido más primer nombre o su inicial en la misma entrada. */
function facultyIdsInAuthors(authors: string) {
  const found = new Set<string>();
  for (const author of String(authors || '').split(/[;|]/)) {
    const n = ` ${normName(author)} `;
    for (const f of facultyMatchers) {
      if (!f.surname || !n.includes(` ${f.surname} `)) continue;
      if (n.includes(` ${f.given} `) || n.includes(` ${f.given.charAt(0)} `)) found.add(f.id);
    }
  }
  return [...found];
}

const pubItems = visiblePublications.map((p) => {
  const lineIds = p.line_ids || [];
  const lineNames = lineNamesFor(lineIds);
  const lineId = lineIds[0] || '';
  const line = lineNames[0] || '';
  const typology = p.typology || 'unknown';
  const typologyLabel = p.typology_label_es || typology || 'Publicación';
  const href = p.url || (p.doi ? `https://doi.org/${p.doi}` : '');
  const source = resolveCatalogSource({ doi: p.doi, url: href, kind: 'pub' });
  return {
    id: p.id,
    kind: 'pub' as const,
    title: p.title,
    author: p.authors || '',
    year: String(p.year || ''),
    level: typologyLabel,
    typology,
    typologyLabel,
    degreeLabel: '',
    lineId,
    lineIds,
    topicIds: p.topic_ids ?? [],
    facultyIds: facultyIdsInAuthors(p.authors),
    line,
    lineName: lineNames.join(', '),
    lineColor: resolveLineColor(lineId, line),
    meta: `${typologyLabel} · ${p.year}`,
    href,
    outcome: p.venue_title || '',
    sourceId: source.id,
    sourceLabel: source.label,
    sourceLogo: source.logo,
  };
});

const thesisItems = visibleTheses.map((t) => {
  const lineIds = t.line_ids;
  const lineNames = lineNamesFor(lineIds);
  const lineId = lineIds[0] || '';
  const line = lineNames[0] || '';
  const degree = degreeLabel[t.degree] ?? t.degree ?? '';
  const href = t.item_url || '';
  const source = resolveCatalogSource({ url: href, kind: 'thesis' });
  return {
    id: t.id,
    kind: 'thesis' as const,
    title: t.title,
    author: t.authors || '',
    year: String(t.year || ''),
    level: degree,
    typology: 'thesis',
    typologyLabel: 'Tesis',
    degreeLabel: degree,
    lineId,
    lineIds,
    topicIds: t.topic_ids ?? [],
    facultyIds: t.advisor_ids,
    line,
    lineName: lineNames.join(', ') || line,
    lineColor: resolveLineColor(lineId, line),
    meta: `Tesis · ${degree} · ${t.year}`,
    href,
    outcome: '',
    sourceId: source.id,
    sourceLabel: source.label,
    sourceLogo: source.logo,
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

/** Trabajos "activos" en la página de línea: año actual y los dos anteriores. */
const ACTIVE_SINCE = new Date().getFullYear() - 2;
const facultyById = new Map(facultyItems.map((f) => [f.id, f]));

export const lineDetails = researchLines.map((line) => {
  const topicById = new Map(line.topics.map((t) => [t.id, t]));
  const works = catalogItems
    .filter((w) => w.lineIds.includes(line.id))
    .map((w) => ({
      id: w.id,
      title: w.title,
      author: w.author,
      year: w.year,
      meta: w.meta,
      outcome: w.outcome,
      href: w.href,
      topicIds: w.topicIds.filter((id) => topicById.has(id)),
      topics: w.topicIds
        .map((id) => topicById.get(id))
        .filter((t): t is NonNullable<typeof t> => Boolean(t))
        .map((t) => ({ slug: t.slug, name: t.name })),
    }));

  const topics = line.topics.map((t) => {
    const topicWorks = catalogItems.filter((w) => w.topicIds.includes(t.id));
    const workCountByFaculty = new Map<string, number>();
    for (const w of topicWorks) {
      for (const id of w.facultyIds) workCountByFaculty.set(id, (workCountByFaculty.get(id) ?? 0) + 1);
    }
    const people = [...workCountByFaculty.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => facultyById.get(id))
      .filter((f): f is NonNullable<typeof f> => Boolean(f))
      .map((f) => ({ id: f.id, name: f.name, image: f.image, href: f.href }));
    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description,
      total: topicWorks.length,
      people,
      activeWorks: works.filter((w) => w.topicIds.includes(t.id) && Number(w.year) >= ACTIVE_SINCE),
    };
  });

  const years = [...new Set(works.map((w) => w.year).filter(Boolean))].sort((a, b) =>
    b.localeCompare(a),
  );
  return {
    ...line,
    topics,
    activeSince: ACTIVE_SINCE,
    workCount: works.length,
    timeline: years.map((year) => ({ year, works: works.filter((w) => w.year === year) })),
  };
});

export const catalogYears = [
  ...new Set(catalogItems.map((i) => i.year).filter(Boolean)),
].sort((a, b) => b.localeCompare(a));

export const catalogTypologies = [
  ...new Map(
    catalogItems
      .filter((i) => i.typology)
      .map((i) => [i.typology, i.typologyLabel] as const),
  ).entries(),
].sort((a, b) => {
  const ia = TYPE_ORDER.indexOf(a[0]);
  const ib = TYPE_ORDER.indexOf(b[0]);
  const ra = ia === -1 ? 999 : ia;
  const rb = ib === -1 ? 999 : ib;
  return ra - rb || a[1].localeCompare(b[1], 'es');
});

/** Payload cliente para filtros del catálogo (sin campos de display extras). */
export const catalogFilterData = catalogItems.map((item) => ({
  id: item.id,
  title: item.title,
  author: item.author,
  year: item.year,
  meta: item.meta,
  href: item.href,
  outcome: item.outcome,
  typology: item.typology,
  typologyLabel: item.typologyLabel,
  degreeLabel: item.degreeLabel,
  lineIds: item.lineIds,
  lineName: item.lineName,
  lineChip: item.lineChip,
  sourceLabel: item.sourceLabel,
  sourceLogo: item.sourceLogo,
}));

export const recentWorks = catalogItems.slice(0, 3).map((item) => ({
  id: item.id,
  title: item.title,
  author: item.author,
  meta: item.meta,
  outcome: item.outcome,
  href: item.href || withBase('/catalog'),
  image: item.sourceLogo,
  sourceLabel: item.sourceLabel,
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

export const contactLinks = [
  groupJson.gruplac_url
    ? {
        label: `GrupLAC (Minciencias ${groupJson.minciencias_class})`,
        href: groupJson.gruplac_url,
      }
    : null,
  groupJson.hermes_url
    ? {
        label: 'HERMES',
        href: groupJson.hermes_url,
      }
    : null,
].filter(Boolean) as { label: string; href: string }[];

export const contactIntro = {
  title: 'Escríbenos',
  lede: 'Ideas de tesis, colaboraciones o preguntas sobre el grupo: leemos con criterio y respondemos cuando hay un camino claro.',
  ctaLabel: 'Enviar correo',
  ctaHref: `mailto:${groupJson.email}`,
};

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

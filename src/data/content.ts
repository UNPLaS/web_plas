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
import lineTopicGraphs from './line-topic-graphs.json';
import { resolveCatalogSource } from './catalog-sources';
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
    profileLinks: profileLinks(f.profiles ?? []),
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
  profileLinks: f.profileLinks,
}));

export const students = [...studentsJson]
  .sort((a, b) => Number(b.active) - Number(a.active) || a.name_sort.localeCompare(b.name_sort))
  .map((s) => {
    const degree = s.thesis?.degree || s.degree_highest;
    const typeLabel = s.role_label || degreeLabel[degree] || degree;
    const lineName = s.lines || '';
    const thesisUrl =
      s.thesis?.url || s.links?.find((l) => /tesis/i.test(l.label))?.url || '';
    return {
      id: s.id,
      name: s.name_display,
      role: typeLabel,
      meta: s.status,
      image: s.image_path || '',
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
          ? [{ id: 'linea', label: lineName, color: resolveLineColor(undefined, lineName) }]
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

export const researchLines = linesJson.map((line) => {
  const graph = (lineTopicGraphs as Record<string, { nodes: unknown[]; edges: unknown[] }>)[
    line.id
  ];
  return {
    id: line.id,
    title: line.name,
    summary: line.summary,
    text: line.description,
    href: '/lines',
    slug: line.slug,
    color: line.color,
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

const pubItems = publicationsJson.map((p) => {
  const lineIds = p.line_ids || [];
  const lineNames = p.line_names || [];
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

const thesisItems = thesesJson.map((t) => {
  const lineIds =
    t.line_ids?.length
      ? t.line_ids
      : t.line_id_primary
        ? [t.line_id_primary]
        : [];
  const lineNames = t.line_names || [];
  const lineId = lineIds[0] || t.line_id_primary || '';
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
  href: item.href || '/catalog',
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

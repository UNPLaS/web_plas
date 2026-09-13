/**
 * View-models desde JSON exportado de new_plas.
 * Rutas internas: convención Front_plas (/projects, /events, …).
 */
import eventsJson from './events.json';
import facultyJson from './faculty.json';
import groupJson from './group.json';
import homeNewsJson from './home_news.json';
import linesJson from './lines.json';
import projectsJson from './projects.json';
import publicationsJson from './publications.json';
import resourcesJson from './resources.json';
import studentsJson from './students.json';
import thesesJson from './theses.json';

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
    .replace(/^\/eventos(\/|$)/, '/events$1')
    .replace(/^\/publicaciones(\/|$)/, '/catalog$1')
    .replace(/^\/integrantes(\/|$)/, '/people$1')
    .replace(/^\/investigacion(\/|$)/, '/lines$1')
    .replace(/^\/contacto(\/|$)/, '/contact$1')
    .replace(/^\/sobre(\/|$)/, '/about$1')
    .replace(/^\/recursos(\/|$)/, '/resources$1');

  // /projects/uncode ya coincide; /events#id → /events/<param>
  if (next === '/events' && hash) {
    next = `/events/${eventParam(decodeURIComponent(hash))}`;
    return next;
  }
  return hash ? `${next}#${hash}` : next;
}

export function eventParam(id: string): string {
  return id.replace(/:/g, '--');
}

export function eventIdFromParam(param: string): string {
  return param.replace(/--/g, ':');
}

export const group = groupJson;

export const site = {
  name: groupJson.name,
  nameFull: groupJson.name_full,
  tagline: 'Construimos software, herramientas y criterios para enseñar y hacer ingeniería.',
  subtitle:
    'Estudiantes y colaboradores exploran ideas con libertad y las llevan a producciones de calidad.',
  logo: '/images/PLaS/Logo_PLaS.png',
};

export const newsItems = homeNewsJson.slice(0, 3).map((item) => ({
  id: item.id,
  title: item.title,
  meta: item.meta || item.label,
  outcome: item.label,
  href: mapHref(item.href),
  image: '',
}));

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
    lineName: p.line_name,
  }));

export const featuredProjects = projectItems.slice(0, 6).map((p) => ({
  id: p.id,
  title: p.title,
  text: p.summary,
  outcome: p.outcome,
  href: p.href,
  image: p.image,
}));

export const eventItems = [...eventsJson]
  .sort((a, b) => String(b.date_from).localeCompare(String(a.date_from)))
  .map((e) => {
    const place =
      e.place && e.place !== 'No informado' ? ` · ${e.place}` : '';
    const summary = [e.participation, e.ambito, e.place !== 'No informado' ? e.place : '']
      .filter(Boolean)
      .join(' · ');
    return {
      id: eventParam(e.id),
      rawId: e.id,
      title: e.title,
      meta: `Evento · ${e.year}${place}`,
      summary: summary || e.event_type,
      outcome: e.participation || e.event_type,
      href: `/events/${eventParam(e.id)}`,
      image: '',
      year: e.year,
      place: e.place,
      dateFrom: e.date_from,
      dateTo: e.date_to,
      ambito: e.ambito,
      participation: e.participation,
      eventType: e.event_type,
    };
  });

export const facultyItems = facultyJson.map((f) => ({
  id: f.id,
  name: f.name_display,
  role: f.group_role || f.rank,
  href: '/people',
  image: f.image_path || '',
  meta: f.line_names?.length ? `Líneas: ${f.line_names.join(', ')}` : f.rank,
  email: f.email,
  rank: f.rank,
  profiles: f.profiles ?? [],
}));

export const people = facultyItems.map((f) => ({
  id: f.id,
  name: f.name,
  role: f.role,
  meta: f.meta,
  image: f.image,
}));

export const students = [...studentsJson]
  .sort((a, b) => Number(b.active) - Number(a.active) || a.name_sort.localeCompare(b.name_sort))
  .map((s) => ({
    id: s.id,
    name: s.name_display,
    role: s.role_label,
    meta: s.lines || s.status,
    image: s.image_path || '',
    active: s.active,
  }));

export const researchLines = linesJson.map((line) => ({
  id: line.id,
  title: line.name,
  text: line.description,
  href: '/lines',
  slug: line.slug,
  topics: line.topics ?? [],
}));

const pubItems = publicationsJson.map((p) => ({
  id: p.id,
  kind: 'pub' as const,
  title: p.title,
  author: p.authors,
  year: String(p.year),
  meta: `${p.typology_label_es} · ${p.year}`,
  href: p.url || p.doi ? `https://doi.org/${p.doi}` : '',
  outcome: p.venue_title || '',
}));

const thesisItems = thesesJson.map((t) => ({
  id: t.id,
  kind: 'thesis' as const,
  title: t.title,
  author: t.authors,
  year: String(t.year),
  meta: `Tesis · ${degreeLabel[t.degree] ?? t.degree} · ${t.year}`,
  href: t.item_url || '',
  outcome: t.line_names?.[0] || '',
}));

export const catalogItems = [...pubItems, ...thesisItems].sort(
  (a, b) => Number(b.year) - Number(a.year) || a.title.localeCompare(b.title),
);

export const recentWorks = catalogItems.slice(0, 3).map((item) => ({
  id: item.id,
  title: item.title,
  author: item.author,
  meta: item.meta,
  outcome: item.outcome,
  href: item.href || '/catalog',
  image: '',
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

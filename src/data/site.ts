/** Punto de entrada de datos del sitio: navegación, citas y view-models de `content.ts`. */

import { withBase } from '../lib/with-base';
import homeQuotesJson from './home-quotes.json';

export {
  blogItems,
  catalogItems,
  catalogYears,
  catalogTypologies,
  catalogFilterData,
  contactFields,
  contactIntro,
  contactLinks,
  eventItems,
  facultyItems,
  featuredProjects,
  group,
  newsItems,
  people,
  projectItems,
  recentWorks,
  researchLines,
  resourceSections,
  site,
  students,
  activeStudents,
  historicalStudentSections,
} from './content';

export const nav = [
  { href: withBase('/about'), label: 'Grupo' },
  { href: withBase('/lines'), label: 'Líneas' },
  { href: withBase('/projects'), label: 'Proyectos' },
  { href: withBase('/blog'), label: 'Blog' },
  { href: withBase('/catalog'), label: 'Catálogo' },
  { href: withBase('/resources'), label: 'Recursos' },
  { href: withBase('/people'), label: 'Equipo' },
  { href: withBase('/contact'), label: 'Contacto' },
] as const;

export const homeQuotes = homeQuotesJson;

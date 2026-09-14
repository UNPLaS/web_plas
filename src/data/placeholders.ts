/** Navegación y copy editorial del mockup. Datos de contenido: `content.ts` + JSON. */

import { withBase } from '../lib/with-base';

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

export {
  aboutAnchors,
  aboutIntro,
  aboutNucleos,
  aboutPurpose,
  aboutSignals,
} from './about';

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

export const homeQuote = {
  text: 'Los programas deben escribirse para que los lean las personas, y solo de paso para que los ejecuten las máquinas.',
  attribution: 'Harold Abelson y Gerald Jay Sussman, Structure and Interpretation of Computer Programs',
};

export const aboutDoors = [
  { href: withBase('/lines'), label: 'Líneas de investigación', text: 'Dónde concentramos el trabajo.' },
  { href: withBase('/people'), label: 'Equipo', text: 'Quiénes acompañan los proyectos.' },
  { href: withBase('/projects'), label: 'Proyectos', text: 'Herramientas y obras en curso.' },
];

export const claims = [
  'Frase clave uno.',
  'Frase clave dos.',
  'Frase clave tres.',
];

export const links = [
  { href: withBase('/about'), label: 'Grupo' },
  { href: withBase('/projects'), label: 'Proyectos' },
  { href: withBase('/blog'), label: 'Blog' },
  { href: withBase('/contact'), label: 'Contacto' },
];

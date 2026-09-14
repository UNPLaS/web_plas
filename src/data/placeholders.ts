/** Navegación y copy editorial del mockup. Datos de contenido: `content.ts` + JSON. */

export {
  aboutBlocks,
  aboutIntro,
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
  { href: '/about', label: 'Grupo' },
  { href: '/lines', label: 'Líneas' },
  { href: '/projects', label: 'Proyectos' },
  { href: '/blog', label: 'Blog' },
  { href: '/catalog', label: 'Catálogo' },
  { href: '/resources', label: 'Recursos' },
  { href: '/people', label: 'Equipo' },
  { href: '/contact', label: 'Contacto' },
] as const;

export const homeQuote = {
  text: 'Los programas deben escribirse para que los lean las personas, y solo de paso para que los ejecuten las máquinas.',
  attribution: 'Harold Abelson y Gerald Jay Sussman, Structure and Interpretation of Computer Programs',
};

export const aboutDoors = [
  { href: '/lines', label: 'Líneas de investigación', text: 'Dónde concentramos el trabajo.' },
  { href: '/people', label: 'Equipo', text: 'Quiénes acompañan los proyectos.' },
  { href: '/projects', label: 'Proyectos', text: 'Herramientas y obras en curso.' },
];

export const claims = [
  'Frase clave uno.',
  'Frase clave dos.',
  'Frase clave tres.',
];

export const links = [
  { href: '/about', label: 'Grupo' },
  { href: '/projects', label: 'Proyectos' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contacto' },
];

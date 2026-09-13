/** Placeholders mínimos — contenido de prueba. */

export const site = {
  name: 'Front Plas Prototype',
  tagline: 'Prototipo estructural — educación en ingeniería',
};

export const nav = [
  { href: '/', label: 'Inicio' },
  { href: '/about', label: 'About' },
  { href: '/lines', label: 'Lines' },
  { href: '/collection', label: 'Collection' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/people', label: 'People' },
  { href: '/contact', label: 'Contact' },
] as const;

export const claims = [
  'Frase clave uno.',
  'Frase clave dos.',
  'Frase clave tres.',
];

export const links = [
  { href: '/about', label: 'About' },
  { href: '/collection', label: 'Collection' },
  { href: '/contact', label: 'Contact' },
];

/** Cita de apertura en home — sin título de sección. */
export const homeQuote = {
  text: 'Los programas deben escribirse para que los lean las personas, y solo de paso para que los ejecuten las máquinas.',
  attribution: 'Harold Abelson y Gerald Jay Sussman, Structure and Interpretation of Computer Programs',
};

export const newsItems = [
  {
    id: 'news-01',
    title: 'Novedad uno',
    meta: 'Evento · 2026',
    href: '/collection/item-01',
  },
  {
    id: 'news-02',
    title: 'Novedad dos',
    meta: 'Proyecto · 2026',
    href: '/collection/item-02',
  },
  {
    id: 'news-03',
    title: 'Novedad tres',
    meta: 'Publicación · 2025',
    href: '/collection/item-03',
  },
];

export const recentWorks = [
  {
    id: 'work-01',
    title: 'Título de publicación reciente',
    author: 'Autores del trabajo',
    meta: 'Publicación · 2026',
    href: '/catalog',
  },
  {
    id: 'work-02',
    title: 'Título de tesis reciente',
    author: 'Estudiante Uno',
    meta: 'Tesis · Maestría · 2026',
    href: '/catalog',
  },
  {
    id: 'work-03',
    title: 'Otro artículo o capítulo',
    author: 'Autores del trabajo',
    meta: 'Publicación · 2025',
    href: '/catalog',
  },
];

export const featuredProjects = [
  {
    id: 'proj-01',
    title: 'UNCode',
    text: 'Aprendizaje y evaluación automática de programación.',
    href: '/collection/item-01',
  },
  {
    id: 'proj-02',
    title: 'SHE',
    text: 'Herramientas para software tolerante a fallos.',
    href: '/collection/item-02',
  },
  {
    id: 'proj-03',
    title: 'Paradigmas',
    text: 'Contenidos vivos para enseñar lenguajes de programación.',
    href: '/collection/item-03',
  },
  {
    id: 'proj-04',
    title: 'FTxAC',
    text: 'Cómputo aproximado y confiabilidad en sistemas embebidos.',
    href: '/collection',
  },
];

export const facultyItems = [
  {
    id: 'doc-01',
    name: 'Docente Uno',
    role: 'Líder del grupo',
    href: '/people',
  },
  {
    id: 'doc-02',
    name: 'Docente Dos',
    role: 'Profesor titular',
    href: '/people',
  },
  {
    id: 'doc-03',
    name: 'Docente Tres',
    role: 'Profesor asociado',
    href: '/people',
  },
  {
    id: 'doc-04',
    name: 'Docente Cuatro',
    role: 'Profesor asociado',
    href: '/people',
  },
];

/** Orden deliberado: educación primero (constancia), mismo peso visual en todas. */
export const researchLines = [
  {
    id: 'line-edu',
    title: 'Educación en ingeniería',
    text: 'Aprendizaje, evaluación y herramientas para enseñar a construir software.',
    href: '/lines',
  },
  {
    id: 'line-lang',
    title: 'Lenguajes de programación',
    text: 'Cómo se diseñan, analizan y enseñan los lenguajes.',
    href: '/lines',
  },
  {
    id: 'line-emb',
    title: 'Sistemas embebidos confiables',
    text: 'Tolerancia a fallos y sistemas que deben resistir el uso real.',
    href: '/lines',
  },
  {
    id: 'line-its',
    title: 'Sistemas inteligentes de transporte',
    text: 'Datos y modelos para movilidad y seguridad vial.',
    href: '/lines',
  },
  {
    id: 'line-agri',
    title: 'Agricultura de precisión',
    text: 'Tecnología aplicada a decisiones en el campo.',
    href: '/lines',
  },
];

export const contactFields = [
  { label: 'Correo', value: 'prototype@example.edu' },
  { label: 'Teléfono', value: '+00 000 000 0000' },
  { label: 'Dirección', value: 'Edificio · Ciudad' },
];

export const collectionItems = [
  {
    id: 'item-01',
    title: 'Novedad uno',
    meta: 'Evento · 2026',
    summary: 'Resumen corto del item para la colección de novedades.',
  },
  {
    id: 'item-02',
    title: 'Novedad dos',
    meta: 'Proyecto · 2026',
    summary: 'Resumen corto del item para la colección de novedades.',
  },
  {
    id: 'item-03',
    title: 'Novedad tres',
    meta: 'Publicación · 2025',
    summary: 'Resumen corto del item para la colección de novedades.',
  },
];

export const catalogItems = [
  {
    id: 'cat-01',
    title: 'Registro 01',
    author: 'Autores del trabajo',
    year: '2025',
    meta: 'Publicación · 2025',
  },
  {
    id: 'cat-02',
    title: 'Registro 02',
    author: 'Estudiante Uno',
    year: '2024',
    meta: 'Tesis · Maestría · 2024',
  },
  {
    id: 'cat-03',
    title: 'Registro 03',
    author: 'Autores del trabajo',
    year: '2023',
    meta: 'Publicación · 2023',
  },
  {
    id: 'cat-04',
    title: 'Registro 04',
    author: 'Estudiante Dos',
    year: '2023',
    meta: 'Tesis · Pregrado · 2023',
  },
];

export const people = [
  {
    id: 'p-01',
    name: 'Docente Uno',
    role: 'Líder del grupo',
    meta: 'Líneas: educación, lenguajes',
  },
  {
    id: 'p-02',
    name: 'Docente Dos',
    role: 'Profesor titular',
    meta: 'Líneas: embebidos, confiabilidad',
  },
  {
    id: 'p-03',
    name: 'Docente Tres',
    role: 'Profesor asociado',
    meta: 'Líneas: transporte, datos',
  },
  {
    id: 'p-04',
    name: 'Docente Cuatro',
    role: 'Profesor asociado',
    meta: 'Líneas: agricultura de precisión',
  },
];

export const students = [
  {
    id: 's-01',
    name: 'Estudiante Uno',
    role: 'Doctorado',
    meta: 'Educación en ingeniería',
  },
  {
    id: 's-02',
    name: 'Estudiante Dos',
    role: 'Maestría',
    meta: 'Lenguajes de programación',
  },
  {
    id: 's-03',
    name: 'Estudiante Tres',
    role: 'Maestría',
    meta: 'Sistemas embebidos',
  },
  {
    id: 's-04',
    name: 'Estudiante Cuatro',
    role: 'Pregrado',
    meta: 'Educación en ingeniería',
  },
];

export const aboutBlocks = [
  {
    title: 'Quiénes somos',
    body: 'Grupo de investigación en software, lenguajes y educación en ingeniería.',
  },
  {
    title: 'Cómo trabajamos',
    body: 'Proyectos, publicaciones y formación de estudiantes en un mismo hilo.',
  },
  {
    title: 'Con quiénes',
    body: 'Colaboraciones académicas e institucionales alrededor de problemas reales.',
  },
];

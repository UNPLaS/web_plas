/** Placeholders mínimos — contenido de prueba. */

export const site = {
  name: 'PLaS',
  tagline: 'Construimos software, herramientas y criterios para enseñar y hacer ingeniería.',
  subtitle:
    'Estudiantes y colaboradores exploran ideas con libertad y las llevan a producciones de calidad.',
};

export const nav = [
  { href: '/', label: 'Inicio' },
  { href: '/about', label: 'Grupo' },
  { href: '/lines', label: 'Líneas' },
  { href: '/projects', label: 'Proyectos' },
  { href: '/events', label: 'Eventos' },
  { href: '/catalog', label: 'Catálogo' },
  { href: '/people', label: 'Equipo' },
  { href: '/contact', label: 'Contacto' },
] as const;

export const claims = [
  'Frase clave uno.',
  'Frase clave dos.',
  'Frase clave tres.',
];

export const links = [
  { href: '/about', label: 'Grupo' },
  { href: '/projects', label: 'Proyectos' },
  { href: '/events', label: 'Eventos' },
  { href: '/contact', label: 'Contacto' },
];

/** Cita de apertura en home — sin título de sección. */
export const homeQuote = {
  text: 'Los programas deben escribirse para que los lean las personas, y solo de paso para que los ejecuten las máquinas.',
  attribution: 'Harold Abelson y Gerald Jay Sussman, Structure and Interpretation of Computer Programs',
};

export const newsItems = [
  {
    id: 'news-01',
    title: 'Taller abierto de evaluación automática',
    meta: 'Evento · 2026',
    outcome: 'Sesión práctica con UNCode y docentes invitados.',
    href: '/events/evt-01',
  },
  {
    id: 'news-02',
    title: 'Nuevo módulo de laboratorio en Paradigmas',
    meta: 'Proyecto · 2026',
    outcome: 'Material usable en curso y reproducible fuera del aula.',
    href: '/projects/proj-paradigmas',
  },
  {
    id: 'news-03',
    title: 'Artículo aceptado sobre aprendizaje de programación',
    meta: 'Publicación · 2025',
    outcome: 'Resultados de estudio en aula con evidencia empírica.',
    href: '/events/evt-02',
  },
];

export const recentWorks = [
  {
    id: 'work-01',
    title: 'Evaluación automática formativa en cursos de programación',
    author: 'Autores del grupo',
    meta: 'Publicación · 2026',
    outcome: 'Modelo validado en un curso real de pregrado.',
    href: '/catalog',
  },
  {
    id: 'work-02',
    title: 'Herramientas de apoyo para software tolerante a fallos',
    author: 'Estudiante Uno',
    meta: 'Tesis · Maestría · 2026',
    outcome: 'Prototipo usable y evaluación experimental.',
    href: '/catalog',
  },
  {
    id: 'work-03',
    title: 'Diseño de lenguajes para enseñanza de paradigmas',
    author: 'Autores del grupo',
    meta: 'Publicación · 2025',
    outcome: 'Criterios de diseño aplicados a contenidos de curso.',
    href: '/catalog',
  },
];

export const featuredProjects = [
  {
    id: 'proj-01',
    title: 'UNCode',
    text: 'Aprendizaje y evaluación automática de programación.',
    outcome: 'Plataforma en uso para juzgar y formar en programación.',
    href: '/projects/proj-uncode',
  },
  {
    id: 'proj-02',
    title: 'SHE',
    text: 'Herramientas para software tolerante a fallos.',
    outcome: 'Suite de apoyo al diseño y análisis de resiliencia.',
    href: '/projects/proj-she',
  },
  {
    id: 'proj-03',
    title: 'Paradigmas',
    text: 'Contenidos vivos para enseñar lenguajes de programación.',
    outcome: 'Material de curso mantenido y abierto a iteración.',
    href: '/projects/proj-paradigmas',
  },
  {
    id: 'proj-04',
    title: 'FTxAC',
    text: 'Cómputo aproximado y confiabilidad en sistemas embebidos.',
    outcome: 'Métodos y prototipos para sistemas con margen de error.',
    href: '/projects/proj-ftxac',
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
  {
    label: 'Correo',
    value: 'plas@unal.edu.co',
    href: 'mailto:plas@unal.edu.co',
  },
  {
    label: 'Teléfono',
    value: '+57 601 316 5000',
    href: 'tel:+576013165000',
  },
  {
    label: 'Ubicación',
    value: 'Facultad de Ingeniería · Universidad Nacional de Colombia, Bogotá',
  },
];

export const contactIntro = {
  title: 'Escríbenos',
  lede: 'Ideas de tesis, colaboraciones o preguntas sobre el grupo: leemos con criterio y respondemos cuando hay un camino claro.',
  ctaLabel: 'Enviar correo',
  ctaHref: 'mailto:plas@unal.edu.co',
};

export const projectItems = [
  {
    id: 'proj-uncode',
    title: 'UNCode',
    meta: 'Proyecto · Activo',
    summary: 'Plataforma de aprendizaje y evaluación automática de programación.',
    outcome: 'En uso en cursos para juzgar y formar.',
  },
  {
    id: 'proj-she',
    title: 'SHE',
    meta: 'Proyecto · Activo',
    summary: 'Herramientas para diseñar y analizar software tolerante a fallos.',
    outcome: 'Suite de apoyo a resiliencia de software.',
  },
  {
    id: 'proj-paradigmas',
    title: 'Paradigmas',
    meta: 'Proyecto · Educación',
    summary: 'Contenidos vivos para enseñar lenguajes y paradigmas de programación.',
    outcome: 'Material de curso iterable y abierto.',
  },
  {
    id: 'proj-ftxac',
    title: 'FTxAC',
    meta: 'Proyecto · Embebidos',
    summary: 'Cómputo aproximado y confiabilidad en sistemas embebidos.',
    outcome: 'Métodos y prototipos con margen de error controlado.',
  },
];

export const eventItems = [
  {
    id: 'evt-01',
    title: 'Taller abierto de evaluación automática',
    meta: 'Evento · 2026',
    summary: 'Sesión práctica con UNCode y docentes invitados.',
    outcome: 'Intercambio de prácticas de evaluación en aula.',
  },
  {
    id: 'evt-02',
    title: 'Charla: resultados en aprendizaje de programación',
    meta: 'Evento · 2025',
    summary: 'Presentación de hallazgos de estudio en aula con evidencia empírica.',
    outcome: 'Difusión de resultados ante la comunidad académica.',
  },
  {
    id: 'evt-03',
    title: 'Encuentro de estudiantes del grupo',
    meta: 'Evento · 2025',
    summary: 'Espacio para compartir avances de tesis y proyectos en curso.',
    outcome: 'Retroalimentación cruzada entre líneas del grupo.',
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

export const aboutIntro = {
  title: 'Sobre el grupo',
  lede: 'PLaS reúne investigación en software, lenguajes y educación en ingeniería. Construimos herramientas reales y formamos criterio en el camino.',
  statement:
    'No separamos el laboratorio del aula: lo que investigamos se prueba, se enseña y se lleva a producción con calidad.',
};

export const aboutBlocks = [
  {
    title: 'Quiénes somos',
    body: 'Un grupo de la Universidad Nacional de Colombia enfocado en software, lenguajes de programación y educación en ingeniería de sistemas.',
  },
  {
    title: 'Cómo trabajamos',
    body: 'Proyectos, publicaciones y tesis en un mismo hilo: ideas exploradas con libertad y entregadas con rigor.',
  },
  {
    title: 'Con quiénes',
    body: 'Estudiantes, docentes e instituciones que comparten problemas concretos de enseñanza, evaluación y sistemas confiables.',
  },
];

export const aboutDoors = [
  { href: '/lines', label: 'Líneas de investigación', text: 'Dónde concentramos el trabajo.' },
  { href: '/people', label: 'Equipo', text: 'Quiénes acompañan los proyectos.' },
  { href: '/projects', label: 'Proyectos', text: 'Herramientas y obras en curso.' },
];

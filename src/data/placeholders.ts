/** Datos ficticios para validar estructura, no contenido real. */

export const site = {
  name: 'Front Plas Prototype',
  tagline: 'Educación en ingeniería como raíz compartida — grupo vibrante, docente sereno',
};

export const nav = [
  { href: '/', label: 'Home', pattern: 'home' },
  { href: '/about', label: 'About', pattern: 'sections' },
  { href: '/collection', label: 'Collection', pattern: 'card-index' },
  { href: '/catalog', label: 'Catalog', pattern: 'filter-catalog' },
  { href: '/people', label: 'People', pattern: 'directory' },
  { href: '/sections', label: 'Sections', pattern: 'grouped-blocks' },
  { href: '/contact', label: 'Contact', pattern: 'contact' },
] as const;

export const claims = [
  'La educación en ingeniería es el tronco: de ahí crecen las demás ramas.',
  'Aprender no es lineal — bifurca, vuelve, profundiza.',
  'Herramientas y mentoría: crecimiento que se puede tocar.',
];

export const ctas = [
  {
    title: 'Estudiar',
    text: 'Rama abierta: formación, mentoring, camino al laboratorio.',
    primary: { href: '/about', label: 'Conocer el enfoque' },
    secondary: { href: '/contact', label: 'Escribir' },
  },
  {
    title: 'Explorar obras',
    text: 'Proyectos y evidencias como frutos del proceso educativo.',
    primary: { href: '/collection', label: 'Colección' },
    secondary: { href: '/catalog', label: 'Catálogo' },
  },
  {
    title: 'Gente',
    text: 'Quién sostiene el árbol: docentes, estudiantes, trayectorias.',
    primary: { href: '/people', label: 'Personas' },
    secondary: { href: '/sections', label: 'Secciones' },
  },
];

export const chips = [
  'Educación en ingeniería',
  'Mentoría',
  'Herramientas',
  'Crecimiento',
];

export const collectionItems = [
  {
    id: 'item-01',
    title: 'Item de colección 01',
    meta: 'Meta · 2024',
    summary: 'Extracto corto del item. Sirve para probar título + meta + cuerpo.',
  },
  {
    id: 'item-02',
    title: 'Item de colección 02',
    meta: 'Meta · 2023',
    summary: 'Segundo item de la grilla. Misma estructura de tarjeta.',
  },
  {
    id: 'item-03',
    title: 'Item de colección 03',
    meta: 'Meta · 2022',
    summary: 'Tercer item. Validar densidad en grid de 2 columnas.',
  },
  {
    id: 'item-04',
    title: 'Item de colección 04',
    meta: 'Meta · 2021',
    summary: 'Cuarto item. Cierre del preview en home y del índice.',
  },
];

export const catalogItems = [
  {
    id: 'cat-01',
    title: 'Registro de catálogo 01',
    year: '2025',
    typology: 'Tipo A',
    authors: 'Autor Uno, Autor Dos',
    venue: 'Venue de ejemplo',
  },
  {
    id: 'cat-02',
    title: 'Registro de catálogo 02',
    year: '2024',
    typology: 'Tipo B',
    authors: 'Autor Tres',
    venue: 'Otro venue',
  },
  {
    id: 'cat-03',
    title: 'Registro de catálogo 03',
    year: '2024',
    typology: 'Tipo A',
    authors: 'Autor Cuatro, Autor Cinco',
    venue: 'Venue corto',
  },
  {
    id: 'cat-04',
    title: 'Registro de catálogo 04',
    year: '2023',
    typology: 'Tipo C',
    authors: 'Autor Seis',
    venue: 'Venue largo de prueba',
  },
  {
    id: 'cat-05',
    title: 'Registro de catálogo 05',
    year: '2022',
    typology: 'Tipo B',
    authors: 'Autor Siete, Autor Ocho',
    venue: 'Venue X',
  },
];

export const people = [
  {
    id: 'p-01',
    name: 'Persona Ejemplo Uno',
    role: 'Rol destacado',
    meta: 'Afiliación · línea ficticia',
    hasPhoto: true,
  },
  {
    id: 'p-02',
    name: 'Persona Ejemplo Dos',
    role: 'Rol secundario',
    meta: 'Afiliación · otra línea',
    hasPhoto: true,
  },
  {
    id: 'p-03',
    name: 'Persona Ejemplo Tres',
    role: 'Rol de lista',
    meta: 'Estado · año',
    hasPhoto: false,
  },
  {
    id: 'p-04',
    name: 'Persona Ejemplo Cuatro',
    role: 'Rol de lista',
    meta: 'Estado · año',
    hasPhoto: false,
  },
];

export const aboutSections = [
  {
    id: 'block-a',
    title: 'Bloque A',
    body: 'Párrafo de sección apilada. Estructura: título + cuerpo. Sin narrativa real.',
  },
  {
    id: 'block-b',
    title: 'Bloque B',
    body: 'Segundo bloque. Misma forma, distinto id para anclas internas.',
  },
  {
    id: 'block-c',
    title: 'Bloque C',
    body: 'Tercer bloque. Cierra la página de secciones simples.',
  },
];

export const timeline = [
  { year: 'Fase 1', title: 'Capítulo uno', body: 'Descripción corta del hito.' },
  { year: 'Fase 2', title: 'Capítulo dos', body: 'Descripción corta del hito.' },
  { year: 'Fase 3', title: 'Capítulo tres', body: 'Descripción corta del hito.' },
  { year: 'Fase 4', title: 'Capítulo cuatro', body: 'Descripción corta del hito.' },
];

export const groupedSections = [
  {
    id: 'group-a',
    title: 'Grupo A',
    items: [
      { title: 'Entrada A1', meta: 'Meta A1' },
      { title: 'Entrada A2', meta: 'Meta A2' },
      { title: 'Entrada A3', meta: 'Meta A3' },
    ],
  },
  {
    id: 'group-b',
    title: 'Grupo B',
    items: [
      { title: 'Entrada B1', meta: 'Meta B1' },
      { title: 'Entrada B2', meta: 'Meta B2' },
    ],
  },
  {
    id: 'group-c',
    title: 'Grupo C',
    items: [
      { title: 'Entrada C1', meta: 'Meta C1' },
      { title: 'Entrada C2', meta: 'Meta C2' },
      { title: 'Entrada C3', meta: 'Meta C3' },
      { title: 'Entrada C4', meta: 'Meta C4' },
    ],
  },
];

export const tableRows = [
  { year: '2025', colA: 'Valor A1', colB: 'Valor B1', colC: 'Valor C1' },
  { year: '2024', colA: 'Valor A2', colB: 'Valor B2', colC: 'Valor C2' },
  { year: '2023', colA: 'Valor A3', colB: 'Valor B3', colC: 'Valor C3' },
  { year: '2022', colA: 'Valor A4', colB: 'Valor B4', colC: 'Valor C4' },
];

export const contactFields = [
  { label: 'Correo', value: 'prototype@example.edu' },
  { label: 'Teléfono', value: '+00 000 000 0000' },
  { label: 'Dirección', value: 'Edificio · Ciudad · País' },
  { label: 'Enlace externo', value: 'https://example.edu/group', href: '#' },
];

export const detailSections = [
  {
    title: 'Sección de detalle 1',
    body: 'Cuerpo largo del detalle. Aquí iría descripción, contexto o método.',
  },
  {
    title: 'Sección de detalle 2',
    body: 'Segunda sección apilada bajo el hero del item.',
  },
];

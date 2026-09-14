/**
 * Sobre PLaS — mapa del grupo (propósito + núcleos + anclas).
 */
import groupJson from './group.json';
import { projectItems } from './content';

export const aboutIntro = {
  eyebrow: 'Sobre el grupo',
  title: 'Sobre PLaS',
  lead:
    'Investigamos cómo se enseñan, construyen y confían los lenguajes y los sistemas —en el aula, el laboratorio y problemas reales de movilidad y producción.',
  meta: [
    `Categoría Minciencias ${groupJson.minciencias_class}`,
    groupJson.institution,
    'Maestría y doctorado',
  ],
};

export const aboutPurpose = {
  id: 'proposito',
  title: 'Cómo entendemos el trabajo',
  paragraphs: [
    'Contribuimos a que los sistemas computacionales —y quienes los diseñan, los programan y los enseñan— ganen en comprensión, en formación con evidencia y en confianza: entender con más claridad lo que se construye; investigar con rigor cómo se aprende a construirlo; y sostener lo construido cuando el entorno exige fiabilidad o decisiones a tiempo.',
    'Ese propósito se recorre por las líneas del grupo —lenguajes, educación en ingeniería, embebidos confiables, transporte inteligente y agricultura de precisión—, como caminos distintos hacia la misma pregunta. Formamos investigadores e investigadoras y preferimos dejar métodos y herramientas que otros puedan usar, evaluar y mejorar fuera del paper.',
    'Investigar aquí es un oficio: preguntas precisas, evidencia revisable y acompañamiento en posgrado. El rigor se pone a prueba cuando el aula, el dispositivo y el entorno se hablan; el avance se nota en lo publicado, lo reutilizable y la comunidad que sostiene ese modo de trabajar.',
  ],
};

/** Puente escaneable entre el propósito y las puertas concretas. */
export const aboutNucleos = {
  id: 'nucleos',
  title: 'Tres núcleos',
  lede: 'La misma pregunta, tres formas de nombrarla.',
  items: [
    {
      title: 'Comprensión',
      text: 'Entender y expresar lo que se construye: lenguajes, código, representación.',
    },
    {
      title: 'Formación con evidencia',
      text: 'Investigar cómo se aprende a construir sistemas: aula, evaluación, mentoring.',
    },
    {
      title: 'Confianza',
      text: 'Que el sistema resista y sirva cuando importa: embebidos, datos y entorno aplicado.',
    },
  ],
};

const uncode = projectItems.find((p) => p.id === 'uncode');

export const aboutAnchors = {
  title: 'PLaS en concreto',
  lede: 'Tres puertas al trabajo vivo del grupo.',
  items: [
    {
      href: uncode?.href ?? '/projects/uncode',
      label: uncode?.title ?? 'UNCode',
      text: 'Aprendizaje y evaluación automática de programación: un artefacto que une aula e investigación.',
      image: uncode?.image || '/images/PLaS/proyectos/uncode0.png',
      meta: uncode?.lineName ?? 'Educación en ingeniería',
    },
    {
      href: '/lines',
      label: 'Líneas de investigación',
      text: 'Cinco frentes que se refuerzan: del lenguaje y el aula a embebidos, ciudad y campo.',
      image: '/images/PLaS/proyectos/lenguajes/lenguajes_0.jpg',
      meta: 'Mapa del grupo',
    },
    {
      href: '/people',
      label: 'Equipo',
      text: 'Docentes y trayectoria de formación en maestría y doctorado.',
      image: '/images/PLaS/profesores/frc_pic.jpg',
      meta: 'Comunidad',
    },
  ],
};

/** Señales institucionales (ficha, no prosa). */
export const aboutSignals = {
  classLabel: groupJson.minciencias_class,
  convocatoria: groupJson.minciencias_convocatoria,
  gruplac: groupJson.gruplac_url,
  hermes: groupJson.hermes_url,
};

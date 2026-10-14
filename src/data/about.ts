/**
 * Sobre PLaS — mapa del grupo (propósito + núcleos + anclas), en cada idioma.
 */
import groupJson from './group.json';
import { getContent } from './content';
import { withBase } from '../lib/with-base';
import { localePath, type Lang } from '../i18n';

const TEXT = {
  es: {
    intro: {
      eyebrow: 'Sobre el grupo',
      title: 'Sobre PLaS',
      lead: 'Investigamos cómo se enseñan, construyen y confían los lenguajes y los sistemas —en el aula, el laboratorio y problemas reales de movilidad y producción.',
      meta: [
        `Categoría Minciencias ${groupJson.minciencias_class}`,
        groupJson.institution,
        'Maestría y doctorado',
      ],
    },
    purpose: {
      title: 'Cómo entendemos el trabajo',
      paragraphs: [
        'Contribuimos a que los sistemas computacionales —y quienes los diseñan, los programan y los enseñan— ganen en comprensión, en formación con evidencia y en confianza: entender con más claridad lo que se construye; investigar con rigor cómo se aprende a construirlo; y sostener lo construido cuando el entorno exige fiabilidad o decisiones a tiempo.',
        'Ese propósito se recorre por las líneas del grupo —lenguajes, educación en ingeniería, embebidos confiables, transporte inteligente y sensado del entorno—, como caminos distintos hacia la misma pregunta. Formamos investigadores e investigadoras y preferimos dejar métodos y herramientas que otros puedan usar, evaluar y mejorar fuera del paper.',
        'Investigar aquí es un oficio: preguntas precisas, evidencia revisable y acompañamiento en posgrado. El rigor se pone a prueba cuando el aula, el dispositivo y el entorno se hablan; el avance se nota en lo publicado, lo reutilizable y la comunidad que sostiene ese modo de trabajar.',
      ],
    },
    nucleos: {
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
    },
    anchors: {
      title: 'PLaS en concreto',
      lede: 'Tres puertas al trabajo vivo del grupo.',
      uncode: 'Aprendizaje y evaluación automática de programación: un artefacto que une aula e investigación.',
      uncodeMeta: 'Educación en ingeniería',
      lines: 'Líneas de investigación',
      linesText: 'Cinco frentes que se refuerzan: del lenguaje y el aula a embebidos, ciudad y campo.',
      linesMeta: 'Mapa del grupo',
      people: 'Equipo',
      peopleText: 'Docentes y trayectoria de formación en maestría y doctorado.',
      peopleMeta: 'Comunidad',
    },
  },
  en: {
    intro: {
      eyebrow: 'About the group',
      title: 'About PLaS',
      lead: 'We study how languages and systems are taught, built and trusted — in the classroom, in the lab, and in real mobility and production problems.',
      meta: [
        `Minciencias category ${groupJson.minciencias_class}`,
        groupJson.institution,
        'Master’s and PhD',
      ],
    },
    purpose: {
      title: 'How we see our work',
      paragraphs: [
        'We help computing systems — and the people who design, program and teach them — gain understanding, evidence-based training and trust: understanding more clearly what gets built; researching rigorously how people learn to build it; and sustaining what has been built when the setting demands reliability or timely decisions.',
        'That purpose runs through the group’s research lines — languages, engineering education, dependable embedded systems, intelligent transportation and environmental sensing — as different paths toward the same question. We train researchers, and we prefer to leave behind methods and tools that others can use, evaluate and improve beyond the paper.',
        'Research here is a craft: precise questions, reviewable evidence and close mentoring in graduate programs. Rigor is put to the test when the classroom, the device and the environment talk to each other; progress shows in what gets published, what can be reused, and the community that sustains this way of working.',
      ],
    },
    nucleos: {
      title: 'Three cores',
      lede: 'One question, three ways of naming it.',
      items: [
        {
          title: 'Understanding',
          text: 'Understanding and expressing what gets built: languages, code, representation.',
        },
        {
          title: 'Evidence-based training',
          text: 'Researching how people learn to build systems: classroom, assessment, mentoring.',
        },
        {
          title: 'Trust',
          text: 'Systems that hold up and serve when it matters: embedded devices, data and applied settings.',
        },
      ],
    },
    anchors: {
      title: 'PLaS in practice',
      lede: 'Three doors into the group’s ongoing work.',
      uncode: 'Automated programming learning and assessment: an artifact that brings classroom and research together.',
      uncodeMeta: 'Engineering education',
      lines: 'Research lines',
      linesText: 'Five mutually reinforcing fronts: from language and the classroom to embedded systems, the city and the field.',
      linesMeta: 'Map of the group',
      people: 'People',
      peopleText: 'Faculty and a track record of training master’s and PhD students.',
      peopleMeta: 'Community',
    },
  },
} satisfies Record<Lang, unknown>;

export function getAbout(lang: Lang) {
  const text = TEXT[lang];
  const uncode = getContent(lang).projectItems.find((p) => p.id === 'uncode');
  return {
    intro: text.intro,
    purpose: { id: 'proposito', ...text.purpose },
    nucleos: { id: 'nucleos', ...text.nucleos },
    anchors: {
      title: text.anchors.title,
      lede: text.anchors.lede,
      items: [
        {
          href: uncode?.href ?? localePath(lang, '/projects/uncode'),
          label: uncode?.title ?? 'UNCode',
          text: text.anchors.uncode,
          image: uncode?.image || withBase('/images/PLaS/proyectos/uncode0.webp'),
          meta: uncode?.lineName ?? text.anchors.uncodeMeta,
        },
        {
          href: localePath(lang, '/lines'),
          label: text.anchors.lines,
          text: text.anchors.linesText,
          image: withBase('/images/PLaS/proyectos/lenguajes/lenguajes_0.webp'),
          meta: text.anchors.linesMeta,
        },
        {
          href: localePath(lang, '/people'),
          label: text.anchors.people,
          text: text.anchors.peopleText,
          image: withBase('/images/PLaS/profesores/frc_pic.webp'),
          meta: text.anchors.peopleMeta,
        },
      ],
    },
    /** Señales institucionales (ficha, no prosa). */
    signals: {
      classLabel: groupJson.minciencias_class,
      convocatoria: groupJson.minciencias_convocatoria,
      gruplac: groupJson.gruplac_url,
      hermes: groupJson.hermes_url,
    },
  };
}

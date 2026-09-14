/** Fuentes / editoriales del catálogo: logo por prefijo DOI o host. */
import { withBase } from '../lib/with-base';

export type CatalogSource = {
  id: string;
  label: string;
  logo: string;
};

const sources = {
  ieee: { id: 'ieee', label: 'IEEE', logo: '/images/catalog-sources/ieee.png' },
  mdpi: { id: 'mdpi', label: 'MDPI', logo: '/images/catalog-sources/mdpi.png' },
  springer: {
    id: 'springer',
    label: 'Springer',
    logo: '/images/catalog-sources/springer.png',
  },
  elsevier: {
    id: 'elsevier',
    label: 'Elsevier',
    logo: '/images/catalog-sources/elsevier.png',
  },
  acm: { id: 'acm', label: 'ACM', logo: '/images/catalog-sources/acm.svg' },
  wiley: { id: 'wiley', label: 'Wiley', logo: '/images/catalog-sources/wiley.png' },
  sage: { id: 'sage', label: 'SAGE', logo: '/images/catalog-sources/sage.svg' },
  frontiers: {
    id: 'frontiers',
    label: 'Frontiers',
    logo: '/images/catalog-sources/frontiers.svg',
  },
  peerj: { id: 'peerj', label: 'PeerJ', logo: '/images/catalog-sources/peerj.svg' },
  iated: { id: 'iated', label: 'IATED', logo: '/images/catalog-sources/iated.png' },
  scitepress: {
    id: 'scitepress',
    label: 'SCITEPRESS',
    logo: '/images/catalog-sources/scitepress.svg',
  },
  informing: {
    id: 'informing',
    label: 'Informing Science',
    logo: '/images/catalog-sources/informing.svg',
  },
  inderscience: {
    id: 'inderscience',
    label: 'Inderscience',
    logo: '/images/catalog-sources/inderscience.svg',
  },
  dialnet: {
    id: 'dialnet',
    label: 'Dialnet',
    logo: '/images/catalog-sources/dialnet.svg',
  },
  wiete: { id: 'wiete', label: 'WIETE', logo: '/images/catalog-sources/wiete.svg' },
  utp: { id: 'utp', label: 'UTP', logo: '/images/catalog-sources/utp.svg' },
  'unal-revistas': {
    id: 'unal-revistas',
    label: 'Revistas UNAL',
    logo: '/images/catalog-sources/unal-revistas.svg',
  },
  'unal-repo': {
    id: 'unal-repo',
    label: 'Repositorio UNAL',
    logo: '/images/catalog-sources/unal-repo.png',
  },
  uninorte: {
    id: 'uninorte',
    label: 'Universidad del Norte',
    logo: '/images/catalog-sources/uninorte.svg',
  },
  uptc: { id: 'uptc', label: 'UPTC', logo: '/images/catalog-sources/uptc.svg' },
  unisimon: {
    id: 'unisimon',
    label: 'Universidad Simón Bolívar',
    logo: '/images/catalog-sources/unisimon.svg',
  },
  uma: {
    id: 'uma',
    label: 'Universidad de Málaga',
    logo: '/images/catalog-sources/uma.svg',
  },
  sbmicro: {
    id: 'sbmicro',
    label: 'JICS / SBMicro',
    logo: '/images/catalog-sources/sbmicro.svg',
  },
  apsce: { id: 'apsce', label: 'APSCE', logo: '/images/catalog-sources/apsce.svg' },
  tecnia: { id: 'tecnia', label: 'TECNIA', logo: '/images/catalog-sources/tecnia.svg' },
  document: {
    id: 'document',
    label: 'Documento',
    logo: '/images/catalog-sources/document.svg',
  },
} as const satisfies Record<string, CatalogSource>;

type SourceId = keyof typeof sources;

/** Prefijos DOI → editorial / plataforma. */
const doiPrefixToSource: Record<string, SourceId> = {
  '10.1109': 'ieee',
  '10.3390': 'mdpi',
  '10.1007': 'springer',
  '10.1016': 'elsevier',
  '10.1145': 'acm',
  '10.1002': 'wiley',
  '10.1111': 'wiley',
  '10.1177': 'sage',
  '10.3389': 'frontiers',
  '10.7717': 'peerj',
  '10.28945': 'informing',
  '10.21125': 'iated',
  '10.5220': 'scitepress',
  '10.1504': 'inderscience',
  '10.15446': 'unal-revistas',
  '10.14482': 'uninorte',
  '10.19053': 'uptc',
  '10.17081': 'unisimon',
  '10.24310': 'uma',
  '10.29292': 'sbmicro',
  '10.58459': 'apsce',
  '10.21754': 'tecnia',
};

/** Dominios (hostname sin www) → fuente. */
const hostToSource: Record<string, SourceId> = {
  'repositorio.unal.edu.co': 'unal-repo',
  'dialnet.unirioja.es': 'dialnet',
  'wiete.com.au': 'wiete',
  'revistas.utp.ac.pa': 'utp',
};

function hostFromUrl(url?: string) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function doiPrefix(doi?: string) {
  if (!doi) return '';
  const cleaned = String(doi).trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  return cleaned.split('/')[0] || '';
}

export function resolveCatalogSource(opts: {
  doi?: string;
  url?: string;
  kind?: 'pub' | 'thesis';
}): CatalogSource {
  const prefix = doiPrefix(opts.doi);
  let source: CatalogSource;
  if (prefix && doiPrefixToSource[prefix]) {
    source = sources[doiPrefixToSource[prefix]];
  } else {
    const host = hostFromUrl(opts.url);
    if (host && hostToSource[host]) {
      source = sources[hostToSource[host]];
    } else if (opts.kind === 'thesis') {
      source = sources['unal-repo'];
    } else {
      source = sources.document;
    }
  }
  return { ...source, logo: withBase(source.logo) };
}

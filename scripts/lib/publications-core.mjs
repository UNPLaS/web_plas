/**
 * Pure helpers for the publication harvest (testable without ORCID/Crossref).
 * The catalog of record is src/data/publications.json: existing rows are never
 * modified, new ORCID works are appended in site format.
 */
import { typologyFromCrossref, typologyFromOrcid } from "./typology.mjs";
import {
  identityConfidence,
  nameMatchesAuthor,
  normalizeDoi,
  stripAccents,
  yearFromCrossref,
} from "./orcid-crossref.mjs";
import { classifyTopics, linesForTopics } from "./topics.mjs";

export const FABIO = "docente:fagonzalezo";
/** Manual marker: hidden from the site and never re-harvested. */
export const REJECTED = "rejected";
export const HARVEST_SOURCE = "orcid_harvest";

export const MATCH = {
  "docente:ferestrepoca": {
    familyParts: ["restrepo", "calle"],
    givenNames: ["felipe"],
    givenInitials: ["f"],
  },
  "docente:capedrazab": {
    familyParts: ["pedraza"],
    givenNames: ["cesar", "césar", "augusto"],
    givenInitials: ["c"],
  },
  "docente:fagonzalezo": {
    familyParts: ["gonzalez", "gonzález"],
    givenNames: ["fabio"],
    givenInitials: ["f"],
  },
  "docente:jjramireze": {
    familyParts: ["ramirez", "ramírez", "echeverry"],
    givenNames: ["jhon", "jairo"],
    givenInitials: ["j"],
  },
};

export function pubIdFromDoi(doi) {
  return `pub:doi:${normalizeDoi(doi)}`;
}

export function pubIdFromOrcid(orcid, putCode) {
  return `pub:orcid:${orcid.replace(/-/g, "")}:${putCode}`;
}

export function normTitle(s) {
  return stripAccents(String(s || "").replace(/<[^>]+>/g, " "))
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** ORCID iD from the faculty "ORCID" profile link. */
export function orcidFromFaculty(f) {
  const url = (f.profiles || []).find((p) => /orcid/i.test(p.label || ""))?.url || "";
  return url.match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i)?.[0] || "";
}

export function matchOptsFor(doc) {
  return (
    MATCH[doc.id] || {
      familyParts: [(doc.name_sort || "").split(",")[0].trim()].filter(Boolean),
      givenNames: [],
      givenInitials: [],
    }
  );
}

/** Index of every known publication (accepted or rejected) for dedupe. */
export function buildKnownIndex(pubs) {
  const index = { ids: new Set(), dois: new Set(), titles: new Set() };
  for (const p of pubs) addToKnownIndex(index, p);
  return index;
}

export function addToKnownIndex(index, p) {
  if (p.id) index.ids.add(p.id);
  if (p.doi) index.dois.add(normalizeDoi(p.doi));
  const t = normTitle(p.title);
  if (t) index.titles.add(t);
}

function isKnown(index, { id, doi, title }) {
  if (index.ids.has(id)) return true;
  if (doi && index.dois.has(normalizeDoi(doi))) return true;
  const t = normTitle(title);
  return Boolean(t) && index.titles.has(t);
}

function authorOrcid(a) {
  return (a.ORCID || "").replace(/https?:\/\/orcid\.org\//i, "").toUpperCase();
}

/** PLaS docentes among Crossref authors, by ORCID or by name. */
export function plasDocentesInAuthors(authors, faculty) {
  const found = new Set();
  for (const a of authors) {
    const o = authorOrcid(a);
    for (const f of faculty) {
      if ((o && o === (f.orcid || "").toUpperCase()) || nameMatchesAuthor(a, matchOptsFor(f))) {
        found.add(f.id);
      }
    }
  }
  return found;
}

/** Student full names → token sets, for coauthor detection. */
export function buildStudentMatchers(names) {
  return names
    .map((n) => new Set(normTitle(n).split(" ").filter(Boolean)))
    .filter((tokens) => tokens.size >= 2);
}

/** A student matches when the author's first given name and first surname are in the student's name. */
export function hasStudentAuthor(authors, studentMatchers) {
  return authors.some((a) => {
    const given = normTitle(a.given).split(" ")[0] || "";
    const family = normTitle(a.family).split(" ")[0] || "";
    if (given.length < 2 || family.length < 2) return false;
    return studentMatchers.some((tokens) => tokens.has(given) && tokens.has(family));
  });
}

/**
 * Evaluate one ORCID work (+ optional Crossref message) for the catalog.
 * @returns {{ status: "quarantined" | "known" | "fabio_independent" | "added", pub?: object }}
 */
export function evaluateOrcidWork({ work, msg, doc, faculty, studentMatchers, known, lines = [] }) {
  const doi = normalizeDoi(work.doi);
  const id = doi ? pubIdFromDoi(doi) : pubIdFromOrcid(doc.orcid, work.putCode);

  if (doi && msg && identityConfidence(msg, doc.orcid, matchOptsFor(doc)) === "E") {
    return { status: "quarantined" };
  }

  const crossrefTitle = String(msg?.title?.[0] || "").replace(/<[^>]+>/g, "").trim();
  const title = crossrefTitle || work.title || "";
  if (isKnown(known, { id, doi, title })) return { status: "known" };

  const authors = msg?.author?.length ? msg.author : [];
  const docentes = plasDocentesInAuthors(authors, faculty);
  docentes.add(doc.id);

  if (doc.id === FABIO && docentes.size === 1 && !hasStudentAuthor(authors, studentMatchers)) {
    return { status: "fabio_independent" };
  }

  const typ = msg ? typologyFromCrossref(msg.type) : typologyFromOrcid(work.type);
  const candidateLines = new Set();
  for (const f of faculty) {
    if (docentes.has(f.id)) for (const l of f.line_ids || []) candidateLines.add(l);
  }
  const authorNames = authors
    .map((a) => `${a.given || ""} ${a.family || ""}`.trim())
    .filter(Boolean);
  const venueTitle = msg?.["container-title"]?.[0] || "";
  const topicIds = classifyTopics(`${title}\n${venueTitle}`, lines, [...candidateLines]);
  const seedLine = faculty.find((f) => f.id === doc.id)?.line_ids?.[0];

  const pub = {
    id,
    doi,
    title,
    year: (msg && yearFromCrossref(msg)) || String(work.year || ""),
    typology: typ.typology,
    typology_label_es: typ.typology_label_es,
    venue_title: venueTitle,
    url: doi ? `https://doi.org/${doi}` : "",
    plas_catalog_source: HARVEST_SOURCE,
    authors: (authorNames.length ? authorNames : [doc.name_display]).join("; "),
    topic_ids: topicIds,
    line_ids: topicIds.length ? linesForTopics(topicIds, lines) : seedLine ? [seedLine] : [],
  };
  addToKnownIndex(known, pub);
  return { status: "added", pub };
}

export function sortPublications(pubs) {
  return [...pubs].sort(
    (a, b) => String(b.year).localeCompare(String(a.year)) || a.title.localeCompare(b.title),
  );
}

export function isVisiblePublication(p) {
  return p.plas_catalog_source !== REJECTED;
}

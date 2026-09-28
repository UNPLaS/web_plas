/**
 * Pure helpers for thesis harvest (testable without RI / FS).
 */
import {
  classifyDegree,
  isEngineeringProgram,
  estudianteIdFromName,
  splitAuthors,
  normText,
} from "./normalize.mjs";
import { assignLine, FABIO } from "./lines.mjs";
import { classifyTopics } from "./topics.mjs";

export { FABIO, classifyDegree, isEngineeringProgram, splitAuthors, normText };

/** Advisor aliases (RI name forms) from src/data/faculty.json `aliases`. */
export function aliasesFromFaculty(faculty) {
  return faculty.flatMap((f) =>
    (f.aliases || []).map((alias) => ({
      docente_id: f.id,
      alias,
      alias_norm: normText(alias.replace(/\(thesis advisor\)/gi, "")),
    })),
  );
}

export function buildAliasIndex(aliases) {
  const byDocente = new Map();
  const matchAliases = [];
  for (const a of aliases) {
    const list = byDocente.get(a.docente_id) || [];
    list.push(a);
    byDocente.set(a.docente_id, list);
    matchAliases.push(a);
  }
  const seen = new Set();
  const queries = [];
  for (const a of matchAliases) {
    const q = (a.alias || "").trim();
    const key = normText(q);
    if (!q || seen.has(key)) continue;
    seen.add(key);
    queries.push({ query: q, docente_id: a.docente_id, alias_norm: a.alias_norm || key });
  }
  return { byDocente, queries, matchAliases };
}

export function matchAdvisors(advisorNames, matchAliases) {
  const hits = [];
  const seen = new Set();
  for (const raw of advisorNames) {
    const n = normText(raw.replace(/\(thesis advisor\)/gi, ""));
    for (const a of matchAliases) {
      const an = normText(a.alias_norm || a.alias);
      if (!an) continue;
      if (n === an || n.includes(an) || an.includes(n)) {
        if (!seen.has(a.docente_id)) {
          seen.add(a.docente_id);
          hits.push({ docente_id: a.docente_id, name_form_raw: raw });
        }
        break;
      }
    }
  }
  return hits;
}

export function shouldRegister({ degree, engineering, plasDirectors }) {
  if (!degree) return { ok: false, reason: "not_posgrado" };
  if (engineering === false) return { ok: false, reason: "no_ingenieria" };
  if (engineering == null) return { ok: false, reason: "programa_desconocido" };
  const ids = plasDirectors.map((d) => d.docente_id);
  if (!ids.length) return { ok: false, reason: "sin_director_plas" };
  if (ids.length === 1 && ids[0] === FABIO) {
    return { ok: false, reason: "fabio_unico_director_plas" };
  }
  return { ok: true, reason: "" };
}

/** docente id → line ids, from src/data/faculty.json. */
export function buildDocenteLineasMap(faculty) {
  return Object.fromEntries(faculty.map((f) => [f.id, [...(f.line_ids || [])]]));
}

/** line id → keywords, from src/data/lines.json. */
export function buildKeywordsMap(lines) {
  return Object.fromEntries(
    lines.map((l) => [
      l.id,
      [...new Set([...(l.keywords || []), ...(l.topics || []).flatMap((t) => t.keywords || [])])],
    ]),
  );
}

/** "Apellido, Nombre" (RI form) → "Nombre Apellido". */
export function displayStudentName(raw) {
  const name = (raw || "").trim();
  const comma = name.indexOf(",");
  if (comma > 0) {
    const family = name.slice(0, comma).trim();
    const given = name.slice(comma + 1).trim();
    if (family && given) return `${given} ${family}`;
  }
  return name;
}

/** Existing students are never modified; unknown authors get a new row. */
export function ensureStudent(students, name) {
  const id = estudianteIdFromName(name);
  const existing = students.find((s) => s.id === id);
  if (existing) return { student: existing, created: false };
  const student = {
    id,
    name_display: displayStudentName(name),
    name_sort: name.trim(),
    role_group: "",
    status: "",
    line_ids: [],
    image_path: "",
    email: "",
    links: [],
  };
  students.push(student);
  return { student, created: true };
}

/**
 * Register one summarized RI item into site data (mutates theses/students).
 * Known handles (including plas_catalog_source "rejected") are skipped.
 * @returns {{ ok: true, row, line, newStudents } | { ok: false, reason: string }}
 */
export function registerThesis(data, sum, {
  matchAliases,
  docenteLineas,
  keywordsByLine,
  lines = [],
  forceDirectors = null,
}) {
  if (data.theses.some((t) => t.handle === sum.handle)) {
    return { ok: false, reason: "already_present" };
  }

  let plasDirectors = matchAdvisors(sum.advisors || [], matchAliases);
  if (forceDirectors?.length && !plasDirectors.length) {
    plasDirectors = forceDirectors;
  }

  const degree = classifyDegree(sum.dcTypes || []);
  const engineering = isEngineeringProgram(sum.degreeName || "");
  const gate = shouldRegister({ degree, engineering, plasDirectors });
  if (!gate.ok) return { ok: false, reason: gate.reason };

  const line = assignLine({
    directorIds: plasDirectors.map((d) => d.docente_id),
    docenteLineas,
    keywordsByLine,
    title: sum.title,
    abstractEs: sum.abstractEs,
    abstractEn: sum.abstractEn,
    researchArea: sum.researchArea,
  });

  const authorNames = sum.authorsList?.length ? sum.authorsList : splitAuthors(sum.authors);
  const newStudents = [];
  const studentIds = authorNames.map((name) => {
    const { student, created } = ensureStudent(data.students, name);
    if (created) newStudents.push(student);
    return student.id;
  });

  const row = {
    id: `tesis:${sum.handle}`,
    handle: sum.handle,
    title: sum.title || "",
    year: sum.year || "",
    degree,
    item_url: sum.itemUrl || "",
    authors: sum.authors || authorNames.join(" | "),
    topic_ids: classifyTopics(
      [sum.title, sum.abstractEs, sum.abstractEn].filter(Boolean).join("\n"),
      lines,
      [line.lineId],
    ),
    line_ids: [line.lineId],
    advisor_ids: plasDirectors.map((d) => d.docente_id),
    student_ids: studentIds,
    plas_catalog_source: "repositorio_unal",
  };
  data.theses.push(row);
  return { ok: true, row, line, newStudents };
}

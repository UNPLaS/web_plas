/**
 * Pure helpers for thesis harvest (testable without RI / FS).
 */
import {
  classifyDegree,
  isEngineeringProgram,
  estudianteIdFromName,
  nameKey,
  splitAuthors,
  normText,
} from "./normalize.mjs";
import { assignLine, FABIO } from "./lines.mjs";

export { FABIO, classifyDegree, isEngineeringProgram, splitAuthors, normText };

export function buildAliasIndex(aliases) {
  const byDocente = new Map();
  const matchAliases = [];
  for (const a of aliases) {
    if (String(a.use_for_advisor_match).toLowerCase() !== "yes") continue;
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

export function buildDocenteLineasMap(rows) {
  const m = {};
  for (const r of rows) {
    if (!m[r.docente_id]) m[r.docente_id] = [];
    if (r.line_id) m[r.docente_id].push(r.line_id);
  }
  return m;
}

export function buildKeywordsMap(rows) {
  const m = {};
  for (const r of rows) {
    if (!m[r.line_id]) m[r.line_id] = [];
    m[r.line_id].push(r.keyword);
  }
  return m;
}

export function upsertEstudiante(estudiantes, name, degree, year) {
  const id = estudianteIdFromName(name);
  let e = estudiantes.find((x) => x.id === id);
  const rank = degree === "doctorado" ? 3 : 2;
  if (!e) {
    e = {
      id,
      name_display: name,
      name_sort: name,
      name_key: nameKey(name),
      degree_highest: degree,
      degree_rank: String(rank),
      degrees_seen: degree,
      n_tesis: "1",
      year_first: year || "",
      year_last: year || "",
      name_variants: "",
      source: "tesis_authors",
      site_name: "",
      site_role_group: "",
      site_status: "",
      site_lines: "",
      image_src: "",
      email: "",
      linkedin: "",
      github: "",
      website: "",
      office: "",
      phone: "",
      member_match: "",
    };
    estudiantes.push(e);
    return { estudiante: e, created: true };
  }
  e.n_tesis = String(Number(e.n_tesis || 0) + 1);
  if (year) {
    if (!e.year_first || year < e.year_first) e.year_first = year;
    if (!e.year_last || year > e.year_last) e.year_last = year;
  }
  const degrees = new Set(String(e.degrees_seen || "").split(/\s*\|\s*/).filter(Boolean));
  degrees.add(degree);
  e.degrees_seen = [...degrees].join(" | ");
  if (rank > Number(e.degree_rank || 0)) {
    e.degree_highest = degree;
    e.degree_rank = String(rank);
  }
  return { estudiante: e, created: false };
}

/**
 * Register one summarized RI item into working harvest tables (mutates data).
 * @returns {{ ok: true, row } | { ok: false, reason: string }}
 */
export function registerThesis(data, sum, {
  matchAliases,
  docenteLineas,
  keywordsByLine,
  harvestedAt,
  forceDirectors = null,
}) {
  const existing = new Set(data.tesis.map((t) => t.handle));
  if (existing.has(sum.handle)) return { ok: false, reason: "already_present" };

  let plasDirectors = matchAdvisors(sum.advisors || [], matchAliases);
  if (forceDirectors?.length && !plasDirectors.length) {
    plasDirectors = forceDirectors;
  }

  const degree = classifyDegree(sum.dcTypes || []);
  const degreeName = sum.degreeName || "";
  const engineering = isEngineeringProgram(degreeName);
  const gate = shouldRegister({ degree, engineering, plasDirectors });
  if (!gate.ok) return { ok: false, reason: gate.reason };

  const tid = `tesis:${sum.handle}`;
  const line = assignLine({
    directorIds: plasDirectors.map((d) => d.docente_id),
    docenteLineas,
    keywordsByLine,
    title: sum.title,
    abstractEs: sum.abstractEs,
    abstractEn: sum.abstractEn,
    researchArea: sum.researchArea,
  });

  const hasAbs = sum.abstractEs || sum.abstractEn || sum.abstractOther ? "yes" : "no";
  const row = {
    id: tid,
    handle: sum.handle,
    uuid: sum.uuid || "",
    title: sum.title || "",
    year: sum.year || "",
    degree,
    degree_level_ri: sum.degreeLevel || (degree === "doctorado" ? "Doctorado" : "Maestría"),
    degree_name_ri: degreeName,
    authors: sum.authors || "",
    abstract_es: sum.abstractEs || "",
    abstract_en: sum.abstractEn || "",
    abstract_other: sum.abstractOther || "",
    has_abstract: hasAbs,
    research_area: sum.researchArea || "",
    dc_type: (sum.dcTypes || []).join(" | "),
    item_url: sum.itemUrl || "",
    n_directores_plas: String(plasDirectors.length),
    director_docente_ids: plasDirectors.map((d) => d.docente_id).join(" | "),
    source: "repositorio_unal",
    harvested_at: harvestedAt,
    line_id_primary: line.lineId,
    line_method: line.method,
    line_confidence: line.confidence,
    line_needs_review: line.needsReview,
    visible: "yes",
    exclusion_reason: "",
    exclusion_notes: "",
  };
  data.tesis.push(row);

  for (const d of plasDirectors) {
    data.directores.push({
      tesis_id: tid,
      docente_id: d.docente_id,
      name_form_raw: d.name_form_raw,
      role: "advisor",
    });
  }

  data.tesisLineas.push({
    tesis_id: tid,
    line_id: line.lineId,
    method: line.method,
    confidence: line.confidence,
    is_primary: "yes",
    needs_review: line.needsReview,
    notes: line.notes,
  });

  const authors = (sum.authorsList?.length ? sum.authorsList : splitAuthors(sum.authors));
  for (const [idx, name] of authors.entries()) {
    const { estudiante } = upsertEstudiante(data.estudiantes, name, degree, sum.year);
    data.autores.push({
      tesis_id: tid,
      estudiante_id: estudiante.id,
      name_form_raw: name,
      author_position: String(idx + 1),
      degree_of_tesis: degree,
      is_highest_degree_tesis: degree === estudiante.degree_highest ? "yes" : "no",
    });
  }

  return { ok: true, row, line };
}

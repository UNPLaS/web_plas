/**
 * Project canonical harvest JSON → site-facing src/data/*.json
 * (parity with new_plas export-web-data for pubs / theses / students).
 */
import path from "node:path";
import { readTable, readJson, writeJson, SITE_DATA_DIR, ROOT } from "./json-store.mjs";

function pick(row, keys) {
  const o = {};
  for (const k of keys) o[k] = row[k] ?? "";
  return o;
}

function absPublicPath(p) {
  if (!p) return "";
  return p.startsWith("/") ? p : `/${p}`;
}

function displayStudentName(raw) {
  const name = (raw || "").trim();
  if (!name) return "";
  const comma = name.indexOf(",");
  if (comma > 0) {
    const family = name.slice(0, comma).trim();
    const given = name.slice(comma + 1).trim();
    if (family && given) return `${given} ${family}`;
  }
  return name;
}

const ROLE_LABEL = {
  estudiante_maestria: "Estudiante de maestría",
  estudiante_doctorado: "Estudiante de doctorado",
  estudiante_pregrado: "Estudiante de pregrado",
};

function roleFromDegree(degree) {
  if (degree === "doctorado") return ROLE_LABEL.estudiante_doctorado;
  if (degree === "maestria") return ROLE_LABEL.estudiante_maestria;
  if (degree === "pregrado") return ROLE_LABEL.estudiante_pregrado;
  return "";
}

function thesisUrl(itemUrl) {
  if (!itemUrl) return "";
  if (/^https?:\/\//i.test(itemUrl)) return itemUrl;
  return absPublicPath(itemUrl);
}

function pickPrimaryThesis(rows) {
  if (!rows?.length) return null;
  return [...rows].sort((x, y) => {
    const hx = x.author.is_highest_degree_tesis === "yes" ? 1 : 0;
    const hy = y.author.is_highest_degree_tesis === "yes" ? 1 : 0;
    if (hx !== hy) return hy - hx;
    const yx = String(x.thesis.year || "");
    const yy = String(y.thesis.year || "");
    if (yx !== yy) return yy.localeCompare(yx);
    const vx = x.thesis.visible === "yes" ? 1 : 0;
    const vy = y.thesis.visible === "yes" ? 1 : 0;
    return vy - vx;
  })[0];
}

/** Pure projection from in-memory tables (testable). */
export function projectCatalog({
  publications,
  people,
  publicationAuthors,
  facultyLines,
  researchLines,
  theses,
  thesisAuthors,
  students,
}) {
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const linesByDocente = new Map();
  for (const fl of facultyLines) {
    if (!fl.line_id) continue;
    if (!linesByDocente.has(fl.docente_id)) linesByDocente.set(fl.docente_id, new Set());
    linesByDocente.get(fl.docente_id).add(fl.line_id);
  }
  const authorsByPub = new Map();
  for (const a of publicationAuthors) {
    if (!authorsByPub.has(a.publicacion_id)) authorsByPub.set(a.publicacion_id, []);
    authorsByPub.get(a.publicacion_id).push(a);
  }
  const lineNameById = Object.fromEntries(
    (researchLines || []).map((l) => [l.id, l.name || l.title_site || l.id]),
  );

  function authorsDisplay(pubId) {
    const rows = (authorsByPub.get(pubId) || [])
      .slice()
      .sort((a, b) => Number(a.author_position) - Number(b.author_position));
    return rows
      .map((a) => peopleById.get(a.persona_id)?.name_display || "")
      .filter(Boolean)
      .join("; ");
  }

  function lineIdsForPub(pub) {
    const ids = new Set();
    const seeds = String(pub.seed_docente_ids || "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const did of seeds) {
      for (const lid of linesByDocente.get(did) || []) ids.add(lid);
    }
    for (const a of authorsByPub.get(pub.id) || []) {
      const did = peopleById.get(a.persona_id)?.docente_id;
      if (!did) continue;
      for (const lid of linesByDocente.get(did) || []) ids.add(lid);
    }
    return [...ids].sort();
  }

  const pubsOut = publications
    .filter((p) => p.plas_catalog === "yes")
    .map((p) => {
      const line_ids = lineIdsForPub(p);
      return {
        ...pick(p, [
          "id",
          "doi",
          "title",
          "year",
          "typology",
          "typology_label_es",
          "venue_title",
          "url",
          "plas_catalog_source",
        ]),
        authors: authorsDisplay(p.id),
        line_ids,
        line_names: line_ids.map((id) => lineNameById[id] || id).filter(Boolean),
      };
    })
    .sort((a, b) => String(b.year).localeCompare(String(a.year)) || a.title.localeCompare(b.title));

  const thesesOut = theses
    .filter((t) => t.visible === "yes")
    .map((t) => {
      const line_ids = t.line_id_primary ? [t.line_id_primary] : [];
      return {
        ...pick(t, [
          "id",
          "handle",
          "title",
          "year",
          "degree",
          "item_url",
          "line_id_primary",
          "authors",
        ]),
        line_ids,
        line_names: line_ids.map((id) => lineNameById[id] || id).filter(Boolean),
      };
    })
    .sort((a, b) => String(b.year).localeCompare(String(a.year)));

  const thesesById = new Map(theses.map((t) => [t.id, t]));
  const thesisRowsByStudent = new Map();
  for (const a of thesisAuthors) {
    const t = thesesById.get(a.tesis_id);
    if (!t) continue;
    if (!thesisRowsByStudent.has(a.estudiante_id)) {
      thesisRowsByStudent.set(a.estudiante_id, []);
    }
    thesisRowsByStudent.get(a.estudiante_id).push({ author: a, thesis: t });
  }

  const studentsOut = students
    .filter((s) => s.site_name || s.member_match || thesisRowsByStudent.has(s.id))
    .map((s) => {
      const primary = pickPrimaryThesis(thesisRowsByStudent.get(s.id));
      const thesis = primary
        ? {
            id: primary.thesis.id,
            title: primary.thesis.title || "",
            year: primary.thesis.year || "",
            degree: primary.thesis.degree || primary.author.degree_of_tesis || "",
            url: thesisUrl(primary.thesis.item_url),
          }
        : null;
      const hasThesis = Boolean(thesis);
      const status = hasThesis ? "Inactivo" : s.site_status || "";
      const exit_year = hasThesis ? thesis.year || "" : "";
      const links = [
        s.website ? { label: "Sitio web", url: s.website } : null,
        s.linkedin ? { label: "LinkedIn", url: s.linkedin } : null,
        s.github ? { label: "GitHub", url: s.github } : null,
        s.email ? { label: "Correo", url: `mailto:${s.email}` } : null,
        thesis?.url ? { label: "Tesis", url: thesis.url } : null,
      ].filter(Boolean);
      return {
        id: s.id,
        name_display: s.site_name || displayStudentName(s.name_display),
        name_sort: s.name_sort || s.name_display,
        degree_highest: s.degree_highest || "",
        role_label:
          ROLE_LABEL[s.site_role_group] ||
          s.site_role_group ||
          roleFromDegree(s.degree_highest) ||
          roleFromDegree(thesis?.degree) ||
          "",
        status,
        exit_year,
        active: !hasThesis && status === "Activo",
        thesis,
        lines: s.site_lines || "",
        image_path: absPublicPath(s.image_src),
        n_tesis: s.n_tesis || "",
        email: s.email || "",
        links,
      };
    })
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      const ey = String(b.exit_year || "").localeCompare(String(a.exit_year || ""));
      if (ey) return ey;
      return a.name_sort.localeCompare(b.name_sort, "es");
    });

  return { publications: pubsOut, theses: thesesOut, students: studentsOut };
}

export async function loadCanonicalForProject() {
  const [
    publications,
    people,
    publicationAuthors,
    facultyLines,
    researchLines,
    theses,
    thesisAuthors,
    students,
  ] = await Promise.all([
    readTable("publications"),
    readTable("people"),
    readTable("publication_authors"),
    readTable("faculty_lines"),
    readTable("research_lines"),
    readTable("theses"),
    readTable("thesis_authors"),
    readTable("students"),
  ]);
  return {
    publications,
    people,
    publicationAuthors,
    facultyLines,
    researchLines,
    theses,
    thesisAuthors,
    students,
  };
}

export async function projectSiteData({ dryRun = false } = {}) {
  const canonical = await loadCanonicalForProject();
  const out = projectCatalog(canonical);

  if (dryRun) {
    return { dryRun: true, counts: {
      publications: out.publications.length,
      theses: out.theses.length,
      students: out.students.length,
    } };
  }

  await writeJson(path.join(SITE_DATA_DIR, "publications.json"), out.publications);
  await writeJson(path.join(SITE_DATA_DIR, "theses.json"), out.theses);
  await writeJson(path.join(SITE_DATA_DIR, "students.json"), out.students);

  const metaPrev = await readJson(path.join(SITE_DATA_DIR, "meta.json"), {});
  let meta = { ...(metaPrev || {}) };
  meta = {
    ...meta,
    exported_at: new Date().toISOString().slice(0, 10),
    source: "data/harvest → src/data",
    counts: {
      ...(meta.counts || {}),
      publications: out.publications.length,
      theses: out.theses.length,
      students: out.students.length,
    },
  };
  await writeJson(path.join(SITE_DATA_DIR, "meta.json"), meta);

  console.log(
    `site data ← ${path.relative(ROOT, SITE_DATA_DIR)} ` +
      `(pubs=${out.publications.length} theses=${out.theses.length} students=${out.students.length})`,
  );
  return { dryRun: false, counts: meta.counts };
}

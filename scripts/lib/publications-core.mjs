/**
 * Pure helpers for publication harvest merge (testable without ORCID/Crossref).
 */
import { typologyFromCrossref, typologyFromOrcid } from "./typology.mjs";
import {
  identityConfidence,
  normalizeDoi,
  slugName,
  yearFromCrossref,
  dateIssuedFromCrossref,
} from "./orcid-crossref.mjs";

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

export function personaIdFromOrcid(orcid) {
  return `persona:orcid:${orcid}`;
}

export function personaIdFromName(family, given) {
  return `persona:name:${slugName(`${family}-${given}`)}`;
}

export function pubIdFromDoi(doi) {
  return `pub:doi:${normalizeDoi(doi)}`;
}

export function pubIdFromOrcid(orcid, putCode) {
  return `pub:orcid:${orcid.replace(/-/g, "")}:${putCode}`;
}

export function ensurePersona(map, row) {
  if (!map.has(row.id)) map.set(row.id, row);
  else {
    const cur = map.get(row.id);
    if (!cur.docente_id && row.docente_id) cur.docente_id = row.docente_id;
    if (!cur.orcid && row.orcid) cur.orcid = row.orcid;
    if (!cur.name_display && row.name_display) cur.name_display = row.name_display;
  }
  return row.id;
}

export function mergeSeeds(a, b) {
  const s = new Set([...(a || "").split("|"), ...(b || "").split("|")].filter(Boolean));
  return [...s].sort().join("|");
}

export function mergePutCodes(a, b) {
  const s = new Set([...(a || "").split("|"), ...(b || "").split("|")].filter(Boolean));
  return [...s].sort().join("|");
}

export function autorKey(a) {
  return `${a.publicacion_id}|${a.persona_id}|${a.author_position}`;
}

/**
 * Merge one ORCID work (+ optional Crossref message) into pubs/personas/autores maps.
 * @returns {{ accepted: boolean, quarantined: boolean, pubId?: string }}
 */
export function mergeOrcidWork({
  work,
  msg,
  doc,
  matchOpts,
  docentes,
  pubs,
  personas,
  autorMap,
  harvestedAt,
}) {
  let pubId;
  let conf;
  let title = work.title;
  let year = work.year;
  let dateIssued = "";
  let venue = "";
  let publisher = "";
  let url = work.doi ? `https://doi.org/${work.doi}` : "";
  let language = "";
  let abstract = "";
  let typ;

  if (work.doi) {
    conf = identityConfidence(msg, doc.orcid, matchOpts);
    if (conf === "E") {
      return { accepted: false, quarantined: true };
    }
    if (msg) {
      title = (msg.title && msg.title[0]) || title;
      year = yearFromCrossref(msg) || year;
      dateIssued = dateIssuedFromCrossref(msg);
      venue = (msg["container-title"] && msg["container-title"][0]) || "";
      publisher = msg.publisher || "";
      language = msg.language || "";
      if (msg.abstract) {
        abstract = String(msg.abstract).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);
      }
      typ = typologyFromCrossref(msg.type);
      url = msg.URL || url;
      pubId = pubIdFromDoi(work.doi);
      conf = identityConfidence(msg, doc.orcid, matchOpts);
      if (conf === "E") return { accepted: false, quarantined: true };
      if (conf === "C") conf = "B";
    } else {
      typ = typologyFromOrcid(work.type);
      pubId = pubIdFromDoi(work.doi);
      conf = "C";
    }
  } else {
    conf = "D";
    typ = typologyFromOrcid(work.type);
    pubId = pubIdFromOrcid(doc.orcid, work.putCode);
  }

  if (!typ) typ = typologyFromOrcid(work.type);

  const existing = pubs.get(pubId);
  const row = existing || {
    id: pubId,
    doi: work.doi || "",
    title: title || "",
    year: year || "",
    date_issued: dateIssued || "",
    ...typ,
    venue_title: venue,
    publisher_name: publisher,
    url,
    language,
    abstract,
    openalex_id: "",
    orcid_put_codes: String(work.putCode || ""),
    identity_confidence: conf,
    harvest_sources: work.doi && msg ? "orcid+crossref" : work.doi ? "orcid+crossref_miss" : "orcid",
    seed_docente_ids: doc.id,
    plas_catalog: "pending",
    plas_catalog_source: "pending",
    plas_catalog_notes: "",
    inventory_match: "",
    harvested_at: harvestedAt,
    notes: conf === "C" ? "crossref_unresolved" : "",
  };

  if (existing) {
    row.seed_docente_ids = mergeSeeds(existing.seed_docente_ids, doc.id);
    row.orcid_put_codes = mergePutCodes(existing.orcid_put_codes, String(work.putCode || ""));
    const rank = { A: 4, B: 3, D: 2, C: 1, E: 0 };
    if ((rank[conf] || 0) > (rank[existing.identity_confidence] || 0)) {
      row.identity_confidence = conf;
    }
    if (!row.title && title) row.title = title;
    if (!row.year && year) row.year = year;
    if (!row.publisher_name && publisher) row.publisher_name = publisher;
    if (!row.venue_title && venue) row.venue_title = venue;
    if (msg && row.harvest_sources === "orcid") row.harvest_sources = "orcid+crossref";
    row.harvested_at = harvestedAt;
  }

  pubs.set(pubId, row);

  const authors = msg?.author?.length
    ? msg.author.map((a, idx) => ({
        family: a.family || "",
        given: a.given || "",
        orcid: (a.ORCID || "").replace(/https?:\/\/orcid\.org\//i, ""),
        affiliation: (a.affiliation || []).map((x) => x.name).filter(Boolean).join(" | "),
        position: idx + 1,
      }))
    : [{
        family: matchOpts.familyParts.join(" "),
        given: matchOpts.givenNames[0] || "",
        orcid: doc.orcid,
        affiliation: "",
        position: 1,
      }];

  for (const a of authors) {
    let pid;
    if (a.orcid) {
      pid = personaIdFromOrcid(a.orcid);
      const linked = docentes.find((d) => d.orcid === a.orcid);
      ensurePersona(personas, {
        id: pid,
        name_display: `${a.given} ${a.family}`.trim(),
        name_family: a.family,
        name_given: a.given,
        orcid: a.orcid,
        docente_id: linked?.id || "",
        estudiante_id: "",
        notes: "",
      });
    } else {
      pid = personaIdFromName(a.family, a.given);
      ensurePersona(personas, {
        id: pid,
        name_display: `${a.given} ${a.family}`.trim(),
        name_family: a.family,
        name_given: a.given,
        orcid: "",
        docente_id: "",
        estudiante_id: "",
        notes: "name-key; may collide",
      });
    }

    const linkedDoc = docentes.find((d) => d.orcid && d.orcid === a.orcid);
    const isPlas = linkedDoc ? "yes" : "no";
    const key = autorKey({
      publicacion_id: pubId,
      persona_id: pid,
      author_position: String(a.position),
    });
    autorMap.set(key, {
      publicacion_id: pubId,
      persona_id: pid,
      author_position: String(a.position),
      author_role: "author",
      affiliation_raw: a.affiliation || "",
      is_plas_docente: isPlas,
      evidence: msg ? "crossref" : "orcid",
    });
  }

  return { accepted: true, quarantined: false, pubId };
}

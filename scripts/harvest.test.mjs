import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import path from "node:path";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import {
  classifyDegree,
  isEngineeringProgram,
  shouldRegister,
  matchAdvisors,
  aliasesFromFaculty,
  buildAliasIndex,
  buildDocenteLineasMap,
  buildKeywordsMap,
  registerThesis,
  ensureStudent,
  FABIO,
} from "./lib/theses-core.mjs";
import { assignLine } from "./lib/lines.mjs";
import { labelEs, typologyFromCrossref, typologyFromOrcid } from "./lib/typology.mjs";
import { identityConfidence, normalizeDoi } from "./lib/orcid-crossref.mjs";
import {
  evaluateOrcidWork,
  buildKnownIndex,
  buildStudentMatchers,
  isVisiblePublication,
  orcidFromFaculty,
  MATCH,
  pubIdFromDoi,
  REJECTED,
} from "./lib/publications-core.mjs";
import { summarizeItem } from "./lib/ri.mjs";
import { classifyTopics, linesForTopics } from "./lib/topics.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_DATA = path.join(ROOT, "src", "data");

const TEST_LINES = [
  { id: "line:embebidos", topics: [{ id: "topic:tolerancia-fallos", keywords: ["soft error", "fault tolerant"] }] },
  { id: "line:educacion", topics: [{ id: "topic:evaluacion-automatica", keywords: ["grading", "automatic assessment"] }] },
  { id: "line:lenguajes", topics: [{ id: "topic:analisis-codigo", keywords: ["static analysis"] }] },
  { id: "line:transporte", topics: [{ id: "topic:accidentalidad-vial", keywords: ["traffic accidents", "crash"] }] },
];

describe("topics", () => {
  it("classifies by keywords, optionally restricted to candidate lines", () => {
    assert.deepEqual(classifyTopics("Automatic grading of notebooks", TEST_LINES), ["topic:evaluacion-automatica"]);
    assert.deepEqual(classifyTopics("Static analysis of Python", TEST_LINES, ["line:embebidos"]), []);
    assert.deepEqual(classifyTopics("Nothing relevant", TEST_LINES), []);
  });

  it("maps topics back to their lines", () => {
    assert.deepEqual(
      linesForTopics(["topic:accidentalidad-vial", "topic:tolerancia-fallos"], TEST_LINES),
      ["line:embebidos", "line:transporte"],
    );
  });
});

describe("typology + identity", () => {
  it("maps crossref journal-article", () => {
    const t = typologyFromCrossref("journal-article");
    assert.equal(t.typology, "journal_article");
    assert.match(t.typology_label_es, /revista/i);
  });

  it("maps orcid type with underscore", () => {
    const t = typologyFromOrcid("journal_article");
    assert.equal(t.typology, "journal_article");
  });

  it("normalizeDoi strips prefix", () => {
    assert.equal(normalizeDoi("https://doi.org/10.1234/AbC"), "10.1234/abc");
  });

  it("identityConfidence A on ORCID match", () => {
    const conf = identityConfidence(
      {
        author: [{ family: "Restrepo", given: "Felipe", ORCID: "https://orcid.org/0000-0003-4226-1324" }],
      },
      "0000-0003-4226-1324",
      MATCH["docente:ferestrepoca"],
    );
    assert.equal(conf, "A");
  });

  it("identityConfidence B on name match", () => {
    const conf = identityConfidence(
      { author: [{ family: "Restrepo Calle", given: "Felipe" }] },
      "0000-0003-4226-1324",
      MATCH["docente:ferestrepoca"],
    );
    assert.equal(conf, "B");
  });

  it("identityConfidence E on mismatch", () => {
    const conf = identityConfidence(
      { author: [{ family: "Other", given: "Person" }] },
      "0000-0003-4226-1324",
      MATCH["docente:ferestrepoca"],
    );
    assert.equal(conf, "E");
  });
});

describe("publications harvest", () => {
  const felipe = {
    id: "docente:ferestrepoca",
    orcid: "0000-0003-4226-1324",
    name_display: "Felipe Restrepo Calle",
    line_ids: ["line:embebidos"],
  };
  const fabio = {
    id: "docente:fagonzalezo",
    orcid: "0000-0001-9009-7288",
    name_display: "Fabio González Osorio",
    line_ids: ["line:educacion", "line:lenguajes"],
  };
  const cesar = {
    id: "docente:capedrazab",
    orcid: "0000-0002-6687-1429",
    name_display: "César Pedraza Bonilla",
    line_ids: ["line:transporte"],
  };
  const faculty = [felipe, fabio, cesar];
  const fabioAuthor = { family: "González", given: "Fabio A.", ORCID: `https://orcid.org/${fabio.orcid}` };

  function evaluate({ work, msg, doc, pubs = [], students = [] }) {
    return evaluateOrcidWork({
      work,
      msg,
      doc,
      faculty,
      studentMatchers: buildStudentMatchers(students),
      known: buildKnownIndex(pubs),
      lines: TEST_LINES,
    });
  }

  function work(doi, title = "Some title") {
    return { doi, title, year: "2024", type: "journal-article", putCode: 7 };
  }

  it("adds a new crossref hit in site format", () => {
    const result = evaluate({
      work: work("10.1234/Test.Pub", "ORCID title"),
      msg: {
        title: ["Crossref <i>title</i>"],
        type: "journal-article",
        author: [
          { family: "Restrepo", given: "Felipe", ORCID: `https://orcid.org/${felipe.orcid}` },
          { family: "Doe", given: "Jane" },
        ],
        published: { "date-parts": [[2025, 6, 1]] },
        "container-title": ["Test Journal"],
      },
      doc: felipe,
    });
    assert.equal(result.status, "added");
    assert.deepEqual(result.pub, {
      id: pubIdFromDoi("10.1234/test.pub"),
      doi: "10.1234/test.pub",
      title: "Crossref title",
      year: "2025",
      typology: "journal_article",
      typology_label_es: "Artículos de revista",
      venue_title: "Test Journal",
      url: "https://doi.org/10.1234/test.pub",
      plas_catalog_source: "orcid_harvest",
      authors: "Felipe Restrepo; Jane Doe",
      topic_ids: [],
      line_ids: ["line:embebidos"],
    });
  });

  it("derives lines from topics within the coauthors' lines", () => {
    const crash = evaluate({
      work: work("10.5/crash"),
      msg: {
        title: ["Deep learning for traffic accidents"],
        type: "journal-article",
        author: [fabioAuthor, { family: "Pedraza Bonilla", given: "César" }],
      },
      doc: fabio,
    });
    assert.deepEqual(crash.pub.topic_ids, ["topic:accidentalidad-vial"]);
    assert.deepEqual(crash.pub.line_ids, ["line:transporte"]);

    const outside = evaluate({
      work: work("10.5/static"),
      msg: {
        title: ["Static analysis of embedded firmware"],
        type: "journal-article",
        author: [{ family: "Restrepo Calle", given: "Felipe", ORCID: `https://orcid.org/${felipe.orcid}` }],
      },
      doc: felipe,
    });
    assert.deepEqual(outside.pub.topic_ids, []);
    assert.deepEqual(outside.pub.line_ids, ["line:embebidos"]);
  });

  it("quarantines identity E", () => {
    const result = evaluate({
      work: work("10.9/x"),
      msg: { author: [{ family: "Nobody", given: "Else" }], title: ["x"], type: "journal-article" },
      doc: felipe,
    });
    assert.equal(result.status, "quarantined");
  });

  it("skips known rows by id, DOI or title, including rejected ones", () => {
    const pubs = [
      { id: "pub:doi:10.1/a", doi: "10.1/a", title: "A", plas_catalog_source: REJECTED },
      { id: "pub:gjee:2020:x", doi: "", title: "Interactive Software Tool for CS1" },
    ];
    const msg = {
      title: ["A"],
      type: "journal-article",
      author: [{ family: "Restrepo Calle", given: "Felipe" }],
    };
    assert.equal(evaluate({ work: work("https://doi.org/10.1/A"), msg, doc: felipe, pubs }).status, "known");
    assert.equal(
      evaluate({
        work: { doi: "", title: "Interactive software tool for CS1.", year: "2020", putCode: 3 },
        msg: null,
        doc: felipe,
        pubs,
      }).status,
      "known",
    );
  });

  it("skips Fabio works without another PLaS coauthor", () => {
    const result = evaluate({
      work: work("10.5/solo"),
      msg: { title: ["Solo"], type: "book", author: [fabioAuthor, { family: "Pérez", given: "Ana" }] },
      doc: fabio,
    });
    assert.equal(result.status, "fabio_independent");
  });

  it("skips Fabio works without DOI metadata", () => {
    const result = evaluate({
      work: { doi: "", title: "No DOI", year: "2019", type: "journal-article", putCode: 9 },
      msg: null,
      doc: fabio,
    });
    assert.equal(result.status, "fabio_independent");
  });

  it("keeps Fabio works with a PLaS docente detected by name", () => {
    const result = evaluate({
      work: work("10.5/collab"),
      msg: {
        title: ["Collab"],
        type: "proceedings-article",
        author: [fabioAuthor, { family: "Pedraza Bonilla", given: "César" }],
      },
      doc: fabio,
    });
    assert.equal(result.status, "added");
    assert.deepEqual(result.pub.line_ids, ["line:educacion"]);
  });

  it("keeps Fabio works with a PLaS student coauthor", () => {
    const result = evaluate({
      work: work("10.5/student"),
      msg: {
        title: ["With student"],
        type: "journal-article",
        author: [fabioAuthor, { family: "Hernández", given: "Juan Camilo" }],
      },
      doc: fabio,
      students: ["Juan Camilo Hernández Ortiz"],
    });
    assert.equal(result.status, "added");
  });

  it("accepts books from other docentes", () => {
    const result = evaluate({
      work: work("10.7/book"),
      msg: { title: ["Book"], type: "book", author: [{ family: "Restrepo-Calle", given: "F." }] },
      doc: felipe,
    });
    assert.equal(result.status, "added");
    assert.equal(result.pub.typology, "book");
  });

  it("does not add the same work twice in one run", () => {
    const known = buildKnownIndex([]);
    const args = {
      work: work("10.8/dup"),
      msg: {
        title: ["Dup"],
        type: "journal-article",
        author: [
          { family: "Restrepo Calle", given: "Felipe" },
          { family: "Pedraza", given: "Cesar" },
        ],
      },
      faculty,
      studentMatchers: [],
      known,
    };
    assert.equal(evaluateOrcidWork({ ...args, doc: felipe }).status, "added");
    assert.equal(evaluateOrcidWork({ ...args, doc: cesar }).status, "known");
  });

  it("rejected marker hides a publication", () => {
    assert.equal(isVisiblePublication({ plas_catalog_source: REJECTED }), false);
    assert.equal(isVisiblePublication({ plas_catalog_source: "orcid_harvest" }), true);
  });

  it("reads ORCID from faculty profiles", () => {
    assert.equal(
      orcidFromFaculty({ profiles: [{ label: "ORCID", url: "https://orcid.org/0000-0002-6499-1785" }] }),
      "0000-0002-6499-1785",
    );
    assert.equal(orcidFromFaculty({ profiles: [] }), "");
  });
});

describe("theses gates + register", () => {
  const aliases = [
    {
      docente_id: "docente:ferestrepoca",
      alias: "Felipe Restrepo Calle",
      alias_norm: "felipe restrepo calle",
      use_for_advisor_match: "yes",
    },
    {
      docente_id: FABIO,
      alias: "Fabio Gonzalez",
      alias_norm: "fabio gonzalez",
      use_for_advisor_match: "yes",
    },
    {
      docente_id: "docente:jjramireze",
      alias: "Jhon Jairo Ramirez",
      alias_norm: "jhon jairo ramirez",
      use_for_advisor_match: "yes",
    },
  ];

  it("classifyDegree detects maestria/doctorado", () => {
    assert.equal(classifyDegree(["Master thesis"]), "maestria");
    assert.equal(classifyDegree(["Tesis de doctorado"]), "doctorado");
    assert.equal(classifyDegree(["Trabajo de grado"]), null);
  });

  it("isEngineeringProgram", () => {
    assert.equal(isEngineeringProgram("Maestría en Ingeniería de Sistemas"), true);
    assert.equal(isEngineeringProgram("Maestría en Biología"), false);
    assert.equal(isEngineeringProgram(""), null);
  });

  it("shouldRegister gates Fabio-only", () => {
    assert.equal(
      shouldRegister({
        degree: "maestria",
        engineering: true,
        plasDirectors: [{ docente_id: FABIO }],
      }).reason,
      "fabio_unico_director_plas",
    );
    assert.equal(
      shouldRegister({
        degree: "maestria",
        engineering: true,
        plasDirectors: [{ docente_id: FABIO }, { docente_id: "docente:ferestrepoca" }],
      }).ok,
      true,
    );
  });

  it("matchAdvisors + buildAliasIndex", () => {
    const { matchAliases, queries } = buildAliasIndex(aliases);
    assert.ok(queries.length >= 3);
    const hits = matchAdvisors(
      ["Felipe Restrepo Calle (thesis advisor)", "Someone Else"],
      matchAliases,
    );
    assert.equal(hits.length, 1);
    assert.equal(hits[0].docente_id, "docente:ferestrepoca");
  });

  it("aliasesFromFaculty normalizes RI name forms", () => {
    const rows = aliasesFromFaculty([
      { id: "docente:ferestrepoca", aliases: ["Restrepo Calle, Felipe (Thesis advisor)", "Restrepo-Calle, Felipe"] },
      { id: "docente:x" },
    ]);
    assert.deepEqual(
      rows.map((r) => [r.docente_id, r.alias_norm]),
      [
        ["docente:ferestrepoca", "restrepo calle felipe"],
        ["docente:ferestrepoca", "restrepo calle felipe"],
      ],
    );
    const { queries, matchAliases } = buildAliasIndex(rows);
    assert.equal(queries.length, 2);
    assert.equal(matchAdvisors(["Restrepo Calle, Felipe"], matchAliases)[0].docente_id, "docente:ferestrepoca");
  });

  it("line maps come from faculty and lines, keeping primary line first", () => {
    const docenteLineas = buildDocenteLineasMap([
      { id: "docente:capedrazab", line_ids: ["line:transporte", "line:sensado"] },
    ]);
    const keywordsByLine = buildKeywordsMap([
      {
        id: "line:transporte",
        keywords: ["movilidad"],
        topics: [{ keywords: ["rfid", "movilidad"] }],
      },
    ]);
    assert.deepEqual(keywordsByLine, { "line:transporte": ["movilidad", "rfid"] });
    const line = assignLine({
      directorIds: ["docente:capedrazab"],
      docenteLineas,
      keywordsByLine: {},
      title: "Sin pistas",
      abstractEs: "",
      abstractEn: "",
      researchArea: "",
    });
    assert.equal(line.lineId, "line:transporte");
  });

  it("assignLine never empty for single-advisor single-line", () => {
    const line = assignLine({
      directorIds: ["docente:ferestrepoca"],
      docenteLineas: { "docente:ferestrepoca": ["line:educacion"] },
      keywordsByLine: {},
      title: "Anything",
      abstractEs: "",
      abstractEn: "",
      researchArea: "",
    });
    assert.equal(line.lineId, "line:educacion");
    assert.equal(line.method, "advisor");
  });

  const riSum = {
    handle: "unal/99999",
    uuid: "u-test",
    title: "Sistema embebido tolerante a fallos",
    year: "2026",
    authors: "Lovelace, Ada",
    authorsList: ["Lovelace, Ada"],
    advisors: ["Felipe Restrepo Calle"],
    dcTypes: ["Master thesis"],
    degreeName: "Maestría en Ingeniería de Sistemas y Computación",
    researchArea: "sistemas embebidos",
    abstractEs: "soft error fault tolerant",
    abstractEn: "",
    itemUrl: "https://repositorio.unal.edu.co/handle/unal/99999",
  };
  const registerOpts = () => ({
    matchAliases: buildAliasIndex(aliases).matchAliases,
    docenteLineas: { "docente:ferestrepoca": ["line:embebidos", "line:educacion"] },
    keywordsByLine: { "line:embebidos": ["embebido", "fault", "soft error"] },
    lines: TEST_LINES,
  });

  it("registerThesis appends thesis and new student in site format", () => {
    const data = { theses: [], students: [] };
    const result = registerThesis(data, riSum, registerOpts());
    assert.equal(result.ok, true);
    assert.deepEqual(data.theses[0], {
      id: "tesis:unal/99999",
      handle: "unal/99999",
      title: "Sistema embebido tolerante a fallos",
      year: "2026",
      degree: "maestria",
      item_url: "https://repositorio.unal.edu.co/handle/unal/99999",
      authors: "Lovelace, Ada",
      topic_ids: ["topic:tolerancia-fallos"],
      line_ids: ["line:embebidos"],
      advisor_ids: ["docente:ferestrepoca"],
      student_ids: ["estudiante:lovelace-ada"],
      plas_catalog_source: "repositorio_unal",
    });
    assert.equal(data.students.length, 1);
    assert.equal(data.students[0].name_display, "Ada Lovelace");
    assert.equal(result.newStudents.length, 1);
  });

  it("registerThesis links existing students without modifying them", () => {
    const existing = { id: "estudiante:lovelace-ada", name_display: "Ada L.", status: "Activo", line_ids: ["line:lenguajes"] };
    const snapshot = structuredClone(existing);
    const data = { theses: [], students: [existing] };
    const result = registerThesis(data, riSum, registerOpts());
    assert.equal(result.ok, true);
    assert.equal(data.students.length, 1);
    assert.deepEqual(data.students[0], snapshot);
    assert.deepEqual(data.theses[0].student_ids, ["estudiante:lovelace-ada"]);
  });

  it("registerThesis skips known handles, including rejected ones", () => {
    const data = {
      theses: [{ id: "tesis:unal/99999", handle: "unal/99999", plas_catalog_source: "rejected" }],
      students: [],
    };
    assert.equal(registerThesis(data, riSum, registerOpts()).reason, "already_present");
    assert.equal(data.theses.length, 1);
  });

  it("ensureStudent reuses the id derived from the RI name", () => {
    const list = [];
    assert.equal(ensureStudent(list, "Lovelace, Ada").created, true);
    assert.equal(ensureStudent(list, "Lovelace,  Ada ").created, false);
    assert.equal(list.length, 1);
  });
});

describe("RI summarizeItem", () => {
  it("extracts handle advisors authors", () => {
    const item = {
      uuid: "abc",
      handle: "unal/123",
      metadata: {
        "dc.title": [{ value: "Título" }],
        "dc.contributor.author": [{ value: "Author One" }],
        "dc.contributor.advisor": [{ value: "Felipe Restrepo Calle" }],
        "dc.type": [{ value: "Master thesis" }],
        "dc.date.issued": [{ value: "2025-01-01" }],
        "dc.description.degreename": [{ value: "Maestría en Ingeniería" }],
      },
    };
    const sum = summarizeItem(item);
    assert.equal(sum.handle, "unal/123");
    assert.equal(sum.year, "2025");
    assert.equal(sum.authorsList[0], "Author One");
    assert.equal(sum.advisors[0], "Felipe Restrepo Calle");
  });
});

describe("json-store roundtrip", () => {
  let dir;

  before(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "plas-harvest-"));
  });

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("writeJson/readJson roundtrip", async () => {
    const { writeJson, readJson } = await import("./lib/json-store.mjs");
    const file = path.join(dir, "nested", "sample.json");
    await writeJson(file, [{ a: 1, b: null }]);
    assert.deepEqual(await readJson(file), [{ a: 1, b: null }]);
    assert.deepEqual(await readJson(path.join(dir, "missing.json"), []), []);
  });
});

describe("harvest data present", () => {
  const readSite = async (name) => JSON.parse(await readFile(path.join(SITE_DATA, name), "utf8"));

  it("has faculty with ORCID, advisor aliases and known lines", async () => {
    const faculty = await readSite("faculty.json");
    const lines = await readSite("lines.json");
    const lineIds = new Set(lines.map((l) => l.id));
    for (const f of faculty) {
      assert.ok(orcidFromFaculty(f), f.id);
      assert.ok(f.aliases?.length, f.id);
      for (const id of f.line_ids) assert.ok(lineIds.has(id), `${f.id} → ${id}`);
    }
    assert.ok(lines.every((l) => l.keywords?.length));
  });

  it("lines have slug, short name, paragraphs and unique topics", async () => {
    const lines = await readSite("lines.json");
    const topicIds = new Set();
    for (const l of lines) {
      assert.equal(l.slug, l.id.replace("line:", ""), l.id);
      assert.ok(l.name && l.short_name && l.summary, l.id);
      assert.ok(Array.isArray(l.description) && l.description.length, l.id);
      assert.ok(l.topics.length, l.id);
      for (const t of l.topics) {
        assert.equal(t.id, `topic:${t.slug}`, t.id);
        assert.ok(t.name && t.description && t.keywords?.length, t.id);
        assert.ok(!topicIds.has(t.id), `tema repetido ${t.id}`);
        topicIds.add(t.id);
      }
    }
  });

  it("publications reference known lines and have unique ids", async () => {
    const pubs = await readSite("publications.json");
    const lineIds = new Set((await readSite("lines.json")).map((l) => l.id));
    assert.ok(pubs.filter(isVisiblePublication).length > 50);
    assert.equal(new Set(pubs.map((p) => p.id)).size, pubs.length);
    for (const p of pubs) {
      for (const id of p.line_ids || []) assert.ok(lineIds.has(id), `${p.id} → ${id}`);
      assert.equal(p.typology_label_es, labelEs(p.typology), p.id);
    }
  });

  it("theses link to existing students, faculty and lines", async () => {
    const theses = await readSite("theses.json");
    const students = await readSite("students.json");
    const lineIds = new Set((await readSite("lines.json")).map((l) => l.id));
    const facultyIds = new Set((await readSite("faculty.json")).map((f) => f.id));
    const studentIds = new Set(students.map((s) => s.id));
    assert.equal(new Set(theses.map((t) => t.handle)).size, theses.length);
    assert.equal(studentIds.size, students.length);
    for (const t of theses) {
      assert.ok(t.student_ids.length, t.id);
      for (const id of t.student_ids) assert.ok(studentIds.has(id), `${t.id} → ${id}`);
      for (const id of t.advisor_ids) assert.ok(facultyIds.has(id), `${t.id} → ${id}`);
      for (const id of t.line_ids) assert.ok(lineIds.has(id), `${t.id} → ${id}`);
    }
    for (const s of students) {
      for (const id of s.line_ids) assert.ok(lineIds.has(id), `${s.id} → ${id}`);
    }
  });

  it("works with topics carry exactly the lines of those topics", async () => {
    const lines = await readSite("lines.json");
    const topicIds = new Set(lines.flatMap((l) => l.topics.map((t) => t.id)));
    const works = [...(await readSite("publications.json")), ...(await readSite("theses.json"))];
    for (const w of works) {
      assert.ok(Array.isArray(w.topic_ids), `${w.id} sin topic_ids`);
      for (const id of w.topic_ids) assert.ok(topicIds.has(id), `${w.id} → ${id}`);
      if (w.topic_ids.length) {
        assert.deepEqual([...w.line_ids].sort(), linesForTopics(w.topic_ids, lines), w.id);
      }
    }
  });
});

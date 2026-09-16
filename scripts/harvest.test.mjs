import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import path from "node:path";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import {
  classifyDegree,
  isEngineeringProgram,
  shouldRegister,
  matchAdvisors,
  buildAliasIndex,
  registerThesis,
  upsertEstudiante,
  FABIO,
} from "./lib/theses-core.mjs";
import { assignLine } from "./lib/lines.mjs";
import { typologyFromCrossref, typologyFromOrcid } from "./lib/typology.mjs";
import { identityConfidence, normalizeDoi } from "./lib/orcid-crossref.mjs";
import {
  mergeOrcidWork,
  MATCH,
  pubIdFromDoi,
} from "./lib/publications-core.mjs";
import { projectCatalog } from "./lib/project-site.mjs";
import { summarizeItem } from "./lib/ri.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HARVEST = path.join(ROOT, "data", "harvest");

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

describe("publications merge", () => {
  it("accepts crossref hit and writes pending catalog", () => {
    const pubs = new Map();
    const personas = new Map();
    const autorMap = new Map();
    const doc = {
      id: "docente:ferestrepoca",
      orcid: "0000-0003-4226-1324",
      name_display: "Felipe Restrepo Calle",
    };
    const work = {
      doi: "10.1234/test.pub",
      title: "ORCID title",
      year: "2024",
      type: "journal-article",
      putCode: 99,
    };
    const msg = {
      title: ["Crossref title"],
      type: "journal-article",
      URL: "https://doi.org/10.1234/test.pub",
      author: [
        { family: "Restrepo", given: "Felipe", ORCID: "https://orcid.org/0000-0003-4226-1324" },
        { family: "Doe", given: "Jane" },
      ],
      published: { "date-parts": [[2024, 6, 1]] },
      "container-title": ["Test Journal"],
      publisher: "Test Pub",
    };
    const result = mergeOrcidWork({
      work,
      msg,
      doc,
      matchOpts: MATCH[doc.id],
      docentes: [doc],
      pubs,
      personas,
      autorMap,
      harvestedAt: "2026-09-13",
    });
    assert.equal(result.accepted, true);
    assert.equal(result.pubId, pubIdFromDoi(work.doi));
    const row = pubs.get(result.pubId);
    assert.equal(row.title, "Crossref title");
    assert.equal(row.plas_catalog, "pending");
    assert.equal(row.identity_confidence, "A");
    assert.equal(row.venue_title, "Test Journal");
    assert.equal(autorMap.size, 2);
    assert.ok([...autorMap.values()].some((a) => a.is_plas_docente === "yes"));
  });

  it("quarantines identity E", () => {
    const pubs = new Map();
    const result = mergeOrcidWork({
      work: { doi: "10.9/x", title: "x", year: "2020", type: "journal-article", putCode: 1 },
      msg: { author: [{ family: "Nobody", given: "Else" }], title: ["x"], type: "journal-article" },
      doc: { id: "docente:ferestrepoca", orcid: "0000-0003-4226-1324" },
      matchOpts: MATCH["docente:ferestrepoca"],
      docentes: [],
      pubs,
      personas: new Map(),
      autorMap: new Map(),
      harvestedAt: "2026-09-13",
    });
    assert.equal(result.quarantined, true);
    assert.equal(pubs.size, 0);
  });

  it("merges seed_docente_ids on existing pub", () => {
    const pubs = new Map();
    const personas = new Map();
    const autorMap = new Map();
    const d1 = { id: "docente:ferestrepoca", orcid: "0000-0003-4226-1324", name_display: "F" };
    const d2 = { id: "docente:capedrazab", orcid: "0000-0001-1111-1111", name_display: "C" };
    const work = { doi: "10.1/shared", title: "S", year: "2021", type: "journal-article", putCode: 2 };
    const msg = {
      title: ["S"],
      type: "journal-article",
      author: [
        { family: "Restrepo", given: "Felipe", ORCID: `https://orcid.org/${d1.orcid}` },
        { family: "Pedraza", given: "Cesar", ORCID: `https://orcid.org/${d2.orcid}` },
      ],
    };
    mergeOrcidWork({
      work, msg, doc: d1, matchOpts: MATCH[d1.id], docentes: [d1, d2],
      pubs, personas, autorMap, harvestedAt: "2026-09-13",
    });
    mergeOrcidWork({
      work, msg, doc: d2, matchOpts: MATCH[d2.id], docentes: [d1, d2],
      pubs, personas, autorMap, harvestedAt: "2026-09-13",
    });
    const row = pubs.get(pubIdFromDoi(work.doi));
    assert.ok(row.seed_docente_ids.includes("docente:ferestrepoca"));
    assert.ok(row.seed_docente_ids.includes("docente:capedrazab"));
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

  it("registerThesis inserts row + student + line", () => {
    const { matchAliases } = buildAliasIndex(aliases);
    const data = {
      tesis: [],
      directores: [],
      autores: [],
      estudiantes: [],
      tesisLineas: [],
    };
    const sum = {
      handle: "unal/99999",
      uuid: "u-test",
      title: "Sistema embebido tolerante a fallos",
      year: "2026",
      authors: "Ada Lovelace",
      authorsList: ["Ada Lovelace"],
      advisors: ["Felipe Restrepo Calle"],
      dcTypes: ["Master thesis"],
      degreeName: "Maestría en Ingeniería de Sistemas y Computación",
      degreeLevel: "Maestría",
      researchArea: "sistemas embebidos",
      abstractEs: "soft error fault tolerant",
      abstractEn: "",
      abstractOther: "",
      itemUrl: "https://repositorio.unal.edu.co/handle/unal/99999",
    };
    const result = registerThesis(data, sum, {
      matchAliases,
      docenteLineas: {
        "docente:ferestrepoca": ["line:embebidos", "line:educacion"],
      },
      keywordsByLine: {
        "line:embebidos": ["embebido", "fault", "soft error"],
      },
      harvestedAt: "2026-09-13",
    });
    assert.equal(result.ok, true);
    assert.equal(data.tesis.length, 1);
    assert.equal(data.tesis[0].visible, "yes");
    assert.ok(data.tesis[0].line_id_primary);
    assert.equal(data.estudiantes.length, 1);
    assert.equal(data.autores[0].estudiante_id, data.estudiantes[0].id);
    assert.equal(data.directores[0].docente_id, "docente:ferestrepoca");
  });

  it("upsertEstudiante increments n_tesis", () => {
    const list = [];
    upsertEstudiante(list, "Ada Lovelace", "maestria", "2024");
    upsertEstudiante(list, "Ada Lovelace", "doctorado", "2026");
    assert.equal(list.length, 1);
    assert.equal(list[0].n_tesis, "2");
    assert.equal(list[0].degree_highest, "doctorado");
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

describe("projectCatalog", () => {
  it("filters plas_catalog=yes and visible theses", () => {
    const out = projectCatalog({
      publications: [
        {
          id: "pub:doi:10.1/a",
          doi: "10.1/a",
          title: "In",
          year: "2025",
          typology: "journal_article",
          typology_label_es: "Artículos de revista",
          venue_title: "V",
          url: "https://doi.org/10.1/a",
          plas_catalog: "yes",
          plas_catalog_source: "minciencias",
          seed_docente_ids: "docente:ferestrepoca",
        },
        {
          id: "pub:doi:10.1/b",
          title: "Pending",
          year: "2025",
          plas_catalog: "pending",
          seed_docente_ids: "docente:ferestrepoca",
        },
      ],
      people: [
        {
          id: "persona:orcid:x",
          name_display: "Felipe Restrepo",
          docente_id: "docente:ferestrepoca",
        },
      ],
      publicationAuthors: [
        {
          publicacion_id: "pub:doi:10.1/a",
          persona_id: "persona:orcid:x",
          author_position: "1",
        },
      ],
      facultyLines: [{ docente_id: "docente:ferestrepoca", line_id: "line:educacion" }],
      researchLines: [{ id: "line:educacion", name: "Educación en ingeniería" }],
      theses: [
        {
          id: "tesis:unal/1",
          handle: "unal/1",
          title: "Visible",
          year: "2024",
          degree: "maestria",
          item_url: "https://repositorio.unal.edu.co/handle/unal/1",
          line_id_primary: "line:educacion",
          authors: "A B",
          visible: "yes",
        },
        {
          id: "tesis:unal/2",
          handle: "unal/2",
          title: "Hidden",
          year: "2023",
          visible: "no",
          line_id_primary: "line:educacion",
          authors: "C",
          degree: "maestria",
          item_url: "",
        },
      ],
      thesisAuthors: [
        {
          tesis_id: "tesis:unal/1",
          estudiante_id: "estudiante:a-b",
          degree_of_tesis: "maestria",
          is_highest_degree_tesis: "yes",
        },
      ],
      students: [
        {
          id: "estudiante:a-b",
          name_display: "B, A",
          name_sort: "B, A",
          degree_highest: "maestria",
          n_tesis: "1",
          site_name: "",
          site_status: "",
          site_role_group: "",
          site_lines: "",
          image_src: "",
          email: "",
          website: "",
          linkedin: "",
          github: "",
          member_match: "",
        },
      ],
    });
    assert.equal(out.publications.length, 1);
    assert.equal(out.publications[0].authors, "Felipe Restrepo");
    assert.deepEqual(out.publications[0].line_ids, ["line:educacion"]);
    assert.equal(out.theses.length, 1);
    assert.equal(out.students.length, 1);
    assert.equal(out.students[0].thesis.id, "tesis:unal/1");
    assert.equal(out.students[0].active, false);
  });
});

describe("json-store roundtrip", () => {
  let dir;
  let store;

  before(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "plas-harvest-"));
    await mkdir(path.join(dir, "data", "harvest"), { recursive: true });
    await writeFile(
      path.join(dir, "data", "harvest", "faculty.json"),
      JSON.stringify([{ id: "docente:x", orcid: "0000", name_display: "X" }], null, 2),
      "utf8",
    );
    // Load module with patched paths via dynamic import after writing a tiny wrapper is hard;
    // test the helpers by importing and writing via absolute API using temp files directly.
    const { writeJson, readJson, rowToStrings } = await import("./lib/json-store.mjs");
    store = { writeJson, readJson, rowToStrings };
  });

  after(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("writeJson/readJson roundtrip", async () => {
    const file = path.join(dir, "sample.json");
    await store.writeJson(file, [{ a: 1, b: null }]);
    const got = await store.readJson(file);
    assert.equal(got[0].a, 1);
    assert.deepEqual(store.rowToStrings({ a: 1, b: null }), { a: "1", b: "" });
  });
});

describe("harvest data present", () => {
  it("has faculty with ORCID and theses aliases", async () => {
    const faculty = JSON.parse(await readFile(path.join(HARVEST, "faculty.json"), "utf8"));
    const aliases = JSON.parse(await readFile(path.join(HARVEST, "faculty_aliases.json"), "utf8"));
    const pubs = JSON.parse(await readFile(path.join(HARVEST, "publications.json"), "utf8"));
    assert.ok(faculty.some((f) => f.orcid));
    assert.ok(aliases.some((a) => a.use_for_advisor_match === "yes"));
    assert.ok(pubs.length > 50);
    const catalogYes = pubs.filter((p) => p.plas_catalog === "yes").length;
    assert.ok(catalogYes > 0);
  });
});

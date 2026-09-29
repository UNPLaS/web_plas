#!/usr/bin/env node
/**
 * RI UNAL → new rows appended to src/data/{theses,students}.json.
 * Existing theses and students are never modified; known handles (including
 * plas_catalog_source "rejected") are skipped. The only exception is
 * --backfill-abstracts, which fills a missing `abstract` and nothing else.
 */
import path from "node:path";
import { sleep } from "./lib/normalize.mjs";
import {
  discoverSearch,
  fetchItemByHandle,
  fetchOwningCollectionName,
  summarizeItem,
} from "./lib/ri.mjs";
import { readJson, writeJson, SITE_DATA_DIR } from "./lib/json-store.mjs";
import {
  aliasesFromFaculty,
  buildAliasIndex,
  matchAdvisors,
  buildDocenteLineasMap,
  buildKeywordsMap,
  registerThesis,
  normText,
  thesisAbstract,
  withAbstract,
} from "./lib/theses-core.mjs";

const THESES = path.join(SITE_DATA_DIR, "theses.json");
const STUDENTS = path.join(SITE_DATA_DIR, "students.json");

function parseArgs(argv) {
  const args = {
    dryRun: false,
    backfillAbstracts: false,
    testHoldout: null,
    maxPages: 30,
    queryDelayMs: 120,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--backfill-abstracts") args.backfillAbstracts = true;
    else if (a === "--test-holdout") args.testHoldout = argv[++i];
    else if (a === "--max-pages") args.maxPages = Number(argv[++i]);
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

async function harvestFromRi({ queries, matchAliases, maxPages, delayMs, onlyDocentes = null }) {
  const byHandle = new Map();
  const filteredQueries = onlyDocentes
    ? queries.filter((q) => onlyDocentes.has(q.docente_id))
    : queries;

  console.log(`Consultando RI: ${filteredQueries.length} aliases…`);
  let qi = 0;
  for (const q of filteredQueries) {
    qi++;
    process.stdout.write(`  [${qi}/${filteredQueries.length}] ${q.docente_id} «${q.query}» `);
    try {
      const items = await discoverSearch(`"${q.query}"`, { maxPages, delayMs });
      let added = 0;
      for (const item of items) {
        const sum = summarizeItem(item);
        if (!sum.handle) continue;
        const advisors = matchAdvisors(sum.advisors, matchAliases);
        const prev = byHandle.get(sum.handle);
        if (!prev) {
          byHandle.set(sum.handle, { ...sum, plasDirectors: advisors });
          added++;
        } else {
          const merged = new Map(prev.plasDirectors.map((d) => [d.docente_id, d]));
          for (const d of advisors) merged.set(d.docente_id, d);
          prev.plasDirectors = [...merged.values()];
        }
      }
      console.log(`→ ${items.length} hits, +${added} nuevos handles`);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
    }
    await sleep(delayMs);
  }
  return [...byHandle.values()];
}

async function enrichProgram(sum) {
  return sum.degreeName || (await fetchOwningCollectionName(sum.uuid)) || "";
}

/** Fill `abstract` on theses that lack it; returns how many rows changed. */
async function backfillAbstracts(theses, { delayMs }) {
  let filled = 0;
  for (let i = 0; i < theses.length; i++) {
    const t = theses[i];
    if (t.abstract || !t.handle) continue;
    process.stdout.write(`  ${t.handle} `);
    try {
      const abstract = thesisAbstract(summarizeItem(await fetchItemByHandle(t.handle)));
      if (abstract) {
        theses[i] = withAbstract(t, abstract);
        filled++;
        console.log(`→ ${abstract.length} caracteres`);
      } else {
        console.log("→ sin abstract en el repositorio");
      }
    } catch (e) {
      console.log(`ERROR: ${e.message.split("\n")[0]}`);
    }
    await sleep(delayMs);
  }
  return filled;
}

/** Remove one thesis (and students left without theses) from in-memory data only. */
function holdoutPrepare(handle, data) {
  const h = handle.replace(/^tesis:/, "");
  const thesis = data.theses.find((t) => t.handle === h);
  if (!thesis) throw new Error(`Holdout no encontrado: ${handle}`);
  data.theses = data.theses.filter((t) => t !== thesis);
  const studentIds = new Set(thesis.student_ids);
  const students = data.students.filter((s) => studentIds.has(s.id));
  data.students = data.students.filter(
    (s) => !studentIds.has(s.id) || data.theses.some((t) => t.student_ids.includes(s.id)),
  );
  console.log(`Holdout apartado en memoria: ${thesis.id}`);
  return { thesis, students, directorIds: new Set(thesis.advisor_ids) };
}

function compareHoldout({ thesis, students }, data) {
  const got = data.theses.find((t) => t.id === thesis.id);
  const report = { ok: true, checks: [] };
  const check = (name, pass, detail = "") => {
    report.checks.push({ name, pass, detail });
    if (!pass) report.ok = false;
  };
  const sameSet = (a, b) => [...a].sort().join("|") === [...b].sort().join("|");

  check("tesis_recreada", !!got, got ? got.title : "missing");
  if (got) {
    check("title", normText(got.title) === normText(thesis.title), got.title);
    check("degree", got.degree === thesis.degree, `${got.degree} vs ${thesis.degree}`);
    check("line", sameSet(got.line_ids, thesis.line_ids), `${got.line_ids} vs ${thesis.line_ids}`);
    check("directores", sameSet(got.advisor_ids, thesis.advisor_ids), `${got.advisor_ids}`);
    check("estudiantes", sameSet(got.student_ids, thesis.student_ids), `${got.student_ids}`);
  }
  for (const s of students) {
    check(`estudiante:${s.id}`, data.students.some((x) => x.id === s.id));
  }
  return report;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Uso:
  node scripts/harvest-theses.mjs [--dry-run] [--test-holdout unal/HANDLE] [--max-pages N]
  node scripts/harvest-theses.mjs --backfill-abstracts [--dry-run]

Agrega tesis y estudiantes nuevos a src/data/. --test-holdout nunca escribe.
--backfill-abstracts solo completa el abstract de tesis existentes que no lo tienen.
`);
    return;
  }

  const faculty = await readJson(path.join(SITE_DATA_DIR, "faculty.json"));
  const lines = await readJson(path.join(SITE_DATA_DIR, "lines.json"));
  const data = {
    theses: await readJson(THESES),
    students: await readJson(STUDENTS),
  };
  if (args.backfillAbstracts) {
    const missing = data.theses.filter((t) => !t.abstract).length;
    console.log(`Tesis sin abstract: ${missing}`);
    const filled = await backfillAbstracts(data.theses, { delayMs: args.queryDelayMs });
    console.log(`\nAbstracts completados: ${filled}/${missing}`);
    if (args.dryRun || !filled) {
      console.log(args.dryRun ? "Dry-run: no se escribe JSON." : "Nada que escribir.");
      return;
    }
    await writeJson(THESES, data.theses);
    console.log("Escrito src/data/theses.json");
    return;
  }

  const { queries, matchAliases } = buildAliasIndex(aliasesFromFaculty(faculty));
  const docenteLineas = buildDocenteLineasMap(faculty);
  const keywordsByLine = buildKeywordsMap(lines);

  let holdout = null;
  if (args.testHoldout) {
    holdout = holdoutPrepare(args.testHoldout, data);
    console.log(`Modo test: solo aliases de ${[...holdout.directorIds].join(", ")}`);
  }

  const harvested = await harvestFromRi({
    queries,
    matchAliases,
    maxPages: args.maxPages,
    delayMs: args.queryDelayMs,
    onlyDocentes: holdout?.directorIds ?? null,
  });

  console.log(`Handles únicos con match PLaS en advisors: ${harvested.length}`);

  const stats = { examined: 0, new: 0, newStudents: 0, skipped: {} };

  for (const sum of harvested) {
    stats.examined++;
    if (data.theses.some((t) => t.handle === sum.handle)) continue;
    sum.degreeName = await enrichProgram(sum);

    const forceDirectors =
      holdout && sum.handle === holdout.thesis.handle
        ? holdout.thesis.advisor_ids.map((docente_id) => ({ docente_id, name_form_raw: "" }))
        : null;

    const result = registerThesis(data, sum, {
      matchAliases,
      docenteLineas,
      keywordsByLine,
      lines,
      forceDirectors,
    });

    if (!result.ok) {
      stats.skipped[result.reason] = (stats.skipped[result.reason] || 0) + 1;
      continue;
    }

    stats.new++;
    stats.newStudents += result.newStudents.length;
    console.log(
      `+ ${sum.handle} · ${result.line.lineId} (${result.line.method}) · ${sum.title.slice(0, 60)}`,
    );
    for (const s of result.newStudents) console.log(`    estudiante nuevo: ${s.id}`);
    await sleep(80);
  }

  console.log("\nResumen:", JSON.stringify(stats, null, 2));

  if (holdout) {
    const report = compareHoldout(holdout, data);
    console.log("\n=== HOLD OUT COMPARE ===");
    for (const c of report.checks) {
      console.log(`${c.pass ? "PASS" : "FAIL"} ${c.name}${c.detail ? " — " + c.detail : ""}`);
    }
    console.log(report.ok ? "\nPipeline OK: recreó el registro apartado." : "\nPipeline FALLÓ la comparación.");
    process.exitCode = report.ok ? 0 : 1;
    return;
  }

  if (args.dryRun || !stats.new) {
    console.log(args.dryRun ? "Dry-run: no se escribe JSON." : "Sin tesis nuevas.");
    return;
  }

  data.theses.sort((a, b) => String(b.year).localeCompare(String(a.year)));
  await writeJson(THESES, data.theses);
  await writeJson(STUDENTS, data.students);
  console.log(`Escritas ${stats.new} tesis nuevas en src/data/theses.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

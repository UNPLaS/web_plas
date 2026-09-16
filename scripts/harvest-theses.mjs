#!/usr/bin/env node
/**
 * RI UNAL → data/harvest/{theses,thesis_*,students}.json
 * Then projects visible rows into src/data/{theses,students}.json
 */
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { sleep } from "./lib/normalize.mjs";
import { discoverSearch, fetchOwningCollectionName, summarizeItem } from "./lib/ri.mjs";
import {
  ensureHarvestDir,
  readTable,
  writeTables,
  PIPELINE_TEST_DIR,
} from "./lib/json-store.mjs";
import { projectSiteData } from "./lib/project-site.mjs";
import {
  buildAliasIndex,
  matchAdvisors,
  buildDocenteLineasMap,
  buildKeywordsMap,
  registerThesis,
  normText,
} from "./lib/theses-core.mjs";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    testHoldout: null,
    maxPages: 30,
    queryDelayMs: 120,
    skipProject: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--test-holdout") args.testHoldout = argv[++i];
    else if (a === "--max-pages") args.maxPages = Number(argv[++i]);
    else if (a === "--skip-project") args.skipProject = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

async function loadCanonical() {
  return {
    aliases: await readTable("faculty_aliases"),
    tesis: await readTable("theses"),
    directores: await readTable("thesis_advisors"),
    autores: await readTable("thesis_authors"),
    estudiantes: await readTable("students"),
    tesisLineas: await readTable("thesis_lines"),
    docenteLineas: await readTable("faculty_lines"),
    lineasKeywords: await readTable("research_line_keywords"),
  };
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
  let degreeName = sum.degreeName;
  if (!degreeName) {
    degreeName = await fetchOwningCollectionName(sum.uuid);
  }
  return degreeName || "";
}

async function holdoutPrepare(handle, data) {
  const dir = PIPELINE_TEST_DIR;
  await mkdir(dir, { recursive: true });
  const tid = handle.startsWith("tesis:") ? handle : `tesis:${handle}`;
  const h = tid.replace(/^tesis:/, "");

  const tesisRow = data.tesis.find((t) => t.id === tid || t.handle === h);
  if (!tesisRow) throw new Error(`Holdout no encontrado: ${handle}`);

  const dirs = data.directores.filter((d) => d.tesis_id === tid);
  const auts = data.autores.filter((a) => a.tesis_id === tid);
  const lines = data.tesisLineas.filter((l) => l.tesis_id === tid);
  const estIds = new Set(auts.map((a) => a.estudiante_id));
  const estRows = data.estudiantes.filter((e) => estIds.has(e.id));

  const bundle = {
    tesis: tesisRow,
    directores: dirs,
    autores: auts,
    tesis_lineas: lines,
    estudiantes: estRows,
  };
  await writeFile(path.join(dir, "holdout.json"), JSON.stringify(bundle, null, 2), "utf8");

  data.tesis = data.tesis.filter((t) => t.id !== tid);
  data.directores = data.directores.filter((d) => d.tesis_id !== tid);
  data.autores = data.autores.filter((a) => a.tesis_id !== tid);
  data.tesisLineas = data.tesisLineas.filter((l) => l.tesis_id !== tid);

  for (const eid of estIds) {
    const still = data.autores.some((a) => a.estudiante_id === eid);
    if (!still) data.estudiantes = data.estudiantes.filter((e) => e.id !== eid);
    else {
      const e = data.estudiantes.find((x) => x.id === eid);
      if (e) e.n_tesis = String(Math.max(0, Number(e.n_tesis || 1) - 1));
    }
  }

  console.log(`Holdout apartado: ${tid} → data/pipeline_test/holdout.json`);
  return { tid, handle: h, bundle, directorIds: [...new Set(dirs.map((d) => d.docente_id))] };
}

function compareHoldout(bundle, data) {
  const tid = bundle.tesis.id;
  const got = data.tesis.find((t) => t.id === tid);
  const report = { ok: true, checks: [] };
  const check = (name, pass, detail = "") => {
    report.checks.push({ name, pass, detail });
    if (!pass) report.ok = false;
  };

  check("tesis_recreada", !!got, got ? got.title : "missing");
  if (got) {
    check("title", normText(got.title) === normText(bundle.tesis.title), `${got.title}`);
    check("degree", got.degree === bundle.tesis.degree, `${got.degree} vs ${bundle.tesis.degree}`);
    check("visible", got.visible === "yes", got.visible);
    check("line_nonempty", !!(got.line_id_primary || "").trim(), got.line_id_primary);
    check(
      "directores",
      normText(got.director_docente_ids) === normText(bundle.tesis.director_docente_ids) ||
        got.director_docente_ids.split("|").map((s) => s.trim()).sort().join("|") ===
          bundle.tesis.director_docente_ids.split("|").map((s) => s.trim()).sort().join("|"),
      `${got.director_docente_ids}`,
    );
  }

  for (const a of bundle.autores) {
    const ga = data.autores.find((x) => x.tesis_id === tid && x.estudiante_id === a.estudiante_id);
    check(`autor:${a.estudiante_id}`, !!ga, ga ? "ok" : "missing");
    const ge = data.estudiantes.find((x) => x.id === a.estudiante_id);
    check(`estudiante:${a.estudiante_id}`, !!ge, ge ? ge.name_display : "missing");
  }

  const gl = data.tesisLineas.find((l) => l.tesis_id === tid && l.is_primary === "yes");
  check("tesis_lineas_primary", !!gl && !!(gl.line_id || "").trim(), gl?.line_id || "");

  return report;
}

async function persist(data, { dryRun }) {
  if (dryRun) {
    console.log("Dry-run: no se escribe JSON.");
    return;
  }
  await writeTables({
    theses: data.tesis,
    thesis_advisors: data.directores,
    thesis_authors: data.autores,
    students: data.estudiantes,
    thesis_lines: data.tesisLineas,
  });
  console.log("data/harvest theses/students actualizados.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Uso:
  node scripts/harvest-theses.mjs [--dry-run] [--test-holdout unal/HANDLE] [--max-pages N]

Escribe JSON en data/harvest/ y proyecta a src/data/ (salvo --skip-project).
`);
    return;
  }

  await ensureHarvestDir();
  const data = await loadCanonical();
  const { queries, matchAliases } = buildAliasIndex(data.aliases);
  const docenteLineas = buildDocenteLineasMap(data.docenteLineas);
  const keywordsByLine = buildKeywordsMap(data.lineasKeywords);

  let holdout = null;
  let onlyDocentes = null;
  if (args.testHoldout) {
    holdout = await holdoutPrepare(args.testHoldout, data);
    onlyDocentes = new Set(holdout.directorIds);
    console.log(`Modo test: solo aliases de ${[...onlyDocentes].join(", ")}`);
  }

  if (holdout && !args.dryRun) {
    await persist(data, { dryRun: false });
  }

  const harvested = await harvestFromRi({
    queries,
    matchAliases,
    maxPages: args.maxPages,
    delayMs: args.queryDelayMs,
    onlyDocentes,
  });

  console.log(`Handles únicos con match PLaS en advisors: ${harvested.length}`);

  const stats = { examined: 0, new: 0, skipped: {}, added: [] };

  for (const sum of harvested) {
    stats.examined++;
    sum.degreeName = await enrichProgram(sum);

    const forceDirectors =
      holdout && sum.handle === holdout.handle
        ? holdout.bundle.directores.map((d) => ({
            docente_id: d.docente_id,
            name_form_raw: d.name_form_raw,
          }))
        : null;

    const result = registerThesis(data, sum, {
      matchAliases,
      docenteLineas,
      keywordsByLine,
      harvestedAt: today(),
      forceDirectors,
    });

    if (!result.ok) {
      if (result.reason !== "already_present") {
        stats.skipped[result.reason] = (stats.skipped[result.reason] || 0) + 1;
      }
      continue;
    }

    stats.new++;
    stats.added.push({
      handle: sum.handle,
      title: sum.title,
      line: result.line.lineId,
      method: result.line.method,
    });
    console.log(
      `+ ${sum.handle} · ${result.line.lineId} (${result.line.method}) · ${sum.title.slice(0, 60)}`,
    );
    await sleep(80);
  }

  console.log(
    "\nResumen:",
    JSON.stringify({ examined: stats.examined, new: stats.new, skipped: stats.skipped }, null, 2),
  );

  await persist(data, { dryRun: args.dryRun });

  if (!args.dryRun && !args.skipProject) {
    await projectSiteData();
  }

  if (holdout) {
    const report = compareHoldout(holdout.bundle, data);
    await mkdir(PIPELINE_TEST_DIR, { recursive: true });
    await writeFile(
      path.join(PIPELINE_TEST_DIR, "compare_report.json"),
      JSON.stringify(report, null, 2),
      "utf8",
    );
    console.log("\n=== HOLD OUT COMPARE ===");
    for (const c of report.checks) {
      console.log(`${c.pass ? "PASS" : "FAIL"} ${c.name}${c.detail ? " — " + c.detail : ""}`);
    }
    console.log(
      report.ok ? "\nPipeline OK: recreó el registro apartado." : "\nPipeline FALLÓ la comparación.",
    );
    process.exitCode = report.ok ? 0 : 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

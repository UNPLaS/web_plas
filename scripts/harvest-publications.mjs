#!/usr/bin/env node
/**
 * ORCID → Crossref → new rows appended to src/data/publications.json.
 * Existing rows (including plas_catalog_source "rejected") are never touched
 * nor re-added. Works seeded only by Fabio without another PLaS coauthor are skipped.
 */
import path from "node:path";
import {
  fetchOrcidWorks,
  fetchCrossrefWork,
  sleep as sleepMs,
} from "./lib/orcid-crossref.mjs";
import { readJson, writeJson, SITE_DATA_DIR } from "./lib/json-store.mjs";
import {
  buildKnownIndex,
  buildStudentMatchers,
  evaluateOrcidWork,
  orcidFromFaculty,
  sortPublications,
} from "./lib/publications-core.mjs";

const PUBLICATIONS = path.join(SITE_DATA_DIR, "publications.json");

function parseArgs(argv) {
  const opts = { dryRun: false, only: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--dry-run") opts.dryRun = true;
    else if (argv[i] === "--only") opts.only = argv[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);

  const faculty = (await readJson(path.join(SITE_DATA_DIR, "faculty.json")))
    .map((f) => ({ ...f, orcid: orcidFromFaculty(f) }));
  const students = await readJson(path.join(SITE_DATA_DIR, "students.json"), []);
  const pubs = await readJson(PUBLICATIONS);
  const lines = await readJson(path.join(SITE_DATA_DIR, "lines.json"));

  let targets = faculty.filter((d) => d.orcid);
  if (opts.only) {
    targets = targets.filter(
      (d) => d.id === `docente:${opts.only}` || d.email?.split("@")[0] === opts.only,
    );
  }
  if (!targets.length) {
    console.error("No docentes with ORCID to harvest");
    process.exit(1);
  }

  const known = buildKnownIndex(pubs);
  const studentMatchers = buildStudentMatchers(students.map((s) => s.name_display));
  const added = [];
  const stats = { works: 0, known: 0, added: 0, fabio_independent: 0, quarantined: 0 };

  for (const doc of targets) {
    console.log(`\n== ${doc.name_display} (${doc.orcid})`);
    const works = await fetchOrcidWorks(doc.orcid);
    await sleepMs(200);

    for (const work of works) {
      stats.works++;
      let msg = null;
      if (work.doi) {
        msg = await fetchCrossrefWork(work.doi);
        await sleepMs(150);
      }
      const result = evaluateOrcidWork({ work, msg, doc, faculty, studentMatchers, known, lines });
      stats[result.status]++;
      if (result.status === "quarantined") {
        console.log(`  QUARANTINE  ${work.doi || work.putCode}  ${(work.title || "").slice(0, 60)}`);
      } else if (result.status === "added") {
        added.push(result.pub);
        console.log(`  ADD  ${result.pub.id}  ${result.pub.title.slice(0, 70)}`);
      }
    }
  }

  console.log("\n=== summary ===");
  console.log(JSON.stringify(stats, null, 2));

  if (opts.dryRun || !added.length) {
    console.log(opts.dryRun ? "dry-run: not writing" : "no new publications");
    return;
  }

  await writeJson(PUBLICATIONS, sortPublications([...pubs, ...added]));
  console.log(`wrote ${added.length} new rows to src/data/publications.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

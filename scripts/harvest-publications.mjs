#!/usr/bin/env node
/**
 * ORCID → Crossref → data/harvest/{publications,people,publication_authors}.json
 * Then projects catalog-ready rows into src/data/publications.json
 */
import {
  fetchOrcidWorks,
  fetchCrossrefWork,
  sleep as sleepMs,
} from "./lib/orcid-crossref.mjs";
import {
  ensureHarvestDir,
  readTable,
  writeTables,
} from "./lib/json-store.mjs";
import { projectSiteData } from "./lib/project-site.mjs";
import {
  MATCH,
  personaIdFromOrcid,
  ensurePersona,
  autorKey,
  mergeOrcidWork,
} from "./lib/publications-core.mjs";

const TODAY = new Date().toISOString().slice(0, 10);

function parseArgs(argv) {
  const opts = { dryRun: false, only: null, skipProject: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--dry-run") opts.dryRun = true;
    else if (argv[i] === "--only") opts.only = argv[++i];
    else if (argv[i] === "--skip-project") opts.skipProject = true;
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  await ensureHarvestDir();

  const docentes = await readTable("faculty");
  let targets = docentes.filter((d) => d.orcid);
  if (opts.only) {
    targets = targets.filter(
      (d) => d.email_local === opts.only || d.id === `docente:${opts.only}`,
    );
  }
  if (!targets.length) {
    console.error("No docentes with ORCID to harvest");
    process.exit(1);
  }

  const pubs = new Map((await readTable("publications")).map((r) => [r.id, r]));
  const personas = new Map((await readTable("people")).map((r) => [r.id, r]));
  const autorMap = new Map(
    (await readTable("publication_authors")).map((a) => [autorKey(a), a]),
  );

  const stats = { works: 0, accepted: 0, quarantine: 0, byDocente: {} };

  for (const doc of targets) {
    const matchOpts = MATCH[doc.id] || {
      familyParts: [doc.name_sort?.split(",")[0] || doc.email_local],
      givenNames: [],
      givenInitials: [],
    };
    console.log(`\n== ${doc.name_display} (${doc.orcid})`);
    const works = await fetchOrcidWorks(doc.orcid);
    stats.byDocente[doc.id] = { orcid: works.length, accepted: 0, quarantine: 0 };
    await sleepMs(200);

    ensurePersona(personas, {
      id: personaIdFromOrcid(doc.orcid),
      name_display: doc.name_display,
      name_family: (doc.name_sort || "").split(",")[0]?.trim() || "",
      name_given: doc.name_display.split(/\s+/)[0] || "",
      orcid: doc.orcid,
      docente_id: doc.id,
      estudiante_id: "",
      notes: "seed from faculty",
    });

    for (const w of works) {
      stats.works++;
      let msg = null;
      if (w.doi) {
        msg = await fetchCrossrefWork(w.doi);
        await sleepMs(150);
      }
      const result = mergeOrcidWork({
        work: w,
        msg,
        doc,
        matchOpts,
        docentes,
        pubs,
        personas,
        autorMap,
        harvestedAt: TODAY,
      });
      if (result.quarantined) {
        stats.quarantine++;
        stats.byDocente[doc.id].quarantine++;
        console.log(`  QUARANTINE E  ${w.doi || w.putCode}  ${(w.title || "").slice(0, 60)}`);
        continue;
      }
      if (result.accepted) {
        stats.accepted++;
        stats.byDocente[doc.id].accepted++;
      }
    }
  }

  const pubRows = [...pubs.values()].sort((a, b) =>
    String(b.year).localeCompare(String(a.year)) || a.id.localeCompare(b.id),
  );
  const personaRows = [...personas.values()].sort((a, b) => a.id.localeCompare(b.id));
  const autorRows = [...autorMap.values()].sort(
    (a, b) =>
      a.publicacion_id.localeCompare(b.publicacion_id) ||
      Number(a.author_position) - Number(b.author_position),
  );

  console.log("\n=== summary ===");
  console.log(JSON.stringify(stats, null, 2));
  console.log(
    `rows: pubs=${pubRows.length} personas=${personaRows.length} autores=${autorRows.length}`,
  );

  if (opts.dryRun) {
    console.log("dry-run: not writing");
    return;
  }

  await writeTables({
    publications: pubRows,
    people: personaRows,
    publication_authors: autorRows,
  });
  console.log("wrote data/harvest/{publications,people,publication_authors}.json");

  if (!opts.skipProject) {
    await projectSiteData();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

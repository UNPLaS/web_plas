#!/usr/bin/env node
/** Project data/harvest → src/data/{publications,theses,students,meta}.json */
import { ensureHarvestDir } from "./lib/json-store.mjs";
import { projectSiteData } from "./lib/project-site.mjs";

const dryRun = process.argv.includes("--dry-run");

await ensureHarvestDir();
const result = await projectSiteData({ dryRun });
console.log(JSON.stringify(result, null, 2));

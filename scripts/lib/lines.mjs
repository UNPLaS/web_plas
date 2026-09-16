import { normText } from "./normalize.mjs";

const FABIO = "docente:fagonzalezo";

/** Score keyword hits for a line against haystack text */
function keywordScore(haystack, keywords) {
  let score = 0;
  const h = normText(haystack);
  for (const kw of keywords) {
    const k = normText(kw);
    if (!k) continue;
    // word-boundary-ish: spaces around or edges
    if (k.includes(" ")) {
      if (h.includes(k)) score += 2;
    } else {
      const re = new RegExp(`(?:^|\\s)${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`);
      if (re.test(h)) score += 1;
    }
  }
  return score;
}

/**
 * Assign research line. Never returns empty.
 * @returns {{ lineId: string, method: string, confidence: string, needsReview: string, notes: string }}
 */
export function assignLine({
  directorIds,
  docenteLineas,
  keywordsByLine,
  title,
  abstractEs,
  abstractEn,
  researchArea,
}) {
  const official = (docenteId) =>
    (docenteLineas[docenteId] || []).filter((l) => l && l.startsWith("line:"));

  const dirs = [...new Set(directorIds.filter(Boolean))];
  const perDir = dirs.map((d) => official(d));

  // 1) single advisor with exactly one line
  if (dirs.length === 1 && perDir[0].length === 1) {
    return {
      lineId: perDir[0][0],
      method: "advisor",
      confidence: "high",
      needsReview: "no",
      notes: "single advisor single line",
    };
  }

  // 2) intersection of advisor lines
  if (dirs.length > 1) {
    let inter = new Set(perDir[0]);
    for (const lines of perDir.slice(1)) {
      inter = new Set([...inter].filter((x) => lines.includes(x)));
    }
    if (inter.size === 1) {
      return {
        lineId: [...inter][0],
        method: "advisor_intersection",
        confidence: "high",
        needsReview: "no",
        notes: "co-advisor intersection",
      };
    }
  }

  // candidate lines = union of advisor official lines
  let candidates = [...new Set(perDir.flat())];
  if (!candidates.length) {
    candidates = ["line:lenguajes", "line:educacion", "line:transporte", "line:agricultura", "line:embebidos"];
  }

  const hay = [title, abstractEs, abstractEn, researchArea].filter(Boolean).join("\n");
  const area = normText(researchArea);

  // 3) research_area hints
  const areaMap = [
    [/educacion|aprendizaje|learning/, "line:educacion"],
    [/transporte|traffic|trafico|vehicular|its/, "line:transporte"],
    [/agricultur|cultivo|maleza|precision/, "line:agricultura"],
    [/embebido|embedded|soft\s*error|fault/, "line:embebidos"],
    [/lenguaje|programming|compil|codigo|source code/, "line:lenguajes"],
  ];
  for (const [re, lineId] of areaMap) {
    if (area && re.test(area) && candidates.includes(lineId)) {
      return {
        lineId,
        method: "research_area",
        confidence: "medium",
        needsReview: "no",
        notes: `research_area→${lineId}`,
      };
    }
  }

  // 4) keywords
  const scores = {};
  for (const lineId of candidates) {
    scores[lineId] = keywordScore(hay, keywordsByLine[lineId] || []);
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] > 0) {
    const margin = ranked[0][1] - (ranked[1]?.[1] || 0);
    const conf = ranked[0][1] >= 4 && margin >= 2 ? "high" : ranked[0][1] >= 2 ? "medium" : "low";
    return {
      lineId: ranked[0][0],
      method: "keywords",
      confidence: conf,
      needsReview: conf === "low" ? "yes" : "no",
      notes: `scores=${JSON.stringify(scores)}`,
    };
  }

  // 5) common-sense fallbacks on title
  const t = normText(title);
  const titleRules = [
    [/transmilenio|trafico|vehicul|accidente|brt|torniquete/, "line:transporte"],
    [/cultivo|maleza|agricultur|palma|pecuaria|papa/, "line:agricultura"],
    [/estudiante|aprendizaje|gamific|programacion de computador|cs1|educativ/, "line:educacion"],
    [/embebido|embedded|soft error|fault tolerant|risc-v/, "line:embebidos"],
    [/compil|lenguaje|codigo fuente|source code|nlp|llm|software/, "line:lenguajes"],
  ];
  for (const [re, lineId] of titleRules) {
    if (re.test(t) && candidates.includes(lineId)) {
      return {
        lineId,
        method: "fallback_title",
        confidence: "low",
        needsReview: "yes",
        notes: "title heuristic",
      };
    }
  }

  // 6) never empty: prefer advisor's first line, else lenguajes
  const fallback = candidates[0] || "line:lenguajes";
  return {
    lineId: fallback,
    method: "fallback_default",
    confidence: "low",
    needsReview: "yes",
    notes: `default→${fallback}; fabio=${dirs.includes(FABIO)}`,
  };
}

export { FABIO };

import { keywordScore } from "./lines.mjs";

const MAX_TOPICS = 2;

/**
 * Topics (from lines.json) whose keywords appear in the text, restricted to the
 * candidate lines when given. Best scores first; empty when nothing matches.
 * @returns {string[]} topic ids
 */
export function classifyTopics(text, lines, lineIds = []) {
  const pool = lineIds.length ? lines.filter((l) => lineIds.includes(l.id)) : lines;
  const scored = pool
    .flatMap((l) => (l.topics || []).map((t) => ({ id: t.id, score: keywordScore(text, t.keywords || []) })))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return [];
  const best = scored[0].score;
  return scored
    .filter((t) => t.score * 2 >= best)
    .slice(0, MAX_TOPICS)
    .map((t) => t.id);
}

/** Line ids owning the given topics (sorted, unique). */
export function linesForTopics(topicIds, lines) {
  const owner = new Map(lines.flatMap((l) => (l.topics || []).map((t) => [t.id, l.id])));
  return [...new Set(topicIds.map((id) => owner.get(id)).filter(Boolean))].sort();
}

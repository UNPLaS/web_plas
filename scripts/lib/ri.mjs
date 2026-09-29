import { sleep, metaValues, metaFirst, yearFromDate } from "./normalize.mjs";

const BASE = "https://bffrepositorio.unal.edu.co/server/api";
const UA = "PlaSTest-harvest/1.0";

async function getJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/hal+json,application/json", "User-Agent": UA },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${url}\n${body.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Paginated discover search. Returns indexableObject-like items.
 */
export async function discoverSearch(query, { size = 50, maxPages = 40, delayMs = 120 } = {}) {
  const items = [];
  for (let page = 0; page < maxPages; page++) {
    const url =
      `${BASE}/discover/search/objects?query=${encodeURIComponent(query)}` +
      `&size=${size}&page=${page}`;
    const data = await getJson(url);
    const objects =
      data?._embedded?.searchResult?._embedded?.objects ||
      data?._embedded?.objects ||
      [];
    if (!objects.length) break;
    for (const obj of objects) {
      const item = obj?._embedded?.indexableObject || obj?.indexableObject || obj;
      if (item?.uuid || item?.handle) items.push(item);
    }
    const totalPages =
      data?._embedded?.searchResult?.page?.totalPages ??
      data?.page?.totalPages ??
      page + 1;
    if (page + 1 >= totalPages) break;
    await sleep(delayMs);
  }
  return items;
}

/** Item by handle (`unal/12345`) via the persistent-identifier resolver. */
export async function fetchItemByHandle(handle) {
  return getJson(`${BASE}/pid/find?id=${encodeURIComponent(`hdl:${handle}`)}`);
}

export async function fetchOwningCollectionName(uuid) {
  if (!uuid) return "";
  try {
    const data = await getJson(`${BASE}/core/items/${uuid}?embed=owningCollection`);
    return data?._embedded?.owningCollection?.name || "";
  } catch {
    return "";
  }
}

export function itemHandle(item) {
  return item?.handle || metaFirst(item?.metadata, "dc.identifier.uri")?.replace(/^.*handle\//, "") || "";
}

export function summarizeItem(item) {
  const md = item.metadata || {};
  const types = metaValues(md, "dc.type");
  const authors = metaValues(md, "dc.contributor.author");
  const advisors = metaValues(md, "dc.contributor.advisor");
  const abstracts = [
    ...metaValues(md, "dc.description.abstract"),
    ...metaValues(md, "dc.description"),
  ];
  // The RI tags languages as ISO 639-2 (`spa`, `eng`); older items use `es`/`en` or none.
  const abstractEntries = (md["dc.description.abstract"] || []).filter((x) => x?.value);
  const langOf = (x) => String(x.language || "").toLowerCase();
  const absEs = abstractEntries
    .filter((x) => !langOf(x) || langOf(x).startsWith("es") || langOf(x).startsWith("spa"))
    .map((x) => x.value);
  const absEn = abstractEntries.filter((x) => langOf(x).startsWith("en")).map((x) => x.value);

  return {
    uuid: item.uuid || item.id || "",
    handle: itemHandle(item),
    title: metaFirst(md, "dc.title") || item.name || "",
    authors: authors.join(" | "),
    authorsList: authors,
    advisors,
    dcTypes: types,
    year: yearFromDate(
      metaFirst(md, "dc.date.issued") ||
        metaFirst(md, "dc.date.available") ||
        metaFirst(md, "dc.date.accessioned")
    ),
    degreeName: metaFirst(md, "dc.description.degreename"),
    degreeLevel: metaFirst(md, "dc.description.degreelevel"),
    researchArea: metaValues(md, "dc.description.researcharea").join(" | "),
    abstractEs: absEs[0] || "",
    abstractEn: absEn[0] || "",
    abstractOther: abstracts.filter((a) => a && a !== absEs[0] && a !== absEn[0]).join("\n\n"),
    itemUrl: itemHandle(item)
      ? `https://repositorio.unal.edu.co/handle/${itemHandle(item)}`
      : metaFirst(md, "dc.identifier.uri") || "",
    raw: item,
  };
}

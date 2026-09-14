/**
 * Catálogo unificado (cliente): tipo documental, línea, año y búsqueda.
 * Controles: #catalog-q, #catalog-typology, #catalog-line, #catalog-year
 * Lista: #catalog-results · Meta: #catalog-meta
 */

type LineChip = { id: string; label: string; color?: string } | null;

type CatalogItem = {
  id: string;
  title: string;
  author: string;
  year: string;
  meta: string;
  href: string;
  outcome: string;
  typology: string;
  typologyLabel: string;
  degreeLabel: string;
  lineIds: string[];
  lineName: string;
  lineChip: LineChip;
  sourceLabel: string;
  sourceLogo: string;
};

export function initCatalogFilters() {
  const dataEl = document.getElementById('catalog-data');
  const results = document.getElementById('catalog-results');
  const meta = document.getElementById('catalog-meta');
  if (!dataEl || !results || !meta) return;
  if (results.dataset.catalogReady === '1') return;
  results.dataset.catalogReady = '1';

  let items: CatalogItem[] = [];
  try {
    items = JSON.parse(dataEl.textContent || '[]') as CatalogItem[];
  } catch {
    return;
  }

  const qInput = document.getElementById('catalog-q') as HTMLInputElement | null;
  const typSelect = document.getElementById('catalog-typology') as HTMLSelectElement | null;
  const lineSelect = document.getElementById('catalog-line') as HTMLSelectElement | null;
  const yearSelect = document.getElementById('catalog-year') as HTMLSelectElement | null;
  const clearBtn = document.getElementById('catalog-clear');

  let debounceTimer = 0;

  function norm(s: string) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
  }

  function filtered() {
    const q = norm(qInput?.value || '');
    const typ = String(typSelect?.value || 'all').trim();
    const line = String(lineSelect?.value || 'all').trim();
    const year = String(yearSelect?.value || 'all').trim();

    return items.filter((it) => {
      if (typ !== 'all') {
        const code = String(it.typology || '').trim();
        const label = String(it.typologyLabel || '').trim();
        if (code !== typ && label !== typ) return false;
      }
      if (line !== 'all') {
        const ids = Array.isArray(it.lineIds) ? it.lineIds : [];
        if (!ids.includes(line)) return false;
      }
      if (year !== 'all' && String(it.year || '') !== year) return false;
      if (!q) return true;
      const blob = norm(
        [
          it.title,
          it.author,
          it.outcome,
          it.degreeLabel,
          it.typologyLabel,
          it.lineName,
        ].join(' '),
      );
      return blob.includes(q);
    });
  }

  function escapeHtml(s: string) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderChip(chip: LineChip) {
    if (!chip) return '';
    const style = chip.color ? ` style="--chip-color: ${escapeHtml(chip.color)}"` : '';
    return `<div class="works-card__foot"><span class="type-chip type-chip--${escapeHtml(chip.id)}"${style}>${escapeHtml(chip.label)}</span></div>`;
  }

  function renderItem(it: CatalogItem) {
    const author = it.author
      ? `<p class="works-card__author">${escapeHtml(it.author)}</p>`
      : '';
    const media = it.sourceLogo
      ? `<div class="works-card__media works-card__media--logo"><img src="${escapeHtml(it.sourceLogo)}" alt="" loading="lazy" /></div>`
      : `<div class="works-card__media" aria-hidden="true"></div>`;
    const body = `
      ${media}
      <div class="works-card__body">
        <p class="works-card__meta">${escapeHtml(it.meta)}</p>
        <h2 class="works-card__title">${escapeHtml(it.title)}</h2>
        ${author}
        ${renderChip(it.lineChip)}
      </div>`;

    if (it.href) {
      return `<li><a class="works-card works-card--thumb" href="${escapeHtml(it.href)}" target="_blank" rel="noreferrer">${body}</a></li>`;
    }
    return `<li><article class="works-card works-card--thumb">${body}</article></li>`;
  }

  function render() {
    const list = filtered();

    meta.textContent =
      list.length === 0
        ? 'Sin resultados con estos filtros.'
        : `${list.length} resultado${list.length === 1 ? '' : 's'}`;

    results.innerHTML = list.length
      ? list.map(renderItem).join('')
      : `<li class="catalog-empty">Prueba otra búsqueda o limpia los filtros.</li>`;
  }

  qInput?.addEventListener('input', () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(render, 180);
  });
  typSelect?.addEventListener('change', render);
  lineSelect?.addEventListener('change', render);
  yearSelect?.addEventListener('change', render);

  clearBtn?.addEventListener('click', () => {
    if (qInput) qInput.value = '';
    if (typSelect) typSelect.value = 'all';
    if (lineSelect) lineSelect.value = 'all';
    if (yearSelect) yearSelect.value = 'all';
    render();
    qInput?.focus();
  });

  render();
}

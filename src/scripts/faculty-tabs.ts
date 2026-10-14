/** Pestañas de la página de docente: un solo panel visible; `#<panel>` en la URL elige cuál. */
let bound = false;

function tabsOf(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLButtonElement>('[data-faculty-tab]')];
}

function select(root: HTMLElement, id: string, focus = false) {
  const tabs = tabsOf(root);
  if (!tabs.some((tab) => tab.dataset.facultyTab === id)) return false;
  for (const tab of tabs) {
    const active = tab.dataset.facultyTab === id;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
    const panel = document.getElementById(tab.dataset.facultyTab ?? '');
    if (panel) panel.hidden = !active;
  }
  return true;
}

function onClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const tab = target.closest<HTMLButtonElement>('[data-faculty-tab]');
  const root = tab?.closest<HTMLElement>('[data-faculty-tabs]');
  if (!tab || !root) return;
  if (select(root, tab.dataset.facultyTab ?? '')) {
    history.replaceState(history.state, '', `#${tab.dataset.facultyTab}`);
  }
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.matches('[data-faculty-tab]')) return;
  const root = target.closest<HTMLElement>('[data-faculty-tabs]');
  if (!root) return;
  const tabs = tabsOf(root);
  const i = tabs.indexOf(target as HTMLButtonElement);
  const next =
    event.key === 'ArrowRight' ? tabs[(i + 1) % tabs.length]
    : event.key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length]
    : event.key === 'Home' ? tabs[0]
    : event.key === 'End' ? tabs[tabs.length - 1]
    : null;
  if (!next) return;
  event.preventDefault();
  select(root, next.dataset.facultyTab ?? '', true);
  history.replaceState(history.state, '', `#${next.dataset.facultyTab}`);
}

export function initFacultyTabs() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id) document.querySelectorAll<HTMLElement>('[data-faculty-tabs]').forEach((root) => select(root, id));
  if (bound) return;
  bound = true;
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeydown);
}

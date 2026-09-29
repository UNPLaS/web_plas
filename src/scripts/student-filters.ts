/** Filtro rápido por línea en /people: afecta activos e histórico a la vez. */
let bound = false;

function applyFilter(root: HTMLElement, lineId: string) {
  root.querySelectorAll<HTMLButtonElement>('[data-student-filter]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.studentFilter === lineId));
  });

  root.querySelectorAll<HTMLElement>('[data-student-lines]').forEach((item) => {
    const lines = (item.dataset.studentLines ?? '').split(' ');
    item.hidden = lineId !== 'all' && !lines.includes(lineId);
  });

  const hasVisible = (el: Element) => Boolean(el.querySelector('[data-student-lines]:not([hidden])'));

  root.querySelectorAll<HTMLElement>('.works-list').forEach((list) => {
    list.hidden = !hasVisible(list);
  });
  root.querySelectorAll<HTMLElement>('.students-degree').forEach((group) => {
    group.hidden = !hasVisible(group);
  });
  root.querySelectorAll<HTMLElement>('.students-block').forEach((block) => {
    const empty = block.querySelector<HTMLElement>('[data-students-empty]');
    if (empty) empty.hidden = hasVisible(block);
  });
}

function onClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-student-filter]');
  const root = button?.closest<HTMLElement>('[data-student-filter-root]');
  if (!button || !root) return;
  applyFilter(root, button.dataset.studentFilter ?? 'all');
}

export function initStudentFilters() {
  if (bound) return;
  bound = true;
  document.addEventListener('click', onClick);
}

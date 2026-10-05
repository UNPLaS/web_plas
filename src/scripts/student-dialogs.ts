/** Abre el modal de un estudiante desde su tarjeta; clic en el fondo lo cierra. */
let bound = false;

function onClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const opener = target.closest<HTMLElement>('[data-student-dialog]');
  if (opener) {
    const dialog = document.getElementById(opener.dataset.studentDialog ?? '');
    if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
    return;
  }

  // El panel cubre todo el <dialog>: si el clic cae en el propio <dialog>, fue en el fondo.
  if (target instanceof HTMLDialogElement && target.classList.contains('student-dialog')) {
    target.close();
    return;
  }

  // Un enlace interno (p. ej. al docente en esta misma página) debe verse sin el modal encima.
  if (target.closest('a[href]:not([target="_blank"])')) {
    target.closest<HTMLDialogElement>('dialog.student-dialog[open]')?.close();
  }
}

export function initStudentDialogs() {
  if (bound) return;
  bound = true;
  document.addEventListener('click', onClick);
}

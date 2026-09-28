/** Abre el tema (<details>) al que apunta el hash: enlaces de la trayectoria o externos. */
let bound = false;

function openFromHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return;
  const target = document.getElementById(id);
  if (target instanceof HTMLDetailsElement) target.open = true;
}

export function initTopicAnchors() {
  openFromHash();
  if (bound) return;
  bound = true;
  window.addEventListener('hashchange', openFromHash);
}

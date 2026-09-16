/**
 * Chrome institucional — sin jQuery, sin tocar #main del contenido.
 */
(function () {
  const header = document.getElementById('unal-header');
  const burger = document.getElementById('unal-burger');
  const servicesRoot = document.getElementById('unal-services');
  const servicesToggle = document.getElementById('unal-services-toggle');
  const servicesPanel = document.getElementById('unal-services-panel');
  const accessRoot = document.getElementById('unal-access');
  const accessPanel = document.getElementById('unal-access-panel');
  const siteContent = document.getElementById('unal-site-content');
  const letterInput = document.getElementById('unal-letter-percent');

  let fontPercent = 100;
  let invertOn = false;

  function closeDropdowns(except) {
    document.querySelectorAll('#unal-header [data-unal-dropdown].is-open').forEach((el) => {
      if (el !== except) {
        el.classList.remove('is-open');
        const btn = el.querySelector('.unal-dropdown__btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('#unal-header [data-unal-dropdown]').forEach((dd) => {
    const btn = dd.querySelector('.unal-dropdown__btn');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = dd.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      closeDropdowns(dd);
    });
  });

  document.addEventListener('click', () => closeDropdowns(null));

  if (burger && header) {
    burger.addEventListener('click', () => {
      const open = header.classList.toggle('is-nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  if (servicesToggle && servicesRoot) {
    servicesToggle.addEventListener('click', () => {
      const open = servicesRoot.classList.toggle('is-open');
      servicesToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (servicesPanel) servicesPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
  }

  function setAccessOpen(open) {
    if (!accessRoot || !accessPanel) return;
    accessRoot.classList.toggle('is-open', open);
    accessPanel.hidden = !open;
    if (siteContent) siteContent.classList.toggle('accesibility-on', open);
    document
      .querySelectorAll('#unal-access-toggle, #unal-access-toggle-mobile')
      .forEach((btn) => btn.setAttribute('aria-expanded', open ? 'true' : 'false'));
  }

  function toggleAccess() {
    if (!accessRoot) return;
    setAccessOpen(!accessRoot.classList.contains('is-open'));
  }

  document.getElementById('unal-access-toggle')?.addEventListener('click', toggleAccess);
  document.getElementById('unal-access-toggle-mobile')?.addEventListener('click', toggleAccess);

  function clearFontClasses() {
    for (let p = 110; p <= 200; p += 10) {
      document.documentElement.classList.remove(`unal-font-${p}`);
    }
  }

  function applyFont() {
    clearFontClasses();
    if (fontPercent > 100) {
      document.documentElement.classList.add(`unal-font-${fontPercent}`);
    }
    if (letterInput) letterInput.value = `${fontPercent}%`;
  }

  document.querySelectorAll('[data-unal-font]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.getAttribute('data-unal-font');
      if (dir === '+' && fontPercent < 200) fontPercent += 10;
      if (dir === '-' && fontPercent > 100) fontPercent -= 10;
      applyFont();
    });
  });

  function clearContrast() {
    document.body.classList.remove('unal-contrast-1', 'unal-contrast-2', 'unal-contrast-3');
  }

  document.querySelectorAll('[data-unal-contrast]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const n = btn.getAttribute('data-unal-contrast');
      clearContrast();
      document.body.classList.add(`unal-contrast-${n}`);
    });
  });

  document.getElementById('unal-invert')?.addEventListener('click', () => {
    invertOn = !invertOn;
    document.documentElement.style.filter = invertOn ? 'invert(100%)' : '';
  });

  document.getElementById('unal-access-reset')?.addEventListener('click', () => {
    fontPercent = 100;
    applyFont();
    clearContrast();
    invertOn = false;
    document.documentElement.style.filter = '';
  });
})();

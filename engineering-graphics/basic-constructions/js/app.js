/* Tab switching via URL hash and default-value reset */
(() => {
  'use strict';
  const { $, tabs } = UI;
  const nav = $('tabs');

  function show(name) {
    if (!tabs[name]) name = 'parallele';
    for (const b of nav.querySelectorAll('button')) b.classList.toggle('active', b.dataset.tab === name);
    for (const s of document.querySelectorAll('.tab')) s.classList.toggle('active', s.id === 'tab-' + name);
    tabs[name].render();
  }
  nav.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) location.hash = b.dataset.tab;
  });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));

  const resetBtn = $('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      for (const k in tabs) tabs[k].reset();
      show(location.hash.slice(1));
    });
  }

  show(location.hash.slice(1));
})();

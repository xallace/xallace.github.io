/* Tab switching via URL hash and default-value reset */
(() => {
  'use strict';
  const { $, tabs } = UI;
  const nav = $('tabs');
  // Legacy hashes (#tab-vc …) continue routing to the matching tab
  const OLD = {
    'tab-overview': 'formeln',
    'tab-vc': 'formeln',
    'tab-torque': 'zahlenwert',
    'tab-linear': 'linear',
    'tab-breakeven': 'kosten',
    'tab-quiz': 'formeln'
  };

  function show(name) {
    if (OLD[name]) name = OLD[name];
    if (!tabs[name]) name = 'formeln';
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

/* Reiter per Adress-Hash, Blueprint-Modus, Buchwerte */
(() => {
  'use strict';
  const { $, tabs } = UI;
  const nav = $('tabs');
  // Adressen der früheren Fassung (#tab-vc …) führen weiter zum passenden Reiter
  const OLD = { 'tab-overview': 'formeln', 'tab-vc': 'formeln', 'tab-torque': 'zahlenwert', 'tab-linear': 'linear',
    'tab-breakeven': 'kosten', 'tab-quiz': 'formeln', 'tab-book': 'formeln' };

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

  function setTheme(dark) {
    document.body.classList.toggle('theme-blueprint', dark);
    $('theme-label').textContent = dark ? 'Heller Modus' : 'Blueprint-Modus';
    try { localStorage.setItem('tbb14-theme', dark ? 'dark' : 'light'); } catch (e) { /* ohne Speicher weiter */ }
  }
  $('btn-theme').addEventListener('click', () => setTheme(!document.body.classList.contains('theme-blueprint')));
  // Blueprint ist Standard (Klasse steht schon im <body>); hell nur nach Umschalten oder mit ?theme=light
  let saved = null;
  try { saved = localStorage.getItem('tbb14-theme'); } catch (e) { /* ohne Speicher weiter */ }
  const forced = /[?&]theme=(dark|light)/.exec(location.search);
  setTheme((forced ? forced[1] : saved) !== 'light');

  $('btn-book').addEventListener('click', () => {
    for (const k in tabs) tabs[k].reset();
    show(location.hash.slice(1));
  });

  show(location.hash.slice(1));
})();

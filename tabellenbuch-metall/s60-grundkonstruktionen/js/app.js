/* Tab switching via URL hash, blueprint mode, handbook preset values for Tabellenbuch Metall p. 60 */
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

  function setTheme(dark) {
    document.body.classList.toggle('theme-blueprint', dark);
    $('theme-label').textContent = dark ? 'Light Mode' : 'Blueprint Mode';
    try { localStorage.setItem('tbb60-theme', dark ? 'dark' : 'light'); } catch (e) { /* continue without storage */ }
  }
  $('btn-theme').addEventListener('click', () => setTheme(!document.body.classList.contains('theme-blueprint')));
  let saved = null;
  try { saved = localStorage.getItem('tbb60-theme'); } catch (e) { /* continue without storage */ }
  const forced = /[?&]theme=(dark|light)/.exec(location.search);
  setTheme((forced ? forced[1] : saved) !== 'light');

  $('btn-book').addEventListener('click', () => {
    for (const k in tabs) tabs[k].reset();
    show(location.hash.slice(1));
  });

  show(location.hash.slice(1));
})();

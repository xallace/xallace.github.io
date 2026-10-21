/* Reiter per Adress-Hash, Blueprint-Modus, Buchwerte */
(() => {
  'use strict';
  const { $, tabs } = UI;
  const nav = $('tabs');

  function show(name) {
    if (!tabs[name]) name = 'koordinaten';
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
    try { localStorage.setItem('tbb58-theme', dark ? 'dark' : 'light'); } catch (e) { /* ohne Speicher weiter */ }
  }
  $('btn-theme').addEventListener('click', () => setTheme(!document.body.classList.contains('theme-blueprint')));
  let saved = null;
  try { saved = localStorage.getItem('tbb58-theme'); } catch (e) { /* ohne Speicher weiter */ }
  if (saved === 'dark' || /[?&]theme=dark/.test(location.search)) setTheme(true);

  $('btn-book').addEventListener('click', () => {
    for (const k in tabs) tabs[k].reset();
    show(location.hash.slice(1));
  });

  show(location.hash.slice(1));
})();

/* Reiterverwaltung: baut jeden Reiter erst beim ersten Öffnen auf, merkt den Reiter in der Adresse (#reifen …)
   und sagt dem alten Reiter Bescheid, damit er Animationen anhält. */
(function () {
  'use strict';
  const TABS = [
    { id: 'reifen', part: 'I', label: 'Reifen' },
    { id: 'fahrleistung', part: 'II', label: 'Fahrleistungen' },
    { id: 'bremsung', part: 'II', label: 'Bremsung' },
    { id: 'schwingung', part: 'III', label: 'Schwingungen' },
    { id: 'fahrverhalten', part: 'IV', label: 'Fahrverhalten' },
    { id: 'pruefung', part: '✓', label: 'Prüfung & Quellen' },
  ];
  const nav = document.getElementById('tabs');
  const host = document.getElementById('tab-host');
  const state = {};
  let current = null;

  for (const t of TABS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span class="part">${t.part}</span>${t.label}`;
    b.addEventListener('click', () => { location.hash = t.id; });
    nav.appendChild(b);
    const sec = document.createElement('section');
    sec.className = 'tab';
    sec.id = 'tab-' + t.id;
    host.appendChild(sec);
    state[t.id] = { btn: b, sec, ready: false };
  }

  function show(id) {
    if (!state[id]) id = TABS[0].id;
    if (current === id) return;
    const mod = window.KTabs && window.KTabs[id];
    if (current) {
      const old = window.KTabs[current];
      state[current].btn.classList.remove('active');
      state[current].sec.classList.remove('active');
      if (old && old.deactivate) old.deactivate();
    }
    current = id;
    const s = state[id];
    s.btn.classList.add('active');
    s.sec.classList.add('active');
    if (!s.ready && mod) {
      try { mod.init(s.sec); } catch (e) {
        s.sec.innerHTML = `<p class="note">Fehler beim Aufbau des Reiters: ${e.message}</p>`;
        console.error(e);
      }
      s.ready = true;
    }
    if (mod && mod.activate) mod.activate();
  }

  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1));
})();

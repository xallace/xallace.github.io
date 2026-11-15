/* Tab manager: lazily initializes each tab on first open, tracks the active tab in the URL hash (#reifen …),
   and notifies the previous tab so it can pause animations. */
(function () {
  'use strict';
  const TABS = [
    { id: 'reifen', part: 'I', label: 'Tires' },
    { id: 'fahrleistung', part: 'II', label: 'Performance' },
    { id: 'bremsung', part: 'II', label: 'Braking' },
    { id: 'schwingung', part: 'III', label: 'Vibrations' },
    { id: 'fahrverhalten', part: 'IV', label: 'Handling' },
    { id: 'pruefung', part: '✓', label: 'Verification & Sources' },
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
        s.sec.innerHTML = `<p class="note">Error initializing tab: ${e.message}</p>`;
        console.error(e);
      }
      s.ready = true;
    }
    if (mod && mod.activate) mod.activate();
  }

  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1));
})();

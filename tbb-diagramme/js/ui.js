/* Kleine UI-Hilfen und Register der Reiter */
const UI = (() => {
  'use strict';
  const $ = id => document.getElementById(id);

  // Segmentschalter: Knöpfe mit data-v, genau einer trägt .on
  function setSeg(id, v) {
    for (const b of $(id).querySelectorAll('button')) b.classList.toggle('on', b.dataset.v === String(v));
  }
  function seg(id, onChange) {
    const root = $(id);
    root.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || !root.contains(b)) return;
      setSeg(id, b.dataset.v);
      onChange(b.dataset.v);
    });
  }

  function chk(id, onChange) {
    const c = $(id);
    c.addEventListener('change', () => onChange(c.checked));
    return c;
  }

  function feedback(id, msg, ok) {
    const e = $(id);
    e.innerHTML = msg;
    e.className = 'feedback' + (ok == null ? '' : ok ? ' ok' : ' bad');
  }

  // Zufallswert im Raster step zwischen a und b
  function rnd(a, b, step) {
    const n = Math.round((b - a) / step);
    return +(a + step * Math.floor(Math.random() * (n + 1))).toFixed(10);
  }

  // Formelzeichen und Indizes für HTML: „P1“ → P<sub>1</sub>
  const nameHtml = name => String(name).replace(/^([A-Za-z]+)(\d+)$/, '$1<sub>$2</sub>');

  const onEnter = (id, fn) => $(id).addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });

  const tabs = {};
  const register = (name, mod) => { tabs[name] = mod; };

  return { $, seg, setSeg, chk, feedback, rnd, nameHtml, onEnter, tabs, register };
})();

/* Kleine UI-Hilfen, Formelsatz in HTML und Register der Reiter */
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

  // Schieberegler: Wert setzen, ohne dass der Regler den Zustand beschneidet
  function slider(id, v) { $(id).value = v; }

  // Zufallswert im Raster step zwischen a und b
  function rnd(a, b, step) {
    const n = Math.round((b - a) / step);
    return +(a + step * Math.floor(Math.random() * (n + 1))).toFixed(10);
  }
  const pick = list => list[Math.floor(Math.random() * list.length)];

  // Formelsatz: Bruch mit Zähler über Nenner; attrs z. B. ' data-p="op"' für die Hervorhebung des Bruchstrichs
  const frac = (num, den, attrs = '') => `<span class="frac"${attrs}><span>${num}</span><span>${den}</span></span>`;
  // Zahlenwert und Einheit mit schmalem geschütztem Leerzeichen
  const q = (num, unit) => `${num}&#8239;${unit}`;
  // Zeile eines Rechengangs: linke Seite, Gleichheitszeichen, rechte Seite (fortlaufender Formelsatz)
  const ln = (lhs, rhs) => `<div class="ln"><span class="lhs">${lhs}</span><span>=</span><span class="rhs">${rhs}</span></div>`;

  const onEnter = (id, fn) => $(id).addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });

  const tabs = {};
  const register = (name, mod) => { tabs[name] = mod; };

  return { $, seg, setSeg, chk, feedback, slider, rnd, pick, frac, q, ln, onEnter, tabs, register };
})();

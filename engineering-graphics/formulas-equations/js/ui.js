/* Small UI helpers, HTML math typesetting, and tab module registry */
const UI = (() => {
  'use strict';
  const $ = id => document.getElementById(id);

  // Segmented control: buttons with data-v, exactly one carries .on
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

  // Slider: assign value without clamping state
  function slider(id, v) { $(id).value = v; }

  // Random value on grid step between a and b
  function rnd(a, b, step) {
    const n = Math.round((b - a) / step);
    return +(a + step * Math.floor(Math.random() * (n + 1))).toFixed(10);
  }
  const pick = list => list[Math.floor(Math.random() * list.length)];

  // Math typesetting: fraction with numerator over denominator; attrs e.g. ' data-p="op"' to highlight bar
  const frac = (num, den, attrs = '') => `<span class="frac"${attrs}><span>${num}</span><span>${den}</span></span>`;
  // Numeric value and unit separated by thin non-breaking space
  const q = (num, unit) => `${num}&#8239;${unit}`;
  // One calculation step line: left-hand side, equals sign, right-hand side
  const ln = (lhs, rhs) => `<div class="ln"><span class="lhs">${lhs}</span><span>=</span><span class="rhs">${rhs}</span></div>`;

  const onEnter = (id, fn) => $(id).addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });

  const tabs = {};
  const register = (name, mod) => { tabs[name] = mod; };

  return { $, seg, setSeg, chk, feedback, slider, rnd, pick, frac, q, ln, onEnter, tabs, register };
})();

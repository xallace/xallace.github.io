/* Kleine UI-Hilfen, Schritt-Player und Register der Reiter für Tabellenbuch Metall S. 62 */
const UI = (() => {
  'use strict';
  const $ = id => document.getElementById(id);

  function setSeg(id, v) {
    const root = $(id);
    if (!root) return;
    for (const b of root.querySelectorAll('button')) b.classList.toggle('on', b.dataset.v === String(v));
  }

  function seg(id, onChange) {
    const root = $(id);
    if (!root) return;
    root.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || !root.contains(b)) return;
      setSeg(id, b.dataset.v);
      onChange(b.dataset.v);
    });
  }

  function chk(id, onChange) {
    const c = $(id);
    if (!c) return null;
    c.addEventListener('change', () => onChange(c.checked));
    return c;
  }

  function feedback(id, msg, ok) {
    const e = $(id);
    if (!e) return;
    e.innerHTML = msg;
    e.className = 'feedback' + (ok == null ? '' : ok ? ' ok' : ' bad');
  }

  const onEnter = (id, fn) => {
    const el = $(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
  };

  // Gemeinsame Steuerung für die schrittweise Konstruktion (0..maxStep) inkl. Animation und Schrittliste
  function bindStepPlayer(prefix, maxStep, stepsList, st, renderFn) {
    let timer = null;
    const segId = `${prefix}-step`;
    const playBtn = $(`${prefix}-play`);
    const rulesEl = $(`${prefix}-steps`);

    function stopTimer() {
      if (timer) { clearInterval(timer); timer = null; }
      if (playBtn) playBtn.textContent = '▶ Animation';
    }

    function updateStepUI() {
      setSeg(segId, st.step);
      if (!rulesEl) return;
      rulesEl.innerHTML = stepsList.map(([num, title, desc]) => {
        const done = st.step >= num;
        const active = st.pinStep === num || st.hoverStep === num || (st.step === num && st.step < maxStep);
        return `<li class="hover-able${active ? ' active' : ''}${done ? ' step-done' : ' step-pending'}" data-step="${num}">`
          + `<span class="step-badge">${num}</span><div><b>${title}:</b> ${desc}</div></li>`;
      }).join('');
    }

    seg(segId, v => {
      stopTimer();
      st.step = +v;
      updateStepUI();
      renderFn();
    });

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (timer) { stopTimer(); return; }
        st.step = 0;
        updateStepUI();
        renderFn();
        playBtn.textContent = '⏸ Stopp';
        timer = setInterval(() => {
          if (st.step < maxStep) {
            st.step++;
            updateStepUI();
            renderFn();
          } else {
            stopTimer();
          }
        }, 1100);
      });
    }

    if (rulesEl) {
      rulesEl.addEventListener('mouseover', e => {
        const li = e.target.closest('li[data-step]');
        const s = li ? +li.dataset.step : null;
        if (s !== st.hoverStep) { st.hoverStep = s; renderFn(); }
      });
      rulesEl.addEventListener('mouseleave', () => {
        if (st.hoverStep !== null) { st.hoverStep = null; renderFn(); }
      });
      rulesEl.addEventListener('click', e => {
        const li = e.target.closest('li[data-step]');
        if (!li) return;
        const s = +li.dataset.step;
        st.pinStep = st.pinStep === s ? null : s;
        updateStepUI();
        renderFn();
      });
    }

    return { stopTimer, updateStepUI };
  }

  const tabs = {};

  return { $, setSeg, seg, chk, feedback, onEnter, bindStepPlayer, tabs };
})();

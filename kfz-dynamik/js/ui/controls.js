/* Bedienelemente: Parameterpanel (Regler + Zahlenfeld), Vorlagen, Kennwert-Kacheln, Formeln (KaTeX). */
(function (root) {
  'use strict';
  const fmt = root.KFmt;

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  // ruft fn höchstens einmal pro Animationsframe auf
  function scheduler(fn) {
    let pending = false;
    return () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; fn(); });
    };
  }

  const roundTo = (v, step) => {
    const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
    return Number((Math.round(v / step) * step).toFixed(d));
  };

  /* defs: Liste aus { group } oder { key, label, unit, min, max, step, scale, type, options, hint, log }.
     scale rechnet den gespeicherten SI-Wert in die Anzeige um (Anzeige = Wert · scale). */
  function paramPanel(container, defs, values, onChange) {
    const rows = {};
    let groupEl = container;
    for (const d of defs) {
      if (d.group) {
        groupEl = el('fieldset', 'pgroup');
        groupEl.appendChild(el('legend', '', d.group));
        container.appendChild(groupEl);
        continue;
      }
      const scale = d.scale || 1;
      const row = el('div', 'prow' + (d.type === 'select' ? ' prow-select' : ''));
      const lab = el('label', 'plabel', `${d.label}${d.unit ? ` <span class="unit">[${d.unit}]</span>` : ''}`);
      if (d.hint) lab.title = d.hint;
      row.appendChild(lab);
      if (d.type === 'select') {
        const sel = el('select', 'pselect');
        for (const [v, t] of d.options) {
          const o = el('option', '', t); o.value = v; sel.appendChild(o);
        }
        sel.value = String(values[d.key]);
        sel.addEventListener('change', () => {
          const v = typeof values[d.key] === 'number' ? Number(sel.value) : sel.value;
          values[d.key] = v; onChange(d.key, v);
        });
        row.appendChild(sel);
        rows[d.key] = { set: (v) => { sel.value = String(v); } };
      } else {
        const num = el('input', 'pnum'); num.type = 'number'; num.step = d.step; num.min = d.min; num.max = d.max;
        const rng = el('input', 'prange'); rng.type = 'range';
        // logarithmische Regler für Größen über mehrere Dekaden
        const toR = d.log ? (v) => Math.log10(v) : (v) => v;
        const fromR = d.log ? (r) => Math.pow(10, r) : (r) => r;
        rng.min = toR(d.min); rng.max = toR(d.max); rng.step = d.log ? (toR(d.max) - toR(d.min)) / 400 : d.step;
        const show = (si) => {
          const disp = si * scale;
          num.value = roundTo(disp, d.step);
          rng.value = toR(disp);
        };
        show(values[d.key]);
        const commit = (disp) => {
          if (!isFinite(disp)) return;
          values[d.key] = disp / scale;
          onChange(d.key, values[d.key]);
        };
        rng.addEventListener('input', () => {
          const disp = roundTo(fromR(Number(rng.value)), d.step);
          num.value = disp; commit(disp);
        });
        num.addEventListener('change', () => {
          let disp = Number(String(num.value).replace(',', '.'));
          if (!isFinite(disp)) return;
          rng.value = toR(Math.min(d.max, Math.max(d.min, disp)));
          commit(disp);
        });
        const ctl = el('div', 'pctl');
        ctl.appendChild(rng); ctl.appendChild(num);
        row.appendChild(ctl);
        rows[d.key] = { set: show };
      }
      groupEl.appendChild(row);
    }
    return {
      refresh() { for (const k in rows) if (k in values) rows[k].set(values[k]); },
    };
  }

  // Vorlagen als Knopfleiste
  function presets(container, list, onPick) {
    const wrap = el('div', 'presets');
    const btns = [];
    list.forEach((p, i) => {
      const b = el('button', 'preset', p.name);
      b.type = 'button';
      if (p.title) b.title = p.title;
      b.addEventListener('click', () => {
        btns.forEach((x) => x.classList.remove('on')); b.classList.add('on');
        onPick(p, i);
      });
      btns.push(b); wrap.appendChild(b);
    });
    container.appendChild(wrap);
    return { mark(i) { btns.forEach((x, j) => x.classList.toggle('on', i === j)); }, clear() { btns.forEach((x) => x.classList.remove('on')); } };
  }

  /* Kennwerte: items = [{ label, value, unit, digits, sub, state: 'ok'|'warn'|'bad', ref }] */
  function kpis(container, items) {
    container.innerHTML = '';
    for (const it of items) {
      const t = el('div', 'kpi' + (it.state ? ' ' + it.state : ''));
      const v = typeof it.value === 'number' ? fmt(it.value, it.digits) : it.value;
      t.innerHTML = `<div class="kpi-label">${it.label}</div>
        <div class="kpi-value">${v}${it.unit ? `<span class="kpi-unit">${it.unit}</span>` : ''}</div>
        ${it.sub ? `<div class="kpi-sub">${it.sub}</div>` : ''}`;
      if (it.ref) t.title = it.ref;
      container.appendChild(t);
    }
  }

  function tex(target, latex, display = true) {
    if (root.katex) {
      try { root.katex.render(latex, target, { displayMode: display, throwOnError: false, strict: false }); return; } catch (e) { /* Fallback unten */ }
    }
    target.textContent = latex;
  }

  /* Formelliste: items = [{ tex, ref, note }] */
  function formulas(container, items) {
    container.innerHTML = '';
    for (const it of items) {
      const row = el('div', 'frow');
      const f = el('div', 'fmath'); tex(f, it.tex, true);
      row.appendChild(f);
      const r = el('div', 'fref', `${it.ref || ''}${it.note ? `<span class="fnote">${it.note}</span>` : ''}`);
      row.appendChild(r);
      container.appendChild(row);
    }
  }

  // Karte mit Titel, Diagramm-Container und Bildunterschrift
  function card(parent, title, caption, cls = '') {
    const c = el('section', 'card ' + cls);
    if (title) c.appendChild(el('h3', 'card-title', title));
    const body = el('div', 'card-body');
    c.appendChild(body);
    if (caption) c.appendChild(el('p', 'caption', caption));
    parent.appendChild(c);
    return body;
  }

  // wie scheduler, aber erst nach einer Ruhepause (für teure Rechnungen)
  function debounce(fn, ms) {
    let id = 0;
    return () => { clearTimeout(id); id = setTimeout(fn, ms); };
  }

  // Umschalter: options = [[wert, text], ...]
  function seg(container, options, value, onChange) {
    const wrap = el('div', 'seg');
    const btns = options.map(([v, t]) => {
      const b = el('button', v === value ? 'on' : '', t);
      b.type = 'button';
      b.addEventListener('click', () => {
        btns.forEach((x) => x.classList.toggle('on', x === b));
        onChange(v);
      });
      wrap.appendChild(b);
      return b;
    });
    container.appendChild(wrap);
    return wrap;
  }

  /* Grundgerüst eines Reiters: Kopf, links Parameter, rechts Kennwerte, Karten, Formeln */
  function tabLayout(section, { title, intro, src }) {
    section.innerHTML = '';
    const head = el('div', 'tab-head');
    head.appendChild(el('h2', '', title));
    if (intro) head.appendChild(el('p', '', intro));
    if (src) head.appendChild(el('p', 'src', src));
    section.appendChild(head);
    const grid = el('div', 'tab-grid');
    const aside = el('aside', 'params');
    const main = el('div', 'main');
    grid.appendChild(aside); grid.appendChild(main);
    section.appendChild(grid);
    const kpiEl = el('div', 'kpis'); main.appendChild(kpiEl);
    const cards = el('div', 'cards'); main.appendChild(cards);
    const det = el('details', 'formulas');
    det.appendChild(el('summary', '', 'Formeln und Quellen'));
    const fbody = el('div', ''); det.appendChild(fbody);
    main.appendChild(det);
    return { aside, main, kpis: kpiEl, cards, formulas: fbody };
  }

  // Serienfarben, gleiche Reihenfolge wie --c1 … --c7
  const COL = ['#38bdf8', '#f59e0b', '#34d399', '#f472b6', '#a78bfa', '#f87171', '#e2e8f0'];

  root.UI = { el, scheduler, debounce, seg, tabLayout, COL, paramPanel, presets, kpis, tex, formulas, card };
})(window);

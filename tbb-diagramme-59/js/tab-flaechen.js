/* Tab 4: Area Charts –
   Column / horizontal bar chart (Revenue 2013–2016) and pie charts with central angle α = 360° · x % / 100 % */
(() => {
  'use strict';
  const { $, seg, setSeg, feedback } = UI;
  const { fmt, polarToScreen, screenToPolar, pctToAngle, angleToPct, parseAlloy } = Core;
  const el = SVG.el;

  // Sector colors as in the book (yellow-beige, blue, orange-red, green)
  const SECTOR_CLS = ['sec-yellow', 'sec-blue', 'sec-orange', 'sec-green', 'sec-purple'];

  const PIE_PRESETS = {
    alloy: () => ({
      title: 'Alloy CuZn36Pb3 (Book Example)',
      sel: 0, // Pb (3 %) or Zn (36 %)
      items: [
        { label: 'Pb', pct: 3, cls: 'sec-orange' },
        { label: 'Zn', pct: 36, cls: 'sec-blue' },
        { label: 'Cu', pct: 61, cls: 'sec-yellow' }
      ]
    }),
    pct: () => ({
      title: 'Pie chart percentage shares (Book Figure)',
      sel: 3, // 25 % sector with α = 90°
      items: [
        { label: '5 %', pct: 5, cls: 'sec-orange' },
        { label: '5 %', pct: 5, cls: 'sec-green' },
        { label: '65 %', pct: 65, cls: 'sec-yellow' },
        { label: '25 %', pct: 25, cls: 'sec-blue' }
      ]
    }),
    cusn8: () => ({
      title: 'Tin bronze CuSn8',
      sel: 0,
      items: [
        { label: 'Sn', pct: 8, cls: 'sec-orange' },
        { label: 'Cu', pct: 92, cls: 'sec-yellow' }
      ]
    }),
    cuni: () => ({
      title: 'Nickel silver CuNi18Zn20',
      sel: 0,
      items: [
        { label: 'Ni', pct: 18, cls: 'sec-green' },
        { label: 'Zn', pct: 20, cls: 'sec-blue' },
        { label: 'Cu', pct: 62, cls: 'sec-yellow' }
      ]
    })
  };

  // Digitized from the figure on p. 59 (± 0.05 €M)
  const BAR_BOOK = () => [
    { year: '2013', val: 3.4 },
    { year: '2014', val: 2.7 },
    { year: '2015', val: 2.2 },
    { year: '2016', val: 3.7 }
  ];

  const st = {
    preset: 'alloy',
    pie: PIE_PRESETS.alloy(),
    bars: BAR_BOOK(),
    barOrient: 'col',     // 'col' = vertical columns, 'bar' = horizontal bars
    barWidth: 0.52,
    quiz: null,
    score: [0, 0]
  };

  const svgPie = $('c-pie-svg');
  const svgBar = $('c-bar-svg');

  // ================================================================ 1. Pie chart
  function renderPie() {
    const W = 560, H = 400, CX = 250, CY = 200, R = 136;
    SVG.clear(svgPie);
    el(svgPie, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const items = st.pie.items;
    const sum = items.reduce((a, b) => a + b.pct, 0) || 100;
    let deg0 = 0;
    const sectors = items.map((it, i) => {
      const span = pctToAngle(it.pct * 100 / sum);
      const s = { i, label: it.label, pct: it.pct, span, deg0, deg1: deg0 + span, cls: it.cls || SECTOR_CLS[i % SECTOR_CLS.length] };
      deg0 += span;
      return s;
    });

    // Draw pie sectors
    for (const s of sectors) {
      const isSel = s.i === st.pie.sel;
      const mid = (s.deg0 + s.deg1) / 2;
      // Slightly explode selected sector
      const [ox, oy] = isSel && sectors.length > 1 ? polarToScreen(0, 0, 5, mid) : [0, 0];
      const p = el(svgPie, 'path', {
        d: SVG.sectorPath(CX + ox, CY + oy, R, s.deg0, s.deg1),
        class: `pie-sec ${s.cls}${isSel ? ' sel' : ''}`,
        'data-i': s.i
      });
      p.style.cursor = 'pointer';
    }

    // Central angle α inside selected sector
    const selSec = sectors[st.pie.sel] || sectors[0];
    if (selSec && selSec.span > 2) {
      const [ox, oy] = sectors.length > 1 ? polarToScreen(0, 0, 5, (selSec.deg0 + selSec.deg1) / 2) : [0, 0];
      const arcR = selSec.span < 25 ? R * 0.62 : R * 0.42;
      SVG.angleArc(svgPie, CX + ox, CY + oy, arcR, selSec.deg0, selSec.deg1, {
        w: 1.3, l: 9, b: 3.2, bothHeads: selSec.span >= 28
      });
      const mid = (selSec.deg0 + selSec.deg1) / 2;
      const [ax, ay] = polarToScreen(CX + ox, CY + oy, arcR + (selSec.span < 22 ? 18 : -16), mid);
      SVG.text(svgPie, ax, ay + 5, '*α*', { 'text-anchor': 'middle', 'font-size': 16, class: 'halo lbl-strong' });
    }

    // Sector labels (large sectors inside, narrow ones outside with callout line as in the book)
    for (const s of sectors) {
      const isSel = s.i === st.pie.sel;
      const mid = (s.deg0 + s.deg1) / 2;
      const [ox, oy] = isSel && sectors.length > 1 ? polarToScreen(0, 0, 5, mid) : [0, 0];
      const txt = st.preset === 'pct' ? `${fmt(s.pct, 1)} %` : `${s.label} (${fmt(s.pct, 1)} %)`;
      if (s.span >= 38) {
        const [tx, ty] = polarToScreen(CX + ox, CY + oy, R * 0.68, mid);
        SVG.text(svgPie, tx, ty + 5, txt, { 'text-anchor': 'middle', 'font-size': 14.5, class: 'halo' + (isSel ? ' sel-text' : '') });
      } else {
        const [x1, y1] = polarToScreen(CX + ox, CY + oy, R * 0.82, mid);
        const [x2, y2] = polarToScreen(CX + ox, CY + oy, R + 24, mid);
        el(svgPie, 'line', { x1, y1, x2, y2, class: 'callout' });
        el(svgPie, 'circle', { cx: x1, cy: y1, r: 2.3, class: 'ax-head' });
        const right = Math.cos(mid * Math.PI / 180) >= 0;
        SVG.text(svgPie, x2 + (right ? 6 : -6), y2 + 5, txt, {
          'text-anchor': right ? 'start' : 'end', 'font-size': 14.5,
          class: 'halo' + (isSel ? ' sel-text' : '')
        });
      }
    }

    // Drag handles on sector boundaries (for interactively adjusting shares)
    if (sectors.length >= 2) {
      for (let i = 0; i < sectors.length - 1; i++) {
        const deg = sectors[i].deg1;
        const [hx, hy] = polarToScreen(CX, CY, R, deg);
        el(svgPie, 'circle', { cx: hx, cy: hy, r: 4.5, class: 'pt' });
        el(svgPie, 'circle', { cx: hx, cy: hy, r: 13, class: 'pt-hit', 'data-edge': i });
      }
    }

    updatePieSide(selSec, sum);
  }

  function updatePieSide(selSec, sum) {
    if (!selSec) return;
    const alpha = pctToAngle(selSec.pct);
    $('c-formula-box').innerHTML =
      `<div class="formula-line"><i>α</i> = <span class="frac"><span>360° · <i>x</i> %</span><span>100 %</span></span>`
      + ` = <span class="frac"><span>360° · ${fmt(selSec.pct, 1)} %</span><span>100 %</span></span>`
      + ` = <b>${fmt(alpha, 1)}°</b></div>`;
    $('c-sum-msg').innerHTML = Math.abs(sum - 100) < 0.05
      ? `Sum: <b>100 % ≙ 360°</b> (1 % ≙ 3.6°)`
      : `<span class="bad-txt">Current sum ${fmt(sum, 1)} % – for a pie chart, the total must equal 100 % (≙ 360°).</span>`;
  }

  function renderPieTable() {
    $('c-pie-table').innerHTML = '<tr><th>Constituent</th><th>Share <i>x</i> in %</th><th>Angle <i>α</i> in °</th></tr>'
      + st.pie.items.map((it, i) => {
        const a = pctToAngle(it.pct);
        return `<tr class="${i === st.pie.sel ? 'cur-row' : ''}" data-row="${i}">`
          + `<td><input data-k="label" data-i="${i}" value="${it.label}" aria-label="Label ${i + 1}"></td>`
          + `<td><input data-k="pct" data-i="${i}" value="${fmt(it.pct, 1)}" inputmode="decimal" aria-label="Percentage share ${i + 1}"></td>`
          + `<td><input data-k="deg" data-i="${i}" value="${fmt(a, 1)}" inputmode="decimal" aria-label="Central angle ${i + 1}"></td>`
          + `</tr>`;
      }).join('');
  }

  svgPie.addEventListener('pointerdown', e => {
    const W = 560, CX = 250, CY = 200;
    const edgeHit = e.target.closest && e.target.closest('[data-edge]');
    if (edgeHit) {
      const idx = +edgeHit.getAttribute('data-edge');
      const items = st.pie.items;
      const pairSum = items[idx].pct + items[idx + 1].pct;
      const startDeg = items.slice(0, idx).reduce((a, b) => a + pctToAngle(b.pct), 0);
      SVG.startDrag(svgPie, e, p => {
        const pol = screenToPolar(CX, CY, p.x, p.y, 1);
        let span = ((pol.deg - startDeg) % 360 + 360) % 360;
        let p1 = Math.round(angleToPct(span) * 2) / 2;
        p1 = Math.max(1, Math.min(pairSum - 1, p1));
        items[idx].pct = p1;
        items[idx + 1].pct = +(pairSum - p1).toFixed(2);
        st.pie.sel = idx;
        renderPieTable();
        renderPie();
      });
      return;
    }
    const secHit = e.target.closest && e.target.closest('[data-i]');
    if (secHit) {
      st.pie.sel = +secHit.getAttribute('data-i');
      renderPieTable();
      renderPie();
    }
  });

  $('c-pie-table').addEventListener('click', e => {
    const tr = e.target.closest('tr[data-row]');
    if (tr && +tr.dataset.row !== st.pie.sel) {
      st.pie.sel = +tr.dataset.row;
      renderPieTable();
      renderPie();
    }
  });

  $('c-pie-table').addEventListener('change', e => {
    const inp = e.target, k = inp.dataset.k, i = +inp.dataset.i;
    if (k === 'label') {
      st.pie.items[i].label = inp.value.trim() || `Part ${i + 1}`;
    } else if (k === 'pct') {
      const v = Core.parseNum(inp.value);
      if (isFinite(v) && v > 0 && v <= 100) st.pie.items[i].pct = +v.toFixed(2);
    } else if (k === 'deg') {
      const d = Core.parseNum(inp.value);
      if (isFinite(d) && d > 0 && d <= 360) st.pie.items[i].pct = +angleToPct(d).toFixed(2);
    }
    st.pie.sel = i;
    renderPieTable();
    renderPie();
  });

  $('c-norm-btn').addEventListener('click', () => {
    const sum = st.pie.items.reduce((a, b) => a + b.pct, 0) || 1;
    let acc = 0;
    st.pie.items.forEach((it, i) => {
      if (i < st.pie.items.length - 1) {
        it.pct = +(it.pct * 100 / sum).toFixed(1);
        acc += it.pct;
      } else {
        it.pct = +(100 - acc).toFixed(1);
      }
    });
    renderPieTable();
    renderPie();
  });

  // ================================================================ 2. Column / Horizontal Bar Chart
  function renderBar() {
    const W = 560, H = 310;
    SVG.clear(svgBar);
    SVG.background(svgBar, W, H);

    const n = st.bars.length;
    const yMax = 4.5;
    if (st.barOrient === 'col') {
      // Vertical columns (as in the lower-left figure in the book)
      const PX0 = 96, PX1 = 520, PY0 = 256, PY1 = 26;
      const Y = Core.linScale(0, yMax, PY0, PY1);
      const slot = (PX1 - PX0) / n;
      const bw = slot * st.barWidth;

      el(svgBar, 'line', { x1: PX0, y1: PY0, x2: PX1 + 10, y2: PY0, class: 'ax', 'stroke-width': 1.4 });
      el(svgBar, 'line', { x1: PX0, y1: PY0, x2: PX0, y2: PY1 - 6, class: 'ax', 'stroke-width': 1.4 });

      for (const v of [1, 2, 3, 4]) {
        el(svgBar, 'line', { x1: PX0 - 5, y1: Y(v), x2: PX0 + 5, y2: Y(v), class: 'tick', 'stroke-width': 1.1 });
        SVG.text(svgBar, PX0 - 10, Y(v) + 5, String(v), { 'text-anchor': 'end', 'font-size': 14 });
      }
      // Label "Revenue in €M" with upward arrow as in the book
      const ym = (PY0 + PY1) / 2;
      SVG.text(svgBar, 26, ym + 44, 'Revenue in', { 'text-anchor': 'middle', 'font-size': 14, transform: `rotate(-90 26 ${ym + 44})` });
      SVG.text(svgBar, 44, ym + 44, '€M', { 'text-anchor': 'middle', 'font-size': 14, transform: `rotate(-90 44 ${ym + 44})` });
      SVG.arrow(svgBar, 34, ym - 4, 34, ym - 66, { w: 1.2, l: 10, b: 3.5 });

      st.bars.forEach((b, i) => {
        const cx = PX0 + (i + 0.5) * slot;
        const x = cx - bw / 2, y = Y(b.val), h = PY0 - y;
        el(svgBar, 'rect', { x, y, width: bw, height: h, class: 'bar-rect' });
        SVG.text(svgBar, cx, y - 7, fmt(b.val, 1), { 'text-anchor': 'middle', 'font-size': 13, class: 'halo lbl-strong' });
        SVG.text(svgBar, cx, PY0 + 22, b.year, { 'text-anchor': 'middle', 'font-size': 14 });
        el(svgBar, 'rect', { x: x - 6, y: PY1, width: bw + 12, height: PY0 - PY1, class: 'pt-hit', 'data-bar': i });
      });
    } else {
      // Horizontal bars (per book text)
      const PX0 = 96, PX1 = 510, PY0 = 252, PY1 = 26;
      const X = Core.linScale(0, yMax, PX0, PX1);
      const slot = (PY0 - PY1) / n;
      const bh = slot * st.barWidth;

      el(svgBar, 'line', { x1: PX0, y1: PY0, x2: PX1 + 10, y2: PY0, class: 'ax', 'stroke-width': 1.4 });
      el(svgBar, 'line', { x1: PX0, y1: PY0, x2: PX0, y2: PY1 - 6, class: 'ax', 'stroke-width': 1.4 });

      for (const v of [1, 2, 3, 4]) {
        el(svgBar, 'line', { x1: X(v), y1: PY0 - 5, x2: X(v), y2: PY0 + 5, class: 'tick', 'stroke-width': 1.1 });
        SVG.text(svgBar, X(v), PY0 + 21, String(v), { 'text-anchor': 'middle', 'font-size': 14 });
      }
      const xm = (PX0 + PX1) / 2;
      SVG.text(svgBar, xm + 18, PY0 + 48, 'Revenue in €M', { 'text-anchor': 'end', 'font-size': 14 });
      SVG.arrow(svgBar, xm + 28, PY0 + 43, xm + 84, PY0 + 43, { w: 1.2, l: 10, b: 3.5 });

      st.bars.forEach((b, i) => {
        const cy = PY1 + (i + 0.5) * slot;
        const y = cy - bh / 2, w = X(b.val) - PX0;
        el(svgBar, 'rect', { x: PX0, y, width: w, height: bh, class: 'bar-rect' });
        SVG.text(svgBar, PX0 + w + 8, cy + 5, fmt(b.val, 1) + ' €M', { 'font-size': 13, class: 'halo lbl-strong' });
        SVG.text(svgBar, PX0 - 10, cy + 5, b.year, { 'text-anchor': 'end', 'font-size': 14 });
        el(svgBar, 'rect', { x: PX0, y: y - 6, width: PX1 - PX0, height: bh + 12, class: 'pt-hit', 'data-bar': i });
      });
    }

    const vals = st.bars.map(b => b.val);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const minB = st.bars.reduce((a, b) => (b.val < a.val ? b : a), st.bars[0]);
    const maxB = st.bars.reduce((a, b) => (b.val > a.val ? b : a), st.bars[0]);
    $('c-bar-summary').innerHTML =
      `All ${st.barOrient === 'col' ? 'vertical columns' : 'horizontal bars'} have <b>equal width</b>; only the ${st.barOrient === 'col' ? 'height' : 'length'} represents the value. `
      + `Mean: <b>${fmt(avg, 2)} €M</b> (Minimum ${minB.year}: ${fmt(minB.val, 1)} €M, Maximum ${maxB.year}: ${fmt(maxB.val, 1)} €M).`;
  }

  svgBar.addEventListener('pointerdown', e => {
    const hit = e.target.closest && e.target.closest('[data-bar]');
    if (!hit) return;
    const i = +hit.getAttribute('data-bar');
    const move = p => {
      if (st.barOrient === 'col') {
        const Y = Core.linScale(0, 4.5, 256, 26);
        st.bars[i].val = Math.round(Math.min(4.3, Math.max(0.2, Y.inv(p.y))) * 10) / 10;
      } else {
        const X = Core.linScale(0, 4.5, 96, 510);
        st.bars[i].val = Math.round(Math.min(4.3, Math.max(0.2, X.inv(p.x))) * 10) / 10;
      }
      renderBar();
    };
    move(SVG.toLocal(svgBar, e));
    SVG.startDrag(svgBar, e, move);
  });

  // ================================================================ 3. Practice: central angle & percentages
  const ALLOY_TASKS = [
    { code: 'CuZn36Pb3', elem: 'lead content (Pb)', pct: 3 },
    { code: 'CuZn36Pb3', elem: 'zinc content (Zn)', pct: 36 },
    { code: 'CuZn36Pb3', elem: 'copper content (Cu)', pct: 61 },
    { code: 'CuZn40Pb2', elem: 'lead content (Pb)', pct: 2 },
    { code: 'CuZn40Pb2', elem: 'zinc content (Zn)', pct: 40 },
    { code: 'CuSn8', elem: 'tin content (Sn)', pct: 8 },
    { code: 'CuNi18Zn20', elem: 'nickel content (Ni)', pct: 18 }
  ];

  function newQuiz() {
    const types = ['alloy', 'pctToDeg', 'degToPct'];
    const kind = types[Math.floor(Math.random() * types.length)];
    let truth, tol = 0.2, unit = '°', text = '', explain = '';
    if (kind === 'alloy') {
      const a = ALLOY_TASKS[Math.floor(Math.random() * ALLOY_TASKS.length)];
      truth = pctToAngle(a.pct);
      text = `How large is the central angle <i>α</i> for the <b>${a.elem}</b> of alloy <b>${a.code}</b> (${a.pct} %)?`;
      explain = `<i>α</i> = 360° · ${a.pct} % / 100 % = ${fmt(truth, 1)}°`;
    } else if (kind === 'pctToDeg') {
      const pct = UI.rnd(5, 85, 2.5);
      truth = pctToAngle(pct);
      text = `A constituent has a share of <b><i>x</i> = ${fmt(pct, 1)} %</b>. What is the corresponding central angle <b><i>α</i></b> in the pie chart?`;
      explain = `<i>α</i> = 360° · ${fmt(pct, 1)} % / 100 % = ${fmt(truth, 1)}°`;
    } else {
      const pct = UI.rnd(5, 75, 5);
      const deg = pctToAngle(pct);
      truth = pct;
      unit = '%';
      text = `A pie sector has a central angle of <b><i>α</i> = ${fmt(deg, 1)}°</b>. What percentage share <b><i>x</i></b> does that represent?`;
      explain = `<i>x</i> = ${fmt(deg, 1)}° · 100 % / 360° = ${fmt(truth, 1)} %`;
    }
    st.quiz = { kind, truth, tol, unit, explain, done: false };
    $('c-task').innerHTML = text;
    $('c-ans-unit').textContent = unit;
    $('c-ans').value = '';
    $('c-ans-row').hidden = false;
    $('c-quiz-end').hidden = false;
    feedback('c-feedback', '');
    $('c-ans').focus();
  }

  function checkQuiz() {
    const q = st.quiz;
    if (!q || q.done) return;
    const a = Core.parseNum($('c-ans').value);
    if (!isFinite(a)) { feedback('c-feedback', 'Please enter a number.', false); return; }
    const ok = Math.abs(a - q.truth) <= q.tol + 1e-9;
    q.done = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    $('c-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
    feedback('c-feedback', `${ok ? 'Correct' : 'Off target'}: ${q.explain} (entered: ${fmt(a, 1)} ${q.unit}).`, ok);
    $('c-ans-row').hidden = true;
  }

  function endQuiz() {
    st.quiz = null;
    $('c-task').textContent = '';
    $('c-ans-row').hidden = true;
    $('c-quiz-end').hidden = true;
    feedback('c-feedback', '');
  }

  seg('c-preset', v => {
    st.preset = v;
    st.pie = PIE_PRESETS[v]();
    renderPieTable();
    renderPie();
  });
  seg('c-orient', v => { st.barOrient = v; renderBar(); });
  $('c-quiz').addEventListener('click', newQuiz);
  $('c-quiz-end').addEventListener('click', endQuiz);
  $('c-check').addEventListener('click', checkQuiz);
  UI.onEnter('c-ans', checkQuiz);

  function render() {
    renderPieTable();
    renderPie();
    renderBar();
  }

  function reset() {
    st.preset = 'alloy';
    st.pie = PIE_PRESETS.alloy();
    st.bars = BAR_BOOK();
    st.barOrient = 'col';
    setSeg('c-preset', 'alloy');
    setSeg('c-orient', 'col');
    endQuiz();
    render();
  }

  UI.register('flaechen', { render, reset, state: st, newQuiz });
  render();
})();

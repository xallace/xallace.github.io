/* Tab 3: Linear function y = m · x + b – line with slope triangle, draggable points, value table, reading exercise */
(() => {
  'use strict';
  const { $, chk, feedback } = UI;
  const { fmt } = Core;
  const el = SVG.el;

  // Equal scale on both axes: 60 px per unit, x from −3 to 5, y from −2 to 4
  const W = 640, H = 460, U = 60, X0 = 260, Y0 = 290, XMIN = -3, XMAX = 5, YMIN = -2, YMAX = 4;
  const X = v => X0 + v * U, Y = v => Y0 - v * U;
  const DEFAULT_STATE = () => ({ m: 0.75, b: 0.5, xs: [-2, 0, 2, 4] });
  const st = Object.assign(DEFAULT_STATE(), { tri: true, pts: true, grid: false, quiz: null, score: [0, 0] });
  const svg = $('l-svg');
  const snap = v => Math.round(v * 10) / 10;
  const isDefault = () => st.m === 0.75 && st.b === 0.5 && st.xs.join() === '-2,0,2,4';
  const eqText = (m, b) => {
    const mt = m === 1 ? '' : m === -1 ? '−' : fmt(m, 2) + ' · ';
    const bt = b === 0 ? '' : (b > 0 ? ' + ' : ' − ') + fmt(Math.abs(b), 2);
    return m === 0 ? `<i>y</i> = ${fmt(b, 2)}` : `<i>y</i> = ${mt}<i>x</i>${bt}`;
  };

  // Line y = m·x + b clipped to plot bounds
  function clipLine(m, b) {
    const out = [];
    const add = (x, y) => { if (x >= XMIN - 1e-9 && x <= XMAX + 1e-9 && y >= YMIN - 1e-9 && y <= YMAX + 1e-9) out.push([x, y]); };
    add(XMIN, m * XMIN + b); add(XMAX, m * XMAX + b);
    if (Math.abs(m) > 1e-12) { add((YMIN - b) / m, YMIN); add((YMAX - b) / m, YMAX); }
    out.sort((p, q) => p[0] - q[0]);
    return out.length >= 2 ? [out[0], out[out.length - 1]] : null;
  }

  function render() {
    SVG.clear(svg);
    SVG.background(svg, W, H);
    const xr = Core.ticks(XMIN, XMAX, 1), yr = Core.ticks(YMIN, YMAX, 1);
    if (st.grid || st.quiz) {
      const g = el(svg, 'g', { class: 'grid', 'stroke-width': 0.5, opacity: 0.4 });
      Core.ticks(XMIN, XMAX, 0.5).forEach(v => el(g, 'line', { x1: X(v), y1: Y(YMIN), x2: X(v), y2: Y(YMAX) }));
      Core.ticks(YMIN, YMAX, 0.5).forEach(v => el(g, 'line', { x1: X(XMIN), y1: Y(v), x2: X(XMAX), y2: Y(v) }));
    }
    // Axes through the origin with arrowheads
    SVG.arrow(svg, X(XMIN) - 10, Y0, X(XMAX) + 24, Y0, { w: 1.3 });
    SVG.arrow(svg, X0, Y(YMIN) + 10, X0, Y(YMAX) - 24, { w: 1.3 });
    SVG.text(svg, X(XMAX) + 22, Y0 + 24, '*x*', { 'font-size': 17, 'text-anchor': 'middle' });
    SVG.text(svg, X0 - 16, Y(YMAX) - 14, '*y*', { 'font-size': 17, 'text-anchor': 'middle' });
    xr.forEach(v => {
      if (!v) return;
      el(svg, 'line', { x1: X(v), y1: Y0 - 5, x2: X(v), y2: Y0 + 5, class: 'tick' });
      SVG.text(svg, X(v), Y0 + 22, fmt(v, 0), { 'text-anchor': 'middle', 'font-size': 14, class: 'halo' });
    });
    yr.forEach(v => {
      if (!v) return;
      el(svg, 'line', { x1: X0 - 5, y1: Y(v), x2: X0 + 5, y2: Y(v), class: 'tick' });
      SVG.text(svg, X0 - 10, Y(v) + 5, fmt(v, 0), { 'text-anchor': 'end', 'font-size': 14, class: 'halo' });
    });
    SVG.text(svg, X0 - 8, Y0 + 20, '0', { 'text-anchor': 'end', 'font-size': 14 });

    // Exercise target line
    if (st.quiz) {
      const s = clipLine(st.quiz.m, st.quiz.b);
      if (s) el(svg, 'line', { x1: X(s[0][0]), y1: Y(s[0][1]), x2: X(s[1][0]), y2: Y(s[1][1]), class: 'target' });
      if (!st.quiz.done) { updateSide(); return; }
    }

    const seg = clipLine(st.m, st.b);
    // Occupied label boxes [x0, y0, x1, y1]: axis ticks and axis labels, then each placed annotation
    const taken = [[X(XMIN) - 12, Y0 + 6, X(XMAX) + 32, Y0 + 28], [X0 - 32, Y(YMAX) - 34, X0 - 6, Y(YMIN) + 8]];
    if (seg) el(svg, 'line', { x1: X(seg[0][0]), y1: Y(seg[0][1]), x2: X(seg[1][0]), y2: Y(seg[1][1]), class: 'line-f', 'stroke-width': 3.2 });

    // Slope triangle between B(0 | b) and P(1 | b + m)
    const yb = st.b, yp = st.b + st.m;
    if (st.tri && yb >= YMIN && yb <= YMAX) {
      el(svg, 'line', { x1: X(0), y1: Y(yb), x2: X(1), y2: Y(yb), class: 'read' });
      if (yp >= YMIN && yp <= YMAX && Math.abs(st.m) > 1e-9) {
        el(svg, 'line', { x1: X(1), y1: Y(yb), x2: X(1), y2: Y(yp), class: 'read' });
        SVG.arrowHead(svg, X(1), Y(yp), st.m > 0 ? -90 : 90, 9, 3.2, 'read-head');
        // For shallow lines place next to base away from line; otherwise beside vertical leg clear of x-axis
        const ty = Math.abs(st.m) * U < 30 ? Y(yb) + (st.m > 0 ? 18 : -9)
          : [0.5, 0.25, 0.75].map(f => Y(yb + f * st.m) + 5).find(y => y + 4 < Y0 - 2 || y - 14 > Y0 + 28) ?? Y((yb + yp) / 2) + 5;
        SVG.text(svg, X(1) + 8, ty, `Δ*y* = *m* = ${fmt(st.m, 2)}`, { 'font-size': 14, class: 'halo' });
        taken.push([X(1) + 8, ty - 14, X(1) + 128, ty + 4]);
      }
      SVG.text(svg, X(0.5), Y(yb) + (st.m >= 0 ? 18 : -9), 'Δ*x* = 1', { 'font-size': 14, 'text-anchor': 'middle', class: 'halo' });
      taken.push([X(0.5) - 26, Y(yb) + (st.m >= 0 ? 4 : -23), X(0.5) + 26, Y(yb) + (st.m >= 0 ? 22 : -5)]);
      // Dimension b on the side of the y-axis not crossed by the line; on right with extension line from B
      if (Math.abs(yb) > 0.25) {
        const right = st.m * yb >= 0, xd = right ? 4.2 : -0.45;
        if (right) el(svg, 'line', { x1: X(1), y1: Y(yb), x2: X(xd) + 8, y2: Y(yb), class: 'read' });
        el(svg, 'line', { x1: X(xd), y1: Y(0), x2: X(xd), y2: Y(yb), class: 'dim' });
        SVG.arrowHead(svg, X(xd), Y(yb), yb > 0 ? -90 : 90, 9, 3.2, 'dim-head');
        SVG.arrowHead(svg, X(xd), Y(0), yb > 0 ? 90 : -90, 9, 3.2, 'dim-head');
        const yl = yb < 0 ? Math.min(yb / 2, -0.6) : yb / 2;   // keep clear of tick numbers below x-axis
        SVG.text(svg, X(xd) + (right ? 7 : -7), Y(yl) + 5, `*b* = ${fmt(yb, 2)}`, { 'font-size': 14, 'text-anchor': right ? 'start' : 'end', class: 'halo' });
        taken.push(right ? [X(xd), Y(yl) - 9, X(xd) + 75, Y(yl) + 9] : [X(xd) - 75, Y(yl) - 9, X(xd), Y(yl) + 9]);
      }
    }
    // Value table points
    if (st.pts) st.xs.forEach(x => {
      const y = Core.linear(st.m, st.b, x);
      if (x >= XMIN && x <= XMAX && y >= YMIN && y <= YMAX) el(svg, 'circle', { cx: X(x), cy: Y(y), r: 4.5, class: 'pt-f' });
    });
    // Draggable handles B and P
    [['B', 0, yb], ['P', 1, yp]].forEach(([name, x, y]) => {
      if (y < YMIN || y > YMAX) return;
      el(svg, 'circle', { cx: X(x), cy: Y(y), r: 6, class: 'pt sel' });
      SVG.text(svg, X(x) + (name === 'B' ? -10 : -12), Y(y) - 10, name, { 'font-size': 15, 'text-anchor': 'end', class: 'halo lbl-strong' });
      taken.push([X(x) - 24, Y(y) - 24, X(x) + 8, Y(y) + 8]);
      el(svg, 'circle', { cx: X(x), cy: Y(y), r: 16, class: 'pt-hit', 'data-k': name });
    });
    if (seg) placeEquation(seg, taken);
    updateSide();
  }

  // Place equation next to the visible segment (above or below); text extends away from the line, minimizing overlaps
  function placeEquation(seg, taken) {
    const txt = eqText(st.m, st.b), w = 7.4 * txt.replace(/<\/?i>/g, '').length;
    const [[xa], [xb]] = seg, m = st.m;
    const lineY = x => Y(Core.linear(m, st.b, Math.min(xb, Math.max(xa, x))));
    const hits = (b, o) => !(b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3]);
    const cost = b => {
      let c = b[0] < X(XMIN) - 10 || b[2] > W - 4 || b[1] < 4 || b[3] > H - 4 ? 100 : 0;
      const ya = lineY((b[0] - X0) / U), yb = lineY((b[2] - X0) / U);
      if (Math.max(ya, yb) >= b[1] && Math.min(ya, yb) <= b[3]) c += 10;
      if (b[1] <= Y0 && b[3] >= Y0) c += 2;                         // x-axis
      if (b[0] <= X0 && b[2] >= X0) c += 2;                         // y-axis
      return c + taken.reduce((s, o) => s + (hits(b, o) ? 10 : 0), 0);
    };
    let best = null, bc = Infinity;
    for (const f of [0.95, 0.8, 0.6, 0.4, 0.2, 0.05]) {
      const x = xa + f * (xb - xa), px = X(x), py = lineY(x);
      for (const above of [true, false]) {
        const toRight = above ? m < 0 : m > 0;                      // direction along which line recedes from text
        const tx = px + (toRight ? 6 : -6), ty = py + (above ? -12 : 24);
        const b = toRight ? [tx, ty - 15, tx + w, ty + 4] : [tx - w, ty - 15, tx, ty + 4];
        const c = cost(b);
        if (c < bc) { bc = c; best = [tx, ty, toRight ? 'start' : 'end']; }
      }
    }
    SVG.text(svg, best[0], best[1], txt.replace(/<\/?i>/g, '*'), { 'font-size': 15, 'text-anchor': best[2], class: 'lbl-line halo' });
  }
  function updateSide() {
    const hide = st.quiz && !st.quiz.done;
    $('l-m-out').textContent = fmt(st.m, 2);
    $('l-b-out').textContent = fmt(st.b, 2);
    $('l-eq').innerHTML = `Current: ${eqText(st.m, st.b)}`;
    $('l-tab-note').textContent = isDefault() ? 'Reference value table' : '';
    renderTable();
    const x0 = Core.nullstelle(st.m, st.b);
    $('l-details').innerHTML = [
      ['Slope <i>m</i> = Δ<i>y</i> / Δ<i>x</i>', fmt(st.m, 2)],
      ['<i>y</i>-intercept <i>b</i>', fmt(st.b, 2)],
      ['x-intercept <i>x</i><sub>0</sub> = −<i>b</i> / <i>m</i>', isFinite(x0) ? fmt(x0, 3) : 'none'],
    ].map(([k, v]) => `<span>${k}</span><span>${hide ? '–' : v}</span>`).join('');
  }

  // Horizontal value table; x values are editable
  function renderTable() {
    const ys = st.xs.map(x => fmt(Core.linear(st.m, st.b, x), 2));
    const t = $('l-table');
    if (t.contains(document.activeElement)) {
      st.xs.forEach((x, i) => { t.querySelector(`td[data-i="${i}"]`).textContent = ys[i]; });
      return;
    }
    t.innerHTML = `<tr><th><i>x</i></th>${st.xs.map((x, i) => `<td><input data-i="${i}" value="${fmt(x, 2)}" inputmode="decimal" aria-label="x-value ${i + 1}"></td>`).join('')}</tr>`
      + `<tr><th><i>y</i></th>${ys.map((y, i) => `<td data-i="${i}">${y}</td>`).join('')}</tr>`;
  }
  $('l-table').addEventListener('change', e => {
    const i = +e.target.dataset.i, v = Core.parseNum(e.target.value);
    if (!isFinite(v)) { feedback('l-table-msg', 'Enter numbers only.', false); e.target.value = fmt(st.xs[i], 2); return; }
    feedback('l-table-msg', '');
    st.xs[i] = v;
    e.target.blur();
    render();
  });

  // ---------------------------------------------------------------- Controls and dragging
  function setMB(m, b) {
    st.m = Math.min(3, Math.max(-2, snap(m)));
    st.b = Math.min(3, Math.max(-2, snap(b)));
    UI.slider('l-m', st.m); UI.slider('l-b', st.b);
    render();
  }
  $('l-m').addEventListener('input', e => setMB(+e.target.value, st.b));
  $('l-b').addEventListener('input', e => setMB(st.m, +e.target.value));
  chk('l-tri', v => { st.tri = v; render(); });
  chk('l-pts', v => { st.pts = v; render(); });
  chk('l-grid', v => { st.grid = v; render(); });

  svg.addEventListener('pointerdown', e => {
    const hit = e.target.closest && e.target.closest('.pt-hit');
    if (!hit || (st.quiz && !st.quiz.done)) return;
    const k = hit.getAttribute('data-k');
    SVG.startDrag(svg, e, p => {
      const y = (Y0 - p.y) / U;
      if (k === 'B') setMB(st.m, y); else setMB(y - st.b, st.b);
    });
  });

  // ---------------------------------------------------------------- Exercise: Read line equation
  function newQuiz() {
    let m, b;
    do { m = UI.pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2]); b = UI.rnd(-2, 3, 0.5); } while (m === st.m && b === st.b);
    st.quiz = { m, b, done: false };
    $('l-task').innerHTML = 'Read the dashed line: find slope <i>m</i> using a slope triangle, and <i>b</i> at the <i>y</i>-axis intercept.';
    $('l-ans-m').value = $('l-ans-b').value = '';
    $('l-ans-row').hidden = false;
    $('l-quiz-end').hidden = false;
    feedback('l-feedback', '');
    render();
    $('l-ans-m').focus();
  }
  function checkQuiz() {
    const z = st.quiz;
    if (!z || z.done) return;
    const m = Core.parseNum($('l-ans-m').value), b = Core.parseNum($('l-ans-b').value);
    if (!isFinite(m) || !isFinite(b)) { feedback('l-feedback', 'Please enter both values.', false); return; }
    const okM = Math.abs(m - z.m) < 0.01, okB = Math.abs(b - z.b) < 0.01;
    z.done = true;
    st.score[1]++;
    if (okM && okB) st.score[0]++;
    $('l-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
    const hints = [];
    if (!okM) hints.push(Math.abs(m + z.m) < 0.01 ? 'Check slope sign: if the line slopes downward, <i>m</i> is negative.' : Math.abs(m * z.m - 1) < 0.01 ? 'Δ<i>x</i> and Δ<i>y</i> swapped: <i>m</i> = Δ<i>y</i> / Δ<i>x</i>.' : `Slope: correct value is <i>m</i> = ${fmt(z.m, 2)}.`);
    if (!okB) hints.push(`Intercept: correct value is <i>b</i> = ${fmt(z.b, 2)}.`);
    feedback('l-feedback', okM && okB ? `Correct: ${eqText(z.m, z.b)}.` : hints.join(' '), okM && okB);
    $('l-ans-row').hidden = true;
    render();
  }
  function endQuiz() {
    st.quiz = null;
    $('l-task').textContent = '';
    $('l-ans-row').hidden = true;
    $('l-quiz-end').hidden = true;
    feedback('l-feedback', '');
    render();
  }
  $('l-quiz').addEventListener('click', newQuiz);
  $('l-quiz-end').addEventListener('click', endQuiz);
  $('l-check').addEventListener('click', checkQuiz);
  UI.onEnter('l-ans-b', checkQuiz);

  function reset() {
    Object.assign(st, DEFAULT_STATE(), { tri: true, pts: true, grid: false });
    $('l-tri').checked = $('l-pts').checked = true;
    $('l-grid').checked = false;
    UI.slider('l-m', st.m); UI.slider('l-b', st.b);
    feedback('l-table-msg', '');
    $('l-table').innerHTML = '';
    endQuiz();
  }

  UI.register('linear', { render, reset, state: st });
  UI.slider('l-m', st.m); UI.slider('l-b', st.b);
})();

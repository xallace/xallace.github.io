/* Reiter 1: Kartesisches Koordinatensystem – Punkte setzen, ziehen, Schreibweisen, Übung */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback, nameHtml } = UI;
  const { fmt, pointText } = Core;

  const W = 640, H = 500, U = 46;
  const XMIN = -5, XMAX = 5, YMIN = -4, YMAX = 5;
  const X = Core.linScale(XMIN, XMAX, 90, 90 + (XMAX - XMIN) * U);
  const Y = Core.linScale(YMIN, YMAX, 40 + (YMAX - YMIN) * U, 40);
  const X0 = X(0), Y0 = Y(0);
  const STYLES = { semi: 'Semikolon', bar: 'senkrechter Strich', comma: 'Komma' };
  const BOOK = () => [{ name: 'P1', x: 3.5, y: 1.5 }, { name: 'P2', x: -2, y: -1 }];

  const st = {
    pts: BOOK(), sel: 'P1', style: 'semi', dir: 'heads', snap: 0.5,
    proj: true, names: true, nums: true, grid: false, path: false,
    mode: 'free', task: null, answer: null, score: { place: [0, 0], read: [0, 0] }
  };
  const svg = $('k-svg');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const snap = (v, step, a, b) => clamp(+(Math.round(v / step) * step).toFixed(2), a, b);
  const label = p => SVG.nameMarkup(p.name) + pointText('', p.x, p.y, st.style);

  // ---------------------------------------------------------------- Zeichnen
  function render() {
    SVG.clear(svg);
    SVG.el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });
    const quiz = st.mode !== 'free';
    if (st.grid || quiz) drawGrid();
    // Projektionslinien unter die Achsbeschriftung, damit die Zahlen lesbar bleiben
    const under = SVG.el(svg, 'g', {});
    drawAxes();
    if (st.names && !quiz) drawNames();
    if (quiz) drawQuiz(under); else drawPoints(under);
    updateSide();
  }

  function drawGrid() {
    const g = SVG.el(svg, 'g', { class: 'grid' });
    for (const v of Core.ticks(XMIN, XMAX, 0.5)) {
      SVG.el(g, 'line', { x1: X(v), y1: Y(YMIN), x2: X(v), y2: Y(YMAX), 'stroke-width': v % 1 ? 0.35 : 0.7, opacity: v % 1 ? 0.25 : 0.45 });
    }
    for (const v of Core.ticks(YMIN, YMAX, 0.5)) {
      SVG.el(g, 'line', { x1: X(XMIN), y1: Y(v), x2: X(XMAX), y2: Y(v), 'stroke-width': v % 1 ? 0.35 : 0.7, opacity: v % 1 ? 0.25 : 0.45 });
    }
  }

  function drawAxes() {
    const heads = st.dir === 'heads';
    const xEnd = X(XMAX) + (heads ? 28 : 14), yEnd = Y(YMAX) - (heads ? 28 : 14);
    const g = SVG.el(svg, 'g', {});
    SVG.el(g, 'line', { x1: X(XMIN) - 12, y1: Y0, x2: xEnd - (heads ? 9 : 0), y2: Y0, class: 'ax', 'stroke-width': 1.6 });
    SVG.el(g, 'line', { x1: X0, y1: Y(YMIN) + 12, x2: X0, y2: yEnd + (heads ? 9 : 0), class: 'ax', 'stroke-width': 1.6 });
    for (const v of Core.ticks(XMIN, XMAX, 1)) {
      if (!v) continue;
      SVG.el(g, 'line', { x1: X(v), y1: Y0 - 5, x2: X(v), y2: Y0 + 5, class: 'tick', 'stroke-width': 1.2 });
      if (st.nums) SVG.text(g, X(v), Y0 + 21, fmt(v), { 'text-anchor': 'middle', 'font-size': 14, class: 'halo' });
    }
    for (const v of Core.ticks(YMIN, YMAX, 1)) {
      if (!v) continue;
      SVG.el(g, 'line', { x1: X0 - 5, y1: Y(v), x2: X0 + 5, y2: Y(v), class: 'tick', 'stroke-width': 1.2 });
      if (st.nums) SVG.text(g, X0 - 10, Y(v) + 5, fmt(v), { 'text-anchor': 'end', 'font-size': 14, class: 'halo' });
    }
    if (st.nums) SVG.text(g, X0 - 8, Y0 + 19, '0', { 'text-anchor': 'end', 'font-size': 14 });
    if (heads) {
      SVG.arrowHead(g, xEnd, Y0, 0, 13, 4.5);
      SVG.arrowHead(g, X0, yEnd, -90, 13, 4.5);
      SVG.text(g, xEnd - 5, Y0 + 27, '*x*', { 'text-anchor': 'middle', 'font-size': 18 });
      SVG.text(g, X0 - 12, yEnd + 7, '*y*', { 'text-anchor': 'end', 'font-size': 18 });
    } else {
      const ya = Y0 + 44, xa = X0 - 44;
      SVG.arrow(g, X(3.2), ya, X(4.8), ya, { w: 1.3, l: 11, b: 3.8 });
      SVG.text(g, X(3.2) - 8, ya + 6, '*x*', { 'text-anchor': 'end', 'font-size': 18 });
      SVG.arrow(g, xa, Y(3.2), xa, Y(4.8), { w: 1.3, l: 11, b: 3.8 });
      SVG.text(g, xa, Y(3.2) + 20, '*y*', { 'text-anchor': 'middle', 'font-size': 18 });
    }
  }

  // Bezeichnungen der Achsen und des Nullpunkts mit Hinweislinien
  function drawNames() {
    const g = SVG.el(svg, 'g', { class: 'names' });
    const callout = (tx, ty, anchor, lx1, ly1, lx2, ly2, str) => {
      SVG.el(g, 'line', { x1: lx1, y1: ly1, x2: lx2, y2: ly2, class: 'callout' });
      SVG.text(g, tx, ty, str, { 'text-anchor': anchor, 'font-size': 16, class: 'callout-text halo' });
    };
    callout(X(-4.7), Y(3.1), 'start', X(-2.95), Y(3.1) - 5, X0 - 1, Y(3.7), 'Ordinate');
    callout(X(-4.7), Y(1.7), 'start', X(-2.85), Y(1.7) - 5, X0 - 2, Y0 - 2, 'Nullpunkt');
    callout(X(1.9), Y(-2.1), 'middle', X(2.1), Y(-1.65), X(2.55), Y0 + 1, 'Abszisse');
  }

  function drawPoints(under) {
    const sel = st.pts.find(p => p.name === st.sel);
    if (st.proj) for (const p of st.pts) projection(under, p.x, p.y);
    if (st.path && sel) drawWay(sel);
    for (const p of st.pts) {
      const px = X(p.x), py = Y(p.y), isSel = p.name === st.sel;
      const right = p.x > 0;
      SVG.text(svg, px + (right ? 6 : -6), p.y >= 0 ? py - 12 : py + 24, label(p),
        { 'text-anchor': right ? 'end' : 'start', 'font-size': 15, class: 'halo' + (isSel ? ' sel-text' : '') });
      SVG.el(svg, 'circle', { cx: px, cy: py, r: isSel ? 6 : 5, class: 'pt' + (isSel ? ' sel' : '') });
      SVG.el(svg, 'circle', { cx: px, cy: py, r: 16, class: 'pt-hit', 'data-name': p.name });
    }
  }

  function projection(g, x, y) {
    const px = X(x), py = Y(y);
    if (y) SVG.el(g, 'line', { x1: px, y1: py, x2: px, y2: Y0, class: 'proj' });
    if (x) SVG.el(g, 'line', { x1: px, y1: py, x2: X0, y2: py, class: 'proj' });
  }

  // Weg vom Nullpunkt: erst x-Wert entlang der Abszisse, dann y-Wert parallel zur Ordinate
  function drawWay(p) {
    const g = SVG.el(svg, 'g', {});
    const o = { lineCls: 'way-line', headCls: 'way-head', l: 12, b: 5 };
    if (p.x) {
      SVG.arrow(g, X0, Y0, X(p.x), Y0, o);
      SVG.text(g, (X0 + X(p.x)) / 2, Y0 - 9, '1. *x* = ' + fmt(p.x), { 'text-anchor': 'middle', 'font-size': 14, class: 'way-text halo' });
    }
    if (p.y) {
      SVG.arrow(g, X(p.x), Y0, X(p.x), Y(p.y), o);
      SVG.text(g, X(p.x) + (p.x >= 0 ? 9 : -9), (Y0 + Y(p.y)) / 2 + 5, '2. *y* = ' + fmt(p.y),
        { 'text-anchor': p.x >= 0 ? 'start' : 'end', 'font-size': 14, class: 'way-text halo' });
    }
  }

  function drawQuiz(under) {
    const t = st.task;
    if (!t) return;
    const g = SVG.el(svg, 'g', {});
    if (st.mode === 'read') {
      if (st.answer) projection(under, t.x, t.y);
      SVG.el(g, 'circle', { cx: X(t.x), cy: Y(t.y), r: 7, class: 'quiz-pt' });
      if (st.answer) SVG.text(g, X(t.x) + (t.x > 0 ? 8 : -8), t.y >= 0 ? Y(t.y) - 13 : Y(t.y) + 25,
        'Q' + pointText('', t.x, t.y, t.style), { 'text-anchor': t.x > 0 ? 'end' : 'start', 'font-size': 15, class: 'halo' });
      return;
    }
    const a = st.answer;
    if (!a) return;
    projection(under, t.x, t.y);
    if (!a.ok) {
      SVG.el(g, 'circle', { cx: X(t.x), cy: Y(t.y), r: 9, class: 'target' });
      SVG.text(g, X(t.x) + (t.x > 0 ? 8 : -8), t.y >= 0 ? Y(t.y) - 14 : Y(t.y) + 26,
        'Q' + pointText('', t.x, t.y, t.style), { 'text-anchor': t.x > 0 ? 'end' : 'start', 'font-size': 15, class: 'halo' });
      const ax = X(a.x), ay = Y(a.y), r = 6;
      SVG.el(g, 'path', { d: `M${ax - r} ${ay - r}L${ax + r} ${ay + r}M${ax + r} ${ay - r}L${ax - r} ${ay + r}`, class: 'bad-cross' });
    } else {
      SVG.el(g, 'circle', { cx: X(a.x), cy: Y(a.y), r: 7, class: 'ok-mark' });
    }
  }

  // ---------------------------------------------------------------- Seitenleiste
  function wayText(p) {
    const part = (v, pos, neg, axis) => v === 0 ? `bleibt auf der ${axis}`
      : `${fmt(Math.abs(v))} ${Math.abs(v) === 1 ? 'Einheit' : 'Einheiten'} nach ${v > 0 ? pos : neg}`;
    return `Vom Nullpunkt aus zuerst <i>x</i> = ${fmt(p.x)}: ${part(p.x, 'rechts', 'links', 'y-Achse')}, `
      + `dann <i>y</i> = ${fmt(p.y)}: ${part(p.y, 'oben', 'unten', 'x-Achse')}.`;
  }

  function updateSide() {
    const p = st.mode === 'free' ? st.pts.find(q => q.name === st.sel) : null;
    const nt = $('k-notation');
    if (p) {
      nt.innerHTML = Object.keys(STYLES).map(s =>
        `<span class="lbl">${STYLES[s]}</span><code${s === st.style ? ' class="cur"' : ''}>${nameHtml(p.name)}${pointText('', p.x, p.y, s)}</code>`).join('');
      $('k-way').innerHTML = wayText(p);
      const sx = p.x > 0 ? '+' : p.x < 0 ? '−' : '0', sy = p.y > 0 ? '+' : p.y < 0 ? '−' : '0';
      $('k-quad').textContent = Core.quadrant(p.x, p.y) + ` (${sx} | ${sy})`;
    } else {
      nt.innerHTML = '<span class="lbl">–</span><span class="note">' + (st.mode === 'free' ? 'Kein Punkt gewählt.' : 'In der Übung ausgeblendet.') + '</span>';
      $('k-way').textContent = '';
      $('k-quad').textContent = '';
    }
    $('k-list').innerHTML = st.pts.map(q =>
      `<li data-name="${q.name}"${q.name === st.sel ? ' class="cur"' : ''}><span>${nameHtml(q.name)}${pointText('', q.x, q.y, st.style)}</span>`
      + `<button title="Punkt löschen" data-del="${q.name}">×</button></li>`).join('');
    const sc = st.score[st.mode];
    $('k-score').textContent = sc ? `${sc[0]} / ${sc[1]} richtig` : '';
  }

  // ---------------------------------------------------------------- Punkte bearbeiten
  function freeName() {
    for (let i = 1; i <= 9; i++) if (!st.pts.some(p => p.name === 'P' + i)) return 'P' + i;
    return null;
  }

  function addPoint(x, y, name) {
    name = name || freeName();
    if (!name) { feedback('k-input-msg', 'Höchstens 9 Punkte – erst einen löschen.', false); return null; }
    const p = { name, x, y };
    st.pts.push(p);
    st.pts.sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true }));
    return p;
  }

  function inputPoint() {
    const r = Core.parsePoint($('k-input').value);
    if (r.error) { feedback('k-input-msg', r.error, false); return; }
    if (r.x < XMIN || r.x > XMAX || r.y < YMIN || r.y > YMAX) {
      feedback('k-input-msg', `Außerhalb des Bereichs: x von ${fmt(XMIN)} bis ${fmt(XMAX)}, y von ${fmt(YMIN)} bis ${fmt(YMAX)}.`, false);
      return;
    }
    const name = r.name ? r.name.charAt(0).toUpperCase() + r.name.slice(1) : '';
    let p = name && st.pts.find(q => q.name === name);
    if (p) { p.x = r.x; p.y = r.y; }
    else if (!(p = addPoint(r.x, r.y, name))) return;
    st.sel = p.name;
    feedback('k-input-msg', `${nameHtml(p.name)}${pointText('', p.x, p.y, st.style)} gesetzt.`, true);
    render();
  }

  svg.addEventListener('pointerdown', e => {
    const loc = SVG.toLocal(svg, e);
    const inside = loc.x > X(XMIN) - 14 && loc.x < X(XMAX) + 14 && loc.y > Y(YMAX) - 14 && loc.y < Y(YMIN) + 14;
    if (st.mode === 'place') {
      if (st.task && !st.answer && inside) answerPlace(snap(X.inv(loc.x), 0.5, XMIN, XMAX), snap(Y.inv(loc.y), 0.5, YMIN, YMAX));
      return;
    }
    if (st.mode !== 'free') return;
    const hit = e.target.closest && e.target.closest('.pt-hit');
    let p;
    if (hit) p = st.pts.find(q => q.name === hit.getAttribute('data-name'));
    else if (inside) p = addPoint(snap(X.inv(loc.x), st.snap, XMIN, XMAX), snap(Y.inv(loc.y), st.snap, YMIN, YMAX));
    if (!p) return;
    st.sel = p.name;
    render();
    SVG.startDrag(svg, e, l => {
      const nx = snap(X.inv(l.x), st.snap, XMIN, XMAX), ny = snap(Y.inv(l.y), st.snap, YMIN, YMAX);
      if (nx !== p.x || ny !== p.y) { p.x = nx; p.y = ny; render(); }
    });
  });

  $('k-list').addEventListener('click', e => {
    const del = e.target.closest('[data-del]');
    if (del) {
      st.pts = st.pts.filter(p => p.name !== del.dataset.del);
      if (st.sel === del.dataset.del) st.sel = st.pts.length ? st.pts[0].name : null;
    } else {
      const li = e.target.closest('li');
      if (li) st.sel = li.dataset.name;
    }
    render();
  });

  // ---------------------------------------------------------------- Übung
  function newTask() {
    let x, y;
    do { x = UI.rnd(-4.5, 4.5, 0.5); y = UI.rnd(-3.5, 4.5, 0.5); }
    while (Math.abs(x) === Math.abs(y) || (x === 0 && y === 0));
    const styles = Object.keys(STYLES);
    st.task = { x, y, style: styles[Math.floor(Math.random() * styles.length)] };
    st.answer = null;
    $('k-next').hidden = true;
    feedback('k-feedback', '');
    if (st.mode === 'place') {
      $('k-task').innerHTML = `Setze den Punkt <b>Q${pointText('', x, y, st.task.style)}</b> durch Klick ins Diagramm (Raster 0,5).`;
    } else {
      $('k-task').innerHTML = 'Lies die Koordinaten des markierten Punktes Q ab (Raster 0,5).';
      $('k-ans-x').value = $('k-ans-y').value = '';
    }
    render();
  }

  function diagnose(ax, ay, t) {
    const eq = (a, b) => Math.abs(a - b) < 1e-6;
    if (eq(ax, t.x) && eq(ay, t.y)) return [true, 'Richtig: Q' + pointText('', t.x, t.y, t.style)];
    if (eq(ax, t.y) && eq(ay, t.x)) return [false, '<i>x</i> und <i>y</i> vertauscht: Im geordneten Paar steht zuerst der x-Wert.'];
    if (eq(ax, -t.x) && eq(ay, t.y)) return [false, 'Vorzeichen von <i>x</i> prüfen: negative x-Werte liegen links vom Nullpunkt, positive rechts.'];
    if (eq(ax, t.x) && eq(ay, -t.y)) return [false, 'Vorzeichen von <i>y</i> prüfen: negative y-Werte liegen unter dem Nullpunkt, positive darüber.'];
    if (eq(ax, -t.x) && eq(ay, -t.y)) return [false, 'Beide Vorzeichen vertauscht.'];
    return [false, `Daneben: <i>x</i> um ${fmt(ax - t.x)}, <i>y</i> um ${fmt(ay - t.y)} verschoben.`];
  }

  function score(ok) {
    const sc = st.score[st.mode];
    sc[1]++;
    if (ok) sc[0]++;
    $('k-next').hidden = false;
  }

  function answerPlace(x, y) {
    const [ok, msg] = diagnose(x, y, st.task);
    st.answer = { x, y, ok };
    feedback('k-feedback', ok ? msg : `Gesetzt: Q${pointText('', x, y, st.task.style)}. ${msg}`, ok);
    score(ok);
    render();
  }

  function answerRead() {
    if (st.answer) return;
    const x = Core.parseNum($('k-ans-x').value), y = Core.parseNum($('k-ans-y').value);
    if (!isFinite(x) || !isFinite(y)) { feedback('k-feedback', 'Beide Werte als Zahl eingeben, z. B. −2,5.', false); return; }
    const [ok, msg] = diagnose(x, y, st.task);
    st.answer = { x, y, ok };
    feedback('k-feedback', msg, ok);
    score(ok);
    render();
  }

  function setMode(m) {
    st.mode = m;
    setSeg('k-mode', m);
    $('k-read-inputs').hidden = m !== 'read';
    $('k-next').hidden = true;
    feedback('k-feedback', '');
    if (m === 'free') { st.task = null; $('k-task').textContent = ''; render(); }
    else newTask();
  }

  // ---------------------------------------------------------------- Bedienelemente
  seg('k-style', v => { st.style = v; render(); });
  seg('k-dir', v => { st.dir = v; render(); });
  seg('k-snap', v => { st.snap = +v; });
  seg('k-mode', setMode);
  chk('k-proj', v => { st.proj = v; render(); });
  chk('k-names', v => { st.names = v; render(); });
  chk('k-nums', v => { st.nums = v; render(); });
  chk('k-grid', v => { st.grid = v; render(); });
  chk('k-path', v => { st.path = v; render(); });
  $('k-set').addEventListener('click', inputPoint);
  UI.onEnter('k-input', inputPoint);
  $('k-check').addEventListener('click', answerRead);
  UI.onEnter('k-ans-y', answerRead);
  $('k-next').addEventListener('click', newTask);

  function reset() {
    Object.assign(st, { pts: BOOK(), sel: 'P1', style: 'semi', dir: 'heads', snap: 0.5, proj: true, names: true, nums: true, grid: false, path: false });
    setSeg('k-style', 'semi'); setSeg('k-dir', 'heads'); setSeg('k-snap', '0.5');
    $('k-proj').checked = $('k-names').checked = $('k-nums').checked = true;
    $('k-grid').checked = $('k-path').checked = false;
    $('k-input').value = '';
    feedback('k-input-msg', '');
    setMode('free');
  }

  UI.register('koordinaten', { render, reset, state: st });
  render();
})();

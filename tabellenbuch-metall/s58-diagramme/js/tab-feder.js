/* Reiter 4: Federkennlinie einer Tellerfeder – Wertetabelle, Kennlinie, Ablesen über Punkt A, Übung */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback } = UI;
  const { fmt } = Core;
  const el = SVG.el;

  const W = 640, H = 500, PX0 = 100, PX1 = 580, PY0 = 420, PY1 = 40;
  const BOOK = () => ({ s: [0, 0.3, 0.6, 1.0, 1.3], F: [0, 600, 1000, 1300, 1400] });
  const st = { data: BOOK(), curve: 'pchip', dir: 'sF', grid: false, tangent: false, s: 0.9, F: 1250,
    quiz: null, score: [0, 0], lockDom: null };
  const svg = $('f-svg');

  const isBook = () => JSON.stringify(st.data) === JSON.stringify(BOOK());
  const fnOf = (kind, d = st.data) => (kind === 'pchip' ? Core.pchip : Core.linear)(d.s, d.F);
  const monotone = () => st.data.F.every((v, i, a) => !i || v > a[i - 1]);
  const sLast = () => st.data.s[st.data.s.length - 1];

  // Achsbereich aus den Daten: runde Teilung, letzter Teilstrich ≥ größter Wert
  function domain() {
    if (st.lockDom) return st.lockDom;
    const sMax = Math.max(...st.data.s), FMax = Math.max(...st.data.F);
    const ss = Core.niceStep(sMax || 1, 7), fs = Core.niceStep(FMax || 100, 7);
    const up = (max, step) => +(step * Math.max(1, Math.ceil(max / step - 1e-9))).toFixed(10);
    return { s1: up(sMax, ss), ss, F1: up(FMax, fs), fs };
  }

  // Aktuelle Ablesung: Übungsaufgabe oder Reglerstellung. dir 'sF' = F aus s, 'Fs' = s aus F
  function reading(f) {
    const q = st.quiz;
    const dir = q ? q.dir : st.dir, v = q ? q.v : dir === 'sF' ? st.s : st.F;
    if (dir === 'sF') return { dir, s: v, F: f(v) };
    if (!monotone()) return { dir, s: NaN, F: v };
    return { dir, s: Core.invert(f, v, st.data.s[0], sLast()), F: v };
  }

  function render() {
    const D = domain();
    const X = Core.linScale(0, D.s1, PX0, PX1), Y = Core.linScale(0, D.F1, PY0, PY1);
    const f = fnOf(st.curve);
    SVG.clear(svg);
    SVG.background(svg, W, H);

    // Netzlinien, Achsen, Teilung
    const sTicks = Core.ticks(0, D.s1, D.ss), FTicks = Core.ticks(0, D.F1, D.fs);
    if (st.grid || st.quiz) {
      const g = el(svg, 'g', { class: 'grid' });
      const w = i => (i % 2 ? { 'stroke-width': 0.35, opacity: 0.35 } : { 'stroke-width': 0.6, opacity: 0.6 });
      Core.ticks(0, D.s1, D.ss / 2).forEach((v, i) => el(g, 'line', Object.assign({ x1: X(v), y1: PY0, x2: X(v), y2: PY1 }, w(i))));
      Core.ticks(0, D.F1, D.fs / 2).forEach((v, i) => el(g, 'line', Object.assign({ x1: PX0, y1: Y(v), x2: PX1, y2: Y(v) }, w(i))));
    }
    el(svg, 'line', { x1: PX0, y1: PY0, x2: PX1 + 10, y2: PY0, class: 'ax', 'stroke-width': 1.2 });
    el(svg, 'line', { x1: PX0, y1: PY0, x2: PX0, y2: PY1 - 10, class: 'ax', 'stroke-width': 1.2 });
    const ds = Core.decimalsFor(D.ss);
    sTicks.forEach((v, i) => {
      el(svg, 'line', { x1: X(v), y1: PY0, x2: X(v), y2: PY0 - 6, class: 'tick', 'stroke-width': 1 });
      if (i === sTicks.length - 1) SVG.text(svg, (X(v) + X(sTicks[i - 1])) / 2, PY0 + 22, 'mm', { 'text-anchor': 'middle', 'font-size': 14 });
      SVG.text(svg, X(v), PY0 + 22, Core.tickLabel(v, ds), { 'text-anchor': 'middle', 'font-size': 14 });
    });
    FTicks.forEach((v, i) => {
      el(svg, 'line', { x1: PX0, y1: Y(v), x2: PX0 + 6, y2: Y(v), class: 'tick', 'stroke-width': 1 });
      if (i === FTicks.length - 1) SVG.text(svg, PX0 - 9, (Y(v) + Y(FTicks[i - 1])) / 2 + 5, 'N', { 'text-anchor': 'end', 'font-size': 14 });
      SVG.text(svg, PX0 - 9, Y(v) + 5, fmt(v, 0), { 'text-anchor': 'end', 'font-size': 14 });
    });
    // Benennung mit Pfeil parallel zur Achse
    const xm = (PX0 + PX1) / 2;
    SVG.text(svg, xm + 10, PY0 + 54, 'Federweg *s*', { 'text-anchor': 'end', 'font-size': 15 });
    SVG.arrow(svg, xm + 20, PY0 + 49, xm + 80, PY0 + 49, { w: 1.1, l: 10, b: 3.5 });
    const ym = (PY0 + PY1) / 2;
    SVG.text(svg, 32, ym + 50, 'Federkraft *F*', { 'text-anchor': 'start', 'font-size': 15, transform: `rotate(-90 32 ${ym + 50})` });
    SVG.arrow(svg, 27, ym - 46, 27, ym - 106, { w: 1.1, l: 10, b: 3.5 });

    // Kennlinie und Messpunkte
    el(svg, 'path', { d: SVG.plotFn(f, st.data.s[0], sLast(), X, Y, 200), class: 'curve', 'stroke-width': 2.4 });
    st.data.s.forEach((s, i) => {
      el(svg, 'circle', { cx: X(s), cy: Y(st.data.F[i]), r: 4.5, class: 'pt' });
      el(svg, 'circle', { cx: X(s), cy: Y(st.data.F[i]), r: 13, class: 'pt-hit', 'data-i': i });
    });

    // Ablesung über Punkt A (in der Übung erst nach dem Prüfen)
    const r = reading(f);
    if ((!st.quiz || st.quiz.done) && isFinite(r.s) && isFinite(r.F)) drawReading(X, Y, r.s, r.F, f, r.dir);
    updateResult(f, r);
  }

  function drawReading(X, Y, s, F, f, dir) {
    const ax = X(s), ay = Y(F), g = el(svg, 'g', {});
    const head = (x, y, deg) => SVG.arrowHead(g, x, y, deg, 11, 3.8, 'read-head');
    el(g, 'line', { x1: ax, y1: PY0, x2: ax, y2: ay, class: 'read' });
    el(g, 'line', { x1: ax, y1: ay, x2: PX0, y2: ay, class: 'read' });
    if (dir === 'sF') {
      head(ax, PY0 - (PY0 - ay) * 0.45, -90);      // senkrecht hinauf zur Kennlinie
      head(PX0 + 2, ay, 180);                       // waagrecht zur Ordinate
    } else {
      head(PX0 + (ax - PX0) * 0.55, ay, 0);         // waagrecht zur Kennlinie
      head(ax, PY0 - 2, 90);                        // senkrecht hinab zur Abszisse
    }
    if (st.tangent && !st.quiz) {
      const m = f.deriv(s), ds = 0.22 * (X.domain[1] / 1.4);
      el(g, 'line', { x1: X(s - ds), y1: Y(F - m * ds), x2: X(s + ds), y2: Y(F + m * ds), class: 'tangent' });
    }
    el(g, 'circle', { cx: ax, cy: ay, r: 4.5, class: 'pt sel' });
    SVG.text(g, ax - 6, ay - 10, 'A', { 'text-anchor': 'end', 'font-size': 16, class: 'halo' });
  }

  function updateResult(f, r) {
    const kv = [];
    const lin = fnOf('linear'), smooth = fnOf('pchip');
    if (st.quiz && !st.quiz.done) {
      $('f-result').textContent = '–';
      $('f-details').innerHTML = '<span>Während der Aufgabe ausgeblendet</span><span></span>';
      $('f-book').textContent = '';
      return;
    }
    if (r.dir === 'sF') {
      $('f-result').innerHTML = `<i>F</i> ≈ ${fmt(Math.round(r.F / 10) * 10, 0)} N`;
      kv.push(['Gegeben', `<i>s</i> = ${fmt(r.s, 2)} mm`],
        ['Glatte Kennlinie', fmt(smooth(r.s), 1) + ' N'], ['Polygonzug', fmt(lin(r.s), 1) + ' N'],
        ['Federrate in A', `<i>R</i> ≈ ${fmt(f.deriv(r.s), 0)} N/mm`]);
    } else if (isFinite(r.s)) {
      const a = st.data.s[0], b = sLast();
      $('f-result').innerHTML = `<i>s</i> ≈ ${fmt(Math.round(r.s * 100) / 100, 2)} mm`;
      kv.push(['Gegeben', `<i>F</i> = ${fmt(r.F, 0)} N`],
        ['Glatte Kennlinie', fmt(Core.invert(smooth, r.F, a, b), 3) + ' mm'], ['Polygonzug', fmt(Core.invert(lin, r.F, a, b), 3) + ' mm']);
    } else {
      $('f-result').textContent = '–';
      kv.push(['Kennlinie nicht steigend', 'mehrdeutig']);
    }
    $('f-details').innerHTML = kv.map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    $('f-book').innerHTML = isBook()
      ? 'Buchbeispiel: <i>s</i> = 0,9 mm ergibt <i>F</i> ≈ 1250 N. Rechnerisch liefert die glatte Kennlinie 1246 N, der Polygonzug 1225 N: Das Ergebnis hängt davon ab, wie die Kennlinie zwischen den Messpunkten gezogen wird.'
      : 'Eigene Werte. „Buchwerte laden“ stellt das Beispiel der Seite wieder her.';
  }

  // ---------------------------------------------------------------- Regler
  function syncSlider() {
    const r = $('f-slider');
    if (st.dir === 'sF') {
      st.s = Math.min(st.s, sLast());
      Object.assign(r, { min: st.data.s[0], max: sLast(), step: 0.01 });
      r.value = st.s;
      $('f-slider-label').innerHTML = 'Federweg <i>s</i>';
      $('f-slider-out').textContent = fmt(st.s, 2) + ' mm';
    } else {
      const F0 = st.data.F[0], F1 = st.data.F[st.data.F.length - 1];
      st.F = Math.min(Math.max(st.F, F0), F1);
      Object.assign(r, { min: F0, max: F1, step: 10 });
      r.value = st.F;
      $('f-slider-label').innerHTML = 'Federkraft <i>F</i>';
      $('f-slider-out').textContent = fmt(st.F, 0) + ' N';
    }
    $('f-slider-row').style.visibility = st.quiz ? 'hidden' : '';
  }

  $('f-slider').addEventListener('input', e => {
    if (st.dir === 'sF') st.s = +e.target.value; else st.F = +e.target.value;
    syncSlider();
    render();
  });

  // ---------------------------------------------------------------- Tabelle
  // Wertetabelle senkrecht (Seitenleiste ist schmal); Federweg mit mindestens einer Nachkommastelle wie im Buch
  const sText = v => (v === 0 ? '0' : Number.isInteger(+(v * 10).toFixed(6)) ? Core.tickLabel(v, 1) : fmt(v, 2));
  function renderTable() {
    const d = st.data;
    $('f-table').innerHTML = '<tr><th>Federweg <i>s</i> in mm</th><th>Federkraft <i>F</i> in N</th></tr>'
      + d.s.map((v, i) => `<tr><td><input data-k="s" data-i="${i}" value="${sText(v)}" inputmode="decimal" aria-label="Federweg ${i + 1}"></td>`
        + `<td><input data-k="F" data-i="${i}" value="${fmt(d.F[i], 0)}" inputmode="decimal" aria-label="Federkraft ${i + 1}"></td></tr>`).join('');
  }

  function normalize() {
    const pairs = st.data.s.map((s, i) => [s, st.data.F[i]]).sort((a, b) => a[0] - b[0]);
    st.data = { s: pairs.map(p => p[0]), F: pairs.map(p => p[1]) };
    const dup = st.data.s.some((v, i, a) => i && v === a[i - 1]);
    if (dup) feedback('f-table-msg', 'Zwei gleiche Federwege – jeder s-Wert darf nur einmal vorkommen.', false);
    else if (!monotone()) feedback('f-table-msg', 'Die Kraft steigt nicht überall: „s aus F“ ist dann nicht eindeutig.', false);
    else feedback('f-table-msg', '');
    return !dup;
  }

  $('f-table').addEventListener('change', e => {
    const inp = e.target, k = inp.dataset.k, i = +inp.dataset.i;
    const v = Core.parseNum(inp.value);
    if (!isFinite(v) || v < 0) { feedback('f-table-msg', 'Nur Zahlen ≥ 0 eintragen.', false); inp.value = k === 's' ? sText(st.data.s[i]) : fmt(st.data.F[i], 0); return; }
    const old = st.data[k][i];
    st.data[k][i] = v;
    if (!normalize()) { st.data[k][i] = old; normalize(); }
    renderTable();
    syncSlider();
    render();
  });

  $('f-add').addEventListener('click', () => {
    const n = st.data.s.length;
    if (n >= 8) { feedback('f-table-msg', 'Höchstens 8 Wertepaare.', false); return; }
    st.data.s.push(+(st.data.s[n - 1] + 0.3).toFixed(2));
    st.data.F.push(st.data.F[n - 1] + 100);
    normalize(); renderTable(); syncSlider(); render();
  });
  $('f-del').addEventListener('click', () => {
    if (st.data.s.length <= 2) { feedback('f-table-msg', 'Mindestens 2 Wertepaare.', false); return; }
    st.data.s.pop(); st.data.F.pop();
    normalize(); renderTable(); syncSlider(); render();
  });

  // ---------------------------------------------------------------- Ziehen im Diagramm
  svg.addEventListener('pointerdown', e => {
    const D = domain();
    const X = Core.linScale(0, D.s1, PX0, PX1), Y = Core.linScale(0, D.F1, PY0, PY1);
    const hit = e.target.closest && e.target.closest('.pt-hit');
    if (hit && !st.quiz) {
      const i = +hit.getAttribute('data-i');
      st.lockDom = D;
      SVG.startDrag(svg, e, p => {
        const lo = i ? st.data.s[i - 1] + 0.02 : 0, hi = i < st.data.s.length - 1 ? st.data.s[i + 1] - 0.02 : D.s1;
        st.data.s[i] = +Math.min(hi, Math.max(lo, Math.round(X.inv(p.x) * 100) / 100)).toFixed(2);
        st.data.F[i] = Math.min(D.F1, Math.max(0, Math.round(Y.inv(p.y) / 10) * 10));
        normalize(); renderTable(); syncSlider(); render();
      }, () => { st.lockDom = null; render(); });
      return;
    }
    if (st.quiz) return;
    // Klick ins Diagramm verschiebt die Ablesestelle
    const move = p => {
      if (st.dir === 'sF') st.s = Math.min(sLast(), Math.max(st.data.s[0], Math.round(X.inv(p.x) * 100) / 100));
      else st.F = Math.round(Y.inv(p.y) / 10) * 10;
      syncSlider(); render();
    };
    move(SVG.toLocal(svg, e));
    SVG.startDrag(svg, e, move);
  });

  // ---------------------------------------------------------------- Übung
  function newQuiz() {
    const f = fnOf(st.curve);
    const dir = !monotone() || Math.random() < 0.6 ? 'sF' : 'Fs';
    let v;
    if (dir === 'sF') {
      do v = UI.rnd(0.1, sLast() - 0.05, 0.05); while (st.data.s.some(s => Math.abs(s - v) < 1e-9));
    } else {
      const F1 = st.data.F[st.data.F.length - 1];
      do v = UI.rnd(100, F1 - 50, 50); while (st.data.F.some(F => Math.abs(F - v) < 1e-9));
    }
    const truth = dir === 'sF' ? f(v) : Core.invert(f, v, st.data.s[0], sLast());
    st.quiz = { dir, v, truth, done: false };
    $('f-task').innerHTML = dir === 'sF'
      ? `Welche Federkraft gehört zu <i>s</i> = ${fmt(v, 2)} mm? Im Diagramm ablesen (Toleranz ± 30 N).`
      : `Welcher Federweg gehört zu <i>F</i> = ${fmt(v, 0)} N? Im Diagramm ablesen (Toleranz ± 0,03 mm).`;
    $('f-answer-unit').textContent = dir === 'sF' ? 'N' : 'mm';
    $('f-answer').value = '';
    $('f-answer-row').hidden = false;
    $('f-quiz-end').hidden = false;
    feedback('f-feedback', '');
    syncSlider();
    render();
    $('f-answer').focus();
  }

  function checkQuiz() {
    const q = st.quiz;
    if (!q || q.done) return;
    const a = Core.parseNum($('f-answer').value);
    if (!isFinite(a)) { feedback('f-feedback', 'Bitte eine Zahl eingeben.', false); return; }
    const tol = q.dir === 'sF' ? 30 : 0.03, unit = q.dir === 'sF' ? ' N' : ' mm', dec = q.dir === 'sF' ? 0 : 2;
    const ok = Math.abs(a - q.truth) <= tol + 1e-9;
    q.done = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    $('f-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
    feedback('f-feedback', `${ok ? 'Richtig' : 'Daneben'}: Die Kennlinie ergibt ${fmt(q.truth, dec + 1)}${unit}, abgelesen ${fmt(a, dec)}${unit}.`, ok);
    $('f-answer-row').hidden = true;
    syncSlider();
    render();
  }

  function endQuiz() {
    st.quiz = null;
    $('f-task').textContent = '';
    $('f-answer-row').hidden = true;
    $('f-quiz-end').hidden = true;
    feedback('f-feedback', '');
    syncSlider();
    render();
  }

  $('f-quiz').addEventListener('click', newQuiz);
  $('f-quiz-end').addEventListener('click', endQuiz);
  $('f-check').addEventListener('click', checkQuiz);
  UI.onEnter('f-answer', checkQuiz);

  seg('f-curve', v => { st.curve = v; render(); });
  seg('f-dir', v => {
    if (v === 'Fs' && !monotone()) { setSeg('f-dir', 'sF'); feedback('f-table-msg', 'Die Kraft steigt nicht überall: „s aus F“ ist nicht eindeutig.', false); return; }
    st.dir = v;
    if (v === 'Fs') st.F = Math.round(fnOf(st.curve)(st.s) / 10) * 10;
    syncSlider();
    render();
  });
  chk('f-grid', v => { st.grid = v; render(); });
  chk('f-tangent', v => { st.tangent = v; render(); });

  function reset() {
    Object.assign(st, { data: BOOK(), curve: 'pchip', dir: 'sF', grid: false, tangent: false, s: 0.9, F: 1250, lockDom: null });
    setSeg('f-curve', 'pchip'); setSeg('f-dir', 'sF');
    $('f-grid').checked = $('f-tangent').checked = false;
    feedback('f-table-msg', '');
    renderTable();
    endQuiz();
  }

  UI.register('feder', { render, reset, state: st, newQuiz });
  renderTable();
  syncSlider();
  render();
})();

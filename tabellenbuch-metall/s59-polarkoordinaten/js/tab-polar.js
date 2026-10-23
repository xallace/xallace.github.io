/* Reiter 2: Polarkoordinatensystem nach DIN 461 –
   360°-Teilung, Nullpunkt (Pol), 0° rechts waagrecht, +φ gegen Uhrzeigersinn, Radius r, konzentrische Kreise */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback, nameHtml } = UI;
  const { fmt, polarText, normDeg, polarToCart, polarToScreen, screenToPolar } = Core;
  const el = SVG.el;

  const W = 640, H = 500, CX = 310, CY = 252, RMAX = 5, U = 36;
  const BOOK_PTS = () => [
    { name: 'P1', r: 3.5, deg: 45 },
    { name: 'P2', r: 4.0, deg: 150 }
  ];

  const RULES = [
    ['div360', '360°-Teilung', 'Polarkoordinatensysteme besitzen eine 360°-Kreisteilung (hier mit 15°-, 30°- oder 45°-Strahlen).'],
    ['pole', 'Nullpunkt (Pol)', 'Der Schnittpunkt von waagrechter und senkrechter Achse ist der Nullpunkt (Pol).'],
    ['zero', 'Winkelzuordnung (0°)', 'Die waagrechte Achse rechts vom Nullpunkt wird dem Winkel 0° (360°) zugeordnet.'],
    ['ccw', 'Winkelabtrag (+φ)', 'Positive Winkel werden entgegen dem Uhrzeigersinn (mathematisch positiv) abgetragen.'],
    ['radius', 'Radius r & Kreise', 'Der Radius entspricht der Größe des abzutragenden Wertes; konzentrische Kreise erleichtern das Abtragen.']
  ];

  const st = {
    pts: BOOK_PTS(),
    sel: 'P1',
    sectorStep: 30,
    snapR: 0.5,
    snapDeg: 15,
    showCurve: true,
    showNums: true,
    showCart: false,
    hoverRule: null,
    pinRule: null,
    mode: 'free',         // 'free' | 'place' | 'read'
    task: null,
    answer: null,
    score: { place: [0, 0], read: [0, 0] }
  };
  const svg = $('p-svg');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const snapVal = (v, step, a, b) => clamp(+(Math.round(v / step) * step).toFixed(2), a, b);
  const snapAngle = (deg, step) => normDeg(Math.round(deg / step) * step);

  function render() {
    const hl = st.hoverRule || st.pinRule;
    const quiz = st.mode !== 'free';
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    // 1. Konzentrische Kreise (Radius-Ringe r = 1 … 5)
    const gRings = el(svg, 'g', { class: 'grid' + (hl === 'radius' ? ' hl-lines' : '') });
    for (let r = 1; r <= RMAX; r++) {
      const isRef = r === 2 && st.showCurve && !quiz;
      el(gRings, 'circle', {
        cx: CX, cy: CY, r: r * U,
        fill: 'none',
        'stroke-width': r === RMAX ? 1.15 : 0.75,
        'stroke-dasharray': isRef ? '6 4' : null,
        opacity: r === RMAX ? 0.9 : 0.65
      });
    }

    // 2. Sektorstrahlen (360°-Teilung)
    const step = quiz ? 15 : st.sectorStep;
    const gRays = el(svg, 'g', { class: 'grid' + (hl === 'div360' ? ' hl-lines' : '') });
    for (let d = 0; d < 360; d += step) {
      if (d % 90 === 0) continue;
      const [x1, y1] = polarToScreen(CX, CY, U * 0.45, d);
      const [x2, y2] = polarToScreen(CX, CY, RMAX * U, d);
      el(gRays, 'line', { x1, y1, x2, y2, 'stroke-width': d % 30 === 0 ? 0.65 : 0.4, opacity: d % 30 === 0 ? 0.65 : 0.4 });
      if ((st.showNums || quiz) && d % 30 === 0) {
        const [lx, ly] = polarToScreen(CX, CY, RMAX * U + 18, d);
        SVG.text(svg, lx, ly + 4, d + '°', {
          'text-anchor': 'middle', 'font-size': 12,
          class: 'lbl-muted' + (hl === 'div360' ? ' hl-text' : '')
        });
      }
    }

    // 3. Waagrechte und senkrechte Hauptachse durch den Pol
    const axExt = RMAX * U + 10;
    el(svg, 'line', { x1: CX - axExt, y1: CY, x2: CX + axExt, y2: CY, class: 'ax', 'stroke-width': 1.3 });
    el(svg, 'line', { x1: CX, y1: CY - axExt, x2: CX, y2: CY + axExt, class: 'ax', 'stroke-width': 1.3 });

    // Hervorhebung der 0°-Achse rechts vom Nullpunkt
    if (hl === 'zero') {
      el(svg, 'line', { x1: CX, y1: CY, x2: CX + axExt + 6, y2: CY, class: 'hl', 'stroke-width': 7 });
    }
    // Hervorhebung des Nullpunkts (Pol)
    if (hl === 'pole') {
      el(svg, 'circle', { cx: CX, cy: CY, r: 10, class: 'hl-ring' });
      SVG.text(svg, CX - 14, CY + 24, 'Nullpunkt (Pol)', { 'text-anchor': 'end', 'font-size': 14, class: 'halo hl-text' });
    }

    // 4. Hauptwinkel-Beschriftungen wie im Buch: 0° (360°), 90°, 180°, 270°
    const zeroCls = (hl === 'zero' || hl === 'div360') ? 'hl-text' : '';
    const d360Cls = hl === 'div360' ? 'hl-text' : '';
    SVG.text(svg, CX + axExt + 24, CY - 4, '0°', { 'text-anchor': 'middle', 'font-size': 15, class: zeroCls });
    SVG.text(svg, CX + axExt + 24, CY + 16, '(360°)', { 'text-anchor': 'middle', 'font-size': 14, class: zeroCls });
    SVG.text(svg, CX, CY - axExt - 10, '90°', { 'text-anchor': 'middle', 'font-size': 15, class: d360Cls });
    SVG.text(svg, CX - axExt - 8, CY + 5, '180°', { 'text-anchor': 'end', 'font-size': 15, class: d360Cls });
    SVG.text(svg, CX, CY + axExt + 20, '270°', { 'text-anchor': 'middle', 'font-size': 15, class: d360Cls });

    // Radiusskala an der 270°-/0°-Achse
    if (st.showNums || quiz || hl === 'radius') {
      for (let r = 1; r <= RMAX; r++) {
        SVG.text(svg, CX + r * U - 3, CY + 15, String(r), {
          'text-anchor': 'end', 'font-size': 12.5,
          class: 'halo' + (hl === 'radius' ? ' hl-text' : ' lbl-muted')
        });
      }
    }

    // 5. Geschlossene blaue Beispiel-Kennlinie r(φ) wie im oberen Polardiagramm des Buchs
    if (st.showCurve && !quiz) {
      const dPath = SVG.plotPolar(Core.upperPolarCurve, CX, CY, r => r * U, 240);
      el(svg, 'path', { d: dPath, class: 'curve-re', fill: 'none', 'stroke-width': 2.3 });
      const [sx, sy] = polarToScreen(CX, CY, Core.upperPolarCurve(0) * U, 0);
      el(svg, 'circle', { cx: sx, cy: sy, r: 3.5, class: 'pt' });
    }

    // 6. Punkte oder Übungsaufgabe zeichnen
    if (quiz) drawQuiz();
    else drawPoints(hl);

    // Kleiner Polpunkt im Ursprung
    el(svg, 'circle', { cx: CX, cy: CY, r: 3, class: 'ax-head' });

    updateSide();
  }

  function drawPoints(hl) {
    const sel = st.pts.find(p => p.name === st.sel) || st.pts[0];
    if (sel) {
      const [px, py] = polarToScreen(CX, CY, sel.r * U, sel.deg);

      // Kartesisches Stützdreieck (x = r·cos φ, y = r·sin φ) falls eingeschaltet
      if (st.showCart && sel.r > 0) {
        el(svg, 'line', { x1: CX, y1: CY, x2: px, y2: CY, class: 'proj', 'stroke-dasharray': '4 3' });
        el(svg, 'line', { x1: px, y1: CY, x2: px, y2: py, class: 'proj', 'stroke-dasharray': '4 3' });
        const c = polarToCart(sel.r, sel.deg);
        SVG.text(svg, (CX + px) / 2, CY + (c.y >= 0 ? 16 : -8), `*x* = ${fmt(c.x, 2)}`, { 'text-anchor': 'middle', 'font-size': 13, class: 'halo' });
        SVG.text(svg, px + (c.x >= 0 ? 8 : -8), (CY + py) / 2 + 4, `*y* = ${fmt(c.y, 2)}`, { 'text-anchor': c.x >= 0 ? 'start' : 'end', 'font-size': 13, class: 'halo' });
      }

      // Winkelbogen +φ entgegen dem Uhrzeigersinn (auf dem inneren Referenzkreis, damit außen keine Winkelzahlen überdeckt werden)
      if (sel.deg > 0 && sel.r > 0) {
        const arcR = 2.0 * U;
        SVG.angleArc(svg, CX, CY, arcR, 0, sel.deg, {
          lineCls: 'ax' + (hl === 'ccw' ? ' hl-stroke' : ''),
          headCls: 'ax-head' + (hl === 'ccw' ? ' hl-fill' : ''),
          w: hl === 'ccw' ? 2.5 : 1.35, l: 10, b: 3.4
        });
        const midDeg = Math.min(sel.deg / 2, 65);
        const [tx, ty] = polarToScreen(CX, CY, arcR + 17, midDeg);
        SVG.text(svg, tx, ty + 5, '+ *φ*', {
          'text-anchor': 'middle', 'font-size': 15.5,
          class: 'halo' + (hl === 'ccw' ? ' hl-text' : ' lbl-strong')
        });
      }

      // Radius-Pfeil r vom Pol zum Punkt
      if (sel.r > 0) {
        if (hl === 'radius') el(svg, 'line', { x1: CX, y1: CY, x2: px, y2: py, class: 'hl', 'stroke-width': 7 });
        SVG.arrow(svg, CX, CY, px, py, {
          lineCls: 'ax' + (hl === 'radius' ? ' hl-stroke' : ''),
          headCls: 'ax-head' + (hl === 'radius' ? ' hl-fill' : ''),
          w: 1.5, l: 11, b: 3.6
        });
        const [rx, ry] = polarToScreen(CX, CY, sel.r * U * 0.52, sel.deg + 14);
        SVG.text(svg, rx, ry + 4, '*r*', {
          'text-anchor': 'middle', 'font-size': 16,
          class: 'halo' + (hl === 'radius' ? ' hl-text' : '')
        });
      }
    }

    // Alle Punkte
    for (const p of st.pts) {
      const [px, py] = polarToScreen(CX, CY, p.r * U, p.deg);
      const isSel = p.name === st.sel;
      const right = Math.cos(p.deg * Math.PI / 180) >= 0;
      const up = Math.sin(p.deg * Math.PI / 180) >= 0;
      const inward = p.r >= 3.3;
      const anchor = inward ? (right ? 'end' : 'start') : (right ? 'start' : 'end');
      const dx = inward ? (right ? -10 : 10) : (right ? 10 : -10);
      const dy = up ? -10 : 20;
      SVG.text(svg, px + dx, py + dy,
        SVG.nameMarkup(p.name) + polarText('', p.r, p.deg, 'semi'),
        { 'text-anchor': anchor, 'font-size': 14.5, class: 'halo' + (isSel ? ' sel-text' : '') });
      el(svg, 'circle', { cx: px, cy: py, r: isSel ? 6 : 4.8, class: 'pt' + (isSel ? ' sel' : '') });
      el(svg, 'circle', { cx: px, cy: py, r: 15, class: 'pt-hit', 'data-name': p.name });
    }
  }

  function drawQuiz() {
    const t = st.task;
    if (!t) return;
    const [tx, ty] = polarToScreen(CX, CY, t.r * U, t.deg);
    const g = el(svg, 'g', {});
    if (st.mode === 'read') {
      if (st.answer) {
        SVG.arrow(g, CX, CY, tx, ty, { w: 1.4, l: 10, b: 3.5 });
        if (t.deg > 0) SVG.angleArc(g, CX, CY, Math.min(t.r * U * 0.55, 75), 0, t.deg, { w: 1.2 });
      }
      el(g, 'circle', { cx: tx, cy: ty, r: 7, class: 'quiz-pt' });
      if (st.answer) {
        SVG.text(g, tx + 10, ty - 10, 'Q' + polarText('', t.r, t.deg, 'semi'), { 'font-size': 15, class: 'halo' });
      }
      return;
    }
    const a = st.answer;
    if (!a) return;
    SVG.arrow(g, CX, CY, tx, ty, { w: 1.4, l: 10, b: 3.5 });
    if (t.deg > 0) SVG.angleArc(g, CX, CY, Math.min(t.r * U * 0.55, 75), 0, t.deg, { w: 1.2 });
    const [ax, ay] = polarToScreen(CX, CY, a.r * U, a.deg);
    if (!a.ok) {
      el(g, 'circle', { cx: tx, cy: ty, r: 9, class: 'target' });
      SVG.text(g, tx + 10, ty - 10, 'Q' + polarText('', t.r, t.deg, 'semi'), { 'font-size': 15, class: 'halo' });
      const d = 6;
      el(g, 'path', { d: `M${ax - d} ${ay - d}L${ax + d} ${ay + d}M${ax + d} ${ay - d}L${ax - d} ${ay + d}`, class: 'bad-cross' });
    } else {
      el(g, 'circle', { cx: ax, cy: ay, r: 7, class: 'ok-mark' });
    }
  }

  function updateSide() {
    const p = st.mode === 'free' ? st.pts.find(q => q.name === st.sel) : null;
    if (p) {
      const c = polarToCart(p.r, p.deg);
      $('p-region').textContent = Core.polarRegion(p.r, p.deg);
      $('p-readout').innerHTML = `<b>${nameHtml(p.name)}</b>: Radius <i>r</i> = <code>${fmt(p.r, 2)}</code>, Winkel <i>φ</i> = <code>${fmt(p.deg, 0)}°</code>`;
      $('p-cart-info').innerHTML = `Kartesisch: <i>x</i> = <i>r</i> · cos <i>φ</i> = ${fmt(c.x, 2)}, <i>y</i> = <i>r</i> · sin <i>φ</i> = ${fmt(c.y, 2)}`
        + (st.showCurve ? `<br>Buch-Kennlinie bei ${fmt(p.deg, 0)}°: <i>r</i><sub>Kurve</sub> = ${fmt(Core.upperPolarCurve(p.deg), 2)}` : '');
    } else {
      $('p-region').textContent = '';
      $('p-readout').textContent = st.mode === 'free' ? 'Kein Punkt gewählt.' : 'Während der Übung ausgeblendet.';
      $('p-cart-info').textContent = '';
    }
    $('p-list').innerHTML = st.pts.map(q =>
      `<li data-name="${q.name}"${q.name === st.sel ? ' class="cur"' : ''}><span>${nameHtml(q.name)}${polarText('', q.r, q.deg, 'semi')}</span>`
      + `<button title="Punkt löschen" data-del="${q.name}">×</button></li>`).join('');
    const sc = st.score[st.mode];
    $('p-score').textContent = sc ? `${sc[0]} / ${sc[1]} richtig` : '';
  }

  function renderRules() {
    $('p-rules').innerHTML = RULES.map(([k, t, s]) =>
      `<li class="hover-able${st.pinRule === k ? ' active' : ''}" data-key="${k}"><b>${t}:</b> ${s}</li>`).join('');
  }

  const rulesEl = $('p-rules');
  rulesEl.addEventListener('mouseover', e => {
    const li = e.target.closest('li');
    const k = li ? li.dataset.key : null;
    if (k !== st.hoverRule) { st.hoverRule = k; render(); }
  });
  rulesEl.addEventListener('mouseleave', () => { st.hoverRule = null; render(); });
  rulesEl.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    st.pinRule = st.pinRule === li.dataset.key ? null : li.dataset.key;
    renderRules();
    render();
  });

  function freeName() {
    for (let i = 1; i <= 9; i++) if (!st.pts.some(p => p.name === 'P' + i)) return 'P' + i;
    return null;
  }

  function addPoint(r, deg, name) {
    name = name || freeName();
    if (!name) { feedback('p-input-msg', 'Höchstens 9 Punkte – erst einen löschen.', false); return null; }
    const p = { name, r, deg };
    st.pts.push(p);
    st.pts.sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true }));
    return p;
  }

  function inputPoint() {
    const res = Core.parsePolar($('p-input').value);
    if (res.error) { feedback('p-input-msg', res.error, false); return; }
    if (res.r > RMAX) { feedback('p-input-msg', `Radius r höchstens ${RMAX}.`, false); return; }
    const name = res.name ? res.name.charAt(0).toUpperCase() + res.name.slice(1) : '';
    let p = name && st.pts.find(q => q.name === name);
    if (p) { p.r = res.r; p.deg = res.deg; }
    else if (!(p = addPoint(res.r, res.deg, name))) return;
    st.sel = p.name;
    feedback('p-input-msg', `${nameHtml(p.name)}${polarText('', p.r, p.deg, 'semi')} gesetzt.`, true);
    render();
  }

  svg.addEventListener('pointerdown', e => {
    const loc = SVG.toLocal(svg, e);
    const pol = screenToPolar(CX, CY, loc.x, loc.y, U);
    const inside = pol.r <= RMAX + 0.35;
    if (st.mode === 'place') {
      if (st.task && !st.answer && inside) {
        answerPlace(snapVal(pol.r, 0.5, 0, RMAX), snapAngle(pol.deg, 15));
      }
      return;
    }
    if (st.mode !== 'free') return;
    const hit = e.target.closest && e.target.closest('.pt-hit');
    let p;
    if (hit) p = st.pts.find(q => q.name === hit.getAttribute('data-name'));
    else if (inside) p = addPoint(snapVal(pol.r, st.snapR, 0, RMAX), snapAngle(pol.deg, st.snapDeg));
    if (!p) return;
    st.sel = p.name;
    render();
    SVG.startDrag(svg, e, l => {
      const np = screenToPolar(CX, CY, l.x, l.y, U);
      const nr = snapVal(np.r, st.snapR, 0, RMAX);
      const nd = nr === 0 ? 0 : snapAngle(np.deg, st.snapDeg);
      if (nr !== p.r || nd !== p.deg) { p.r = nr; p.deg = nd; render(); }
    });
  });

  $('p-list').addEventListener('click', e => {
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

  // ---------------------------------------------------------------- Übung mit Fehlerdiagnose
  function newTask() {
    const r = UI.rnd(1, 4.5, 0.5);
    let deg;
    do { deg = UI.rnd(15, 345, 15); } while (deg === 180);
    st.task = { r, deg };
    st.answer = null;
    $('p-next').hidden = true;
    feedback('p-feedback', '');
    if (st.mode === 'place') {
      $('p-task').innerHTML = `Setze den Punkt <b>Q${polarText('', r, deg, 'semi')}</b> durch Klick ins Polardiagramm (Raster Δ<i>r</i> = 0,5; Δ<i>φ</i> = 15°).`;
    } else {
      $('p-task').innerHTML = 'Lies den Radius <i>r</i> und den Winkel <i>φ</i> des markierten Punktes Q ab.';
      $('p-ans-r').value = $('p-ans-deg').value = '';
    }
    render();
  }

  function diagnosePolar(ar, adeg, t) {
    const eqR = Math.abs(ar - t.r) < 1e-6;
    const dNorm = normDeg(adeg);
    const eqDeg = Math.abs(dNorm - t.deg) < 1e-6;
    if (eqR && eqDeg) return [true, 'Richtig: Q' + polarText('', t.r, t.deg, 'semi')];
    if (eqR && Math.abs(dNorm - normDeg(360 - t.deg)) < 1e-6) {
      return [false, 'Drehsinn beachten: Positive Winkel +<i>φ</i> werden <b>entgegen dem Uhrzeigersinn</b> abgetragen (nicht im Uhrzeigersinn).'];
    }
    if (eqR && (Math.abs(dNorm - normDeg(90 - t.deg)) < 1e-6 || Math.abs(dNorm - normDeg(t.deg - 90)) < 1e-6)) {
      return [false, 'Winkelzuordnung prüfen: 0° liegt auf der <b>waagrechten Achse rechts</b> vom Pol, nicht oben bei 90°.'];
    }
    if (!eqR && eqDeg) {
      return [false, `Winkel ${fmt(t.deg, 0)}° stimmt, aber Radius <i>r</i> = ${fmt(ar, 1)} statt ${fmt(t.r, 1)} (konzentrische Kreise vom Pol aus zählen).`];
    }
    return [false, `Daneben: Q${polarText('', t.r, t.deg, 'semi')} (eingegeben: <i>r</i> = ${fmt(ar, 1)}, <i>φ</i> = ${fmt(dNorm, 0)}°).`];
  }

  function score(ok) {
    const sc = st.score[st.mode];
    sc[1]++;
    if (ok) sc[0]++;
    $('p-next').hidden = false;
  }

  function answerPlace(r, deg) {
    const [ok, msg] = diagnosePolar(r, deg, st.task);
    st.answer = { r, deg, ok };
    feedback('p-feedback', ok ? msg : `Gesetzt: Q${polarText('', r, deg, 'semi')}. ${msg}`, ok);
    score(ok);
    render();
  }

  function answerRead() {
    if (st.answer) return;
    const r = Core.parseNum($('p-ans-r').value), deg = Core.parseNum($('p-ans-deg').value);
    if (!isFinite(r) || !isFinite(deg)) { feedback('p-feedback', 'Bitte Radius r und Winkel φ als Zahlen eingeben.', false); return; }
    const [ok, msg] = diagnosePolar(r, deg, st.task);
    st.answer = { r, deg: normDeg(deg), ok };
    feedback('p-feedback', msg, ok);
    score(ok);
    render();
  }

  function setMode(m) {
    st.mode = m;
    setSeg('p-mode', m);
    $('p-read-inputs').hidden = m !== 'read';
    $('p-next').hidden = true;
    feedback('p-feedback', '');
    if (m === 'free') { st.task = null; $('p-task').textContent = ''; render(); }
    else newTask();
  }

  seg('p-div', v => { st.sectorStep = +v; render(); });
  seg('p-snap', v => { st.snapDeg = +v; });
  seg('p-mode', setMode);
  chk('p-curve', v => { st.showCurve = v; render(); });
  chk('p-nums', v => { st.showNums = v; render(); });
  chk('p-cart', v => { st.showCart = v; render(); });
  $('p-set').addEventListener('click', inputPoint);
  UI.onEnter('p-input', inputPoint);
  $('p-check').addEventListener('click', answerRead);
  UI.onEnter('p-ans-deg', answerRead);
  $('p-next').addEventListener('click', newTask);

  function reset() {
    Object.assign(st, {
      pts: BOOK_PTS(), sel: 'P1', sectorStep: 30, snapR: 0.5, snapDeg: 15,
      showCurve: true, showNums: true, showCart: false, pinRule: null
    });
    setSeg('p-div', '30');
    setSeg('p-snap', '15');
    $('p-curve').checked = $('p-nums').checked = true;
    $('p-cart').checked = false;
    $('p-input').value = '';
    feedback('p-input-msg', '');
    renderRules();
    setMode('free');
  }

  UI.register('polar', { render, reset, state: st });
  renderRules();
  render();
})();

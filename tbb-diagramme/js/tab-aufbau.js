/* Reiter 2: Aufbau eines Diagramms – Regeln, Hervorhebung, Linienbreiten, Fehlerbilder */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback } = UI;
  const { fmt } = Core;
  const el = SVG.el;

  const W = 640, H = 460;
  const MM = 2.4;                                   // 1 mm Linienbreite ≙ 2,4 viewBox-Einheiten
  const sig = e => 140 * Math.tanh(e / 0.16);       // Beispielkurve σ(ε), kein Werkstoff

  const RULES = [
    ['axes', 'Achsen', 'Abszisse waagrecht, Ordinate senkrecht; sie schneiden sich im Nullpunkt.'],
    ['dir', 'Positive Richtung', 'nach rechts bzw. oben, gekennzeichnet durch Pfeilspitzen an den Achsen oder Pfeile parallel zu ihnen.'],
    ['sym', 'Formelzeichen', 'kursiv; an der Abszisse unter der Pfeilspitze, an der Ordinate links daneben, sonst vor den parallelen Pfeilen.'],
    ['nums', 'Zahlenwerte', 'an den Teilstrichen; negative Werte immer mit Minuszeichen.'],
    ['unit', 'Einheit', 'zwischen den beiden letzten positiven Zahlen oder hinter dem Formelzeichen.'],
    ['scale', 'Skala', 'meist linear geteilt (gleicher Wertschritt, gleicher Abstand), manchmal logarithmisch.'],
    ['grid', 'Netzlinien', 'erleichtern das Eintragen und Ablesen der Werte.'],
    ['curve', 'Kennlinie', 'verbindet die eingetragenen Werte.'],
    ['widths', 'Linienbreiten', 'Netzlinie : Achse : Kennlinie = 1 : 2 : 4.']
  ];
  const FAULTS = [
    ['noDir', 'Positive Achsrichtungen nicht gekennzeichnet'],
    ['upright', 'Formelzeichen nicht kursiv'],
    ['symPos', 'Formelzeichen an der falschen Stelle'],
    ['noMinus', 'Negative Zahlenwerte ohne Minuszeichen'],
    ['unitPos', 'Einheiten an der falschen Stelle'],
    ['reversed', 'Positive Werte nach links abgetragen'],
    ['widths', 'Linienbreiten nicht im Verhältnis 1 : 2 : 4']
  ];

  const st = { dir: 'parallel', unit: 'between', callouts: true, grid: false, b: 0.25, hover: null, pin: null,
    faults: null, checked: new Set(), done: false, score: [0, 0] };
  const svg = $('a-svg');

  function render() {
    const F = st.faults || new Set();
    const has = k => F.has(k);
    const hl = st.hover || st.pin;
    const rev = has('reversed');
    const X = rev ? Core.linScale(-0.4, 0.4, 530, 110) : Core.linScale(-0.4, 0.4, 110, 530);
    const Y = Core.linScale(-150, 200, 410, 60);
    const X0 = X(0), Y0 = Y(0), sx = rev ? -1 : 1;
    const heads = has('symPos') || st.dir === 'heads';
    const arrows = !has('noDir');
    const wGrid = st.b * MM;
    const wAx = has('widths') ? 3 * st.b * MM : 2 * st.b * MM;
    const wCurve = has('widths') ? st.b * MM : 4 * st.b * MM;
    const hlText = k => (hl === k ? ' hl-text' : '');
    const A = {};                                   // Ankerpunkte für die Beschriftungen

    SVG.clear(svg);
    SVG.background(svg, W, H);

    // Netzlinien
    const showGrid = st.grid || hl === 'grid' || hl === 'widths';
    if (showGrid) {
      const g = el(svg, 'g', { class: 'grid' + (hl === 'grid' ? ' hl-lines' : '') });
      for (const v of Core.ticks(-0.4, 0.4, 0.1)) if (v) el(g, 'line', { x1: X(v), y1: Y(-150), x2: X(v), y2: Y(200), 'stroke-width': wGrid });
      for (const v of Core.ticks(-150, 200, 50)) if (v) el(g, 'line', { x1: X(-0.4), y1: Y(v), x2: X(0.4), y2: Y(v), 'stroke-width': wGrid });
      A.grid = [X(-0.3), Y(-50)];
    }

    // Achsen
    const xEnd = X(0.4) + sx * (heads && arrows ? 32 : 16), xStart = X(-0.4) - sx * 12;
    const yTop = Y(200) - (heads && arrows ? 32 : 16), yBot = Y(-150) + 12;
    const gCurve = el(svg, 'g', {});                // Kennlinie unter Achsen und Zahlen
    const gAx = el(svg, 'g', {});
    if (hl === 'axes') {
      el(gAx, 'line', { x1: xStart, y1: Y0, x2: xEnd, y2: Y0, class: 'hl', 'stroke-width': 8 });
      el(gAx, 'line', { x1: X0, y1: yBot, x2: X0, y2: yTop, class: 'hl', 'stroke-width': 8 });
    }
    el(gAx, 'line', { x1: xStart, y1: Y0, x2: xEnd - (heads && arrows ? sx * 9 : 0), y2: Y0, class: 'ax', 'stroke-width': wAx });
    el(gAx, 'line', { x1: X0, y1: yBot, x2: X0, y2: yTop + (heads && arrows ? 9 : 0), class: 'ax', 'stroke-width': wAx });

    // Teilstriche, Zahlenwerte, Einheiten
    const tickCls = 'tick' + (hl === 'scale' ? ' hl-tick' : '');
    const lab = v => fmt(v, 1, { noMinus: has('noMinus') });
    for (const v of Core.ticks(-0.4, 0.4, 0.1)) {
      if (!v) continue;
      el(gAx, 'line', { x1: X(v), y1: Y0 - 5, x2: X(v), y2: Y0 + 5, class: tickCls, 'stroke-width': wAx * 0.8 });
      SVG.text(gAx, X(v), Y0 + 22, lab(v), { 'text-anchor': 'middle', 'font-size': 14, class: 'halo' + hlText('nums') });
    }
    SVG.text(gAx, X0 + sx * 9, Y0 + 22, '0', { 'text-anchor': rev ? 'end' : 'start', 'font-size': 14, class: 'halo' + hlText('nums') });
    for (const v of Core.ticks(-150, 200, 50)) {
      if (!v) continue;
      el(gAx, 'line', { x1: X0 - 5, y1: Y(v), x2: X0 + 5, y2: Y(v), class: tickCls, 'stroke-width': wAx * 0.8 });
      SVG.text(gAx, X0 - 10, Y(v) + 5, lab(v), { 'text-anchor': 'end', 'font-size': 14, class: 'halo' + hlText('nums') });
    }
    SVG.text(gAx, X0 - 10, Y0 - 6, '0', { 'text-anchor': 'end', 'font-size': 14, class: 'halo' + hlText('nums') });
    A.nums = [[X(0.1), Y0 + 27], [X0 - 22, Y(-100) + 8]];
    if (hl === 'scale') {
      for (let v = 0.1; v < 0.4; v += 0.1) {
        SVG.arrow(svg, X(v + 0.05), Y0 - 14, X(v + 0.1) - sx * 2, Y0 - 14, { lineCls: 'hl-thin', headCls: 'hl-fill', l: 6, b: 2.5 });
        SVG.arrow(svg, X(v + 0.05), Y0 - 14, X(v) + sx * 2, Y0 - 14, { lineCls: 'hl-thin', headCls: 'hl-fill', l: 6, b: 2.5 });
      }
      SVG.text(svg, X(0.25), Y0 - 22, 'gleiche Abstände je 0,1 %', { 'text-anchor': 'middle', 'font-size': 13, class: 'halo hl-text' });
    }

    let unitY = '', unitX = '';
    if (has('unitPos')) {
      SVG.text(gAx, X0 - 10, Y(-125) + 5, 'N/mm²', { 'text-anchor': 'end', 'font-size': 14, class: 'halo' + hlText('unit') });
      SVG.text(gAx, X(-0.35), Y0 + 22, '%', { 'text-anchor': 'middle', 'font-size': 14, class: 'halo' + hlText('unit') });
      A.unitY = [X0 - 58, Y(-125)];
      A.unitX = [X(-0.35), Y0 + 10];
    } else if (st.unit === 'between') {
      SVG.text(gAx, X0 - 10, Y(175) + 5, 'N/mm²', { 'text-anchor': 'end', 'font-size': 14, class: 'halo' + hlText('unit') });
      SVG.text(gAx, X(0.35), Y0 + 22, '%', { 'text-anchor': 'middle', 'font-size': 14, class: 'halo' + hlText('unit') });
      A.unitY = [X0 - 60, Y(175)];
      A.unitX = [X(0.35) + sx * 2, Y0 + 9];
    } else {
      unitY = ' in N/mm²';
      unitX = ' in %';
    }

    // Kennzeichnung der Richtung und Formelzeichen
    const S = s => (has('upright') ? s : '*' + s + '*');
    const symCls = 'halo' + hlText('sym');
    const dirArrow = { lineCls: 'ax' + (hl === 'dir' ? ' hl-stroke' : ''), headCls: 'ax-head' + (hl === 'dir' ? ' hl-fill' : ''), w: 1.4, l: 12, b: 4 };
    if (has('symPos')) {
      // Fehlerbild: Formelzeichen am negativen Achsende
      if (arrows) { SVG.arrowHead(gAx, xEnd, Y0, rev ? 180 : 0, 13, 4.5, dirArrow.headCls); SVG.arrowHead(gAx, X0, yTop, -90, 13, 4.5, dirArrow.headCls); }
      SVG.text(gAx, xStart - sx * 8, Y0 + 6, S('ε') + unitX, { 'text-anchor': rev ? 'start' : 'end', 'font-size': 18, class: symCls });
      SVG.text(gAx, X0, yBot + 22, S('σ') + unitY, { 'text-anchor': 'middle', 'font-size': 18, class: symCls });
      A.symY = [X0 - 8, yBot + 10]; A.symX = [xStart - sx * 14, Y0 + 10];
      if (unitY) { A.unitY = [X0 + 20, yBot + 26]; A.unitX = [xStart - sx * 30, Y0 + 10]; }
    } else if (heads) {
      if (arrows) { SVG.arrowHead(gAx, xEnd, Y0, rev ? 180 : 0, 13, 4.5, dirArrow.headCls); SVG.arrowHead(gAx, X0, yTop, -90, 13, 4.5, dirArrow.headCls); }
      // Stelle der Pfeilspitze, auch wenn sie im Fehlerbild fehlt; mit Einheit beginnt der Text
      // unter der Spitze, damit die letzte Zahl frei bleibt
      const xTip = X(0.4) + sx * 32, yTip = Y(200) - 32;
      SVG.text(gAx, xTip - sx * (unitX ? 12 : 4), Y0 + 30, S('ε') + unitX,
        { 'text-anchor': unitX ? (rev ? 'end' : 'start') : 'middle', 'font-size': 18, class: symCls });
      SVG.text(gAx, X0 - 12, yTip + 7, S('σ') + unitY, { 'text-anchor': 'end', 'font-size': 18, class: symCls });
      A.symY = unitY ? [X0 - 96, yTip + 11] : [X0 - 24, yTip + 9];
      A.symX = [xTip - sx * 4, Y0 + 34];
      if (unitY) { A.unitY = [X0 - 40, yTip + 11]; A.unitX = [xTip + sx * 26, Y0 + 15]; }
    } else {
      const xa = X0 - 72, ya = Y0 + 46;
      if (arrows) {
        SVG.arrow(gAx, xa, Y(35), xa, Y(115), dirArrow);
        SVG.arrow(gAx, X(0.24), ya, X(0.4), ya, dirArrow);
      }
      SVG.text(gAx, xa, Y(35) + 24, S('σ') + unitY, { 'text-anchor': 'middle', 'font-size': 18, class: symCls });
      SVG.text(gAx, X(0.24) - sx * 9, ya + 6, S('ε') + unitX, { 'text-anchor': rev ? 'start' : 'end', 'font-size': 18, class: symCls });
      A.symY = [xa - 10, Y(35) + 12];
      A.symX = [X(0.24) - sx * 18, ya + 12];
      if (unitY) { A.unitY = [xa - 30, Y(35) + 30]; A.unitX = [X(0.24) - sx * 30, ya + 12]; }
    }

    // Kennlinie
    const d =SVG.plotFn(sig, -0.38, 0.38, X, Y, 120);
    if (hl === 'curve') el(gCurve, 'path', { d, class: 'hl', 'stroke-width': wCurve + 6 });
    el(gCurve, 'path', { d, class: 'curve', 'stroke-width': wCurve });
    A.curve = [X(0.16), Y(sig(0.16))];

    if (st.callouts && !st.faults) drawCallouts(A, X, Y, X0, Y0, sx, showGrid);
    widthLegend(wGrid, wAx, wCurve, hl === 'widths');
  }

  // Linienbreiten unter dem Diagramm (im Fehlerbild ausgeblendet, sonst verrät sie den Fehler)
  function widthLegend(wg, wa, wc, active) {
    const leg = $('a-legend');
    leg.hidden = !!st.faults;
    leg.classList.toggle('active', active);
    const k = 1.4;                                  // Bildschirmmaßstab des Diagramms
    leg.innerHTML = [['Netzlinie', wg, 'grid'], ['Achse', wa, 'ax'], ['Kennlinie', wc, 'curve']].map(([n, w, c]) =>
      `<span><svg width="44" height="12" aria-hidden="true"><line x1="2" y1="6" x2="42" y2="6" class="${c}" stroke-width="${(w * k).toFixed(2)}"/></svg>`
      + `${n} ${fmt(w / MM, 2)} mm</span>`).join('')
      + `<span class="ratio">= ${fmt(1)} : ${fmt(wa / wg, 1)} : ${fmt(wc / wg, 1)}</span>`;
  }

  function drawCallouts(A, X, Y, X0, Y0, sx, showGrid) {
    const g = el(svg, 'g', {});
    const call = (tx, ty, anchor, str, leaders) => {
      for (const [x1, y1, x2, y2] of leaders) el(g, 'line', { x1, y1, x2, y2, class: 'callout' });
      const lines = str.split('\n');
      lines.forEach((s, i) => SVG.text(g, tx, ty + i * 18, s, { 'text-anchor': anchor, 'font-size': 16, class: 'callout-text halo' }));
    };
    // Einheit an der Ordinate und an der Abszisse
    if (A.unitY) call(26, Y(175) + 5, 'start', 'Einheit', [[90, Y(175), A.unitY[0], A.unitY[1]]]);
    if (A.unitX) call(X(0.31), Y(62), 'middle', 'Einheit', [[X(0.32), Y(62) + 6, A.unitX[0], A.unitX[1]]]);
    // Formelzeichen (bei Pfeilspitzen oben, damit sich die Hinweislinien nicht kreuzen)
    const fy = st.dir === 'heads' ? 30 : Y(95);
    call(26, fy, 'start', 'Formel-\nzeichen', [[100, fy + 4, A.symY[0], A.symY[1]]]);
    // Kennlinie
    call(X(0.1), Y(186), 'middle', 'Kennlinie', [[X(0.115), Y(186) + 6, A.curve[0], A.curve[1]]]);
    // Größe der Zahlenwerte
    call(X(0.08), Y(-102), 'start', 'Größe der\nZahlenwerte', [
      [X(0.1) + 10, Y(-102) - 16, A.nums[0][0], A.nums[0][1]],
      [X(0.08) - 6, Y(-102) - 5, A.nums[1][0], A.nums[1][1]]
    ]);
    if (showGrid && A.grid) call(26, Y(-48) , 'start', 'Netzlinien', [[105, Y(-48) - 4, X(-0.2), Y(-75)], [105, Y(-48) - 4, X(-0.3), Y(-100)]]);
  }

  // ---------------------------------------------------------------- Regeln und Fehlerbilder
  function renderRules() {
    $('a-rules').innerHTML = RULES.map(([k, t, s]) =>
      `<li class="hover-able${st.pin === k ? ' active' : ''}" data-key="${k}"><b>${t}</b> ${s}</li>`).join('');
  }

  const rulesEl = $('a-rules');
  rulesEl.addEventListener('mouseover', e => {
    const li = e.target.closest('li');
    const k = li ? li.dataset.key : null;
    if (k !== st.hover) { st.hover = k; render(); }
  });
  rulesEl.addEventListener('mouseleave', () => { st.hover = null; render(); });
  rulesEl.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    st.pin = st.pin === li.dataset.key ? null : li.dataset.key;
    renderRules();
    render();
  });

  function newFaults() {
    const keys = FAULTS.map(f => f[0]).sort(() => Math.random() - 0.5);
    st.faults = new Set(keys.slice(0, 2 + Math.floor(Math.random() * 2)));
    st.checked = new Set();
    st.done = false;
    $('a-faults').hidden = false;
    $('a-check').hidden = false;
    $('a-fix').hidden = false;
    $('a-quiz-intro').textContent = 'Welche Regeln verletzt dieses Diagramm? Zutreffendes ankreuzen.';
    feedback('a-feedback', '');
    renderFaults();
    render();
  }

  function renderFaults() {
    $('a-faults').innerHTML = FAULTS.map(([k, t]) => {
      let state = '';
      if (st.done) {
        const real = st.faults.has(k), ticked = st.checked.has(k);
        state = real && ticked ? '<span class="state ok">gefunden</span>'
          : real ? '<span class="state bad">übersehen</span>'
          : ticked ? '<span class="state bad">kein Fehler</span>' : '';
      }
      return `<li><label class="chk"><input type="checkbox" data-k="${k}"${st.checked.has(k) ? ' checked' : ''}${st.done ? ' disabled' : ''}> ${t}</label>${state}</li>`;
    }).join('');
  }

  $('a-faults').addEventListener('change', e => {
    const k = e.target.dataset.k;
    if (!k) return;
    if (e.target.checked) st.checked.add(k); else st.checked.delete(k);
  });

  function check() {
    if (!st.faults || st.done) return;
    st.done = true;
    const found = [...st.faults].filter(k => st.checked.has(k)).length;
    const wrong = [...st.checked].filter(k => !st.faults.has(k)).length;
    const ok = found === st.faults.size && !wrong;
    st.score[1]++;
    if (ok) st.score[0]++;
    $('a-score').textContent = `${st.score[0]} / ${st.score[1]} fehlerfrei`;
    feedback('a-feedback', ok ? 'Alle Fehler gefunden.'
      : `${found} von ${st.faults.size} Fehlern gefunden${wrong ? `, ${wrong} Fehlalarm${wrong > 1 ? 'e' : ''}` : ''}.`, ok);
    $('a-check').hidden = true;
    renderFaults();
  }

  function endQuiz() {
    st.faults = null;
    st.done = false;
    $('a-faults').hidden = true;
    $('a-check').hidden = true;
    $('a-fix').hidden = true;
    $('a-quiz-intro').textContent = 'Erzeugt ein Diagramm mit zwei bis drei Regelverstößen.';
    feedback('a-feedback', '');
    render();
  }

  seg('a-dir', v => { st.dir = v; render(); });
  seg('a-unit', v => { st.unit = v; render(); });
  seg('a-widths', v => { st.b = +v; render(); });
  chk('a-callouts', v => { st.callouts = v; render(); });
  chk('a-grid', v => { st.grid = v; render(); });
  $('a-new').addEventListener('click', newFaults);
  $('a-fix').addEventListener('click', endQuiz);
  $('a-check').addEventListener('click', check);

  function reset() {
    Object.assign(st, { dir: 'parallel', unit: 'between', callouts: true, grid: false, b: 0.25, pin: null });
    setSeg('a-dir', 'parallel'); setSeg('a-unit', 'between'); setSeg('a-widths', '0.25');
    $('a-callouts').checked = true; $('a-grid').checked = false;
    renderRules();
    endQuiz();
  }

  UI.register('aufbau', { render, reset, state: st, newFaults });
  renderRules();
  render();
})();

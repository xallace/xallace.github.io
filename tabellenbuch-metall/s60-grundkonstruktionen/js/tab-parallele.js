/* Reiter 1: Parallele zu einer Strecke (Tabellenbuch Metall S. 60 oben)
   Gegeben: Strecke AB und Punkt P auf gesuchter Parallele g'.
   1. Kreisbogen mit Radius r um A ergibt Schnittpunkt C.
   2. Kreisbogen mit Radius r um P.
   3. Kreisbogen mit Radius r um C ergibt Schnittpunkt D.
   4. Verbindungslinie PD ist Parallele g' zu AB. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 440, SCALE = 4; // 4 px = 1 mm
  const STEPS = [
    [1, 'Kreisbogen 1 um A', 'Kreisbogen mit Radius <i>r</i> = <span class="overline">AP</span> um A schlagen; ergibt Schnittpunkt C auf <span class="overline">AB</span>.'],
    [2, 'Kreisbogen 2 um P', 'Kreisbogen mit gleichem Radius <i>r</i> um P in Richtung B schlagen.'],
    [3, 'Kreisbogen 3 um C', 'Kreisbogen mit Radius <i>r</i> um C schlagen; ergibt Schnittpunkt D mit Bogen 2.'],
    [4, 'Parallele g′ ziehen', 'Verbindungslinie durch P und D ziehen – sie ist die gesuchte Parallele g′ zu <span class="overline">AB</span>.']
  ];

  const BOOK_STATE = () => ({
    A: pt(116, 344),
    B: pt(524, 344),
    P: pt(220, 168),
    step: 4,
    showRadii: true,
    showRhombus: false,
    showDist: false,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('par-svg');
  const player = bindStepPlayer('par', 4, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const res = Core.constructParallel(st.A, st.B, st.P);
    if (!res.ok) return;
    const { A, B, P, C, D, r } = res;

    // Optional: Rauten-Beweis ACDP im Hintergrund
    if (st.showRhombus && st.step >= 3) {
      el(svg, 'polygon', {
        points: `${A.x.toFixed(1)},${A.y.toFixed(1)} ${C.x.toFixed(1)},${C.y.toFixed(1)} ${D.x.toFixed(1)},${D.y.toFixed(1)} ${P.x.toFixed(1)},${P.y.toFixed(1)}`,
        class: 'proof-fill'
      });
      const center = pt((A.x + D.x) / 2, (A.y + D.y) / 2);
      SVG.text(svg, center.x, center.y + 4, 'Raute *ACDP* (*a* = *r*)', {
        'text-anchor': 'middle', 'font-size': 13.5, class: 'halo lbl-strong'
      });
    }

    // Optional: Lotabstand h
    if (st.showDist) {
      const foot = res.footP;
      el(svg, 'line', {
        x1: P.x.toFixed(1), y1: P.y.toFixed(1), x2: foot.x.toFixed(1), y2: foot.y.toFixed(1),
        class: 'proof-line'
      });
      SVG.rightAngle(svg, foot, P, B, 16, { lineCls: 'proof-line' });
      SVG.text(svg, (P.x + foot.x) / 2 - 10, (P.y + foot.y) / 2 + 4, `*h* = ${fmt(res.distH / SCALE, 1)} mm`, {
        'text-anchor': 'end', 'font-size': 13.5, class: 'halo'
      });
    }

    // Gegebene Strecke AB mit Endstrichen
    SVG.segmentWithTicks(svg, A, B, { w: 2.5 });
    SVG.text(svg, A.x, A.y + 24, 'A', { 'text-anchor': 'middle', 'font-size': 15.5 });
    SVG.text(svg, B.x, B.y + 24, 'B', { 'text-anchor': 'middle', 'font-size': 15.5 });

    // Schritt 1: Kreisbogen 1 mit Radius r um A durch P und C
    if (st.step >= 1) {
      const cls1 = 'arc-line' + (hl === 1 ? ' hl' : '');
      SVG.arcBetweenPoints(svg, A, r, P, C, 12, { cls: cls1 });
      if (st.showRadii) {
        const angP = SVG.screenAngle(A, P);
        const angC = SVG.screenAngle(A, C);
        SVG.radiusArrow(svg, A, r, angP + (angC - angP) * 0.34, '*r*', { labelSide: 'left', labelOffset: 12 });
      }
      const mid1 = SVG.screenPolar(A, r + 15, SVG.screenAngle(A, C) - 18);
      SVG.stepNum(svg, mid1.x, mid1.y + 5, 1, { hl: hl === 1 });
      el(svg, 'line', { x1: C.x.toFixed(1), y1: (C.y - 5).toFixed(1), x2: C.x.toFixed(1), y2: (C.y + 5).toFixed(1), class: 'thin-line' });
      SVG.text(svg, C.x, C.y + 24, 'C', { 'text-anchor': 'middle', 'font-size': 15.5, class: hl === 1 ? 'hl-text' : '' });
    }

    // Schritt 2: Kreisbogen 2 mit Radius r um P (um D herum, wie im Buch nach oben/rechts)
    if (st.step >= 2) {
      const cls2 = 'arc-line' + (hl === 2 ? ' hl' : '');
      const angD = SVG.screenAngle(P, D);
      SVG.compassArc(svg, P, r, angD - 24, angD + 16, { cls: cls2 });
      if (st.showRadii) {
        SVG.radiusArrow(svg, P, r, angD - 15, '*r*', { labelSide: 'left', labelOffset: 11 });
      }
      const pNum2 = SVG.screenPolar(P, r + 14, angD - 16);
      SVG.stepNum(svg, pNum2.x, pNum2.y + 4, 2, { hl: hl === 2 });
    }

    // Schritt 3: Kreisbogen 3 mit Radius r um C ergibt Schnittpunkt D
    if (st.step >= 3) {
      const cls3 = 'arc-line' + (hl === 3 ? ' hl' : '');
      const angCD = SVG.screenAngle(C, D);
      SVG.compassArc(svg, C, r, angCD - 16, angCD + 26, { cls: cls3 });
      if (st.showRadii) {
        SVG.radiusArrow(svg, C, r, angCD + 15, '*r*', { labelSide: 'right', labelOffset: 11 });
      }
      const pNum3 = SVG.screenPolar(C, r + 15, angCD + 16);
      SVG.stepNum(svg, pNum3.x, pNum3.y + 5, 3, { hl: hl === 3 });
      SVG.text(svg, D.x + 12, D.y - 10, 'D', { 'text-anchor': 'start', 'font-size': 15.5, class: 'halo' + (hl === 3 ? ' hl-text' : '') });
    }

    // Schritt 4: Verbindungsgerade PD ist Parallele g' zu AB
    if (st.step >= 4) {
      const u = unit(sub(D, P));
      const pStart = sub(P, scale(u, 65));
      const pEnd = add(D, scale(u, 75));
      el(svg, 'line', {
        x1: pStart.x.toFixed(1), y1: pStart.y.toFixed(1),
        x2: pEnd.x.toFixed(1), y2: pEnd.y.toFixed(1),
        class: 'res-line' + (hl === 4 ? ' hl' : ''),
        'stroke-width': 2.2
      });
      SVG.stepNum(svg, pStart.x + 22, pStart.y - 8, 4, { hl: hl === 4 });
      SVG.text(svg, pEnd.x + 8, pEnd.y + 5, 'g′', { 'text-anchor': 'start', 'font-size': 16, class: 'halo' + (hl === 4 ? ' hl-text' : '') });
    }

    // Ziehpunkte P, A, B
    SVG.point(svg, P, { drag: 'P', label: 'P', dx: -4, dy: -11 });
    el(svg, 'circle', { cx: A.x.toFixed(1), cy: A.y.toFixed(1), r: 14, class: 'pt-hit', 'data-drag': 'A' });
    el(svg, 'circle', { cx: B.x.toFixed(1), cy: B.y.toFixed(1), r: 14, class: 'pt-hit', 'data-drag': 'B' });

    updateSide(res);
  }

  function updateSide(res) {
    const rMm = res.r / SCALE;
    const hMm = res.distH / SCALE;
    const abMm = res.abLen / SCALE;
    $('par-h').value = Math.round(hMm);
    $('par-h-out').textContent = `${fmt(hMm, 1)} mm`;
    $('par-result').innerHTML = `g′ ∥ <span class="overline">AB</span> &nbsp;·&nbsp; Δφ = ${fmt(res.angleDiffDeg, 2)}°`;
    $('par-details').innerHTML = [
      ['Strecke <span class="overline">AB</span>', `${fmt(abMm, 1)} mm`],
      ['Zirkelradius <i>r</i> = <span class="overline">AP</span>', `${fmt(rMm, 1)} mm`],
      ['Abschnitt <span class="overline">AC</span> = <span class="overline">PD</span> = <span class="overline">CD</span>', `${fmt(rMm, 1)} mm`],
      ['Lotabstand <i>h</i> (g′ zu <span class="overline">AB</span>)', `${fmt(hMm, 1)} mm`],
      ['Steigungswinkel Δφ', `${fmt(res.angleDiffDeg, 2)}° (parallel)`]
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    $('par-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} richtig` : '';
  }

  // Ziehen im SVG
  svg.addEventListener('pointerdown', e => {
    const hit = e.target.closest('[data-drag]');
    if (!hit) return;
    const which = hit.dataset.drag;
    player.stopTimer();
    SVG.startDrag(svg, e, loc => {
      if (which === 'P') {
        st.P.x = Math.max(90, Math.min(360, loc.x));
        st.P.y = Math.max(65, Math.min(st.A.y - 60, loc.y));
      } else if (which === 'A') {
        st.A.x = Math.max(60, Math.min(260, loc.x));
        st.A.y = Math.max(250, Math.min(390, loc.y));
      } else if (which === 'B') {
        st.B.x = Math.max(380, Math.min(585, loc.x));
        st.B.y = Math.max(250, Math.min(390, loc.y));
      }
      render();
    });
  });

  $('par-h').addEventListener('input', e => {
    const hPx = +e.target.value * SCALE;
    const res = Core.constructParallel(st.A, st.B, st.P);
    const n = unit(sub(st.P, res.footP));
    st.P = add(res.footP, scale(n, hPx));
    render();
  });

  chk('par-radii', v => { st.showRadii = v; render(); });
  chk('par-rhombus', v => { st.showRhombus = v; render(); });
  chk('par-dist', v => { st.showDist = v; render(); });

  // Übungsaufgabe
  function newQuiz() {
    const rMm = UI.rnd(35, 65, 5);
    const hMm = UI.rnd(20, rMm - 5, 5);
    const kinds = ['cd', 'pd'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    st.quiz = { rMm, hMm, kind, truth: rMm, answered: false };
    $('par-task').innerHTML = kind === 'cd'
      ? `Bei der Parallelenkonstruktion nach S. 60 beträgt der Abstand <span class="overline">AP</span> = <b>${fmt(rMm, 0)} mm</b> und der Lotabstand <i>h</i> = ${fmt(hMm, 0)} mm. Mit welchem Zirkelradius <i>r</i> wird in Schritt 3 der Kreisbogen um C geschlagen?`
      : `Gegeben ist <span class="overline">AP</span> = <i>r</i> = <b>${fmt(rMm, 0)} mm</b>. Wie groß ist der Abstand <span class="overline">PD</span> der beiden Punkte auf der Parallelen <i>g′</i> (Raute <i>ACDP</i>)?`;
    $('par-ans-unit').textContent = 'mm';
    $('par-ans').value = '';
    $('par-ans-row').hidden = false;
    feedback('par-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const v = Core.parseNum($('par-ans').value);
    if (!isFinite(v)) { feedback('par-feedback', 'Bitte eine Zahl in mm eingeben.', false); return; }
    const ok = Math.abs(v - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('par-feedback', ok
      ? `Richtig! Alle 3 Kreisbögen nutzen denselben Radius r = ${fmt(st.quiz.truth, 0)} mm (Raute ACDP).`
      : `Nicht ganz: In allen 3 Schritten bleibt der Zirkel unverändert auf r = AP = ${fmt(st.quiz.truth, 0)} mm eingestellt (nicht h = ${fmt(st.quiz.hMm, 0)} mm).`, ok);
    $('par-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('par-quiz').addEventListener('click', newQuiz);
  $('par-check').addEventListener('click', checkQuiz);
  onEnter('par-ans', checkQuiz);

  function reset() {
    player.stopTimer();
    Object.assign(st, BOOK_STATE());
    $('par-radii').checked = true;
    $('par-rhombus').checked = $('par-dist').checked = false;
    $('par-ans-row').hidden = true;
    $('par-task').textContent = '';
    feedback('par-feedback', '');
    player.updateStepUI();
    render();
  }

  UI.register('parallele', { render, reset, state: st });
  player.updateStepUI();
  render();
})();

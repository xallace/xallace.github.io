/* Tab 1: Parallel line to a line segment (Plate IV)
   Given: segment AB and point P on the desired parallel line g'.
   1. Arc of radius r around A yields intersection C.
   2. Arc of radius r around P.
   3. Arc of radius r around C yields intersection D.
   4. Connecting line PD is the parallel line g' to AB. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 440, SCALE = 4; // 4 px = 1 mm
  const STEPS = [
    [1, 'Arc 1 around A', 'Strike an arc of radius <i>r</i> = <span class="overline">AP</span> centered at A; this yields intersection C on <span class="overline">AB</span>.'],
    [2, 'Arc 2 around P', 'Strike an arc of the same radius <i>r</i> centered at P toward B.'],
    [3, 'Arc 3 around C', 'Strike an arc of radius <i>r</i> centered at C; this intersects arc 2 at point D.'],
    [4, 'Draw parallel g′', 'Draw the line through P and D — this is the desired parallel line g′ to <span class="overline">AB</span>.']
  ];

  const DEFAULT_STATE = () => ({
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

  const st = DEFAULT_STATE();
  const svg = $('par-svg');
  const player = bindStepPlayer('par', 4, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const res = Core.constructParallel(st.A, st.B, st.P);
    if (!res.ok) return;
    const { A, B, P, C, D, r } = res;

    // Optional: rhombus proof ACDP in the background
    if (st.showRhombus && st.step >= 3) {
      el(svg, 'polygon', {
        points: `${A.x.toFixed(1)},${A.y.toFixed(1)} ${C.x.toFixed(1)},${C.y.toFixed(1)} ${D.x.toFixed(1)},${D.y.toFixed(1)} ${P.x.toFixed(1)},${P.y.toFixed(1)}`,
        class: 'proof-fill'
      });
      const center = pt((A.x + D.x) / 2, (A.y + D.y) / 2);
      SVG.text(svg, center.x, center.y + 4, 'Rhombus *ACDP* (*a* = *r*)', {
        'text-anchor': 'middle', 'font-size': 13.5, class: 'halo lbl-strong'
      });
    }

    // Optional: perpendicular distance h
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

    // Given segment AB with end ticks
    SVG.segmentWithTicks(svg, A, B, { w: 2.5 });
    SVG.text(svg, A.x, A.y + 24, 'A', { 'text-anchor': 'middle', 'font-size': 15.5 });
    SVG.text(svg, B.x, B.y + 24, 'B', { 'text-anchor': 'middle', 'font-size': 15.5 });

    // Step 1: Arc 1 of radius r around A through P and C
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

    // Step 2: Arc 2 of radius r around P (passing near D)
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

    // Step 3: Arc 3 of radius r around C yields intersection D
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

    // Step 4: Line PD is the parallel line g' to AB
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

    // Draggable points P, A, B
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
      ['Segment <span class="overline">AB</span>', `${fmt(abMm, 1)} mm`],
      ['Compass radius <i>r</i> = <span class="overline">AP</span>', `${fmt(rMm, 1)} mm`],
      ['Segments <span class="overline">AC</span> = <span class="overline">PD</span> = <span class="overline">CD</span>', `${fmt(rMm, 1)} mm`],
      ['Perpendicular distance <i>h</i> (g′ to <span class="overline">AB</span>)', `${fmt(hMm, 1)} mm`],
      ['Slope difference Δφ', `${fmt(res.angleDiffDeg, 2)}° (parallel)`]
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    $('par-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} correct` : '';
  }

  // Dragging inside the SVG
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

  // Practice question
  function newQuiz() {
    const rMm = UI.rnd(35, 65, 5);
    const hMm = UI.rnd(20, rMm - 5, 5);
    const kinds = ['cd', 'pd'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    st.quiz = { rMm, hMm, kind, truth: rMm, answered: false };
    $('par-task').innerHTML = kind === 'cd'
      ? `In the parallel-line compass construction, the distance is <span class="overline">AP</span> = <b>${fmt(rMm, 0)} mm</b> and the perpendicular distance is <i>h</i> = ${fmt(hMm, 0)} mm. Which compass radius <i>r</i> is used in step 3 to strike the arc around C?`
      : `Given <span class="overline">AP</span> = <i>r</i> = <b>${fmt(rMm, 0)} mm</b>. What is the distance <span class="overline">PD</span> between the two points on parallel line <i>g′</i> (rhombus <i>ACDP</i>)?`;
    $('par-ans-unit').textContent = 'mm';
    $('par-ans').value = '';
    $('par-ans-row').hidden = false;
    feedback('par-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const v = Core.parseNum($('par-ans').value);
    if (!isFinite(v)) { feedback('par-feedback', 'Please enter a number in mm.', false); return; }
    const ok = Math.abs(v - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('par-feedback', ok
      ? `Correct! All 3 arcs use the same radius r = ${fmt(st.quiz.truth, 0)} mm (rhombus ACDP).`
      : `Not quite: throughout all 3 steps the compass remains fixed at r = AP = ${fmt(st.quiz.truth, 0)} mm (not h = ${fmt(st.quiz.hMm, 0)} mm).`, ok);
    $('par-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
  }

  $('par-quiz').addEventListener('click', newQuiz);
  $('par-check').addEventListener('click', checkQuiz);
  onEnter('par-ans', checkQuiz);

  function reset() {
    player.stopTimer();
    Object.assign(st, DEFAULT_STATE());
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

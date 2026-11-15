/* Tab 3: Dropping a perpendicular (Tabellenbuch Metall p. 60, row 3)
   Given: line g and point P
   1. Arbitrary arc 1 around P yields intersections A and B.
   2. Arc 2 of radius r around A; r > 1/2 AB.
   3. Arc 3 of the same radius r around B (intersection C).
   4. The line connecting intersection C and P is the desired perpendicular. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 4; // 4 px = 1 mm
  const STEPS = [
    [1, 'Arc 1 around P', 'An arbitrary arc 1 around P (radius larger than perpendicular distance) gives intersections A and B on line g.'],
    [2, 'Arc 2 around A', 'Strike arc 2 of radius <i>r</i> centered at A; condition: <i>r</i> &gt; ½ <span class="overline">AB</span>.'],
    [3, 'Arc 3 around B', 'Strike arc 3 of the same radius <i>r</i> centered at B (intersection C).'],
    [4, 'Connect perpendicular', 'Line 4 connecting intersection C and P is the desired perpendicular onto line g.']
  ];

  const BOOK_STATE = () => ({
    G1: pt(85, 224),
    G2: pt(555, 224),
    P: pt(320, 68),
    r1Mm: 68,
    r2Mm: 60,
    step: 4,
    showRadii: true,
    showProof: false,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('lot-svg');
  const player = bindStepPlayer('lot', 4, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const r1Px = st.r1Mm * SCALE;
    const r2Px = st.r2Mm * SCALE;
    const res = Core.constructDropPerp(st.G1, st.G2, st.P, r1Px, r2Px);

    // Given line g
    el(svg, 'line', {
      x1: st.G1.x.toFixed(1), y1: st.G1.y.toFixed(1),
      x2: st.G2.x.toFixed(1), y2: st.G2.y.toFixed(1),
      class: 'given-line', 'stroke-width': 2.5
    });
    SVG.text(svg, st.G1.x - 12, st.G1.y + 5, 'g', { 'text-anchor': 'end', 'font-size': 16 });

    if (!res.ok) {
      if (res.stepFailed === 1) {
        SVG.compassArc(svg, st.P, r1Px, 25, 155, { cls: 'warn-arc' });
        SVG.text(svg, st.P.x, st.G1.y + 45,
          `Arc 1 does not reach line g: r₁ (${fmt(st.r1Mm, 0)} mm) must be > perpendicular distance d (${fmt(res.distP / SCALE, 1)} mm)!`,
          { 'text-anchor': 'middle', 'font-size': 14, class: 'halo step-num' });
      } else {
        const { A, B } = res;
        SVG.arcBetweenPoints(svg, st.P, r1Px, B, A, 10, { cls: 'arc-line' });
        SVG.point(svg, A, { label: 'A', dx: -10, dy: -10 });
        SVG.point(svg, B, { label: 'B', dx: 10, dy: -10 });
        SVG.compassArc(svg, A, r2Px, -15, 75, { cls: 'warn-arc' });
        SVG.compassArc(svg, B, r2Px, 105, 195, { cls: 'warn-arc' });
        SVG.text(svg, (A.x + B.x) / 2, st.G1.y + 115,
          `Arcs 2 & 3 do not intersect: r (${fmt(st.r2Mm, 0)} mm) must be > ½ AB (${fmt(res.halfAB / SCALE, 1)} mm)!`,
          { 'text-anchor': 'middle', 'font-size': 14, class: 'halo step-num' });
      }
      SVG.point(svg, st.P, { drag: 'P', label: 'P', dx: 14, dy: 5 });
      updateSide(res);
      return;
    }

    const { P, A, B, C, foot } = res;

    // Optional: symmetry kite PACB & right angle
    if (st.showProof && st.step >= 3) {
      el(svg, 'polygon', {
        points: `${P.x.toFixed(1)},${P.y.toFixed(1)} ${A.x.toFixed(1)},${A.y.toFixed(1)} ${C.x.toFixed(1)},${C.y.toFixed(1)} ${B.x.toFixed(1)},${B.y.toFixed(1)}`,
        class: 'proof-fill'
      });
      if (st.step >= 4) SVG.rightAngle(svg, foot, P, B, 18);
    }

    // Step 1: Arc 1 around P gives intersections A and B
    if (st.step >= 1) {
      const cls1 = 'arc-line' + (hl === 1 ? ' hl' : '');
      SVG.arcBetweenPoints(svg, P, r1Px, B, A, 10, { cls: cls1 });
      const pNum1 = SVG.screenPolar(P, r1Px, SVG.screenAngle(P, A) + 8);
      SVG.stepNum(svg, pNum1.x - 10, pNum1.y - 8, 1, { hl: hl === 1 });
      SVG.point(svg, A, { label: 'A', dx: -6, dy: -12, labelCls: hl === 1 ? 'hl-text' : '' });
      SVG.point(svg, B, { label: 'B', dx: 6, dy: -12, labelCls: hl === 1 ? 'hl-text' : '' });
    }

    // Step 2: Arc 2 of radius r around A
    if (st.step >= 2) {
      const cls2 = 'arc-line' + (hl === 2 ? ' hl' : '');
      const angAC = SVG.screenAngle(A, C);
      SVG.compassArc(svg, A, r2Px, angAC - 22, angAC + 10, { cls: cls2 });
      if (st.showRadii) {
        SVG.radiusArrow(svg, A, r2Px, angAC + 3, '*r*', { labelSide: 'right', labelOffset: 11 });
      }
      const pNum2 = SVG.screenPolar(A, r2Px - 28, angAC - 14);
      SVG.stepNum(svg, pNum2.x + 12, pNum2.y, 2, { hl: hl === 2 });
    }

    // Step 3: Arc 3 of same radius r around B (intersection C)
    if (st.step >= 3) {
      const cls3 = 'arc-line' + (hl === 3 ? ' hl' : '');
      const angBC = SVG.screenAngle(B, C);
      SVG.compassArc(svg, B, r2Px, angBC - 10, angBC + 22, { cls: cls3 });
      if (st.showRadii) {
        SVG.radiusArrow(svg, B, r2Px, angBC - 3, '*r*', { labelSide: 'left', labelOffset: 11 });
      }
      const pNum3 = SVG.screenPolar(B, r2Px + 14, angBC - 8);
      SVG.stepNum(svg, pNum3.x + 6, pNum3.y + 4, 3, { hl: hl === 3 });
      SVG.text(svg, C.x, C.y + 24, 'C', { 'text-anchor': 'middle', 'font-size': 15.5, class: 'halo' + (hl === 3 ? ' hl-text' : '') });
    }

    // Step 4: Line connecting C and P is the desired perpendicular
    if (st.step >= 4) {
      const u = unit(sub(C, P));
      const pTop = sub(P, scale(u, 14));
      const pBot = add(C, scale(u, 18));
      el(svg, 'line', {
        x1: pTop.x.toFixed(1), y1: pTop.y.toFixed(1),
        x2: pBot.x.toFixed(1), y2: pBot.y.toFixed(1),
        class: 'res-line' + (hl === 4 ? ' hl' : ''),
        'stroke-width': 2.2
      });
      SVG.stepNum(svg, P.x + 14, (P.y + foot.y) / 2, 4, { hl: hl === 4 });
    }

    // Draggable point P
    SVG.point(svg, P, { drag: 'P', label: 'P', dx: 14, dy: 5 });

    updateSide(res);
  }

  function updateSide(res) {
    $('lot-r1').value = st.r1Mm;
    $('lot-r1-out').textContent = `${fmt(st.r1Mm, 0)} mm`;
    $('lot-r2').value = st.r2Mm;
    $('lot-r2-out').textContent = `${fmt(st.r2Mm, 0)} mm`;
    const resEl = $('lot-result');
    if (!res.ok) {
      resEl.className = 'result warn';
      resEl.innerHTML = res.stepFailed === 1
        ? `Step 1: <i>r</i><sub>1</sub> ≤ perp. distance <i>d</i> (${fmt(res.distP / SCALE, 1)} mm)`
        : `Step 2: <i>r</i> ≤ ½ <span class="overline">AB</span> (${fmt(res.halfAB / SCALE, 1)} mm)`;
    } else {
      resEl.className = 'result';
      resEl.innerHTML = `<span class="overline">PC</span> ⊥ g &nbsp;·&nbsp; Angle = ${fmt(res.perpAngleDeg, 1)}°`;
    }
    const dMm = res.distP / SCALE;
    const abMm = res.ok || res.abLen ? (res.abLen / SCALE) : 0;
    $('lot-details').innerHTML = [
      ['Perpendicular distance <i>d</i>(P, g)', `${fmt(dMm, 1)} mm`],
      ['Arc 1 around P (<i>r</i><sub>1</sub> &gt; <i>d</i>)', `${fmt(st.r1Mm, 0)} mm`],
      ['Chord <span class="overline">AB</span> on line g', abMm ? `${fmt(abMm, 1)} mm` : '–'],
      ['Minimum radius ½ <span class="overline">AB</span>', abMm ? `&gt; ${fmt(abMm / 2, 1)} mm` : '–'],
      ['Arcs 2 &amp; 3 around A, B (<i>r</i>)', `${fmt(st.r2Mm, 0)} mm`]
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    $('lot-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} correct` : '';
  }

  svg.addEventListener('pointerdown', e => {
    const hit = e.target.closest('[data-drag="P"]');
    if (!hit) return;
    player.stopTimer();
    SVG.startDrag(svg, e, loc => {
      st.P.x = Math.max(170, Math.min(470, loc.x));
      st.P.y = Math.max(40, Math.min(185, loc.y));
      render();
    });
  });

  $('lot-r1').addEventListener('input', e => { st.r1Mm = +e.target.value; render(); });
  $('lot-r2').addEventListener('input', e => { st.r2Mm = +e.target.value; render(); });
  chk('lot-radii', v => { st.showRadii = v; render(); });
  chk('lot-proof', v => { st.showProof = v; render(); });

  function newQuiz() {
    // Pythagorean triples (d, halfAB, r1)
    const cases = [[36, 48, 60], [40, 30, 50], [24, 32, 40], [45, 60, 75]];
    const [d, half, r1] = cases[Math.floor(Math.random() * cases.length)];
    const ask = Math.random() < 0.5 ? 'ab' : 'minR';
    const truth = ask === 'ab' ? 2 * half : half;
    st.quiz = { d, half, r1, truth, answered: false };
    $('lot-task').innerHTML = ask === 'ab'
      ? `Point P has perpendicular distance <i>d</i> = <b>${d} mm</b> from line g. Arc 1 around P is struck with radius <i>r</i><sub>1</sub> = <b>${r1} mm</b>. What is the length of chord <span class="overline">AB</span> cut off on g (<span class="overline">AB</span> = 2·√(<i>r</i><sub>1</sub><sup>2</sup> − <i>d</i><sup>2</sup>))?`
      : `Arc 1 around P cuts points A and B on line g at distance <span class="overline">AB</span> = <b>${2 * half} mm</b>. What value (in mm) must the radius <i>r</i> of arcs 2 and 3 strictly exceed?`;
    $('lot-ans-unit').textContent = 'mm';
    $('lot-ans').value = '';
    $('lot-ans-row').hidden = false;
    feedback('lot-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const v = Core.parseNum($('lot-ans').value);
    if (!isFinite(v)) { feedback('lot-feedback', 'Please enter a number in mm.', false); return; }
    const ok = Math.abs(v - st.quiz.truth) <= 0.25;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('lot-feedback', ok
      ? `Correct: ${fmt(st.quiz.truth, 0)} mm!`
      : `Expected: ${fmt(st.quiz.truth, 0)} mm (half-chord = ${st.quiz.half} mm, full chord AB = ${2 * st.quiz.half} mm).`, ok);
    $('lot-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
  }

  $('lot-quiz').addEventListener('click', newQuiz);
  $('lot-check').addEventListener('click', checkQuiz);
  onEnter('lot-ans', checkQuiz);

  function reset() {
    player.stopTimer();
    Object.assign(st, BOOK_STATE());
    $('lot-radii').checked = true;
    $('lot-proof').checked = false;
    $('lot-ans-row').hidden = true;
    $('lot-task').textContent = '';
    feedback('lot-feedback', '');
    player.updateStepUI();
    render();
  }

  UI.register('lot', { render, reset, state: st });
  player.updateStepUI();
  render();
})();

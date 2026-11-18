/* Tab 2: Circumcircle of a Triangle (Plate VI)
   Given: Triangle
   1. Construct the perpendicular bisector on segment AB.
   2. Construct the perpendicular bisector on segment BC (intersection M).
   3. Circumcircle centered at M. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 460;
  const STEPS = [
    [1, 'Perpendicular bisector on AB', 'With the compass centered at A and B and equal radius r > ½ AB, strike arcs; connect their intersections to get the perpendicular bisector of AB.'],
    [2, 'Perpendicular bisector on BC', 'Similarly construct the perpendicular bisector on segment BC. The intersection of both perpendicular bisectors is the circumcenter M.'],
    [3, 'Circumcircle at M', 'Place the compass point at M and set radius R = MA (= MB = MC). Draw the circle centered at M; it passes through all three vertices A, B, and C.']
  ];

  const DEFAULT_STATE = () => ({
    A: pt(140, 310),
    B: pt(460, 310),
    C: pt(210, 130),
    step: 3,
    showArcs: true,
    showThirdBisector: false,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = DEFAULT_STATE();
  const svg = $('umkreis-svg');
  const player = bindStepPlayer('umkreis', 3, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const res = Core.constructCircumcircle(st.A, st.B, st.C);

    if (!res.ok) {
      SVG.line(svg, st.A, st.B, { cls: 'warn-arc' });
      SVG.point(svg, st.A, { drag: 'A', label: 'A' });
      SVG.point(svg, st.B, { drag: 'B', label: 'B' });
      SVG.point(svg, st.C, { drag: 'C', label: 'C' });
      $('umkreis-result').innerHTML = '<span style="color:var(--bad)">Triangle vertices are collinear (zero area)!</span>';
      return;
    }

    // Given triangle ABC
    el(svg, 'polygon', {
      points: `${st.A.x},${st.A.y} ${st.B.x},${st.B.y} ${st.C.x},${st.C.y}`,
      class: 'given-line', 'stroke-width': 2.4, fill: 'rgba(0, 75, 135, 0.03)'
    });

    // Vertex labels
    SVG.point(svg, st.A, { drag: 'A', label: 'A', dx: -18, dy: 14 });
    SVG.point(svg, st.B, { drag: 'B', label: 'B', dx: 12, dy: 14 });
    SVG.point(svg, st.C, { drag: 'C', label: 'C', dx: -6, dy: -14 });

    // Step 1: Perpendicular bisector on AB
    if (st.step >= 1) {
      const isHl = hl === 1;
      const c = dist(st.A, st.B);
      const rArc = c * 0.62;

      if (st.showArcs && res.arcsAB) {
        const { p1, p2 } = res.arcsAB;
        SVG.compassArc(svg, st.A, rArc, -65, 65, { cls: 'thin-line', dash: '3 2' });
        SVG.compassArc(svg, st.B, rArc, 115, 245, { cls: 'thin-line', dash: '3 2' });
      }

      // Perpendicular bisector line
      const lineLen = 380;
      const pTop = add(res.midAB, scale(res.normAB, lineLen * 0.5));
      const pBot = sub(res.midAB, scale(res.normAB, lineLen * 0.5));
      SVG.line(svg, pTop, pBot, {
        cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 2.4 : 1.3
      });

      // Equality marks (=) on both halves of AB
      const midLeft = Core.lerp(st.A, res.midAB, 0.5);
      const midRight = Core.lerp(res.midAB, st.B, 0.5);
      SVG.text(svg, midLeft.x, midLeft.y + 16, '=', { 'font-size': 13, 'text-anchor': 'middle', fill: 'var(--muted)' });
      SVG.text(svg, midRight.x, midRight.y + 16, '=', { 'font-size': 13, 'text-anchor': 'middle', fill: 'var(--muted)' });

      // Right-angle mark
      SVG.rightAngleMark(svg, res.midAB, st.B, pTop, 9);
      SVG.stepNum(svg, res.midAB.x + 12, res.midAB.y - 45, 1, { hl: isHl });
    }

    // Step 2: Perpendicular bisector on BC -> intersection M
    if (st.step >= 2) {
      const isHl = hl === 2;
      const a = dist(st.B, st.C);
      const rArc = a * 0.62;

      if (st.showArcs && res.arcsBC) {
        SVG.compassArc(svg, st.B, rArc, 30, 160, { cls: 'thin-line', dash: '3 2' });
        SVG.compassArc(svg, st.C, rArc, 210, 340, { cls: 'thin-line', dash: '3 2' });
      }

      const lineLen = 380;
      const pTop = add(res.midBC, scale(res.normBC, lineLen * 0.5));
      const pBot = sub(res.midBC, scale(res.normBC, lineLen * 0.5));
      SVG.line(svg, pTop, pBot, {
        cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 2.4 : 1.3
      });

      // Right-angle mark
      SVG.rightAngleMark(svg, res.midBC, st.C, pTop, 9);

      // Optional 3rd perpendicular bisector
      if (st.showThirdBisector) {
        const pCA1 = add(res.midCA, scale(res.normCA, 200));
        const pCA2 = sub(res.midCA, scale(res.normCA, 200));
        SVG.line(svg, pCA1, pCA2, { cls: 'thin-line', dash: '4 3', w: 1.1 });
      }

      // Intersection M
      SVG.centerMark(svg, res.M, 14);
      SVG.point(svg, res.M, { label: 'M', dx: -18, dy: -6, sel: true });
      SVG.stepNum(svg, (res.midBC.x + res.M.x) / 2 + 10, (res.midBC.y + res.M.y) / 2 - 14, 2, { hl: isHl });
    }

    // Step 3: Circumcircle centered at M
    if (st.step >= 3) {
      const isHl = hl === 3;
      SVG.circle(svg, res.M, res.circumradius, {
        cls: isHl ? 'hl-line' : 'result-line', w: isHl ? 2.8 : 2.2
      });

      // Radius lines to the 3 vertices (dashed)
      SVG.line(svg, res.M, st.A, { cls: 'thin-line', dash: '3 2', w: 1.0 });
      SVG.line(svg, res.M, st.B, { cls: 'thin-line', dash: '3 2', w: 1.0 });
      SVG.line(svg, res.M, st.C, { cls: 'thin-line', dash: '3 2', w: 1.0 });

      SVG.stepNum(svg, res.M.x + res.circumradius * 0.6, res.M.y - res.circumradius * 0.6, 3, { hl: isHl });
    }

    updateSide(res);
  }

  function updateSide(res) {
    const SCALE_MM = 3.2;
    const aMm = res.a / SCALE_MM;
    const bMm = res.b / SCALE_MM;
    const cMm = res.c / SCALE_MM;
    const RMm = res.circumradius / SCALE_MM;
    const areaMm2 = res.area / (SCALE_MM * SCALE_MM);

    const typeMap = {
      spitzwinklig: 'acute',
      rechtwinklig: 'right-angled',
      stumpfwinklig: 'obtuse'
    };
    const typeLabel = typeMap[res.triangleType] || res.triangleType;
    let typeText = 'Acute triangle (circumcenter M lies inside the triangle)';
    if (res.triangleType === 'rechtwinklig') {
      typeText = 'Right-angled triangle (M lies on the hypotenuse by Thales’ theorem)';
    } else if (res.triangleType === 'stumpfwinklig') {
      typeText = 'Obtuse triangle (M lies outside the triangle)';
    }

    $('umkreis-result').innerHTML = `
      <b>Circumradius:</b> <i>R</i> = <b>${fmt(RMm, 1)} mm</b><br>
      <span style="font-size:0.8rem;color:var(--muted)">${typeText}</span>
    `;

    $('umkreis-details').innerHTML = `
      <dt>Triangle type:</dt><dd><b>${typeLabel}</b></dd>
      <dt>Side <i>a</i> (BC):</dt><dd>${fmt(aMm, 1)} mm</dd>
      <dt>Side <i>b</i> (CA):</dt><dd>${fmt(bMm, 1)} mm</dd>
      <dt>Side <i>c</i> (AB):</dt><dd>${fmt(cMm, 1)} mm</dd>
      <dt>Triangle area <i>A</i>:</dt><dd>${fmt(areaMm2, 1)} mm²</dd>
      <dt>Circumradius <i>R</i> = <i>abc</i>/(4<i>A</i>):</dt><dd>${fmt(RMm, 2)} mm</dd>
      <dt>Angles α / β / γ:</dt><dd>${fmt(res.alphaDeg, 1)}° / ${fmt(res.betaDeg, 1)}° / ${fmt(res.gammaDeg, 1)}°</dd>
      <dt>Distance MA = MB = MC:</dt><dd>${fmt(RMm, 1)} mm</dd>
    `;
  }

  SVG.makeDraggable(svg, (key, pos) => {
    if (key === 'A') st.A = pos;
    else if (key === 'B') st.B = pos;
    else if (key === 'C') st.C = pos;
    render();
  });

  chk('umkreis-arcs', v => { st.showArcs = v; render(); });
  chk('umkreis-third', v => { st.showThirdBisector = v; render(); });

  $('umkreis-preset-default').addEventListener('click', () => {
    st.A = pt(140, 310); st.B = pt(460, 310); st.C = pt(210, 130);
    render();
  });
  $('umkreis-preset-right').addEventListener('click', () => {
    st.A = pt(140, 310); st.B = pt(460, 310); st.C = pt(140, 130);
    render();
  });
  $('umkreis-preset-obtuse').addEventListener('click', () => {
    st.A = pt(120, 260); st.B = pt(500, 260); st.C = pt(280, 220);
    render();
  });

  function newQuiz() {
    const isRight = Math.random() < 0.5;
    if (isRight) {
      const c = Math.floor(Math.random() * 5 + 6) * 10; // Hypotenuse 60..100
      const R = c / 2;
      st.quiz = { truth: R, answered: false };
      $('umkreis-task').innerHTML = `A right-angled triangle has hypotenuse <i>c</i> = <b>${c} mm</b>. What is the circumradius <i>R</i> (Thales’ theorem)?`;
    } else {
      const a = 60, alpha = 30; // R = a / (2 * sin 30°) = 60 / (2 * 0.5) = 60
      st.quiz = { truth: 60, answered: false };
      $('umkreis-task').innerHTML = `By the extended law of sines, <i>R</i> = <i>a</i> / (2 · sin α). For <i>a</i> = <b>60 mm</b> and α = <b>30°</b> (sin 30° = 0.5), what is the circumradius <i>R</i>?`;
    }
    $('umkreis-ans').value = '';
    $('umkreis-ans-row').hidden = false;
    feedback('umkreis-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('umkreis-ans').value);
    if (isNaN(val)) {
      feedback('umkreis-feedback', 'Please enter a number.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('umkreis-feedback', ok
      ? `Correct! Circumradius R = ${fmt(st.quiz.truth, 1)} mm.`
      : `Incorrect. Correct answer: R = ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('umkreis-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
  }

  $('umkreis-quiz').addEventListener('click', newQuiz);
  $('umkreis-check').addEventListener('click', checkQuiz);
  onEnter('umkreis-ans', checkQuiz);

  UI.tabs['umkreis'] = {
    render,
    reset() {
      Object.assign(st, DEFAULT_STATE());
      player.updateStepUI();
      render();
    }
  };
})();

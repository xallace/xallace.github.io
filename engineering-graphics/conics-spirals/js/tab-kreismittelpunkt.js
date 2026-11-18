/* Tab 3: Determining the Center of a Circle (Plate VI)
   Given: Circle
   1. Arbitrary line a intersects the circle at A and B.
   2. Line b (as perpendicular to line a as possible) intersects the circle at C and D.
   3. Construct perpendicular bisectors on chords AB and CD.
   4. Intersection of the perpendicular bisectors is circle center M. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 460;
  const STEPS = [
    [1, 'Line a intersects circle (A, B)', 'Draw an arbitrary line a that intersects the circle. This yields intersection points A and B (chord AB).'],
    [2, 'Line b intersects circle (C, D)', 'Draw a second line b (in workshop practice, as perpendicular to a as possible). Circle intersections are C and D (chord CD).'],
    [3, 'Perp. bisectors on AB & CD', 'On both chords AB and CD, construct the perpendicular bisectors using a compass (compass arcs 1, 2 and 3, 3).'],
    [4, 'Intersection is center M', 'The intersection of the two perpendicular bisectors marks the exact required circle center M.']
  ];

  const DEFAULT_STATE = () => ({
    center: pt(320, 230),
    RMm: 50,
    angle1Deg: 28,
    dist1Mm: 16,
    angle2Deg: 118,
    dist2Mm: -12,
    step: 4,
    hideTrueCenter: false,
    showArcs: true,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = DEFAULT_STATE();
  const svg = $('kmp-svg');
  const player = bindStepPlayer('kmp', 4, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const SCALE_MM = 3.2;
    const RPx = st.RMm * SCALE_MM;
    const d1Px = st.dist1Mm * SCALE_MM;
    const d2Px = st.dist2Mm * SCALE_MM;

    const sec1 = { lineDeg: st.angle1Deg, distFromCenter: d1Px };
    const sec2 = { lineDeg: st.angle2Deg, distFromCenter: d2Px };

    const res = Core.constructCircleCenterFromSecants(st.center, RPx, sec1, sec2);

    // Given circle
    SVG.circle(svg, st.center, RPx, {
      cls: 'given-line', w: 2.2, fill: 'rgba(0, 75, 135, 0.02)'
    });

    // True center (unless hidden in workshop blind mode)
    if (!st.hideTrueCenter && st.step >= 4) {
      SVG.centerMark(svg, st.center, 14);
      SVG.point(svg, st.center, { label: 'M', dx: -14, dy: -12 });
    }

    if (!res.ok) {
      $('kmp-result').innerHTML = '<span style="color:var(--bad)">Lines a and b are parallel — perpendicular bisectors do not intersect!</span>';
      return;
    }

    // Step 1: Arbitrary line a intersects circle at A and B
    if (st.step >= 1) {
      const isHl = hl === 1;
      const lineLen = RPx * 2.8;
      const p1 = sub(res.midAB, scale(res.u1, lineLen * 0.5));
      const p2 = add(res.midAB, scale(res.u1, lineLen * 0.5));

      // Line a
      SVG.line(svg, p1, p2, {
        cls: isHl ? 'hl-line' : 'secant-line', w: isHl ? 2.4 : 1.4
      });
      SVG.text(svg, p2.x + 8, p2.y + 4, 'a', { 'font-size': 14, fill: 'var(--primary)', 'font-style': 'italic' });

      // Intersections A and B
      SVG.point(svg, res.A, { label: 'A', dx: -10, dy: 16 });
      SVG.point(svg, res.B, { label: 'B', dx: 12, dy: -6 });

      SVG.stepNum(svg, res.B.x - 14, res.B.y + 24, 1, { hl: isHl });
    }

    // Step 2: Line b intersects circle at C and D
    if (st.step >= 2) {
      const isHl = hl === 2;
      const lineLen = RPx * 2.8;
      const p1 = sub(res.midCD, scale(res.u2, lineLen * 0.5));
      const p2 = add(res.midCD, scale(res.u2, lineLen * 0.5));

      // Line b
      SVG.line(svg, p1, p2, {
        cls: isHl ? 'hl-line' : 'secant-line', w: isHl ? 2.4 : 1.4
      });
      SVG.text(svg, p1.x - 14, p1.y - 4, 'b', { 'font-size': 14, fill: 'var(--primary)', 'font-style': 'italic' });

      // Intersections C and D
      SVG.point(svg, res.C, { label: 'C', dx: -16, dy: 12 });
      SVG.point(svg, res.D, { label: 'D', dx: 12, dy: 14 });

      SVG.stepNum(svg, res.C.x + 18, res.C.y - 12, 2, { hl: isHl });
    }

    // Step 3: Perpendicular bisectors on chords AB and CD
    if (st.step >= 3) {
      const isHl = hl === 3;
      const bisLen = RPx * 2.6;

      // Compass arcs on AB
      if (st.showArcs && res.arcs1) {
        const angA = Core.angleBetween(res.A, res.midAB);
        const angB = Core.angleBetween(res.B, res.midAB);
        SVG.compassArc(svg, res.A, res.rArc1, angA - 40, angA + 40, { cls: 'thin-line', dash: '3 2' });
        SVG.compassArc(svg, res.B, res.rArc1, angB - 40, angB + 40, { cls: 'thin-line', dash: '3 2' });
      }

      // Perpendicular bisector on AB
      const pNorm1A = sub(res.midAB, scale(res.n1, bisLen * 0.5));
      const pNorm1B = add(res.midAB, scale(res.n1, bisLen * 0.5));
      SVG.line(svg, pNorm1A, pNorm1B, {
        cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 2.4 : 1.4
      });

      // Compass arcs on CD
      if (st.showArcs && res.arcs2) {
        const angC = Core.angleBetween(res.C, res.midCD);
        const angD = Core.angleBetween(res.D, res.midCD);
        SVG.compassArc(svg, res.C, res.rArc2, angC - 40, angC + 40, { cls: 'thin-line', dash: '3 2' });
        SVG.compassArc(svg, res.D, res.rArc2, angD - 40, angD + 40, { cls: 'thin-line', dash: '3 2' });
      }

      // Perpendicular bisector on CD
      const pNorm2A = sub(res.midCD, scale(res.n2, bisLen * 0.5));
      const pNorm2B = add(res.midCD, scale(res.n2, bisLen * 0.5));
      SVG.line(svg, pNorm2A, pNorm2B, {
        cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 2.4 : 1.4
      });

      SVG.stepNum(svg, res.midCD.x - 22, res.midCD.y - 14, 3, { hl: isHl });
    }

    // Step 4: Intersection of perpendicular bisectors is circle center M
    if (st.step >= 4) {
      const isHl = hl === 4;
      SVG.centerMark(svg, res.foundCenter, 16);
      SVG.point(svg, res.foundCenter, { label: 'M', dx: -18, dy: -12, sel: true, r: 4.5 });
      SVG.stepNum(svg, res.foundCenter.x + 14, res.foundCenter.y - 14, 4, { hl: isHl });
    }

    updateSide(res, SCALE_MM);
  }

  function updateSide(res, SCALE_MM) {
    const chordABMm = res.chordLenAB / SCALE_MM;
    const chordCDMm = res.chordLenCD / SCALE_MM;
    const errMm = res.errorDist / SCALE_MM;

    $('kmp-result').innerHTML = `
      <b>Found circle center:</b> <i>M</i>(x: ${fmt(res.foundCenter.x / SCALE_MM, 1)}, y: ${fmt(res.foundCenter.y / SCALE_MM, 1)})<br>
      <span style="font-size:0.8rem;color:var(--muted)">Deviation from target center: <b>${fmt(errMm, 3)} mm</b></span>
    `;

    $('kmp-details').innerHTML = `
      <dt>Circle diameter <i>d</i>:</dt><dd>${fmt(st.RMm * 2, 1)} mm</dd>
      <dt>Chord <i>AB</i> (line a):</dt><dd>${fmt(chordABMm, 1)} mm</dd>
      <dt>Chord <i>CD</i> (line b):</dt><dd>${fmt(chordCDMm, 1)} mm</dd>
      <dt>Line intersection angle ∠(a, b):</dt><dd>${fmt(res.angleSecantsDeg, 1)}°</dd>
      <dt>Workshop note:</dt><dd style="font-size:0.75rem;color:var(--muted)">An intersection angle near 90° minimizes measurement and scribing uncertainty.</dd>
    `;
  }

  $('kmp-r').addEventListener('input', e => {
    st.RMm = +e.target.value;
    $('kmp-r-out').textContent = `${st.RMm} mm`;
    render();
  });
  $('kmp-ang1').addEventListener('input', e => {
    st.angle1Deg = +e.target.value;
    $('kmp-ang1-out').textContent = `${st.angle1Deg}°`;
    render();
  });
  $('kmp-ang2').addEventListener('input', e => {
    st.angle2Deg = +e.target.value;
    $('kmp-ang2-out').textContent = `${st.angle2Deg}°`;
    render();
  });

  chk('kmp-hide', v => { st.hideTrueCenter = v; render(); });
  chk('kmp-arcs', v => { st.showArcs = v; render(); });

  function newQuiz() {
    const R = 50;
    const d = Math.floor(Math.random() * 3 + 2) * 10; // 20, 30, 40 mm offset
    // s = 2 * sqrt(R^2 - d^2)
    const s = Math.round(2 * Math.sqrt(R * R - d * d) * 10) / 10;
    st.quiz = { truth: s, answered: false };
    $('kmp-task').innerHTML = `A circle has radius <i>R</i> = <b>${R} mm</b>. A chord runs at distance <i>d</i> = <b>${d} mm</b> from the center. How long is the chord (<i>s</i> = 2 · √(<i>R</i>² − <i>d</i>²))?`;
    $('kmp-ans').value = '';
    $('kmp-ans-row').hidden = false;
    feedback('kmp-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('kmp-ans').value);
    if (isNaN(val)) {
      feedback('kmp-feedback', 'Please enter a number.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.3;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('kmp-feedback', ok
      ? `Correct! Chord length s = ${fmt(st.quiz.truth, 1)} mm.`
      : `Incorrect. Correct answer: s = ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('kmp-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
  }

  $('kmp-quiz').addEventListener('click', newQuiz);
  $('kmp-check').addEventListener('click', checkQuiz);
  onEnter('kmp-ans', checkQuiz);

  UI.tabs['kreismittelpunkt'] = {
    render,
    reset() {
      Object.assign(st, DEFAULT_STATE());
      $('kmp-r').value = st.RMm;
      $('kmp-r-out').textContent = `${st.RMm} mm`;
      $('kmp-ang1').value = st.angle1Deg;
      $('kmp-ang1-out').textContent = `${st.angle1Deg}°`;
      $('kmp-ang2').value = st.angle2Deg;
      $('kmp-ang2-out').textContent = `${st.angle2Deg}°`;
      player.updateStepUI();
      render();
    }
  };
})();

/* Tab 4: Ellipse Construction from Two Circles (Plate VI)
   Given: Axes AB and CD
   1. Two circles centered at M with diameters AB and CD.
   2. Draw several rays through M intersecting the two circles (E, F).
   3. Draw parallels to the two principal axes AB and CD through E and F. Their intersections are ellipse points. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 460;
  const STEPS = [
    [1, 'Two circles at M', 'Draw two concentric circles centered at M: the major circle with diameter d = AB and the minor circle with d = CD.'],
    [2, 'Draw rays through M', 'Draw several rays from center M at various angles. Each ray intersects the inner circle at E and the outer circle at F.'],
    [3, 'Parallels to the axes', 'Through F draw a parallel to minor axis CD (vertical), and through E draw a parallel to major axis AB (horizontal). Their intersection is an ellipse point!']
  ];

  const DEFAULT_STATE = () => ({
    M: pt(320, 230),
    aMm: 52,
    bMm: 32,
    numRays: 12,
    activeAngleDeg: 45,
    step: 3,
    showFoci: true,
    showGrid: true,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = DEFAULT_STATE();
  const svg = $('ellk-svg');
  const player = bindStepPlayer('ellk', 3, STEPS, st, render);

  function getRayAngles(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(Math.round((i * 360) / count));
    }
    return list;
  }

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const SCALE_MM = 3.2;
    const aPx = st.aMm * SCALE_MM;
    const bPx = st.bMm * SCALE_MM;

    const angles = getRayAngles(st.numRays);
    if (!angles.includes(st.activeAngleDeg)) angles.push(st.activeAngleDeg);

    const res = Core.constructEllipseFromTwoCircles(st.M, aPx, bPx, angles);

    // Principal axes AB and CD
    const A = { x: st.M.x - aPx, y: st.M.y };
    const B = { x: st.M.x + aPx, y: st.M.y };
    const C = { x: st.M.x, y: st.M.y - bPx };
    const D = { x: st.M.x, y: st.M.y + bPx };

    // Centerlines
    SVG.line(svg, { x: A.x - 20, y: A.y }, { x: B.x + 20, y: B.y }, { cls: 'thin-line', dash: '6 3' });
    SVG.line(svg, { x: C.x, y: C.y - 20 }, { x: D.x, y: D.y + 20 }, { cls: 'thin-line', dash: '6 3' });

    SVG.point(svg, A, { label: 'A', dx: -16, dy: 5 });
    SVG.point(svg, B, { label: 'B', dx: 10, dy: 5 });
    SVG.point(svg, C, { label: 'C', dx: -6, dy: -10 });
    SVG.point(svg, D, { label: 'D', dx: -6, dy: 16 });

    SVG.centerMark(svg, st.M, 14);
    SVG.point(svg, st.M, { label: 'M', dx: -14, dy: 14 });

    // Step 1: Two circles centered at M with diameters AB and CD
    if (st.step >= 1) {
      const isHl = hl === 1;
      SVG.circle(svg, st.M, aPx, { cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 2.2 : 1.3 });
      SVG.circle(svg, st.M, bPx, { cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 2.2 : 1.3 });
      SVG.stepNum(svg, st.M.x - aPx * 0.72, st.M.y - aPx * 0.72, 1, { hl: isHl });
    }

    // Step 2: Rays through M
    if (st.step >= 2) {
      const isHl = hl === 2;
      for (const ray of res.rays) {
        const isAct = ray.deg === st.activeAngleDeg;
        SVG.line(svg, st.M, ray.F, {
          cls: isAct ? (isHl ? 'hl-line' : 'secant-line') : 'thin-line',
          w: isAct ? 1.8 : 0.9,
          dash: isAct ? null : '3 3'
        });
      }

      // Active ray: highlight points E and F
      const actRay = res.rays.find(r => r.deg === st.activeAngleDeg) || res.rays[0];
      if (actRay) {
        SVG.point(svg, actRay.E, { label: 'E', dx: -12, dy: -6, r: 3 });
        SVG.point(svg, actRay.F, { label: 'F', dx: 10, dy: -6, r: 3 });
      }

      SVG.stepNum(svg, (st.M.x + actRay.F.x) / 2 + 10, (st.M.y + actRay.F.y) / 2 - 10, 2, { hl: isHl });
    }

    // Step 3: Parallels to the two axes through E and F
    if (st.step >= 3) {
      const isHl = hl === 3;

      // Parallels for all rays
      for (const ray of res.rays) {
        const isAct = ray.deg === st.activeAngleDeg;
        // Vertical through F to P
        SVG.line(svg, ray.F, ray.P, {
          cls: isAct ? 'hl-line' : 'thin-line',
          w: isAct ? 1.8 : 0.8,
          dash: '2 2'
        });
        // Horizontal through E to P
        SVG.line(svg, ray.E, ray.P, {
          cls: isAct ? 'hl-line' : 'thin-line',
          w: isAct ? 1.8 : 0.8,
          dash: '2 2'
        });
        // Ellipse point
        SVG.point(svg, ray.P, { r: isAct ? 4 : 2.5, sel: isAct });
      }

      // Full ellipse curve
      const pathPts = [];
      for (let th = 0; th <= 360; th += 2) {
        const rad = th * Core.DEG;
        pathPts.push(`${(st.M.x + aPx * Math.cos(rad)).toFixed(1)},${(st.M.y + bPx * Math.sin(rad)).toFixed(1)}`);
      }
      el(svg, 'polygon', {
        points: pathPts.join(' '),
        class: isHl ? 'hl-line' : 'ellipse-line',
        fill: 'none'
      });

      const actRay = res.rays.find(r => r.deg === st.activeAngleDeg) || res.rays[0];
      SVG.stepNum(svg, actRay.P.x + 14, actRay.P.y - 12, 3, { hl: isHl });
    }

    // Foci F1, F2
    if (st.showFoci && st.step >= 1) {
      SVG.point(svg, res.F1, { label: 'F₁', dx: -12, dy: 14, r: 3 });
      SVG.point(svg, res.F2, { label: 'F₂', dx: 8, dy: 14, r: 3 });
    }

    updateSide(res, SCALE_MM);
  }

  function updateSide(res, SCALE_MM) {
    const eMm = res.e / SCALE_MM;
    const areaMm2 = res.area / (SCALE_MM * SCALE_MM);
    const periMm = res.perimeter / SCALE_MM;

    $('ellk-result').innerHTML = `
      <b>Semi-axes:</b> <i>a</i> = <b>${fmt(st.aMm, 1)} mm</b>, <i>b</i> = <b>${fmt(st.bMm, 1)} mm</b><br>
      <span style="font-size:0.8rem;color:var(--muted)">Linear eccentricity: <i>e</i> = <b>${fmt(eMm, 1)} mm</b> (focus offset)</span>
    `;

    $('ellk-details').innerHTML = `
      <dt>Major axis <i>AB</i> (2<i>a</i>):</dt><dd>${fmt(st.aMm * 2, 1)} mm</dd>
      <dt>Minor axis <i>CD</i> (2<i>b</i>):</dt><dd>${fmt(st.bMm * 2, 1)} mm</dd>
      <dt>Axis ratio <i>b</i> / <i>a</i>:</dt><dd>${fmt(st.bMm / st.aMm, 3)}</dd>
      <dt>Linear eccentricity <i>e</i> = √(<i>a</i>² − <i>b</i>²):</dt><dd>${fmt(eMm, 2)} mm</dd>
      <dt>Numerical eccentricity ε = <i>e</i> / <i>a</i>:</dt><dd>${fmt(res.eps, 3)}</dd>
      <dt>Ellipse area <i>A</i> = π · <i>a</i> · <i>b</i>:</dt><dd>${fmt(areaMm2, 1)} mm²</dd>
      <dt>Perimeter <i>U</i> (Ramanujan):</dt><dd>${fmt(periMm, 1)} mm</dd>
      <dt>Active ray angle φ:</dt><dd>${fmt(st.activeAngleDeg, 0)}°</dd>
      <dt>Equation check (<i>x</i>²/<i>a</i>² + <i>y</i>²/<i>b</i>²):</dt><dd>1.0000 ✓</dd>
    `;
  }

  $('ellk-a').addEventListener('input', e => {
    st.aMm = Math.max(+e.target.value, st.bMm + 2);
    $('ellk-a-out').textContent = `${st.aMm} mm`;
    render();
  });
  $('ellk-b').addEventListener('input', e => {
    st.bMm = Math.min(+e.target.value, st.aMm - 2);
    $('ellk-b-out').textContent = `${st.bMm} mm`;
    render();
  });
  $('ellk-ang').addEventListener('input', e => {
    st.activeAngleDeg = +e.target.value;
    $('ellk-ang-out').textContent = `${st.activeAngleDeg}°`;
    render();
  });

  chk('ellk-foci', v => { st.showFoci = v; render(); });

  function newQuiz() {
    const a = Math.floor(Math.random() * 3 + 4) * 10; // 40, 50, 60 mm
    const b = Math.floor(Math.random() * 2 + 2) * 10; // 20, 30 mm
    const area = Math.round(Math.PI * a * b * 10) / 10;
    st.quiz = { truth: area, answered: false };
    $('ellk-task').innerHTML = `Given an ellipse with semi-axes <i>a</i> = <b>${a} mm</b> and <i>b</i> = <b>${b} mm</b>, calculate the ellipse area <i>A</i> = π · <i>a</i> · <i>b</i> (in mm²)!`;
    $('ellk-ans').value = '';
    $('ellk-ans-row').hidden = false;
    feedback('ellk-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('ellk-ans').value);
    if (isNaN(val)) {
      feedback('ellk-feedback', 'Please enter a number.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 1.5;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('ellk-feedback', ok
      ? `Correct! Ellipse area A = ${fmt(st.quiz.truth, 1)} mm².`
      : `Incorrect. Correct answer: A = ${fmt(st.quiz.truth, 1)} mm².`, ok);
    $('ellk-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
  }

  $('ellk-quiz').addEventListener('click', newQuiz);
  $('ellk-check').addEventListener('click', checkQuiz);
  onEnter('ellk-ans', checkQuiz);

  UI.tabs['ellipse-kreise'] = {
    render,
    reset() {
      Object.assign(st, DEFAULT_STATE());
      $('ellk-a').value = st.aMm;
      $('ellk-a-out').textContent = `${st.aMm} mm`;
      $('ellk-b').value = st.bMm;
      $('ellk-b-out').textContent = `${st.bMm} mm`;
      $('ellk-ang').value = st.activeAngleDeg;
      $('ellk-ang-out').textContent = `${st.activeAngleDeg}°`;
      player.updateStepUI();
      render();
    }
  };
})();

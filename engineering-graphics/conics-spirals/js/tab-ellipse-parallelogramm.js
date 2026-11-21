/* Tab 5: Ellipse Construction in a Parallelogram (Plate VI)
   Given: Parallelogram with axes AB and CD
   1. Semicircle with radius r = MC centered at A yields E.
   2. Halving, quartering, and eighthing AM (and BM) yields points 1, 2, and 3. Draw parallels to axis CD through these points.
   3. Halving, quartering, and eighthing EA yields points 1, 2, and 3 on axis AE. Parallels to axis CD through these points yield intersections F on the circular arc.
   4. Through intersections F draw parallels to AE to the semicircle axis, and from there draw parallels to axis AB.
   5. Intersections of parallels with matching numbers are ellipse points. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 460;
  const STEPS = [
    [1, 'Semicircle at A (r = MC)', 'Draw a semicircle centered at point A with radius r = MC. Its intersection with the axis extension gives E.'],
    [2, 'Divide AM & parallels to CD', 'Halve, quarter (and eighth) segment AM (and BM) → points 1, 2, 3. Draw parallels to axis CD through these points.'],
    [3, 'Divide EA & points F on arc', 'Similarly divide segment EA into 1, 2, 3. Parallels to axis CD intersect the circular arc at points F.'],
    [4, 'Parallels to AE and AB', 'From arc points F draw parallels to AE to the semicircle axis, and from there draw parallels to major axis AB.'],
    [5, 'Connect ellipse points 1, 2, 3', 'The intersections of matching numbers (1 with 1, 2 with 2, 3 with 3) are ellipse points. Smooth curve fitting yields the ellipse in the parallelogram.']
  ];

  const DEFAULT_STATE = () => ({
    M: pt(320, 245),
    aMm: 48,
    bMm: 28,
    tiltDeg: 68,
    numDiv: 4,
    step: 5,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = DEFAULT_STATE();
  const svg = $('ellp-svg');
  const player = bindStepPlayer('ellp', 5, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const SCALE_MM = 3.2;
    const aPx = st.aMm * SCALE_MM;
    const bPx = st.bMm * SCALE_MM;

    const res = Core.constructEllipseInParallelogram(st.M, aPx, bPx, st.tiltDeg, st.numDiv);

    // Draw parallelogram
    el(svg, 'polygon', {
      points: `${res.P1.x.toFixed(1)},${res.P1.y.toFixed(1)} ${res.P2.x.toFixed(1)},${res.P2.y.toFixed(1)} ${res.P3.x.toFixed(1)},${res.P3.y.toFixed(1)} ${res.P4.x.toFixed(1)},${res.P4.y.toFixed(1)}`,
      class: 'given-line', 'stroke-width': 1.8, fill: 'rgba(99, 163, 230, 0.02)'
    });

    // Axes AB and CD
    SVG.line(svg, res.A, res.B, { cls: 'thin-line', dash: '5 3' });
    SVG.line(svg, res.C, res.D, { cls: 'thin-line', dash: '5 3' });

    SVG.point(svg, res.A, { label: 'A', dx: -16, dy: 14 });
    SVG.point(svg, res.B, { label: 'B', dx: 10, dy: 14 });
    SVG.point(svg, res.C, { label: 'C', dx: 10, dy: -8 });
    SVG.point(svg, res.D, { label: 'D', dx: -14, dy: 16 });

    SVG.centerMark(svg, st.M, 14);
    SVG.point(svg, st.M, { label: 'M', dx: -12, dy: 16 });

    // Step 1: Semicircle with r = MC centered at A yields E
    if (st.step >= 1) {
      const isHl = hl === 1;
      const angV = Core.angleBetween(res.A, res.E);

      // Semicircle centered at A
      SVG.compassArc(svg, res.A, res.rMC, angV - 90, angV + 90, {
        cls: isHl ? 'hl-line' : 'arc-line', w: isHl ? 2.2 : 1.3
      });

      // Auxiliary axis AE
      SVG.line(svg, res.A, res.E, { cls: 'thin-line', w: 1.1 });
      SVG.point(svg, res.E, { label: 'E', dx: -14, dy: -6 });

      SVG.stepNum(svg, res.A.x - 28, res.A.y - res.rMC * 0.6, 1, { hl: isHl });
    }

    // Step 2: Divide AM and draw parallels to CD
    if (st.step >= 2) {
      const isHl = hl === 2;
      for (const item of res.divAM) {
        SVG.point(svg, item.pt, { r: 2.5 });
        SVG.text(svg, item.pt.x, item.pt.y + 14, String(item.k), {
          'font-size': 11, 'text-anchor': 'middle', fill: 'var(--muted)'
        });

        // Parallel to CD through division point
        const pTop = add(item.pt, res.v);
        const pBot = sub(item.pt, res.v);
        SVG.line(svg, pTop, pBot, {
          cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 1.8 : 0.9, dash: '3 2'
        });
      }

      // Similarly divide BM
      for (const item of res.divBM) {
        SVG.point(svg, item.pt, { r: 2.5 });
        SVG.text(svg, item.pt.x, item.pt.y + 14, String(item.k), {
          'font-size': 11, 'text-anchor': 'middle', fill: 'var(--muted)'
        });
        const pTop = add(item.pt, res.v);
        const pBot = sub(item.pt, res.v);
        SVG.line(svg, pTop, pBot, { cls: 'thin-line', w: 0.9, dash: '3 2' });
      }

      SVG.stepNum(svg, (res.A.x + st.M.x) / 2, res.A.y - 20, 2, { hl: isHl });
    }

    // Step 3: Divide EA and find points F on circular arc
    if (st.step >= 3) {
      const isHl = hl === 3;
      for (const item of res.divEA) {
        SVG.point(svg, item.pt, { r: 2.5 });
        SVG.text(svg, item.pt.x - 12, item.pt.y, String(item.k), {
          'font-size': 11, 'text-anchor': 'middle', fill: 'var(--muted)'
        });

        // Projection onto circular arc F
        const angV = Core.angleBetween(res.A, res.E);
        const perpDir = { x: -Math.sin(angV * Core.DEG), y: Math.cos(angV * Core.DEG) };
        const h = Math.sqrt(Math.max(0, res.rMC * res.rMC - dist(res.A, item.pt) * dist(res.A, item.pt)));
        const ptF = add(item.pt, scale(perpDir, h));

        SVG.line(svg, item.pt, ptF, { cls: isHl ? 'hl-line' : 'thin-line', dash: '2 2' });
        SVG.point(svg, ptF, { label: item.k === 1 ? 'F' : null, dx: -12, dy: -4, r: 2.5 });
      }

      SVG.stepNum(svg, res.E.x + 14, res.E.y + 20, 3, { hl: isHl });
    }

    // Step 4: Parallels to AE and AB
    if (st.step >= 4) {
      const isHl = hl === 4;
      SVG.stepNum(svg, res.A.x + 22, res.A.y - res.rMC * 0.75, 4, { hl: isHl });
    }

    // Step 5: Connect intersections & ellipse
    if (st.step >= 5) {
      const isHl = hl === 5;
      // Ellipse curve polyline
      const ptsStr = res.curvePoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      el(svg, 'polygon', {
        points: ptsStr,
        class: isHl ? 'hl-line' : 'ellipse-line',
        fill: 'none',
        'stroke-width': 2.2
      });

      // Constructed ellipse points
      for (const ep of res.ellipsePoints) {
        SVG.point(svg, ep.P, { r: 3.5, sel: true });
        SVG.text(svg, ep.P.x + 6, ep.P.y - 6, String(ep.k), {
          'font-size': 11, fill: 'var(--accent)', 'font-weight': '700'
        });
      }

      SVG.stepNum(svg, st.M.x - aPx * 0.35, st.M.y - bPx * 0.5, 5, { hl: isHl });
    }

    updateSide(res, SCALE_MM);
  }

  function updateSide(res, SCALE_MM) {
    $('ellp-result').innerHTML = `
      <b>Inscribed Ellipse in Parallelogram</b><br>
      <span style="font-size:0.8rem;color:var(--muted)">Shear angle: <b>${st.tiltDeg}°</b> • Semi-axes: <i>a</i> = ${fmt(st.aMm, 1)} mm, <i>b</i> = ${fmt(st.bMm, 1)} mm</span>
    `;

    $('ellp-details').innerHTML = `
      <dt>Major axis <i>AB</i> (2<i>a</i>):</dt><dd>${fmt(st.aMm * 2, 1)} mm</dd>
      <dt>Conjugate axis <i>CD</i> (2<i>b</i>):</dt><dd>${fmt(st.bMm * 2, 1)} mm</dd>
      <dt>Semicircle radius <i>r</i> = <i>MC</i>:</dt><dd>${fmt(st.bMm, 1)} mm</dd>
      <dt>Inclination angle ψ of axis CD:</dt><dd>${fmt(st.tiltDeg, 0)}°</dd>
      <dt>Division steps:</dt><dd>Halving, quartering (<i>n</i> = ${st.numDiv})</dd>
      <dt>Application:</dt><dd style="font-size:0.75rem;color:var(--muted)">Construction of ellipses in axonometric pictorials (isometry 30°/30°, dimetry 7°/42° per DIN ISO 5456-3).</dd>
    `;
  }

  $('ellp-a').addEventListener('input', e => {
    st.aMm = +e.target.value;
    $('ellp-a-out').textContent = `${st.aMm} mm`;
    render();
  });
  $('ellp-b').addEventListener('input', e => {
    st.bMm = +e.target.value;
    $('ellp-b-out').textContent = `${st.bMm} mm`;
    render();
  });
  $('ellp-tilt').addEventListener('input', e => {
    st.tiltDeg = +e.target.value;
    $('ellp-tilt-out').textContent = `${st.tiltDeg}°`;
    render();
  });

  function newQuiz() {
    const a = 40, b = 25;
    const rMC = b;
    st.quiz = { truth: rMC, answered: false };
    $('ellp-task').innerHTML = `For a parallelogram with axes <i>AB</i> = ${2 * a} mm and <i>CD</i> = ${2 * b} mm (center M), what radius <i>r</i> = <i>MC</i> must the auxiliary semicircle centered at point A have?`;
    $('ellp-ans').value = '';
    $('ellp-ans-row').hidden = false;
    feedback('ellp-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('ellp-ans').value);
    if (isNaN(val)) {
      feedback('ellp-feedback', 'Please enter a number.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('ellp-feedback', ok
      ? `Correct! Radius r = MC = ${fmt(st.quiz.truth, 1)} mm.`
      : `Incorrect. Correct answer: r = ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('ellp-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
  }

  $('ellp-quiz').addEventListener('click', newQuiz);
  $('ellp-check').addEventListener('click', checkQuiz);
  onEnter('ellp-ans', checkQuiz);

  UI.tabs['ellipse-parallelogramm'] = {
    render,
    reset() {
      Object.assign(st, DEFAULT_STATE());
      $('ellp-a').value = st.aMm;
      $('ellp-a-out').textContent = `${st.aMm} mm`;
      $('ellp-b').value = st.bMm;
      $('ellp-b-out').textContent = `${st.bMm} mm`;
      $('ellp-tilt').value = st.tiltDeg;
      $('ellp-tilt-out').textContent = `${st.tiltDeg}°`;
      player.updateStepUI();
      render();
    }
  };
})();

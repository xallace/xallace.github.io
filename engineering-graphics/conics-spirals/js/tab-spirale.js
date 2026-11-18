/* Tab 6: Spiral (Approximate Construction with a Compass)
   Plate VI — Archimedean Four-Center Spiral
   Given: Pitch a
   1. Draw square ABCD with side a/4.
   2. Quarter circle with radius AD centered at A yields E.
   3. Quarter circle with radius BE centered at B yields F.
   4. Quarter circle with radius CF centered at C yields G.
   5. Quarter circle with radius DG centered at D yields H.
   6. Quarter circle with radius AH centered at A yields I (etc.). */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 460;
  const STEPS = [
    [1, 'Square ABCD of side a/4', 'Draw central square ABCD with side length s = a/4. Its four corners serve as successive compass centers.'],
    [2, '1st quarter circle at A (E)', 'Place the compass point at A. With radius r₁ = AD = a/4, strike a 90° arc from D to E.'],
    [3, '2nd quarter circle at B (F)', 'Place the compass point at B. With radius r₂ = BE = 2·(a/4), continue the arc from E to F.'],
    [4, '3rd quarter circle at C (G)', 'Place the compass point at C. With radius r₃ = CF = 3·(a/4), continue the arc from F to G.'],
    [5, '4th quarter circle at D (H)', 'Place the compass point at D. With radius r₄ = DG = 4·(a/4) = a, strike from G to H. The 1st full turn (360°) is complete!'],
    [6, '5th quarter circle at A (I)', 'Place the compass point at A again with radius r₅ = AH = 5·(a/4); the arc joins seamlessly for the next turn.']
  ];

  const DEFAULT_STATE = () => ({
    center: pt(280, 230),
    pitchMm: 48,
    numQuadrants: 8,
    step: 6,
    showArchimedes: true,
    showSquareZoom: true,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = DEFAULT_STATE();
  const svg = $('spirale-svg');
  const player = bindStepPlayer('spirale', 6, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const SCALE_MM = 2.4; // 2.4 px = 1 mm for spiral with large radius
    const pitchPx = st.pitchMm * SCALE_MM;
    const res = Core.constructSquareSpiral(st.center, pitchPx, Math.max(st.step, st.numQuadrants));

    // Ideal Archimedean spiral in background (if enabled)
    if (st.showArchimedes && st.step >= 1) {
      const archPts = [];
      const totalTurns = (st.step >= 5 ? 2.2 : 1.2);
      for (let deg = 0; deg <= totalTurns * 360; deg += 3) {
        const rad = deg * Core.DEG;
        const rArch = (pitchPx * rad) / (2 * Math.PI);
        const p = Core.polarPt(st.center, rArch, deg + 180);
        archPts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      }
      el(svg, 'polyline', {
        points: archPts.join(' '),
        class: 'thin-line', 'stroke-width': 1.1, stroke: 'var(--primary)',
        'stroke-dasharray': '3 2', fill: 'none'
      });
    }

    // Step 1: Square ABCD with side a/4
    if (st.step >= 1) {
      const isHl = hl === 1;
      const sPx = res.s;

      // Square ABCD
      el(svg, 'polygon', {
        points: `${res.A.x},${res.A.y} ${res.B.x},${res.B.y} ${res.C.x},${res.C.y} ${res.D.x},${res.D.y}`,
        class: isHl ? 'hl-line' : 'given-line', 'stroke-width': isHl ? 2.4 : 1.6,
        fill: 'rgba(0, 75, 135, 0.08)'
      });

      // Vertex labels A, B, C, D
      SVG.point(svg, res.A, { label: 'A', dx: 5, dy: -6, r: 2.5, fs: 11 });
      SVG.point(svg, res.B, { label: 'B', dx: 5, dy: 10, r: 2.5, fs: 11 });
      SVG.point(svg, res.C, { label: 'C', dx: -10, dy: 10, r: 2.5, fs: 11 });
      SVG.point(svg, res.D, { label: 'D', dx: -10, dy: -6, r: 2.5, fs: 11 });

      // Dimension a/4
      SVG.stepNum(svg, res.D.x - 16, res.D.y - 14, 1, { hl: isHl });

      // Magnified square inset top right for better legibility
      if (st.showSquareZoom) {
        const zBox = { x: 480, y: 30, w: 140, h: 140 };
        el(svg, 'rect', {
          x: zBox.x, y: zBox.y, width: zBox.w, height: zBox.h,
          fill: 'var(--bg-card)', stroke: 'var(--border)', 'stroke-width': 1.2, rx: 6
        });
        SVG.text(svg, zBox.x + 10, zBox.y + 18, 'Central square a/4 (Zoom)', { 'font-size': 11, 'font-weight': 700, fill: 'var(--primary)' });

        const zC = { x: zBox.x + 70, y: zBox.y + 80 };
        const zS = 40;
        const zA = { x: zC.x + zS / 2, y: zC.y - zS / 2 };
        const zB = { x: zC.x + zS / 2, y: zC.y + zS / 2 };
        const zCpt = { x: zC.x - zS / 2, y: zC.y + zS / 2 };
        const zD = { x: zC.x - zS / 2, y: zC.y - zS / 2 };

        el(svg, 'polygon', {
          points: `${zA.x},${zA.y} ${zB.x},${zB.y} ${zCpt.x},${zCpt.y} ${zD.x},${zD.y}`,
          fill: 'rgba(56, 189, 248, 0.12)', stroke: 'var(--primary)', 'stroke-width': 1.6
        });
        SVG.point(svg, zA, { label: 'A', dx: 6, dy: -6, fs: 12 });
        SVG.point(svg, zB, { label: 'B', dx: 6, dy: 12, fs: 12 });
        SVG.point(svg, zCpt, { label: 'C', dx: -14, dy: 12, fs: 12 });
        SVG.point(svg, zD, { label: 'D', dx: -14, dy: -6, fs: 12 });
      }
    }

    // Steps 2 to 6 (arcs)
    const arcColors = [
      'var(--accent-red)', 'var(--accent-amber)', 'var(--accent-green)',
      'var(--primary)', 'var(--accent-purple)', 'var(--accent-red)'
    ];

    for (let k = 1; k <= Math.min(st.step, res.arcs.length); k++) {
      const isHl = hl === (k + 1);
      const arc = res.arcs[k - 1];

      // Quarter-circle arc
      SVG.compassArc(svg, arc.center, arc.radiusMm, arc.startDeg, arc.endDeg, {
        cls: isHl ? 'hl-line' : 'spiral-line',
        w: isHl ? 3.0 : 2.2
      });

      // Arc endpoint (E, F, G, H, I...)
      SVG.point(svg, arc.endPt, {
        label: arc.endLabel, dx: 6, dy: 6, r: 3, fs: 12
      });

      // Radius line from center to arc
      if (isHl || k === st.step) {
        SVG.line(svg, arc.center, arc.endPt, { cls: 'thin-line', dash: '3 2', w: 1.1 });
      }

      // Step number on the arc
      const midAng = (arc.startDeg + arc.endDeg) / 2;
      const numPos = Core.polarPt(arc.center, arc.radiusMm * 0.9, midAng);
      if (k <= 5) {
        SVG.stepNum(svg, numPos.x, numPos.y, k + 1, { hl: isHl });
      }
    }

    // Dimension arrow for pitch a
    if (st.step >= 5) {
      const arc4 = res.arcs[3]; // H lies on the left at distance a from D
      const dimY = st.center.y + pitchPx * 0.78;
      SVG.arrow(svg, st.center.x, dimY, st.center.x + pitchPx, dimY, { cls: 'thin-line' });
      SVG.arrow(svg, st.center.x + pitchPx, dimY, st.center.x, dimY, { cls: 'thin-line' });
      SVG.text(svg, st.center.x + pitchPx * 0.5, dimY - 6, `Pitch a = ${fmt(st.pitchMm, 0)} mm`, {
        'font-size': 11.5, 'text-anchor': 'middle', fill: 'var(--muted)', 'font-weight': 600
      });
    }

    updateSide(res, SCALE_MM);
  }

  function updateSide(res, SCALE_MM) {
    const sMm = st.pitchMm / 4;
    const currentRadius = (st.step * sMm);

    $('spirale-result').innerHTML = `
      <b>Pitch (lead):</b> <i>a</i> = <b>${fmt(st.pitchMm, 1)} mm</b> per 360°<br>
      <span style="font-size:0.8rem;color:var(--muted)">Central square: <i>s</i> = <i>a</i>/4 = <b>${fmt(sMm, 2)} mm</b> • Current outer radius: <b>${fmt(currentRadius, 1)} mm</b></span>
    `;

    $('spirale-details').innerHTML = `
      <dt>Pitch <i>a</i> (lead):</dt><dd>${fmt(st.pitchMm, 1)} mm</dd>
      <dt>Square side <i>s</i> = <i>a</i> / 4:</dt><dd>${fmt(sMm, 2)} mm</dd>
      <dt>Radius arc 1 (at A):</dt><dd>1·<i>s</i> = ${fmt(sMm, 1)} mm</dd>
      <dt>Radius arc 2 (at B):</dt><dd>2·<i>s</i> = ${fmt(2 * sMm, 1)} mm</dd>
      <dt>Radius arc 3 (at C):</dt><dd>3·<i>s</i> = ${fmt(3 * sMm, 1)} mm</dd>
      <dt>Radius arc 4 (at D):</dt><dd>4·<i>s</i> = <i>a</i> = ${fmt(4 * sMm, 1)} mm</dd>
      <dt>Radius arc 5 (at A):</dt><dd>5·<i>s</i> = ${fmt(5 * sMm, 1)} mm</dd>
      <dt>Tangent continuity:</dt><dd>100% <i>C</i>¹-continuous (no kink) ✓</dd>
      <dt>Deviation vs. Archimedes:</dt><dd>&lt; 1.4% (0.00% at boundaries)</dd>
    `;
  }

  $('spirale-a').addEventListener('input', e => {
    st.pitchMm = +e.target.value;
    $('spirale-a-out').textContent = `${st.pitchMm} mm`;
    render();
  });

  chk('spirale-arch', v => { st.showArchimedes = v; render(); });
  chk('spirale-zoom', v => { st.showSquareZoom = v; render(); });

  function newQuiz() {
    const pitch = Math.floor(Math.random() * 4 + 3) * 8; // 24, 32, 40, 48 mm
    const s = pitch / 4;
    const k = Math.floor(Math.random() * 4 + 2); // Arc 2, 3, 4, 5
    const rK = k * s;
    const ord = k === 2 ? '2nd' : k === 3 ? '3rd' : `${k}th`;

    st.quiz = { truth: rK, answered: false };
    $('spirale-task').innerHTML = `Given a spiral with pitch <i>a</i> = <b>${pitch} mm</b> (square side <i>s</i> = ${s} mm), what is the radius of the <b>${ord} quarter-circle arc</b> (<i>r</i><sub>${k}</sub> = ${k} · <i>a</i>/4)?`;
    $('spirale-ans').value = '';
    $('spirale-ans-row').hidden = false;
    feedback('spirale-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('spirale-ans').value);
    if (isNaN(val)) {
      feedback('spirale-feedback', 'Please enter a number.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('spirale-feedback', ok
      ? `Correct! Radius r = ${fmt(st.quiz.truth, 1)} mm.`
      : `Incorrect. Correct answer: r = ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('spirale-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
  }

  $('spirale-quiz').addEventListener('click', newQuiz);
  $('spirale-check').addEventListener('click', checkQuiz);
  onEnter('spirale-ans', checkQuiz);

  UI.tabs['spirale'] = {
    render,
    reset() {
      Object.assign(st, DEFAULT_STATE());
      $('spirale-a').value = st.pitchMm;
      $('spirale-a-out').textContent = `${st.pitchMm} mm`;
      player.updateStepUI();
      render();
    }
  };
})();

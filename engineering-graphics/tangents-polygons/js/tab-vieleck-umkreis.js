/* Tab 5: Regular Polygon in Circumcircle (Plate V)
   Given: Circle with diameter d
   1. Divide AB into n equal parts (by the intercept theorem).
   2. Strike circular arc with radius r = AB centered at A -> yields C and D on the transverse axis.
   3. Connect C and D through 1, 3 ... (odd counts) or 2, 4 ... (even counts).
      The intersections with the circle yield the required polygon. */
(() => {
  'use strict';
  const { $, setSeg, seg, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist, polarPt, lerp } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 2.4; // 2.4 px = 1 mm
  const STEPS = [
    [1, 'Divide AB into n parts', 'Divide vertical diameter <span class="overline">AB</span> into <i>n</i> equal parts using the intercept theorem.'],
    [2, 'Pole points C and D', 'Strike a circular arc with radius <i>r</i> = <span class="overline">AB</span> centered at A; intersects the transverse axis at C and D (<i>R</i>√3).'],
    [3, 'Draw pole rays', 'Connect C and D through 1, 3 ... (odd number of sides) or 2, 4 ... (even number of sides) → intersections with circle.'],
    [4, 'Connect polygon', 'Connect the intersection points on the circle to form the required regular polygon.']
  ];

  const DEFAULT_STATE = () => ({
    M: pt(320, 240),
    dMm: 100,
    n: 5,
    step: 4,
    showRayLines: true,
    showDivLines: true,
    showExactOverlay: false,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = DEFAULT_STATE();
  const svg = $('viel-svg');
  const player = bindStepPlayer('viel', 4, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const RMm = st.dMm / 2;
    const RPx = RMm * SCALE;
    const res = Core.constructRegularPolygonApprox(st.M, RPx, st.n);

    // Given circumcircle
    SVG.circle(svg, st.M, RPx, { cls: 'given-line', w: 2.2 });
    SVG.centerMark(svg, st.M, 14);

    // Vertical diameter AB and horizontal centerline
    el(svg, 'line', {
      x1: st.M.x.toFixed(1), y1: (st.M.y - RPx - 25).toFixed(1),
      x2: st.M.x.toFixed(1), y2: (st.M.y + RPx + 25).toFixed(1),
      class: 'thin-line', 'stroke-dasharray': '6 4'
    });
    el(svg, 'line', {
      x1: (st.M.x - res.poleDist - 30).toFixed(1), y1: st.M.y.toFixed(1),
      x2: (st.M.x + res.poleDist + 30).toFixed(1), y2: st.M.y.toFixed(1),
      class: 'thin-line', 'stroke-dasharray': '6 4'
    });

    // Diameter AB dimension on left
    SVG.dimension(svg, { x: st.M.x - RPx, y: st.M.y - RPx }, { x: st.M.x - RPx, y: st.M.y + RPx }, '*d*', { offset: -35 });

    const { A, B, C, D, divisionPoints, rays, vertices, exactVertices } = res;

    SVG.point(svg, A, { label: 'A', dx: 0, dy: 18 });
    SVG.point(svg, B, { label: 'B', dx: 0, dy: -12 });

    // Step 1: Divide AB into n parts
    if (st.step >= 1) {
      const isHl = hl === 1;
      for (const dp of divisionPoints) {
        if (dp.num === 0 || dp.num === st.n) continue;
        el(svg, 'line', {
          x1: (dp.pt.x - 7).toFixed(1), y1: dp.pt.y.toFixed(1),
          x2: (dp.pt.x + 7).toFixed(1), y2: dp.pt.y.toFixed(1),
          class: isHl ? 'hl-line' : 'thin-line', 'stroke-width': 1.6
        });
        SVG.text(svg, dp.pt.x - 14, dp.pt.y + 4, String(dp.num), {
          'text-anchor': 'end', 'font-size': 13.5, class: 'halo ' + (isHl ? 'hl-text' : '')
        });
      }
      SVG.stepNum(svg, st.M.x + 14, st.M.y - RPx * 0.45, 1, { hl: isHl });
    }

    // Step 2: Circular arc with radius AB = 2R centered at A -> C and D
    if (st.step >= 2) {
      const isHl = hl === 2;
      const rHelp = 2 * RPx;
      // Arc centered at A through C and D
      SVG.arcBetweenPoints(svg, A, rHelp, C, D, 12, {
        cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2
      });
      SVG.point(svg, C, { label: 'C', dx: -14, dy: -10, res: true });
      SVG.point(svg, D, { label: 'D', dx: 14, dy: -10, res: true });
      SVG.stepNum(svg, (D.x + st.M.x) / 2 + 10, st.M.y - 18, 2, { hl: isHl });
    }

    // Step 3: Rays through division points
    if (st.step >= 3) {
      const isHl = hl === 3;
      if (st.showRayLines) {
        for (const ray of rays) {
          el(svg, 'line', {
            x1: ray.from.x.toFixed(1), y1: ray.from.y.toFixed(1),
            x2: ray.to.x.toFixed(1), y2: ray.to.y.toFixed(1),
            class: isHl ? 'hl-line' : 'thin-line',
            'stroke-width': isHl ? 1.8 : 1.1,
            'stroke-dasharray': '5 3'
          });
        }
      }
      SVG.stepNum(svg, st.M.x + 35, st.M.y + RPx * 0.45, 3, { hl: isHl });
    }

    // Step 4: Connect polygon
    if (st.step >= 4) {
      const isHl = hl === 4;
      const polyPts = vertices.map(v => `${v.pt.x.toFixed(1)},${v.pt.y.toFixed(1)}`).join(' ');
      el(svg, 'polygon', {
        points: polyPts,
        class: isHl ? 'hl-line' : 'res-line',
        'stroke-width': isHl ? 3.4 : 2.6,
        fill: 'rgba(75, 198, 255, 0.08)'
      });

      // Mark vertices
      for (const v of vertices) {
        SVG.point(svg, v.pt, { r: 3.8, res: true });
      }

      // Optional: Theoretically exact polygon for visual comparison
      if (st.showExactOverlay) {
        const exPts = exactVertices.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        el(svg, 'polygon', {
          points: exPts,
          class: 'proof-line',
          'stroke-width': 1.5,
          'stroke-dasharray': '4 2',
          fill: 'none'
        });
      }
    }

    updateSide(res);
  }

  function updateSide(res) {
    const resEl = $('viel-result');
    const isOdd = st.n % 2 === 1;
    resEl.className = 'result';
    resEl.innerHTML = `Regular ${st.n}-gon &nbsp;·&nbsp; Accuracy ${fmt(res.relAccuracyPct, 2)}%`;

    const sConstructMm = res.edgeLengths[0] / SCALE;
    const sExactMm = res.exactEdgeLen / SCALE;
    const maxDevMm = res.maxEdgeDev / SCALE;

    $('viel-details').innerHTML = [
      ['Number of sides <i>n</i>', `${st.n} (${isOdd ? 'odd → 1, 3...' : 'even → 2, 4...'})`],
      ['Diameter <i>d</i>', `${fmt(st.dMm, 0)} mm`],
      ['Pole distance <span class="overline">MC</span> = <span class="overline">MD</span>', `${fmt(res.poleDist / SCALE, 1)} mm (<i>R</i>√3)`],
      ['Constructed edge length <i>s</i>', `${fmt(sConstructMm, 2)} mm`],
      ['Mathematically exact edge', `${fmt(sExactMm, 2)} mm`],
      ['Maximum deviation Δ<i>s</i>', `${fmt(maxDevMm, 2)} mm (${fmt(100 - res.relAccuracyPct, 2)}%)`],
      ['Pole distance formula', `<i>x</i><sub>C,D</sub> = ± <i>R</i> · √3`]
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');

    $('viel-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} correct` : '';
  }

  // Switch number of sides n (3..10)
  seg('viel-n', v => {
    st.n = +v;
    render();
  });

  $('viel-d').addEventListener('input', e => {
    st.dMm = +e.target.value;
    $('viel-d-out').textContent = `${st.dMm} mm`;
    render();
  });

  chk('viel-rays', v => { st.showRayLines = v; render(); });
  chk('viel-div', v => { st.showDivLines = v; render(); });
  chk('viel-exact', v => { st.showExactOverlay = v; render(); });

  function newQuiz() {
    const n = Math.floor(Math.random() * 6 + 3); // 3..8
    const d = Math.floor(Math.random() * 4 + 8) * 10; // 80, 90, 100, 110
    const R = d / 2;
    const sExact = Math.round((2 * R * Math.sin(Math.PI / n)) * 10) / 10;

    const ask = Math.random() < 0.5 ? 's' : 'pole';
    const truth = ask === 's' ? sExact : Math.round(R * Math.sqrt(3) * 10) / 10;

    st.quiz = { n, d, R, ask, truth, answered: false };
    $('viel-task').innerHTML = ask === 's'
      ? `A circle with diameter <i>d</i> = <b>${d} mm</b> (<i>R</i> = ${R} mm) is inscribed with a regular <b>${n}-gon</b>. What is the mathematically exact edge length <i>s</i> (<i>s</i> = 2<i>R</i> · sin(180° / <i>n</i>))?`
      : `A circle has radius <i>R</i> = <b>${R} mm</b>. At what horizontal distance from the center are pole points C and D located (<i>x</i> = <i>R</i> · √3)?`;

    $('viel-ans-unit').textContent = 'mm';
    $('viel-ans').value = '';
    $('viel-ans-row').hidden = false;
    feedback('viel-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('viel-ans').value);
    if (isNaN(val)) {
      feedback('viel-feedback', 'Please enter a number.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.3;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('viel-feedback', ok
      ? `Correct! Value: ${fmt(st.quiz.truth, 1)} mm.`
      : `Incorrect. Correct answer: ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('viel-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
  }

  $('viel-quiz').addEventListener('click', newQuiz);
  $('viel-check').addEventListener('click', checkQuiz);
  onEnter('viel-ans', checkQuiz);

  UI.tabs['vieleck-umkreis'] = {
    render,
    reset() {
      Object.assign(st, DEFAULT_STATE());
      $('viel-d').value = st.dMm;
      $('viel-d-out').textContent = `${st.dMm} mm`;
      setSeg('viel-n', st.n);
      player.updateStepUI();
      render();
    }
  };
})();

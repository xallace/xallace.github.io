/* Tab 3: Fillet Arc in an Angle (Tabellenbuch Metall p. 61, row 3)
   Given: Angle ASB and radius r
   1. Draw parallels to AS and BS at distance r. Their intersection M is the required center.
   2. Intersections of the perpendiculars from M onto sides AS and BS are tangency points C and D.
   3. Draw fillet arc CD with radius r (smooth tangent transition). */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist, polarPt } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 3.2; // 3.2 px = 1 mm
  const STEPS = [
    [1, 'Draw parallels (M)', 'Draw parallels to sides <span class="overline">AS</span> and <span class="overline">BS</span> at distance <i>r</i>. Their intersection M is the required center of the circular arc.'],
    [2, 'Drop perpendiculars (C and D)', 'The intersections of the perpendiculars from M with sides <span class="overline">AS</span> and <span class="overline">BS</span> are the exact tangency points C and D.'],
    [3, 'Draw fillet arc', 'Draw a circular arc centered at M with radius <i>r</i> from C to D; it blends tangentially into both sides.']
  ];

  const BOOK_STATE = () => ({
    S: pt(140, 340),
    alphaDeg: 72,
    armLenMm: 95,
    rMm: 36,
    step: 3,
    showParallels: true,
    showPerps: true,
    showKite: false,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('rund-svg');
  const player = bindStepPlayer('rund', 3, STEPS, st, render);

  function getLegs() {
    const lenPx = st.armLenMm * SCALE;
    // Side B horizontal to the right, side A at angle alpha upward-right
    const B = polarPt(st.S, lenPx, 0); // 0° right
    const A = polarPt(st.S, lenPx, -st.alphaDeg); // upward in SVG
    return { A, B };
  }

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const { A, B } = getLegs();
    const rPx = st.rMm * SCALE;
    const res = Core.constructFilletCorner(st.S, A, B, rPx);

    // Given angle: sides SA and SB
    el(svg, 'line', {
      x1: st.S.x.toFixed(1), y1: st.S.y.toFixed(1),
      x2: A.x.toFixed(1), y2: A.y.toFixed(1),
      class: 'given-line', 'stroke-width': 2.4
    });
    el(svg, 'line', {
      x1: st.S.x.toFixed(1), y1: st.S.y.toFixed(1),
      x2: B.x.toFixed(1), y2: B.y.toFixed(1),
      class: 'given-line', 'stroke-width': 2.4
    });

    SVG.point(svg, st.S, { label: 'S', dx: -14, dy: 16 });
    SVG.point(svg, A, { label: 'A', dx: 14, dy: -8 });
    SVG.point(svg, B, { label: 'B', dx: 14, dy: 16 });

    // Angle arc alpha
    SVG.angleArcBoth(svg, st.S, B, A, 55, '*α*');

    if (!res.ok) {
      updateSide(res);
      return;
    }

    const { M, C, D, pA1, pA2, pB1, pB2 } = res;

    // Kite SMCD (proof of congruence SMC = SMD)
    if (st.showKite && st.step >= 2) {
      el(svg, 'polygon', {
        points: `${st.S.x.toFixed(1)},${st.S.y.toFixed(1)} ${C.x.toFixed(1)},${C.y.toFixed(1)} ${M.x.toFixed(1)},${M.y.toFixed(1)} ${D.x.toFixed(1)},${D.y.toFixed(1)}`,
        class: 'proof-fill'
      });
      // Angle bisector SM
      el(svg, 'line', {
        x1: st.S.x.toFixed(1), y1: st.S.y.toFixed(1),
        x2: M.x.toFixed(1), y2: M.y.toFixed(1),
        class: 'thin-line', 'stroke-dasharray': '4 3'
      });
    }

    // Step 1: Parallels at distance r
    if (st.step >= 1) {
      const isHl = hl === 1;
      if (st.showParallels) {
        // Parallel to SA through M
        const uA = unit(sub(A, st.S));
        const parAStart = sub(M, scale(uA, 70));
        const parAEnd = add(M, scale(uA, 90));
        el(svg, 'line', {
          x1: parAStart.x.toFixed(1), y1: parAStart.y.toFixed(1),
          x2: parAEnd.x.toFixed(1), y2: parAEnd.y.toFixed(1),
          class: isHl ? 'hl-line' : 'thin-line', 'stroke-dasharray': '5 3'
        });

        // Parallel to SB through M
        const uB = unit(sub(B, st.S));
        const parBStart = sub(M, scale(uB, 50));
        const parBEnd = add(M, scale(uB, 110));
        el(svg, 'line', {
          x1: parBStart.x.toFixed(1), y1: parBStart.y.toFixed(1),
          x2: parBEnd.x.toFixed(1), y2: parBEnd.y.toFixed(1),
          class: isHl ? 'hl-line' : 'thin-line', 'stroke-dasharray': '5 3'
        });

        // Radius arrows for distance r
        const midParB = lerp(D, M, 0.5);
        SVG.radiusArrow(svg, D, rPx, SVG.screenAngle(D, M), '*r*', { labelFrac: 0.55 });
      }

      SVG.centerMark(svg, M, 12);
      SVG.point(svg, M, { label: 'M', dx: 14, dy: -10, res: true });
      SVG.stepNum(svg, M.x + 24, M.y + 4, 1, { hl: isHl });
    }

    // Step 2: Perpendiculars from M onto sides (C and D)
    if (st.step >= 2) {
      const isHl = hl === 2;
      if (st.showPerps) {
        el(svg, 'line', {
          x1: M.x.toFixed(1), y1: M.y.toFixed(1),
          x2: C.x.toFixed(1), y2: C.y.toFixed(1),
          class: isHl ? 'hl-line' : 'thin-line', 'stroke-width': 1.2
        });
        el(svg, 'line', {
          x1: M.x.toFixed(1), y1: M.y.toFixed(1),
          x2: D.x.toFixed(1), y2: D.y.toFixed(1),
          class: isHl ? 'hl-line' : 'thin-line', 'stroke-width': 1.2
        });
        SVG.rightAngle(svg, C, M, st.S, 14);
        SVG.rightAngle(svg, D, M, st.S, 14);
      }

      SVG.point(svg, C, { label: 'C', dx: -12, dy: -10, res: true });
      SVG.point(svg, D, { label: 'D', dx: 0, dy: 18, res: true });
      SVG.stepNum(svg, D.x - 4, D.y + 28, 2, { hl: isHl });
    }

    // Step 3: Fillet arc CD
    if (st.step >= 3) {
      const isHl = hl === 3;
      SVG.arcBetweenPoints(svg, M, rPx, C, D, 0, {
        cls: isHl ? 'hl-line' : 'res-line',
        w: isHl ? 3.5 : 2.8
      });
      // Radius arrow r in the arc
      const angC = SVG.screenAngle(M, C);
      const angD = SVG.screenAngle(M, D);
      const midAng = (angC + angD) / 2;
      SVG.radiusArrow(svg, M, rPx, midAng, '*r*', { labelFrac: 0.5 });
    }

    updateSide(res);
  }

  function updateSide(res) {
    const resEl = $('rund-result');
    if (!res.ok) {
      resEl.className = 'result warn';
      resEl.textContent = 'Invalid angle or radius values';
    } else {
      resEl.className = 'result';
      resEl.innerHTML = `Smooth tangent transition &nbsp;·&nbsp; <span class="overline">SC</span> = <span class="overline">SD</span> = ${fmt(res.tanLen / SCALE, 1)} mm`;
    }

    const tMm = res.ok ? res.tanLen / SCALE : 0;
    const smMm = res.ok ? res.centerDist / SCALE : 0;
    const bMm = res.ok ? res.arcLen / SCALE : 0;

    $('rund-details').innerHTML = [
      ['Interior angle <i>α</i>', `${fmt(st.alphaDeg, 0)}°`],
      ['Fillet radius <i>r</i>', `${fmt(st.rMm, 0)} mm`],
      ['Tangent distance <i>t</i> = <span class="overline">SC</span> = <span class="overline">SD</span>', tMm ? `${fmt(tMm, 1)} mm` : '–'],
      ['Vertex distance <span class="overline">SM</span>', smMm ? `${fmt(smMm, 1)} mm` : '–'],
      ['Arc length <i>b</i>', bMm ? `${fmt(bMm, 1)} mm` : '–'],
      ['Tangent length formula', `<i>t</i> = <i>r</i> / tan(<i>α</i> / 2)`]
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');

    $('rund-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} correct` : '';
  }

  $('rund-alpha').addEventListener('input', e => {
    st.alphaDeg = +e.target.value;
    $('rund-alpha-out').textContent = `${st.alphaDeg}°`;
    render();
  });
  $('rund-r').addEventListener('input', e => {
    st.rMm = +e.target.value;
    $('rund-r-out').textContent = `${st.rMm} mm`;
    render();
  });

  chk('rund-par', v => { st.showParallels = v; render(); });
  chk('rund-perp', v => { st.showPerps = v; render(); });
  chk('rund-kite', v => { st.showKite = v; render(); });

  function newQuiz() {
    // Clean number combinations
    const angles = [60, 90, 120];
    const a = angles[Math.floor(Math.random() * angles.length)];
    const r = Math.floor(Math.random() * 4 + 2) * 10; // 20, 30, 40, 50

    let truth = 0;
    let taskText = '';
    const askType = Math.random() < 0.5 ? 't' : 'sm';

    if (askType === 't') {
      truth = Math.round((r / Math.tan((a / 2) * Core.DEG)) * 10) / 10;
      taskText = `Given an angle <i>α</i> = <b>${a}°</b> and fillet radius <i>r</i> = <b>${r} mm</b>, what is the tangent distance <i>t</i> = <span class="overline">SC</span> (<i>t</i> = <i>r</i> / tan(<i>α</i> / 2))?`;
    } else {
      truth = Math.round((r / Math.sin((a / 2) * Core.DEG)) * 10) / 10;
      taskText = `Given an angle <i>α</i> = <b>${a}°</b> and radius <i>r</i> = <b>${r} mm</b>, what is the distance <span class="overline">SM</span> from the arc center to vertex S (<span class="overline">SM</span> = <i>r</i> / sin(<i>α</i> / 2))?`;
    }

    st.quiz = { a, r, truth, askType, answered: false };
    $('rund-task').innerHTML = taskText;
    $('rund-ans-unit').textContent = 'mm';
    $('rund-ans').value = '';
    $('rund-ans-row').hidden = false;
    feedback('rund-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('rund-ans').value);
    if (isNaN(val)) {
      feedback('rund-feedback', 'Please enter a number.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('rund-feedback', ok
      ? `Correct! Value: ${fmt(st.quiz.truth, 1)} mm.`
      : `Incorrect. Correct answer: ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('rund-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
  }

  $('rund-quiz').addEventListener('click', newQuiz);
  $('rund-check').addEventListener('click', checkQuiz);
  onEnter('rund-ans', checkQuiz);

  UI.tabs['rundung-winkel'] = {
    render,
    reset() {
      Object.assign(st, BOOK_STATE());
      $('rund-alpha').value = st.alphaDeg;
      $('rund-alpha-out').textContent = `${st.alphaDeg}°`;
      $('rund-r').value = st.rMm;
      $('rund-r-out').textContent = `${st.rMm} mm`;
      player.updateStepUI();
      render();
    }
  };
})();

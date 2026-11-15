/* Tab 6: Dividing a line segment (Tabellenbuch Metall p. 60 bottom)
   Given: segment AB to be divided into 5 (generally n) equal parts.
   1. Ray from A at an arbitrary angle.
   2. Step off 5 arbitrary but equal intervals along the ray from A (1'…5').
   3. Connect endpoint 5' to B.
   4. Draw parallels to 5'B through the other division marks (yielding 1…5 on AB). */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 4; // 4 px = 1 mm
  const STEPS = [
    [1, 'Auxiliary ray from A', 'Draw a ray from A at an arbitrary acute angle <i>β</i>.'],
    [2, 'Step off equal parts', 'Use the compass to step off <i>n</i> arbitrary but equal intervals 1′…<i>n</i>′ along the ray from A.'],
    [3, 'Connect endpoint', 'Connect endpoint <i>n</i>′ (5′ in the handbook) to segment endpoint B.'],
    [4, 'Draw parallels', 'Draw parallels to <span class="overline"><i>n</i>′B</span> through the remaining marks (yielding division points 1…<i>n</i> on <span class="overline">AB</span>).']
  ];

  const BOOK_STATE = () => ({
    A: pt(106, 78),
    B: pt(506, 78), // 400 px = 100 mm
    n: 5,
    rayDeg: 32,
    spanMm: 16.5,
    step: 4,
    showArcs: true,
    showDims: true,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('tei-svg');
  const player = bindStepPlayer('tei', 4, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const stepPx = st.spanMm * SCALE;
    // In SVG coordinates (y downward), +rayDeg yields a ray going down-right as in the handbook
    const res = Core.constructDivideSegment(st.A, st.B, st.n, st.rayDeg, stepPx);
    const { A, B, n, rayPts, divPts } = res;

    // Given segment AB with end ticks
    SVG.segmentWithTicks(svg, A, B, { w: 2.5 });
    SVG.text(svg, A.x - 14, A.y + 5, 'A', { 'text-anchor': 'end', 'font-size': 16 });
    SVG.text(svg, B.x + 14, B.y + 5, 'B', { 'text-anchor': 'start', 'font-size': 16 });

    // Step 1: Auxiliary ray from A at arbitrary angle β
    if (st.step >= 1) {
      const endRay = rayPts[n - 1].pt;
      const uRay = unit(sub(endRay, A));
      const rayTip = add(endRay, scale(uRay, 42));
      el(svg, 'line', {
        x1: A.x.toFixed(1), y1: A.y.toFixed(1),
        x2: rayTip.x.toFixed(1), y2: rayTip.y.toFixed(1),
        class: 'thin-line' + (hl === 1 ? ' hl' : ''),
        'stroke-width': 1.35
      });
    }

    // Step 2: Step off n equal compass spans 1' .. n' along ray (with small compass arcs and arrows as in handbook)
    if (st.step >= 2) {
      const rayScreenDeg = SVG.screenAngle(A, rayPts[0].pt);
      const cls2 = 'arc-line' + (hl === 2 ? ' hl' : '');
      for (let i = 0; i < n; i++) {
        const prev = i === 0 ? A : rayPts[i - 1].pt;
        const cur = rayPts[i].pt;
        if (st.showArcs) {
          SVG.compassArc(svg, prev, stepPx, rayScreenDeg - 13, rayScreenDeg + 20, { cls: cls2 });
          SVG.radiusArrow(svg, prev, stepPx, rayScreenDeg + 15, '', { w: 0.95 });
        } else {
          const nAng = (rayScreenDeg + 90) * Math.PI / 180;
          el(svg, 'line', {
            x1: (cur.x - Math.cos(nAng) * 5).toFixed(1), y1: (cur.y - Math.sin(nAng) * 5).toFixed(1),
            x2: (cur.x + Math.cos(nAng) * 5).toFixed(1), y2: (cur.y + Math.sin(nAng) * 5).toFixed(1),
            class: 'thin-line'
          });
        }
        const uRay = unit(sub(rayPts[0].pt, A));
        const nUp = { x: uRay.y, y: -uRay.x };
        const lblPos = add(sub(cur, scale(uRay, 9)), scale(nUp, 12));
        SVG.text(svg, lblPos.x, lblPos.y + 4, cur.label || `${i + 1}′`, {
          'text-anchor': 'middle', 'font-size': 14.5, class: 'halo' + (hl === 2 ? ' hl-text' : '')
        });
      }
      // Draggable endpoint n' on auxiliary ray
      const lastRay = rayPts[n - 1].pt;
      el(svg, 'circle', { cx: lastRay.x.toFixed(1), cy: lastRay.y.toFixed(1), r: 16, class: 'pt-hit', 'data-drag': 'ray' });
    }

    // Step 3: Connect endpoint n' to B
    if (st.step >= 3) {
      const lastRay = rayPts[n - 1].pt;
      const uPar = unit(sub(B, lastRay));
      const p0 = sub(lastRay, scale(uPar, 18));
      const p1 = add(B, scale(uPar, 12));
      el(svg, 'line', {
        x1: p0.x.toFixed(1), y1: p0.y.toFixed(1),
        x2: p1.x.toFixed(1), y2: p1.y.toFixed(1),
        class: (st.step === 3 ? 'res-line' : 'thin-line') + (hl === 3 ? ' hl' : ''),
        'stroke-width': st.step === 3 ? 2.1 : 1.35
      });
      if (st.step === 3) {
        SVG.stepNum(svg, B.x, B.y - 12, n, { hl: hl === 3 });
      }
    }

    // Step 4: Draw parallels to n'B through the remaining division marks 1'...(n-1)'
    if (st.step >= 4) {
      const lastRay = rayPts[n - 1].pt;
      const uPar = unit(sub(B, lastRay));
      for (let i = 0; i < n; i++) {
        const rPt = rayPts[i].pt;
        const dPt = divPts[i].pt;
        const p0 = sub(rPt, scale(uPar, 16));
        const p1 = add(dPt, scale(uPar, 10));
        if (i < n - 1) {
          el(svg, 'line', {
            x1: p0.x.toFixed(1), y1: p0.y.toFixed(1),
            x2: p1.x.toFixed(1), y2: p1.y.toFixed(1),
            class: 'res-line' + (hl === 4 ? ' hl' : ''),
            'stroke-width': 1.5
          });
        }
        // Short tick mark on AB & red division number 1..n as in handbook
        el(svg, 'line', {
          x1: dPt.x.toFixed(1), y1: (dPt.y - 5).toFixed(1),
          x2: dPt.x.toFixed(1), y2: (dPt.y + 5).toFixed(1),
          class: 'given-line', 'stroke-width': 1.6
        });
        SVG.stepNum(svg, dPt.x, dPt.y - 12, i + 1, { hl: hl === 4 });
      }

      // Optional sub-lengths Δl between division points
      if (st.showDims) {
        const partMm = fmt(res.partLen / SCALE, 1);
        for (let i = 0; i < n; i++) {
          const pLeft = i === 0 ? A : divPts[i - 1].pt;
          const pRight = divPts[i].pt;
          SVG.text(svg, (pLeft.x + pRight.x) / 2, A.y - 30, `${partMm}`, {
            'text-anchor': 'middle', 'font-size': 12, class: 'halo lbl-muted'
          });
        }
      }
    }

    // Draggable point B
    el(svg, 'circle', { cx: B.x.toFixed(1), cy: B.y.toFixed(1), r: 15, class: 'pt-hit', 'data-drag': 'B' });

    updateSide(res);
  }

  function updateSide(res) {
    const abMm = res.abLen / SCALE;
    const partMm = res.partLen / SCALE;
    $('tei-angle').value = st.rayDeg;
    $('tei-angle-out').textContent = `${fmt(st.rayDeg, 0)}°`;
    $('tei-span').value = st.spanMm;
    $('tei-span-out').textContent = `${fmt(st.spanMm, 1)} mm`;
    $('tei-given').innerHTML = `<b>Given:</b> Segment <span class="overline">AB</span> to be divided into ${st.n} equal parts.`;
    $('tei-result').innerHTML = `Δ<i>l</i> = <span class="overline">AB</span> / ${st.n} = ${fmt(partMm, 2)} mm`;
    $('tei-details').innerHTML = [
      ['Total segment <span class="overline">AB</span>', `${fmt(abMm, 1)} mm`],
      ['Number of equal parts <i>n</i>', `${st.n}`],
      ['Part length Δ<i>l</i> = <span class="overline">AB</span> / <i>n</i>', `${fmt(partMm, 2)} mm`],
      ['Compass span <i>s</i> on aux. ray', `${fmt(st.spanMm, 1)} mm`],
      ['Total auxiliary ray length <i>n</i> · <i>s</i>', `${fmt(st.n * st.spanMm, 1)} mm`],
      ['Intercept ratio <span class="overline">A1</span> / <span class="overline">AB</span> = <span class="overline">A1′</span> / <span class="overline">A' + st.n + '′</span>', `1 / ${st.n} = ${fmt(100 / st.n, 1)} %`]
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    $('tei-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} correct` : '';
  }

  svg.addEventListener('pointerdown', e => {
    const hit = e.target.closest('[data-drag]');
    if (!hit) return;
    const which = hit.dataset.drag;
    player.stopTimer();
    SVG.startDrag(svg, e, loc => {
      if (which === 'B') {
        st.B.x = Math.max(280, Math.min(580, loc.x));
      } else if (which === 'ray') {
        const dx = loc.x - st.A.x, dy = loc.y - st.A.y;
        const deg = Math.atan2(dy, dx) * 180 / Math.PI;
        st.rayDeg = Math.round(Math.max(18, Math.min(52, deg)));
        const totMm = Math.hypot(dx, dy) / SCALE;
        st.spanMm = Math.round(Math.max(11, Math.min(22, totMm / st.n)) * 2) / 2;
      }
      render();
    });
  });

  seg('tei-n', v => {
    st.n = +v;
    if (st.n * st.spanMm > 115) st.spanMm = Math.floor(115 / st.n);
    render();
  });
  $('tei-angle').addEventListener('input', e => { st.rayDeg = +e.target.value; render(); });
  $('tei-span').addEventListener('input', e => { st.spanMm = +e.target.value; render(); });
  chk('tei-arcs', v => { st.showArcs = v; render(); });
  chk('tei-dims', v => { st.showDims = v; render(); });

  function newQuiz() {
    const n = [4, 5, 6, 8][Math.floor(Math.random() * 4)];
    const part = UI.rnd(12, 28, 1.5);
    const abMm = +(n * part).toFixed(1);
    const k = UI.rnd(2, n - 1, 1);
    const kind = Math.random() < 0.5 ? 'part' : 'kth';
    const truth = kind === 'part' ? part : +(k * part).toFixed(1);
    st.quiz = { n, abMm, k, truth, answered: false };
    const ord = k === 1 ? '1st' : k === 2 ? '2nd' : k === 3 ? '3rd' : k + 'th';
    $('tei-task').innerHTML = kind === 'part'
      ? `A flange strip of length <span class="overline">AB</span> = <b>${fmt(abMm, 1)} mm</b> is divided into <b><i>n</i> = ${n}</b> equal parts using the intercept theorem. How long is a single segment Δ<i>l</i>?`
      : `A segment <span class="overline">AB</span> = <b>${fmt(abMm, 1)} mm</b> is divided into <b><i>n</i> = ${n}</b> equal parts. At what distance <span class="overline">A${k}</span> from point A does the <b>${ord} division point</b> lie?`;
    $('tei-ans-unit').textContent = 'mm';
    $('tei-ans').value = '';
    $('tei-ans-row').hidden = false;
    feedback('tei-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const v = Core.parseNum($('tei-ans').value);
    if (!isFinite(v)) { feedback('tei-feedback', 'Please enter a length in mm.', false); return; }
    const ok = Math.abs(v - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('tei-feedback', ok
      ? `Correct: ${fmt(st.quiz.truth, 1)} mm!`
      : `Expected: ${fmt(st.quiz.truth, 1)} mm (single part Δl = ${fmt(st.quiz.abMm / st.quiz.n, 1)} mm).`, ok);
    $('tei-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
  }

  $('tei-quiz').addEventListener('click', newQuiz);
  $('tei-check').addEventListener('click', checkQuiz);
  onEnter('tei-ans', checkQuiz);

  function reset() {
    player.stopTimer();
    Object.assign(st, BOOK_STATE());
    setSeg('tei-n', '5');
    $('tei-arcs').checked = $('tei-dims').checked = true;
    $('tei-ans-row').hidden = true;
    $('tei-task').textContent = '';
    feedback('tei-feedback', '');
    player.updateStepUI();
    render();
  }

  UI.register('teilen', { render, reset, state: st });
  player.updateStepUI();
  render();
})();

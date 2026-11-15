/* Tab 6: Hexagon & Dodecagon in Circumcircle (Tabellenbuch Metall p. 61, row 6)
   Given: Circle with diameter d
   1. Strike circular arcs with radius r = d/2 centered at A.
   2. Strike circular arcs with radius r centered at B.
   3. Connecting lines form the hexagon.
   For a dodecagon, locate the intermediate points by also striking arcs from C and D. */
(() => {
  'use strict';
  const { $, setSeg, seg, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist, polarPt } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 2.6; // 2.6 px = 1 mm

  const STEPS_HEX = [
    [1, 'Arcs at A (r = d/2)', 'Strike circular arcs with radius <i>r</i> = <i>d</i>/2 centered at vertex A.'],
    [2, 'Arcs at B (r = d/2)', 'Strike circular arcs with the same radius <i>r</i> centered at vertex B.'],
    [3, 'Connect hexagon', 'Connect the 6 intersection points to form a regular hexagon (edge length <i>s</i> = <i>r</i>).']
  ];

  const STEPS_DODECA = [
    [1, 'Arcs at A', 'Strike circular arcs with radius <i>r</i> = <i>d</i>/2 centered at point A.'],
    [2, 'Arcs at B', 'Strike circular arcs with radius <i>r</i> centered at point B.'],
    [3, 'Arcs at C and D', 'Additional arcs centered at endpoints C and D of the transverse axis → 12 points spaced 30° apart.'],
    [4, 'Connect dodecagon', 'Connect the 12 intersection points to form a regular dodecagon.']
  ];

  const BOOK_STATE = () => ({
    M: pt(320, 235),
    dMm: 92,
    mode: 'hexagon', // 'hexagon' | 'dodecagon'
    step: 3,
    showIncircle: true,
    showRadii: true,
    showDimSW: false,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('sechs-svg');
  let player = bindStepPlayer('sechs', 3, STEPS_HEX, st, render);

  function resetPlayer() {
    const isHex = st.mode === 'hexagon';
    const steps = isHex ? STEPS_HEX : STEPS_DODECA;
    const maxS = isHex ? 3 : 4;
    if (st.step > maxS) st.step = maxS;
    player = bindStepPlayer('sechs', maxS, steps, st, render);
    player.updateStepUI();
  }

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const RPx = (st.dMm / 2) * SCALE;
    const res = Core.constructHexagonDodecagon(st.M, RPx, st.mode);

    // Given circumcircle
    SVG.circle(svg, st.M, RPx, { cls: 'given-line', w: 2.2 });
    SVG.centerMark(svg, st.M, 14);

    // Centerlines
    el(svg, 'line', {
      x1: st.M.x.toFixed(1), y1: (st.M.y - RPx - 25).toFixed(1),
      x2: st.M.x.toFixed(1), y2: (st.M.y + RPx + 25).toFixed(1),
      class: 'thin-line', 'stroke-dasharray': '6 4'
    });
    el(svg, 'line', {
      x1: (st.M.x - RPx - 25).toFixed(1), y1: st.M.y.toFixed(1),
      x2: (st.M.x + RPx + 25).toFixed(1), y2: st.M.y.toFixed(1),
      class: 'thin-line', 'stroke-dasharray': '6 4'
    });

    // Diameter dimension on left
    SVG.dimension(svg, { x: st.M.x - RPx, y: st.M.y - RPx }, { x: st.M.x - RPx, y: st.M.y + RPx }, '*d*', { offset: -35 });

    const { A, B, C, D, pA1, pA2, pB1, pB2, pD1, pD2, pC1, pC2, hexVertices, dodecaVertices } = res;

    SVG.point(svg, A, { label: 'A', dx: 0, dy: -12 });
    SVG.point(svg, B, { label: 'B', dx: 0, dy: 18 });
    SVG.point(svg, C, { label: 'C', dx: -14, dy: 5 });
    SVG.point(svg, D, { label: 'D', dx: 14, dy: 5 });

    // Step 1: Arcs centered at A with radius r
    if (st.step >= 1) {
      const isHl = hl === 1;
      SVG.arcThroughPoint(svg, A, RPx, pA1, 26, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2 });
      SVG.arcThroughPoint(svg, A, RPx, pA2, 26, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2 });
      SVG.point(svg, pA1, { r: 3.5 });
      SVG.point(svg, pA2, { r: 3.5 });
      SVG.stepNum(svg, pA2.x - 14, pA2.y - 12, 1, { hl: isHl });
      SVG.stepNum(svg, pA1.x + 14, pA1.y - 12, 1, { hl: isHl });
      if (st.showRadii) {
        SVG.radiusArrow(svg, A, RPx, 30, '*r*', { labelFrac: 0.55 });
      }
    }

    // Step 2: Arcs centered at B with radius r
    if (st.step >= 2) {
      const isHl = hl === 2;
      SVG.arcThroughPoint(svg, B, RPx, pB1, 26, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2 });
      SVG.arcThroughPoint(svg, B, RPx, pB2, 26, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2 });
      SVG.point(svg, pB1, { r: 3.5 });
      SVG.point(svg, pB2, { r: 3.5 });
      SVG.stepNum(svg, pB2.x - 14, pB2.y + 16, 2, { hl: isHl });
      SVG.stepNum(svg, pB1.x + 14, pB1.y + 16, 2, { hl: isHl });
    }

    if (st.mode === 'hexagon') {
      // Step 3 (Hexagon): Connecting lines form the hexagon
      if (st.step >= 3) {
        const isHl = hl === 3;
        const hexPts = hexVertices.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        el(svg, 'polygon', {
          points: hexPts,
          class: isHl ? 'hl-line' : 'res-line',
          'stroke-width': isHl ? 3.4 : 2.6,
          fill: 'rgba(56, 189, 248, 0.08)'
        });
        SVG.stepNum(svg, (B.x + pB1.x) / 2 + 16, (B.y + pB1.y) / 2 + 14, 3, { hl: isHl });

        // Incircle (width across flats AF)
        if (st.showIncircle) {
          SVG.circle(svg, st.M, res.rInHex, { cls: 'proof-line', dash: '4 3', w: 1.3 });
        }
        if (st.showDimSW) {
          // Horizontal width across flats AF dimension
          SVG.dimension(svg, { x: st.M.x - res.rInHex, y: st.M.y }, { x: st.M.x + res.rInHex, y: st.M.y }, '*AF*', { offset: 25 });
        }
      }
    } else {
      // Dodecagon mode
      // Step 3 (Dodecagon): Arcs centered at C and D
      if (st.step >= 3) {
        const isHl = hl === 3;
        SVG.arcThroughPoint(svg, C, RPx, pC1, 26, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2 });
        SVG.arcThroughPoint(svg, C, RPx, pC2, 26, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2 });
        SVG.arcThroughPoint(svg, D, RPx, pD1, 26, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2 });
        SVG.arcThroughPoint(svg, D, RPx, pD2, 26, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2 });
        SVG.point(svg, pC1, { r: 3.5 });
        SVG.point(svg, pC2, { r: 3.5 });
        SVG.point(svg, pD1, { r: 3.5 });
        SVG.point(svg, pD2, { r: 3.5 });
        SVG.stepNum(svg, C.x + 22, C.y - 12, 3, { hl: isHl });
        SVG.stepNum(svg, D.x - 22, D.y - 12, 3, { hl: isHl });
      }

      // Step 4 (Dodecagon): Connect dodecagon
      if (st.step >= 4) {
        const isHl = hl === 4;
        const dodPts = dodecaVertices.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        el(svg, 'polygon', {
          points: dodPts,
          class: isHl ? 'hl-line' : 'res-line',
          'stroke-width': isHl ? 3.4 : 2.6,
          fill: 'rgba(56, 189, 248, 0.08)'
        });
        for (const p of dodecaVertices) SVG.point(svg, p, { r: 3.5, res: true });
        if (st.showIncircle) {
          SVG.circle(svg, st.M, res.rInDodeca, { cls: 'proof-line', dash: '4 3', w: 1.3 });
        }
      }
    }

    updateSide(res);
  }

  function updateSide(res) {
    const resEl = $('sechs-result');
    const isHex = st.mode === 'hexagon';
    resEl.className = 'result';
    resEl.innerHTML = isHex
      ? `Regular hexagon &nbsp;·&nbsp; Edge length <i>s</i> = <i>r</i> = ${fmt(res.sHex / SCALE, 1)} mm`
      : `Regular dodecagon &nbsp;·&nbsp; Edge length <i>s</i>₁₂ = ${fmt(res.sDodeca / SCALE, 1)} mm`;

    const rMm = st.dMm / 2;
    const swMm = res.swHex / SCALE;
    const s12Mm = res.sDodeca / SCALE;

    $('sechs-details').innerHTML = [
      ['Diameter <i>d</i> (across corners <i>e</i>)', `${fmt(st.dMm, 0)} mm`],
      ['Radius <i>r</i> = <i>d</i>/2', `${fmt(rMm, 1)} mm`],
      ['Hexagon edge <i>s</i>', `${fmt(rMm, 1)} mm (exact = <i>r</i>)`],
      ['Width across flats <i>AF</i> = <i>d</i> · √3 / 2', `${fmt(swMm, 2)} mm (incircle)`],
      ['Dodecagon edge <i>s</i>₁₂', `${fmt(s12Mm, 2)} mm (2<i>r</i> sin 15°)`],
      ['Angle between vertices', isHex ? '60.0°' : '30.0°']
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');

    $('sechs-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} correct` : '';
  }

  seg('sechs-mode', v => {
    st.mode = v;
    resetPlayer();
    render();
  });

  $('sechs-d').addEventListener('input', e => {
    st.dMm = +e.target.value;
    $('sechs-d-out').textContent = `${st.dMm} mm`;
    render();
  });

  chk('sechs-incircle', v => { st.showIncircle = v; render(); });
  chk('sechs-radii', v => { st.showRadii = v; render(); });
  chk('sechs-sw', v => { st.showDimSW = v; render(); });

  function newQuiz() {
    // Standardized wrench sizes ISO 4014 / DIN 933
    const cases = [
      { thread: 'M8', sw: 13, d: 15.01 },
      { thread: 'M10', sw: 17, d: 19.63 },
      { thread: 'M12', sw: 19, d: 21.94 },
      { thread: 'M16', sw: 24, d: 27.71 }
    ];
    const c = cases[Math.floor(Math.random() * cases.length)];
    const askSW = Math.random() < 0.5;
    const truth = askSW ? c.sw : c.d;

    st.quiz = { c, askSW, truth, answered: false };
    $('sechs-task').innerHTML = askSW
      ? `A hexagon bolt <b>${c.thread}</b> has a circumcircle diameter (width across corners) <i>e</i> = <i>d</i> = <b>${c.d} mm</b>. What is the corresponding standard width across flats <i>AF</i> in mm (<i>AF</i> = <i>d</i> · √3 / 2)?`
      : `A hexagon nut <b>${c.thread}</b> has a standard width across flats <i>AF</i> = <b>${c.sw} mm</b>. What is the width across corners / circumcircle diameter <i>d</i> in mm (<i>d</i> = <i>AF</i> / (√3 / 2))?`;

    $('sechs-ans-unit').textContent = 'mm';
    $('sechs-ans').value = '';
    $('sechs-ans-row').hidden = false;
    feedback('sechs-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('sechs-ans').value);
    if (isNaN(val)) {
      feedback('sechs-feedback', 'Please enter a number.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.3;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('sechs-feedback', ok
      ? `Correct! Value: ${fmt(st.quiz.truth, 1)} mm.`
      : `Incorrect. Correct answer: ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('sechs-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
  }

  $('sechs-quiz').addEventListener('click', newQuiz);
  $('sechs-check').addEventListener('click', checkQuiz);
  onEnter('sechs-ans', checkQuiz);

  UI.tabs['sechseck-zwoelfeck'] = {
    render,
    reset() {
      Object.assign(st, BOOK_STATE());
      $('sechs-d').value = st.dMm;
      $('sechs-d-out').textContent = `${st.dMm} mm`;
      setSeg('sechs-mode', st.mode);
      resetPlayer();
      render();
    }
  };
})();

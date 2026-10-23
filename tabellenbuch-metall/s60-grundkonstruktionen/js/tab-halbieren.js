/* Reiter 2: Halbieren einer Strecke (Tabellenbuch Metall S. 60, 2. Zeile)
   Gegeben: Strecke AB
   1. Kreisbogen 1 mit Radius r um A; r > 1/2 AB.
   2. Kreisbogen 2 mit gleichem Radius r um B.
   3. Die Verbindungslinie der Kreisschnittpunkte ist die Mittelsenkrechte bzw. die Halbierende der Strecke AB. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 4; // 4 px = 1 mm
  const STEPS = [
    [1, 'Kreisbogen 1 um A', 'Kreisbogen 1 mit Radius <i>r</i> um A schlagen; Bedingung: <i>r</i> &gt; ½ <span class="overline">AB</span>.'],
    [2, 'Kreisbogen 2 um B', 'Kreisbogen 2 mit gleichem Radius <i>r</i> um B schlagen (zwei Kreisschnittpunkte S₁ und S₂).'],
    [3, 'Mittelsenkrechte ziehen', 'Die Verbindungslinie 3 der Kreisschnittpunkte ist die Mittelsenkrechte bzw. Halbierende der Strecke <span class="overline">AB</span> (Mittelpunkt M).']
  ];

  const BOOK_STATE = () => ({
    A: pt(150, 230),
    B: pt(490, 230),
    ratio: 0.68,
    step: 3,
    showRadii: true,
    showProof: false,
    showDims: true,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('bis-svg');
  const player = bindStepPlayer('bis', 3, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const abPx = dist(st.A, st.B);
    const rPx = abPx * st.ratio;
    const res = Core.constructBisector(st.A, st.B, rPx);
    const { A, B, M } = res;
    const baseDeg = SVG.screenAngle(A, B);

    // Gegebene Strecke AB mit Endstrichen
    SVG.segmentWithTicks(svg, A, B, { w: 2.5 });
    SVG.text(svg, A.x - 16, A.y + 5, 'A', { 'text-anchor': 'end', 'font-size': 16 });
    SVG.text(svg, B.x + 16, B.y + 5, 'B', { 'text-anchor': 'start', 'font-size': 16 });

    if (!res.ok) {
      // Anschauliche Darstellung bei Verletzung der Bedingung r > 1/2 AB
      if (st.step >= 1) SVG.compassArc(svg, A, rPx, baseDeg - 65, baseDeg + 65, { cls: 'warn-arc' });
      if (st.step >= 2) SVG.compassArc(svg, B, rPx, baseDeg + 115, baseDeg + 245, { cls: 'warn-arc' });
      SVG.text(svg, M.x, M.y - 95,
        res.reason === 'tangent_equal_half'
          ? 'r = ½ AB: Nur 1 Berührpunkt M – keine Richtung für die Mittelsenkrechte!'
          : 'r < ½ AB: Die beiden Kreisbögen schneiden sich nicht!',
        { 'text-anchor': 'middle', 'font-size': 14.5, class: 'halo step-num' });
    } else {
      const { S1, S2 } = res;

      // Optional: Symmetrie-Raute AS1BS2
      if (st.showProof && st.step >= 2) {
        el(svg, 'polygon', {
          points: `${A.x.toFixed(1)},${A.y.toFixed(1)} ${S1.x.toFixed(1)},${S1.y.toFixed(1)} ${B.x.toFixed(1)},${B.y.toFixed(1)} ${S2.x.toFixed(1)},${S2.y.toFixed(1)}`,
          class: 'proof-fill'
        });
        if (st.step >= 3) SVG.rightAngle(svg, M, S2, B, 18);
      }

      // Schritt 1: Kreisbogen 1 um A
      if (st.step >= 1) {
        const cls1 = 'arc-line' + (hl === 1 ? ' hl' : '');
        SVG.arcBetweenPoints(svg, A, rPx, S2, S1, 14, { cls: cls1 });
        if (st.showRadii) {
          const ang1 = SVG.screenAngle(A, S2) + 9;
          SVG.radiusArrow(svg, A, rPx, ang1, '*r*', { labelSide: 'left', labelOffset: 12 });
        }
        const pNum1 = SVG.screenPolar(A, rPx + 14, SVG.screenAngle(A, S2) + 12);
        SVG.stepNum(svg, pNum1.x + 4, pNum1.y + 5, 1, { hl: hl === 1 });
      }

      // Schritt 2: Kreisbogen 2 um B
      if (st.step >= 2) {
        const cls2 = 'arc-line' + (hl === 2 ? ' hl' : '');
        SVG.arcBetweenPoints(svg, B, rPx, S1, S2, 14, { cls: cls2 });
        if (st.showRadii) {
          const ang2 = SVG.screenAngle(B, S1) + 9;
          SVG.radiusArrow(svg, B, rPx, ang2, '*r*', { labelSide: 'left', labelOffset: 12 });
        }
        const pNum2 = SVG.screenPolar(B, rPx + 14, SVG.screenAngle(B, S1) - 10);
        SVG.stepNum(svg, pNum2.x - 4, pNum2.y + 5, 2, { hl: hl === 2 });
      }

      // Schritt 3: Verbindungslinie der Kreisschnittpunkte = Mittelsenkrechte
      if (st.step >= 3) {
        const u = unit(sub(S1, S2));
        const pTop = sub(S2, scale(u, 28));
        const pBot = add(S1, scale(u, 28));
        el(svg, 'line', {
          x1: pTop.x.toFixed(1), y1: pTop.y.toFixed(1),
          x2: pBot.x.toFixed(1), y2: pBot.y.toFixed(1),
          class: 'res-line' + (hl === 3 ? ' hl' : ''),
          'stroke-width': 2.2
        });
        SVG.stepNum(svg, M.x + 14, M.y - 26, 3, { hl: hl === 3 });
        SVG.text(svg, M.x - 13, M.y + 21, 'M', {
          'text-anchor': 'middle', 'font-size': 15.5,
          class: 'halo step-num' + (hl === 3 ? ' hl-text' : '')
        });

        // Teilmaße AM = MB
        if (st.showDims) {
          const halfMm = fmt((abPx / 2) / SCALE, 1);
          SVG.text(svg, (A.x + M.x) / 2, (A.y + M.y) / 2 - 10, `${halfMm} mm`, {
            'text-anchor': 'middle', 'font-size': 12.5, class: 'halo lbl-muted'
          });
          SVG.text(svg, (M.x + B.x) / 2, (M.y + B.y) / 2 - 10, `${halfMm} mm`, {
            'text-anchor': 'middle', 'font-size': 12.5, class: 'halo lbl-muted'
          });
        }
      }
    }

    // Ziehpunkte A und B
    el(svg, 'circle', { cx: A.x.toFixed(1), cy: A.y.toFixed(1), r: 14, class: 'pt-hit', 'data-drag': 'A' });
    el(svg, 'circle', { cx: B.x.toFixed(1), cy: B.y.toFixed(1), r: 14, class: 'pt-hit', 'data-drag': 'B' });

    updateSide(res, abPx, rPx);
  }

  function updateSide(res, abPx, rPx) {
    const abMm = abPx / SCALE;
    const halfMm = abMm / 2;
    const rMm = rPx / SCALE;
    $('bis-ratio').value = st.ratio;
    $('bis-ratio-out').textContent = `${fmt(st.ratio, 2)} · AB (${fmt(rMm, 1)} mm)`;
    const resEl = $('bis-result');
    if (!res.ok) {
      resEl.className = 'result warn';
      resEl.innerHTML = `Ungültig: <i>r</i> = ${fmt(rMm, 1)} mm ≤ ½ <span class="overline">AB</span> (${fmt(halfMm, 1)} mm)`;
    } else {
      resEl.className = 'result';
      resEl.innerHTML = `<span class="overline">AM</span> = <span class="overline">MB</span> = ${fmt(halfMm, 1)} mm &nbsp;·&nbsp; 90°`;
    }
    $('bis-details').innerHTML = [
      ['Strecke <span class="overline">AB</span>', `${fmt(abMm, 1)} mm`],
      ['Mindestradius ½ <span class="overline">AB</span>', `&gt; ${fmt(halfMm, 1)} mm`],
      ['Gewählter Zirkelradius <i>r</i>', `${fmt(rMm, 1)} mm (${fmt(st.ratio * 100, 0)} %)`],
      ['Halbstrecken <span class="overline">AM</span> = <span class="overline">MB</span>', `${fmt(halfMm, 1)} mm`],
      ['Schnittpunkt-Abstand <i>h</i> von M', res.ok ? `${fmt(res.heightH / SCALE, 1)} mm` : '–']
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    $('bis-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} richtig` : '';
  }

  svg.addEventListener('pointerdown', e => {
    const hit = e.target.closest('[data-drag]');
    if (!hit) return;
    const which = hit.dataset.drag;
    player.stopTimer();
    SVG.startDrag(svg, e, loc => {
      if (which === 'A') {
        st.A.x = Math.max(80, Math.min(250, loc.x));
        st.A.y = Math.max(160, Math.min(300, loc.y));
      } else if (which === 'B') {
        st.B.x = Math.max(390, Math.min(560, loc.x));
        st.B.y = Math.max(160, Math.min(300, loc.y));
      }
      render();
    });
  });

  $('bis-ratio').addEventListener('input', e => {
    st.ratio = +e.target.value;
    render();
  });

  chk('bis-radii', v => { st.showRadii = v; render(); });
  chk('bis-proof', v => { st.showProof = v; render(); });
  chk('bis-dims', v => { st.showDims = v; render(); });

  function newQuiz() {
    const abMm = UI.rnd(48, 116, 4);
    const kind = Math.random() < 0.5 ? 'half' : 'height';
    if (kind === 'half') {
      st.quiz = { abMm, truth: abMm / 2, answered: false, kind };
      $('bis-task').innerHTML = `Eine Strecke <span class="overline">AB</span> = <b>${fmt(abMm, 0)} mm</b> soll halbiert werden. Welchen Wert (in mm) muss der Zirkelradius <i>r</i> <b>mindestens überschreiten</b> (Grenzwert ½ <span class="overline">AB</span>)?`;
    } else {
      const triples = [[60, 50, 40], [80, 50, 30], [48, 40, 32], [72, 45, 27]];
      const [ab, r, h] = triples[Math.floor(Math.random() * triples.length)];
      st.quiz = { abMm: ab, rMm: r, truth: h, answered: false, kind };
      $('bis-task').innerHTML = `Gegeben: <span class="overline">AB</span> = <b>${ab} mm</b> (also <span class="overline">AM</span> = ${ab / 2} mm) und Zirkelradius <i>r</i> = <b>${r} mm</b>. Wie weit liegt der obere Kreisschnittpunkt S₁ vom Mittelpunkt M entfernt ($h = \\sqrt{r^2 - (\\overline{AB}/2)^2}$)?`;
    }
    $('bis-ans-unit').textContent = 'mm';
    $('bis-ans').value = '';
    $('bis-ans-row').hidden = false;
    feedback('bis-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const v = Core.parseNum($('bis-ans').value);
    if (!isFinite(v)) { feedback('bis-feedback', 'Bitte eine Zahl in mm eingeben.', false); return; }
    const ok = Math.abs(v - st.quiz.truth) <= 0.25;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('bis-feedback', ok
      ? `Richtig: ${fmt(st.quiz.truth, 1)} mm!`
      : `Erwartet: ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('bis-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('bis-quiz').addEventListener('click', newQuiz);
  $('bis-check').addEventListener('click', checkQuiz);
  onEnter('bis-ans', checkQuiz);

  function reset() {
    player.stopTimer();
    Object.assign(st, BOOK_STATE());
    $('bis-radii').checked = $('bis-dims').checked = true;
    $('bis-proof').checked = false;
    $('bis-ans-row').hidden = true;
    $('bis-task').textContent = '';
    feedback('bis-feedback', '');
    player.updateStepUI();
    render();
  }

  UI.register('halbieren', { render, reset, state: st });
  player.updateStepUI();
  render();
})();

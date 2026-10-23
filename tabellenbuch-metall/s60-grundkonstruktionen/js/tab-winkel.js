/* Reiter 5: Halbieren eines Winkels (Tabellenbuch Metall S. 60, 5. Zeile)
   Gegeben: Winkel α
   1. Beliebiger Kreisbogen 1 um S ergibt Schnittpunkte A und B.
   2. Kreisbogen 2 mit Radius r um A; r > 1/2 AB.
   3. Kreisbogen 3 mit gleichem Radius r um B ergibt Schnittpunkt C.
   4. Die Verbindungslinie des Schnittpunktes C mit S ist die gesuchte Winkelhalbierende. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, polarPt } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 4; // 4 px = 1 mm
  const STEPS = [
    [1, 'Kreisbogen 1 um S', 'Beliebiger Kreisbogen 1 um den Scheitelpunkt S ergibt die Schnittpunkte A und B auf den Winkelschenkeln.'],
    [2, 'Kreisbogen 2 um A', 'Kreisbogen 2 mit Radius <i>r</i> um A schlagen; Bedingung: <i>r</i> &gt; ½ <span class="overline">AB</span>.'],
    [3, 'Kreisbogen 3 um B', 'Kreisbogen 3 mit gleichem Radius <i>r</i> um B schlagen; ergibt Schnittpunkt C.'],
    [4, 'Winkelhalbierende ziehen', 'Die Verbindungslinie 4 des Schnittpunktes C mit S ist die gesuchte Winkelhalbierende (teilt α in α/2 und α/2).']
  ];

  const BOOK_STATE = () => ({
    S: pt(245, 392),
    alphaDeg: 120,
    r1Mm: 62,
    r2Mm: 62,
    step: 4,
    showRadii: true,
    showKite: false,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('win-svg');
  const player = bindStepPlayer('win', 4, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const r1Px = st.r1Mm * SCALE;
    const r2Px = st.r2Mm * SCALE;
    // Im SVG (y nach unten) liegt Schenkel B bei 0° (rechts waagrecht) und Schenkel A bei -alphaDeg (links-oben wie im Buch)
    const raw = Core.constructAngleBisector(st.S, -st.alphaDeg, st.alphaDeg, r1Px, r2Px);
    // In constructAngleBisector ist B bei startDeg (-alphaDeg) und A bei 0°; wir tauschen die Bezeichnungen passend zum Buchbild:
    const S = st.S;
    const A = raw.B; // oberer/linker Schenkel bei -alphaDeg
    const B = raw.A; // waagrechter Schenkel rechts bei 0°
    const rayLen = r1Px + 34;
    const endA = polarPt(S, rayLen, -st.alphaDeg);
    const endB = polarPt(S, rayLen, 0);

    // Gegebene Winkelschenkel
    el(svg, 'line', { x1: S.x.toFixed(1), y1: S.y.toFixed(1), x2: endA.x.toFixed(1), y2: endA.y.toFixed(1), class: 'given-line', 'stroke-width': 2.5 });
    el(svg, 'line', { x1: S.x.toFixed(1), y1: S.y.toFixed(1), x2: endB.x.toFixed(1), y2: endB.y.toFixed(1), class: 'given-line', 'stroke-width': 2.5 });

    // Winkelbogen α am Scheitel S wie im Buch
    SVG.angleArcBoth(svg, S, A, B, 92, '*α*', { labelPos: 0.34, labelOffset: 15 });

    if (!raw.ok) {
      if (st.step >= 1) {
        SVG.arcBetweenPoints(svg, S, r1Px, A, B, 6, { cls: 'arc-line' });
        SVG.point(svg, A, { drag: 'A', label: 'A', dx: -12, dy: -8 });
        SVG.point(svg, B, { label: 'B', dx: 12, dy: -8 });
      }
      if (st.step >= 2) {
        SVG.compassArc(svg, A, r2Px, -35, 55, { cls: 'warn-arc' });
        SVG.compassArc(svg, B, r2Px, -145, -55, { cls: 'warn-arc' });
      }
      SVG.text(svg, S.x + 90, S.y - 165,
        `r (${fmt(st.r2Mm, 0)} mm) ≤ ½ AB (${fmt(raw.halfAB / SCALE, 1)} mm): Bögen 2 & 3 schneiden sich nicht!`,
        { 'text-anchor': 'middle', 'font-size': 14, class: 'halo step-num' });
      SVG.point(svg, S, { label: 'S', dx: -14, dy: 6 });
      updateSide(raw);
      return;
    }

    const C = raw.C;

    // Optional: Kongruente Dreiecke SAC und SBC (Symmetriedrachen)
    if (st.showKite && st.step >= 3) {
      el(svg, 'polygon', {
        points: `${S.x.toFixed(1)},${S.y.toFixed(1)} ${A.x.toFixed(1)},${A.y.toFixed(1)} ${C.x.toFixed(1)},${C.y.toFixed(1)} ${B.x.toFixed(1)},${B.y.toFixed(1)}`,
        class: 'proof-fill'
      });
      const halfTxt = `${fmt(st.alphaDeg / 2, 1)}°`;
      const p1 = polarPt(S, 132, -st.alphaDeg * 0.75);
      const p2 = polarPt(S, 132, -st.alphaDeg * 0.25);
      SVG.text(svg, p1.x, p1.y, halfTxt, { 'text-anchor': 'middle', 'font-size': 13, class: 'halo lbl-strong' });
      SVG.text(svg, p2.x, p2.y, halfTxt, { 'text-anchor': 'middle', 'font-size': 13, class: 'halo lbl-strong' });
    }

    // Schritt 1: Beliebiger Kreisbogen 1 um S ergibt Schnittpunkte A und B
    if (st.step >= 1) {
      const cls1 = 'arc-line' + (hl === 1 ? ' hl' : '');
      SVG.arcBetweenPoints(svg, S, r1Px, A, B, 5, { cls: cls1 });
      const pNum1 = polarPt(S, r1Px - 18, -st.alphaDeg * 0.68);
      SVG.stepNum(svg, pNum1.x, pNum1.y + 5, 1, { hl: hl === 1 });
    }

    // Schritt 2: Kreisbogen 2 mit Radius r um A
    if (st.step >= 2) {
      const cls2 = 'arc-line' + (hl === 2 ? ' hl' : '');
      const angAC = SVG.screenAngle(A, C);
      SVG.compassArc(svg, A, r2Px, angAC - 16, angAC + 24, { cls: cls2 });
      if (st.showRadii) {
        SVG.radiusArrow(svg, A, r2Px, angAC - 3, '*r*', { labelSide: 'left', labelOffset: 12 });
      }
      const pNum2 = SVG.screenPolar(A, r2Px + 15, angAC + 14);
      SVG.stepNum(svg, pNum2.x + 4, pNum2.y + 6, 2, { hl: hl === 2 });
    }

    // Schritt 3: Kreisbogen 3 mit gleichem Radius r um B ergibt Schnittpunkt C
    if (st.step >= 3) {
      const cls3 = 'arc-line' + (hl === 3 ? ' hl' : '');
      const angBC = SVG.screenAngle(B, C);
      SVG.compassArc(svg, B, r2Px, angBC - 14, angBC + 24, { cls: cls3 });
      if (st.showRadii) {
        SVG.radiusArrow(svg, B, r2Px, angBC + 4, '*r*', { labelSide: 'left', labelOffset: 12 });
      }
      const pNum3 = SVG.screenPolar(B, r2Px + 18, angBC + 12);
      SVG.stepNum(svg, pNum3.x + 8, pNum3.y + 4, 3, { hl: hl === 3 });
      SVG.text(svg, C.x + 4, C.y - 14, 'C', { 'text-anchor': 'start', 'font-size': 15.5, class: 'halo' + (hl === 3 ? ' hl-text' : '') });
    }

    // Schritt 4: Verbindungslinie SC ist die Winkelhalbierende
    if (st.step >= 4) {
      const uSC = unit(sub(C, S));
      const cExt = add(C, scale(uSC, 24));
      el(svg, 'line', {
        x1: S.x.toFixed(1), y1: S.y.toFixed(1),
        x2: cExt.x.toFixed(1), y2: cExt.y.toFixed(1),
        class: 'res-line' + (hl === 4 ? ' hl' : ''),
        'stroke-width': 2.2
      });
      const midSC = polarPt(S, r1Px * 0.56, -st.alphaDeg / 2);
      SVG.stepNum(svg, midSC.x + 16, midSC.y + 6, 4, { hl: hl === 4 });
    }

    // Punkte S, A, B
    SVG.point(svg, S, { label: 'S', dx: -14, dy: 6 });
    if (st.step >= 1) {
      SVG.point(svg, A, { drag: 'A', label: 'A', dx: -4, dy: -12 });
      SVG.point(svg, B, { label: 'B', dx: 12, dy: -8 });
    } else {
      el(svg, 'circle', { cx: A.x.toFixed(1), cy: A.y.toFixed(1), r: 16, class: 'pt-hit', 'data-drag': 'A' });
    }

    updateSide(raw);
  }

  function updateSide(raw) {
    $('win-alpha').value = st.alphaDeg;
    $('win-alpha-out').textContent = `${fmt(st.alphaDeg, 0)}°`;
    $('win-r2').value = st.r2Mm;
    $('win-r2-out').textContent = `${fmt(st.r2Mm, 0)} mm`;
    const abMm = raw.abLen / SCALE;
    const halfABMm = raw.halfAB / SCALE;
    const resEl = $('win-result');
    if (!raw.ok) {
      resEl.className = 'result warn';
      resEl.innerHTML = `Ungültig: <i>r</i> = ${fmt(st.r2Mm, 0)} mm ≤ ½ <span class="overline">AB</span> (${fmt(halfABMm, 1)} mm)`;
    } else {
      resEl.className = 'result';
      resEl.innerHTML = `<i>α</i> / 2 = ${fmt(st.alphaDeg / 2, 1)}° &nbsp;·&nbsp; ∠ASC = ∠BSC`;
    }
    $('win-details').innerHTML = [
      ['Gegebener Winkel <i>α</i>', `${fmt(st.alphaDeg, 0)}°`],
      ['Halbierter Winkel <i>α</i> / 2', `${fmt(st.alphaDeg / 2, 1)}°`],
      ['Bogen 1 um S (<i>r</i><sub>1</sub>)', `${fmt(st.r1Mm, 0)} mm`],
      ['Sehnenlänge <span class="overline">AB</span> = 2·<i>r</i><sub>1</sub>·sin(<i>α</i>/2)', `${fmt(abMm, 1)} mm`],
      ['Bögen 2 &amp; 3 (<i>r</i> &gt; ½ <span class="overline">AB</span> = ' + fmt(halfABMm, 1) + ' mm)', `${fmt(st.r2Mm, 0)} mm`]
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    $('win-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} richtig` : '';
  }

  svg.addEventListener('pointerdown', e => {
    const hit = e.target.closest('[data-drag="A"]');
    if (!hit) return;
    player.stopTimer();
    SVG.startDrag(svg, e, loc => {
      const deg = Math.atan2(st.S.y - loc.y, loc.x - st.S.x) * 180 / Math.PI;
      if (deg >= 24 && deg <= 156) {
        st.alphaDeg = Math.round(deg / 2) * 2;
        render();
      }
    });
  });

  $('win-alpha').addEventListener('input', e => { st.alphaDeg = +e.target.value; render(); });
  $('win-r2').addEventListener('input', e => { st.r2Mm = +e.target.value; render(); });
  chk('win-radii', v => { st.showRadii = v; render(); });
  chk('win-kite', v => { st.showKite = v; render(); });

  function newQuiz() {
    const alpha = UI.rnd(28, 152, 4);
    const kind = Math.random() < 0.5 ? 'half' : 'complement';
    const truth = kind === 'half' ? alpha / 2 : 90 - alpha / 2;
    st.quiz = { alpha, kind, truth, answered: false };
    $('win-task').innerHTML = kind === 'half'
      ? `Ein Werkstückkanten-Winkel <i>α</i> = <b>${alpha}°</b> wird nach der Grundkonstruktion von Seite 60 halbiert. Wie groß ist jeder der beiden Teilwinkel ∠ASC = ∠BSC?`
      : `Ein Winkel <i>α</i> = <b>${alpha}°</b> wird halbiert. Wie viele Grad fehlen einem Teilwinkel (<i>α</i>/2) noch zum rechten Winkel (90° − <i>α</i>/2)?`;
    $('win-ans-unit').textContent = '°';
    $('win-ans').value = '';
    $('win-ans-row').hidden = false;
    feedback('win-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const v = Core.parseNum($('win-ans').value);
    if (!isFinite(v)) { feedback('win-feedback', 'Bitte eine Winkelzahl in Grad eingeben.', false); return; }
    const ok = Math.abs(v - st.quiz.truth) <= 0.15;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('win-feedback', ok
      ? `Richtig: ${fmt(st.quiz.truth, 1)}°!`
      : `Erwartet: ${fmt(st.quiz.truth, 1)}° (α/2 = ${fmt(st.quiz.alpha / 2, 1)}°).`, ok);
    $('win-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('win-quiz').addEventListener('click', newQuiz);
  $('win-check').addEventListener('click', checkQuiz);
  onEnter('win-ans', checkQuiz);

  function reset() {
    player.stopTimer();
    Object.assign(st, BOOK_STATE());
    $('win-radii').checked = true;
    $('win-kite').checked = false;
    $('win-ans-row').hidden = true;
    $('win-task').textContent = '';
    feedback('win-feedback', '');
    player.updateStepUI();
    render();
  }

  UI.register('winkel', { render, reset, state: st });
  player.updateStepUI();
  render();
})();

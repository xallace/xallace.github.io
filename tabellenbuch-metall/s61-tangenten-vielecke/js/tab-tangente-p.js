/* Reiter 1: Tangente durch Kreispunkt P (Tabellenbuch Metall S. 61, 1. Zeile)
   Gegeben: Kreis und Punkt P auf dem Kreis
   1. Verbindungslinie MP ziehen und verlängern.
   2. Kreis um P ergibt Schnittpunkte A und B.
   3. Kreisbögen um A und B mit gleichem Radius ergeben Schnittpunkte C und D.
   4. Verbindungslinie CD ist Senkrechte zu PM (Tangente). */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist, polarPt } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 3.5; // 3.5 px = 1 mm
  const STEPS = [
    [1, 'Strahl MP ziehen', 'Verbindungslinie <span class="overline">MP</span> ziehen und über P hinaus verlängern.'],
    [2, 'Kreis um P (A und B)', 'Kreis um P mit Radius <i>r</i><sub>1</sub> schlagen; ergibt Schnittpunkte A und B auf der Geraden <span class="overline">MP</span>.'],
    [3, 'Bögen um A und B (C und D)', 'Kreisbögen um A und B mit gleichem Radius <i>r</i><sub>2</sub> &gt; <i>r</i><sub>1</sub> schlagen; Schnittpunkte sind C und D.'],
    [4, 'Tangente CD ziehen', 'Verbindungslinie CD ist die Senkrechte zu <span class="overline">PM</span> und damit die gesuchte Tangente im Punkt P.']
  ];

  const BOOK_STATE = () => ({
    M: pt(280, 260),
    RMm: 48,
    angleDeg: 55, // Richtung von M nach P
    r1Mm: 24,
    r2Mm: 38,
    step: 4,
    showRadii: true,
    showAngle: true,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('tanp-svg');
  const player = bindStepPlayer('tanp', 4, STEPS, st, render);

  function getP() {
    return polarPt(st.M, st.RMm * SCALE, -st.angleDeg);
  }

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const RPx = st.RMm * SCALE;
    const r1Px = st.r1Mm * SCALE;
    const r2Px = st.r2Mm * SCALE;
    const P = getP();

    const res = Core.constructTangentAtPoint(st.M, P, r1Px, r2Px);

    // Gegebener Kreis
    SVG.circle(svg, st.M, RPx, { cls: 'given-line', w: 2.2 });
    SVG.centerMark(svg, st.M, 14);
    SVG.point(svg, st.M, { label: 'M', dx: -12, dy: 16 });

    if (!res.ok) {
      if (res.reason === 'r2_too_small') {
        const u = res.u;
        const A = res.A, B = res.B;
        // Strahl MP
        el(svg, 'line', {
          x1: st.M.x.toFixed(1), y1: st.M.y.toFixed(1),
          x2: res.extP.x.toFixed(1), y2: res.extP.y.toFixed(1),
          class: 'thin-line', 'stroke-dasharray': '5 3'
        });
        SVG.circle(svg, P, r1Px, { cls: 'arc-line', w: 1.2 });
        SVG.point(svg, A, { label: 'A', dx: -10, dy: -8 });
        SVG.point(svg, B, { label: 'B', dx: 10, dy: -8 });
        SVG.compassArc(svg, A, r2Px, -st.angleDeg - 40, -st.angleDeg + 40, { cls: 'warn-arc' });
        SVG.compassArc(svg, B, r2Px, -st.angleDeg - 40, -st.angleDeg + 40, { cls: 'warn-arc' });
        SVG.text(svg, P.x, P.y - 45,
          `Bögen 3 schneiden sich nicht: r₂ (${fmt(st.r2Mm, 0)} mm) muss > r₁ (${fmt(st.r1Mm, 0)} mm) sein!`,
          { 'text-anchor': 'middle', 'font-size': 13.5, class: 'halo step-num' });
      }
      SVG.point(svg, P, { drag: 'P', label: 'P', dx: 14, dy: -8, sel: true });
      updateSide(res);
      return;
    }

    const { u, extP, A, B, C, D } = res;

    // Schritt 1: Verbindungslinie MP ziehen und verlängern
    if (st.step >= 1) {
      const isHl = hl === 1;
      const rayEnd = add(P, scale(u, r1Px * 1.6));
      el(svg, 'line', {
        x1: st.M.x.toFixed(1), y1: st.M.y.toFixed(1),
        x2: rayEnd.x.toFixed(1), y2: rayEnd.y.toFixed(1),
        class: isHl ? 'hl-line' : 'thin-line',
        'stroke-width': isHl ? 2.4 : 1.3
      });
      SVG.stepNum(svg, (st.M.x + P.x) / 2 + 12, (st.M.y + P.y) / 2 - 8, 1, { hl: isHl });
    }

    // Schritt 2: Kreis um P ergibt Schnittpunkte A und B
    if (st.step >= 2) {
      const isHl = hl === 2;
      SVG.circle(svg, P, r1Px, {
        cls: isHl ? 'hl-arc' : 'arc-line',
        w: isHl ? 2.0 : 1.2
      });
      SVG.point(svg, A, { label: 'A', dx: -12, dy: 14 });
      SVG.point(svg, B, { label: 'B', dx: 12, dy: -12 });
      SVG.stepNum(svg, P.x - r1Px * 0.75, P.y - r1Px * 0.75, 2, { hl: isHl });
      if (st.showRadii) {
        SVG.radiusArrow(svg, P, r1Px, -st.angleDeg - 70, '*r*_{1}', { labelFrac: 0.55 });
      }
    }

    // Schritt 3: Kreisbögen um A und B ergeben C und D
    if (st.step >= 3) {
      const isHl = hl === 3;
      // Bögen um A
      SVG.arcThroughPoint(svg, A, r2Px, C, 30, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.1 });
      SVG.arcThroughPoint(svg, A, r2Px, D, 30, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.1 });
      // Bögen um B
      SVG.arcThroughPoint(svg, B, r2Px, C, 30, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.1 });
      SVG.arcThroughPoint(svg, B, r2Px, D, 30, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.1 });

      SVG.point(svg, C, { label: 'C', dx: -12, dy: 14 });
      SVG.point(svg, D, { label: 'D', dx: 12, dy: -10 });
      SVG.stepNum(svg, C.x - 14, C.y + 12, 3, { hl: isHl });
      SVG.stepNum(svg, D.x + 14, D.y - 10, 3, { hl: isHl });

      if (st.showRadii) {
        SVG.radiusArrow(svg, A, r2Px, SVG.screenAngle(A, C) + 12, '*r*_{2}', { labelFrac: 0.5 });
      }
    }

    // Schritt 4: Verbindungslinie CD ist Senkrechte zu PM (Tangente)
    if (st.step >= 4) {
      const isHl = hl === 4;
      // Tangente über C und D hinaus etwas verlängern
      const tDir = unit(sub(D, C));
      const tStart = sub(C, scale(tDir, 45));
      const tEnd = add(D, scale(tDir, 45));
      el(svg, 'line', {
        x1: tStart.x.toFixed(1), y1: tStart.y.toFixed(1),
        x2: tEnd.x.toFixed(1), y2: tEnd.y.toFixed(1),
        class: isHl ? 'hl-line' : 'res-line',
        'stroke-width': isHl ? 3.0 : 2.4
      });
      SVG.stepNum(svg, D.x - tDir.x * 20 + 12, D.y - tDir.y * 20 - 14, 4, { hl: isHl });
      if (st.showAngle) {
        SVG.rightAngle(svg, P, st.M, D, 18);
      }
    }

    // Ziehbarer Kreispunkt P
    SVG.point(svg, P, { drag: 'P', label: 'P', dx: 12, dy: -12, sel: true });

    updateSide(res);
  }

  function updateSide(res) {
    const resEl = $('tanp-result');
    if (!res.ok) {
      resEl.className = 'result warn';
      resEl.innerHTML = `Schritt 3: <i>r</i>₂ (${fmt(st.r2Mm, 0)} mm) ≤ <i>r</i>₁ (${fmt(st.r1Mm, 0)} mm)`;
    } else {
      resEl.className = 'result';
      resEl.innerHTML = `Tangente <span class="overline">CD</span> ⊥ <span class="overline">MP</span> &nbsp;·&nbsp; Winkel = ${fmt(res.perpAngleDeg, 1)}°`;
    }

    $('tanp-details').innerHTML = [
      ['Kreisradius <i>R</i>', `${fmt(st.RMm, 0)} mm`],
      ['Winkelposition <i>φ</i> von P', `${fmt(st.angleDeg, 0)}°`],
      ['Hilfskreis um P (<i>r</i>₁)', `${fmt(st.r1Mm, 0)} mm`],
      ['Strecke <span class="overline">AB</span>', res.ok ? `${fmt((res.r1 * 2) / SCALE, 1)} mm` : '–'],
      ['Schnittbögen (<i>r</i>₂ &gt; <i>r</i>₁)', `${fmt(st.r2Mm, 0)} mm`],
      ['Höhe <i>h</i> des Schnittpunkts C/D', res.ok ? `${fmt(res.heightCD / SCALE, 1)} mm` : '–']
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');

    $('tanp-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} richtig` : '';
  }

  // Interaktives Ziehen von Punkt P entlang des Kreisumfangs
  svg.addEventListener('pointerdown', e => {
    const hit = e.target.closest('[data-drag="P"]');
    if (!hit) return;
    player.stopTimer();
    SVG.startDrag(svg, e, loc => {
      const dx = loc.x - st.M.x;
      const dy = loc.y - st.M.y;
      const ang = Math.atan2(-dy, dx) * Core.RAD;
      st.angleDeg = Math.round(Core.normDeg(ang));
      $('tanp-ang').value = st.angleDeg;
      $('tanp-ang-out').textContent = `${st.angleDeg}°`;
      render();
    });
  });

  $('tanp-r').addEventListener('input', e => {
    st.RMm = +e.target.value;
    $('tanp-r-out').textContent = `${st.RMm} mm`;
    render();
  });
  $('tanp-ang').addEventListener('input', e => {
    st.angleDeg = +e.target.value;
    $('tanp-ang-out').textContent = `${st.angleDeg}°`;
    render();
  });
  $('tanp-r1').addEventListener('input', e => {
    st.r1Mm = +e.target.value;
    $('tanp-r1-out').textContent = `${st.r1Mm} mm`;
    render();
  });
  $('tanp-r2').addEventListener('input', e => {
    st.r2Mm = +e.target.value;
    $('tanp-r2-out').textContent = `${st.r2Mm} mm`;
    render();
  });

  chk('tanp-radii', v => { st.showRadii = v; render(); });
  chk('tanp-angle', v => { st.showAngle = v; render(); });

  function newQuiz() {
    const RMm = Math.floor(Math.random() * 5 + 3) * 10; // 30..70
    const r1 = Math.floor(Math.random() * 3 + 2) * 10;  // 20..40
    const r2 = r1 + Math.floor(Math.random() * 3 + 1) * 10; // > r1
    const hTruth = Math.round(Math.sqrt(r2 * r2 - r1 * r1) * 10) / 10;

    const askH = Math.random() < 0.5;
    st.quiz = { RMm, r1, r2, truth: askH ? hTruth : 90, askH, answered: false };

    $('tanp-task').innerHTML = askH
      ? `Um Punkt P wird ein Hilfskreis mit <i>r</i>₁ = <b>${r1} mm</b> geschlagen (<span class="overline">AB</span> = ${2 * r1} mm). Die Bögen um A und B haben den Radius <i>r</i>₂ = <b>${r2} mm</b>. Welchen Abstand <i>h</i> haben die Schnittpunkte C und D von P ($h = \\sqrt{r_2^2 - r_1^2}$)?`
      : `Welchen Winkel (in Grad °) schließt die konstruierte Tangente <span class="overline">CD</span> mit dem Radiusstrahl <span class="overline">MP</span> ein?`;

    $('tanp-ans-unit').textContent = askH ? 'mm' : '°';
    $('tanp-ans').value = '';
    $('tanp-ans-row').hidden = false;
    feedback('tanp-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('tanp-ans').value);
    if (isNaN(val)) {
      feedback('tanp-feedback', 'Bitte eine gültige Zahl eingeben.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('tanp-feedback', ok
      ? `Richtig! Wert: ${fmt(st.quiz.truth, 1)} ${$('tanp-ans-unit').textContent}.`
      : `Leider falsch. Richtig wäre: ${fmt(st.quiz.truth, 1)} ${$('tanp-ans-unit').textContent}.`, ok);
    $('tanp-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('tanp-quiz').addEventListener('click', newQuiz);
  $('tanp-check').addEventListener('click', checkQuiz);
  onEnter('tanp-ans', checkQuiz);

  UI.tabs['tangente-p'] = {
    render,
    reset() {
      Object.assign(st, BOOK_STATE());
      $('tanp-r').value = st.RMm;
      $('tanp-r-out').textContent = `${st.RMm} mm`;
      $('tanp-ang').value = st.angleDeg;
      $('tanp-ang-out').textContent = `${st.angleDeg}°`;
      $('tanp-r1').value = st.r1Mm;
      $('tanp-r1-out').textContent = `${st.r1Mm} mm`;
      $('tanp-r2').value = st.r2Mm;
      $('tanp-r2-out').textContent = `${st.r2Mm} mm`;
      player.updateStepUI();
      render();
    }
  };
})();

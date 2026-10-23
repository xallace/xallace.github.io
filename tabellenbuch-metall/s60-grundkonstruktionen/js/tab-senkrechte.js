/* Reiter 4: Errichten einer Senkrechten im Punkt P (Tabellenbuch Metall S. 60, 4. Zeile)
   Gegeben: Gerade g und Punkt P
   1. Kreisbogen 1 um P mit beliebigem Radius r ergibt Schnittpunkt A.
   2. Kreisbogen 2 mit gleichem Radius r um Punkt A ergibt Schnittpunkt B.
   3. Kreisbogen 3 mit gleichem Radius r um B.
   4. A und B verbinden und Gerade verlängern (Schnittpunkt C).
   5. Punkt C mit Punkt P verbinden. */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 4; // 4 px = 1 mm
  const STEPS = [
    [1, 'Kreisbogen 1 um P', 'Kreisbogen 1 um P mit beliebigem Radius <i>r</i> schlagen; ergibt Schnittpunkt A auf der Geraden g.'],
    [2, 'Kreisbogen 2 um A', 'Kreisbogen 2 mit gleichem Radius <i>r</i> um Punkt A schlagen; ergibt Schnittpunkt B auf Bogen 1 (60°).'],
    [3, 'Kreisbogen 3 um B', 'Kreisbogen 3 mit gleichem Radius <i>r</i> um B nach oben schlagen.'],
    [4, 'Gerade AB verlängern', 'A und B verbinden und Gerade 4 über B hinaus verlängern (Schnittpunkt C auf Kreisbogen 3).'],
    [5, 'Senkrechte PC ziehen', 'Punkt C mit Punkt P verbinden – die Gerade 5 steht im Punkt P senkrecht (90°) auf g.']
  ];

  const BOOK_STATE = () => ({
    P: pt(430, 392),
    rMm: 52,
    side: 'left',
    step: 5,
    showRadii: true,
    showThales: false,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('sen-svg');
  const player = bindStepPlayer('sen', 5, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const rPx = st.rMm * SCALE;
    // up = -1 weil in SVG die y-Achse nach unten zeigt (Senkrechte zeigt nach oben)
    const res = Core.constructErectPerp(st.P, 0, rPx, st.side, -1);
    const { P, A, B, C } = res;
    const isLeft = st.side === 'left';

    // Optional: Thaleskreis um B (geht durch A, P und C) & gleichseitiges Dreieck PAB
    if (st.showThales && st.step >= 2) {
      el(svg, 'polygon', {
        points: `${P.x.toFixed(1)},${P.y.toFixed(1)} ${A.x.toFixed(1)},${A.y.toFixed(1)} ${B.x.toFixed(1)},${B.y.toFixed(1)}`,
        class: 'proof-fill'
      });
      SVG.text(svg, (P.x + A.x + B.x) / 3, (P.y + A.y + B.y) / 3 + 6, '60°', {
        'text-anchor': 'middle', 'font-size': 13.5, class: 'halo lbl-strong'
      });
      if (st.step >= 4) {
        el(svg, 'circle', {
          cx: B.x.toFixed(1), cy: B.y.toFixed(1), r: rPx.toFixed(1),
          class: 'proof-line'
        });
      }
      if (st.step >= 5) {
        SVG.rightAngle(svg, P, A, C, 20);
      }
    }

    // Gegebene Gerade g (endet wie im Buch knapp neben P)
    const gStart = isLeft ? pt(95, P.y) : pt(P.x - 16, P.y);
    const gEnd = isLeft ? pt(P.x + 16, P.y) : pt(545, P.y);
    el(svg, 'line', {
      x1: gStart.x.toFixed(1), y1: gStart.y.toFixed(1),
      x2: gEnd.x.toFixed(1), y2: gEnd.y.toFixed(1),
      class: 'given-line', 'stroke-width': 2.5
    });
    SVG.text(svg, isLeft ? gStart.x - 12 : gEnd.x + 12, P.y + 5, 'g', {
      'text-anchor': isLeft ? 'end' : 'start', 'font-size': 16
    });

    // Schritt 1: Kreisbogen 1 um P mit Radius r ergibt Schnittpunkt A auf g
    if (st.step >= 1) {
      const cls1 = 'arc-line' + (hl === 1 ? ' hl' : '');
      if (isLeft) SVG.compassArc(svg, P, rPx, -180, -35, { cls: cls1 });
      else SVG.compassArc(svg, P, rPx, -145, 0, { cls: cls1 });

      if (st.showRadii) {
        const rAng1 = isLeft ? -48 : -132;
        SVG.radiusArrow(svg, P, rPx, rAng1, '*r*', { labelSide: isLeft ? 'left' : 'right', labelOffset: 11 });
      }
      const pNum1 = SVG.screenPolar(P, rPx - 18, isLeft ? -115 : -65);
      SVG.stepNum(svg, pNum1.x, pNum1.y + 6, 1, { hl: hl === 1 });
      SVG.text(svg, A.x, A.y + 24, 'A', { 'text-anchor': 'middle', 'font-size': 15.5, class: hl === 1 ? 'hl-text' : '' });
    }

    // Schritt 2: Kreisbogen 2 mit gleichem Radius r um A ergibt Schnittpunkt B
    if (st.step >= 2) {
      const cls2 = 'arc-line' + (hl === 2 ? ' hl' : '');
      if (isLeft) SVG.compassArc(svg, A, rPx, -142, 0, { cls: cls2 });
      else SVG.compassArc(svg, A, rPx, -180, -38, { cls: cls2 });

      if (st.showRadii) {
        const rAng2 = isLeft ? -130 : -50;
        SVG.radiusArrow(svg, A, rPx, rAng2, '*r*', { labelSide: isLeft ? 'right' : 'left', labelOffset: 11 });
      }
      const pNum2 = SVG.screenPolar(A, rPx - 18, isLeft ? -34 : -146);
      SVG.stepNum(svg, pNum2.x, pNum2.y + 5, 2, { hl: hl === 2 });
      SVG.text(svg, B.x + (isLeft ? -12 : 12), B.y - 8, 'B', {
        'text-anchor': isLeft ? 'end' : 'start', 'font-size': 15.5,
        class: 'halo' + (hl === 2 ? ' hl-text' : '')
      });
    }

    // Schritt 3: Kreisbogen 3 mit gleichem Radius r um B
    if (st.step >= 3) {
      const cls3 = 'arc-line' + (hl === 3 ? ' hl' : '');
      const angBC = SVG.screenAngle(B, C);
      SVG.compassArc(svg, B, rPx, angBC - 72, angBC + 24, { cls: cls3 });
      if (st.showRadii) {
        const rAng3 = isLeft ? angBC - 58 : angBC + 58;
        SVG.radiusArrow(svg, B, rPx, rAng3, '*r*', { labelSide: isLeft ? 'right' : 'left', labelOffset: 11 });
      }
      const pNum3 = SVG.screenPolar(B, rPx + 14, isLeft ? angBC - 52 : angBC + 52);
      SVG.stepNum(svg, pNum3.x, pNum3.y + 4, 3, { hl: hl === 3 });
    }

    // Schritt 4: A und B verbinden und Gerade über B hinaus bis C verlängern
    if (st.step >= 4) {
      const uAB = unit(sub(C, A));
      const cExt = add(C, scale(uAB, 20));
      el(svg, 'line', {
        x1: A.x.toFixed(1), y1: A.y.toFixed(1),
        x2: cExt.x.toFixed(1), y2: cExt.y.toFixed(1),
        class: 'thin-line' + (hl === 4 ? ' hl' : ''),
        'stroke-width': 1.35
      });
      const midBC = pt((B.x + C.x) / 2, (B.y + C.y) / 2);
      SVG.stepNum(svg, midBC.x + (isLeft ? -14 : 14), midBC.y - 4, 4, { hl: hl === 4 });
      SVG.text(svg, C.x + (isLeft ? 13 : -13), C.y + 4, 'C', {
        'text-anchor': isLeft ? 'start' : 'end', 'font-size': 15.5,
        class: 'halo' + (hl === 4 ? ' hl-text' : '')
      });
    }

    // Schritt 5: Punkt C mit Punkt P verbinden (Senkrechte)
    if (st.step >= 5) {
      const uPC = unit(sub(C, P));
      const cTop = add(C, scale(uPC, 20));
      el(svg, 'line', {
        x1: P.x.toFixed(1), y1: P.y.toFixed(1),
        x2: cTop.x.toFixed(1), y2: cTop.y.toFixed(1),
        class: 'res-line' + (hl === 5 ? ' hl' : ''),
        'stroke-width': 2.3
      });
      SVG.stepNum(svg, P.x + (isLeft ? 15 : -15), (P.y + C.y) / 2 - 12, 5, { hl: hl === 5 });
    }

    // Ziehpunkte P und A
    SVG.point(svg, P, { drag: 'P', label: 'P', dx: isLeft ? 15 : -15, dy: 5 });
    if (st.step >= 1) {
      el(svg, 'circle', { cx: A.x.toFixed(1), cy: A.y.toFixed(1), r: 14, class: 'pt-hit', 'data-drag': 'A' });
    }

    updateSide(res);
  }

  function updateSide(res) {
    const rMm = st.rMm;
    const pcMm = res.distPC / SCALE;
    $('sen-r').value = rMm;
    $('sen-r-out').textContent = `${fmt(rMm, 0)} mm`;
    $('sen-result').innerHTML = `∠APC = ${fmt(res.perpAngleDeg, 1)}° &nbsp;·&nbsp; <span class="overline">PC</span> = ${fmt(pcMm, 1)} mm`;
    $('sen-details').innerHTML = [
      ['Zirkelradius <i>r</i> (unverändert in 1–3)', `${fmt(rMm, 0)} mm`],
      ['Dreieck <i>PAB</i> (<span class="overline">PA</span> = <span class="overline">AB</span> = <span class="overline">BP</span>)', `gleichseitig (60°)`],
      ['Thales-Durchmesser <span class="overline">AC</span> = 2 · <i>r</i>', `${fmt(2 * rMm, 0)} mm`],
      ['Senkrechte <span class="overline">PC</span> = <i>r</i> · √3', `${fmt(pcMm, 2)} mm`],
      ['Winkel ∠APC (Satz des Thales)', `${fmt(res.perpAngleDeg, 1)}°`]
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    $('sen-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} richtig` : '';
  }

  svg.addEventListener('pointerdown', e => {
    const hit = e.target.closest('[data-drag]');
    if (!hit) return;
    const which = hit.dataset.drag;
    player.stopTimer();
    SVG.startDrag(svg, e, loc => {
      if (which === 'P') {
        const minX = st.side === 'left' ? 340 : 120;
        const maxX = st.side === 'left' ? 520 : 300;
        st.P.x = Math.max(minX, Math.min(maxX, loc.x));
      } else if (which === 'A') {
        const dMm = Math.abs(loc.x - st.P.x) / SCALE;
        st.rMm = Math.round(Math.max(30, Math.min(72, dMm)));
      }
      render();
    });
  });

  seg('sen-side', v => {
    st.side = v;
    st.P.x = v === 'left' ? 430 : 210;
    render();
  });
  $('sen-r').addEventListener('input', e => { st.rMm = +e.target.value; render(); });
  chk('sen-radii', v => { st.showRadii = v; render(); });
  chk('sen-thales', v => { st.showThales = v; render(); });

  function newQuiz() {
    const rMm = UI.rnd(30, 70, 5);
    const kind = Math.random() < 0.5 ? 'ac' : 'pc';
    const truth = kind === 'ac' ? 2 * rMm : +(rMm * Math.sqrt(3)).toFixed(1);
    st.quiz = { rMm, kind, truth, answered: false };
    $('sen-task').innerHTML = kind === 'ac'
      ? `Beim Errichten der Senkrechten im Punkt P werden alle drei Kreisbögen mit dem Zirkelradius <i>r</i> = <b>${rMm} mm</b> geschlagen. Wie lang ist die Verbindungsstrecke <span class="overline">AC</span> (von A über B bis C)?`
      : `Gegeben ist der Zirkelradius <i>r</i> = <b>${rMm} mm</b>. Berechne die Höhe <span class="overline">PC</span> = <i>r</i> · √3 des Schnittpunktes C über P (auf 1 Nachkommastelle).`;
    $('sen-ans-unit').textContent = 'mm';
    $('sen-ans').value = '';
    $('sen-ans-row').hidden = false;
    feedback('sen-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const v = Core.parseNum($('sen-ans').value);
    if (!isFinite(v)) { feedback('sen-feedback', 'Bitte eine Zahl in mm eingeben.', false); return; }
    const ok = Math.abs(v - st.quiz.truth) <= 0.35;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('sen-feedback', ok
      ? `Richtig: ${fmt(st.quiz.truth, 1)} mm!`
      : `Erwartet: ${fmt(st.quiz.truth, 1)} mm (${st.quiz.kind === 'ac' ? 'AC = 2 · r' : 'PC = r · √3'}).`, ok);
    $('sen-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('sen-quiz').addEventListener('click', newQuiz);
  $('sen-check').addEventListener('click', checkQuiz);
  onEnter('sen-ans', checkQuiz);

  function reset() {
    player.stopTimer();
    Object.assign(st, BOOK_STATE());
    setSeg('sen-side', 'left');
    $('sen-radii').checked = true;
    $('sen-thales').checked = false;
    $('sen-ans-row').hidden = true;
    $('sen-task').textContent = '';
    feedback('sen-feedback', '');
    player.updateStepUI();
    render();
  }

  UI.register('senkrechte', { render, reset, state: st });
  player.updateStepUI();
  render();
})();

/* Reiter 6: Spirale (Näherungskonstruktion mit dem Zirkel)
   Tabellenbuch Metall S. 62, 6. Zeile
   Gegeben: Steigung a
   1. Quadrat ABCD mit a/4 zeichnen.
   2. Viertelkreis mit Radius AD um A ergibt E.
   3. Viertelkreis mit Radius BE um B ergibt F.
   4. Viertelkreis mit Radius CF um C ergibt G.
   5. Viertelkreis mit Radius DG um D ergibt H.
   6. Viertelkreis mit Radius AH um A ergibt I (usw.). */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 460;
  const STEPS = [
    [1, 'Quadrat ABCD mit a/4', 'Zentrales Quadrat ABCD mit der Seitenlänge s = a/4 zeichnen. Die vier Ecken dienen als fortlaufende Zirkelmittelpunkte.'],
    [2, '1. Viertelkreis um A (E)', 'Zirkel in A einstechen. Mit Radius r₁ = AD = a/4 einen 90°-Bogen von D nach E schlagen.'],
    [3, '2. Viertelkreis um B (F)', 'Zirkel in B einstechen. Mit Radius r₂ = BE = 2·(a/4) den Bogen von E nach F fortsetzen.'],
    [4, '3. Viertelkreis um C (G)', 'Zirkel in C einstechen. Mit Radius r₃ = CF = 3·(a/4) den Bogen von F nach G fortsetzen.'],
    [5, '4. Viertelkreis um D (H)', 'Zirkel in D einstechen. Mit Radius r₄ = DG = 4·(a/4) = a von G nach H schlagen. Die 1. volle Windung (360°) ist vollendet!'],
    [6, '5. Viertelkreis um A (I)', 'Zirkel wieder in A einstechen mit Radius r₅ = AH = 5·(a/4); der Bogen schließt nahtlos an für die nächste Windung.']
  ];

  const BOOK_STATE = () => ({
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

  const st = BOOK_STATE();
  const svg = $('spirale-svg');
  const player = bindStepPlayer('spirale', 6, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const SCALE_MM = 2.4; // 2.4 px = 1 mm für Spirale mit großem Radius
    const pitchPx = st.pitchMm * SCALE_MM;
    const res = Core.constructSquareSpiral(st.center, pitchPx, Math.max(st.step, st.numQuadrants));

    // Ideale Archimedische Spirale im Hintergrund (falls aktiviert)
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

    // Schritt 1: Quadrat ABCD mit a/4
    if (st.step >= 1) {
      const isHl = hl === 1;
      const sPx = res.s;

      // Quadrat ABCD
      el(svg, 'polygon', {
        points: `${res.A.x},${res.A.y} ${res.B.x},${res.B.y} ${res.C.x},${res.C.y} ${res.D.x},${res.D.y}`,
        class: isHl ? 'hl-line' : 'given-line', 'stroke-width': isHl ? 2.4 : 1.6,
        fill: 'rgba(0, 75, 135, 0.08)'
      });

      // Eckenbeschriftungen A, B, C, D
      SVG.point(svg, res.A, { label: 'A', dx: 5, dy: -6, r: 2.5, fs: 11 });
      SVG.point(svg, res.B, { label: 'B', dx: 5, dy: 10, r: 2.5, fs: 11 });
      SVG.point(svg, res.C, { label: 'C', dx: -10, dy: 10, r: 2.5, fs: 11 });
      SVG.point(svg, res.D, { label: 'D', dx: -10, dy: -6, r: 2.5, fs: 11 });

      // Maß a/4
      SVG.stepNum(svg, res.D.x - 16, res.D.y - 14, 1, { hl: isHl });

      // Vergrößerter Quadrat-Einsatz oben rechts für bessere Lesbarkeit
      if (st.showSquareZoom) {
        const zBox = { x: 480, y: 30, w: 140, h: 140 };
        el(svg, 'rect', {
          x: zBox.x, y: zBox.y, width: zBox.w, height: zBox.h,
          fill: 'var(--bg-card)', stroke: 'var(--border)', 'stroke-width': 1.2, rx: 6
        });
        SVG.text(svg, zBox.x + 10, zBox.y + 18, 'Zentralquadrat a/4 (Zoom)', { 'font-size': 11, 'font-weight': 700, fill: 'var(--primary)' });

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

    // Schritte 2 bis 6 (Bögen)
    const arcColors = [
      'var(--accent-red)', 'var(--accent-amber)', 'var(--accent-green)',
      'var(--primary)', 'var(--accent-purple)', 'var(--accent-red)'
    ];

    for (let k = 1; k <= Math.min(st.step, res.arcs.length); k++) {
      const isHl = hl === (k + 1);
      const arc = res.arcs[k - 1];

      // Viertelkreis-Bogen
      SVG.compassArc(svg, arc.center, arc.radiusMm, arc.startDeg, arc.endDeg, {
        cls: isHl ? 'hl-line' : 'spiral-line',
        w: isHl ? 3.0 : 2.2
      });

      // Bogen-Endpunkt (E, F, G, H, I...)
      SVG.point(svg, arc.endPt, {
        label: arc.endLabel, dx: 6, dy: 6, r: 3, fs: 12
      });

      // Radiuslinie vom Zentrum zum Bogen
      if (isHl || k === st.step) {
        SVG.line(svg, arc.center, arc.endPt, { cls: 'thin-line', dash: '3 2', w: 1.1 });
      }

      // Schrittnummer am Bogen
      const midAng = (arc.startDeg + arc.endDeg) / 2;
      const numPos = Core.polarPt(arc.center, arc.radiusMm * 0.9, midAng);
      if (k <= 5) {
        SVG.stepNum(svg, numPos.x, numPos.y, k + 1, { hl: isHl });
      }
    }

    // Maßpfeil für Steigung a (rechts bzw. unten wie im Buch)
    if (st.step >= 5) {
      const arc4 = res.arcs[3]; // H liegt links im Abstand a von D
      const dimY = st.center.y + pitchPx * 0.78;
      SVG.arrow(svg, st.center.x, dimY, st.center.x + pitchPx, dimY, { cls: 'thin-line' });
      SVG.arrow(svg, st.center.x + pitchPx, dimY, st.center.x, dimY, { cls: 'thin-line' });
      SVG.text(svg, st.center.x + pitchPx * 0.5, dimY - 6, `Steigung a = ${fmt(st.pitchMm, 0)} mm`, {
        'font-size': 11.5, 'text-anchor': 'middle', fill: 'var(--muted)', 'font-weight': 600
      });
    }

    updateSide(res, SCALE_MM);
  }

  function updateSide(res, SCALE_MM) {
    const sMm = st.pitchMm / 4;
    const currentRadius = (st.step * sMm);

    $('spirale-result').innerHTML = `
      <b>Steigung (Ganghöhe):</b> <i>a</i> = <b>${fmt(st.pitchMm, 1)} mm</b> pro 360°<br>
      <span style="font-size:0.8rem;color:var(--muted)">Zentralquadrat: <i>s</i> = <i>a</i>/4 = <b>${fmt(sMm, 2)} mm</b> • Aktueller Außenradius: <b>${fmt(currentRadius, 1)} mm</b></span>
    `;

    $('spirale-details').innerHTML = `
      <dt>Steigung <i>a</i> (Ganghöhe):</dt><dd>${fmt(st.pitchMm, 1)} mm</dd>
      <dt>Quadratseite <i>s</i> = <i>a</i> / 4:</dt><dd>${fmt(sMm, 2)} mm</dd>
      <dt>Radius Bogen 1 (um A):</dt><dd>1·<i>s</i> = ${fmt(sMm, 1)} mm</dd>
      <dt>Radius Bogen 2 (um B):</dt><dd>2·<i>s</i> = ${fmt(2 * sMm, 1)} mm</dd>
      <dt>Radius Bogen 3 (um C):</dt><dd>3·<i>s</i> = ${fmt(3 * sMm, 1)} mm</dd>
      <dt>Radius Bogen 4 (um D):</dt><dd>4·<i>s</i> = <i>a</i> = ${fmt(4 * sMm, 1)} mm</dd>
      <dt>Radius Bogen 5 (um A):</dt><dd>5·<i>s</i> = ${fmt(5 * sMm, 1)} mm</dd>
      <dt>Tangenten-Stetigkeit:</dt><dd>100% <i>C</i>¹-stetig (kein Knick) ✓</dd>
      <dt>Abweichung zu Archimedes:</dt><dd>&lt; 1,4% (an Grenzen 0,00%)</dd>
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
    const k = Math.floor(Math.random() * 4 + 2); // Bogen 2, 3, 4, 5
    const rK = k * s;

    st.quiz = { truth: rK, answered: false };
    $('spirale-task').innerHTML = `Gegeben ist eine Spirale mit Steigung <i>a</i> = <b>${pitch} mm</b> (Quadratseite <i>s</i> = ${s} mm). Welchen Radius besitzt der <b>${k}. Viertelkreisbogen</b> ($r_{${k}} = ${k} \\cdot a/4$)?`;
    $('spirale-ans').value = '';
    $('spirale-ans-row').hidden = false;
    feedback('spirale-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('spirale-ans').value);
    if (isNaN(val)) {
      feedback('spirale-feedback', 'Bitte eine Zahl eingeben.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('spirale-feedback', ok
      ? `Richtig! Radius r = ${fmt(st.quiz.truth, 1)} mm.`
      : `Leider falsch. Richtig wäre r = ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('spirale-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('spirale-quiz').addEventListener('click', newQuiz);
  $('spirale-check').addEventListener('click', checkQuiz);
  onEnter('spirale-ans', checkQuiz);

  UI.tabs['spirale'] = {
    render,
    reset() {
      Object.assign(st, BOOK_STATE());
      $('spirale-a').value = st.pitchMm;
      $('spirale-a-out').textContent = `${st.pitchMm} mm`;
      player.updateStepUI();
      render();
    }
  };
})();

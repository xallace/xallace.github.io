/* Reiter 5: Ellipsenkonstruktion in einem Parallelogramm (Tabellenbuch Metall S. 62, 5. Zeile)
   Gegeben: Parallelogramm mit den Achsen AB und CD
   1. Halbkreis mit Radius r = MC um A ergibt E.
   2. AM (bzw. BM) halbieren, vierteln und achteln ergibt Punkte 1, 2 und 3. Durch diese Punkte Parallelen zur Achse CD ziehen.
   3. EA halbieren, vierteln und achteln ergibt die Punkte 1, 2 und 3 auf der Achse AE. Parallelen durch die Punkte zur Achse CD ergeben Schnittpunkte F am Kreisbogen.
   4. Durch Schnittpunkte F Parallelen zu AE bis zur Halbkreisachse, von dort Parallelen zur Achse AB ziehen.
   5. Parallelenschnittpunkte entsprechender Zahlen sind Ellipsenpunkte. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 460;
  const STEPS = [
    [1, 'Halbkreis um A (r = MC)', 'Um Punkt A einen Halbkreis mit Radius r = MC schlagen. Schnittpunkt mit der Achsenverlängerung ergibt E.'],
    [2, 'Teilung AM & Parallelen zu CD', 'Strecke AM (bzw. BM) halbieren, vierteln (und achteln) -> Punkte 1, 2, 3. Durch diese Punkte Parallelen zur Achse CD ziehen.'],
    [3, 'Teilung EA & Punkte F am Bogen', 'Ebenso Strecke EA in 1, 2, 3 teilen. Parallelen zur Achse CD schneiden den Kreisbogen in den Punkten F.'],
    [4, 'Parallelen zu AE und AB', 'Von den Bogenpunkten F Parallelen zu AE bis zur Halbkreisachse ziehen, und von dort Parallelen zur Hauptachse AB.'],
    [5, 'Ellipsenpunkte 1, 2, 3 verbinden', 'Die Schnittpunkte gleicher Ziffern (1 mit 1, 2 mit 2, 3 mit 3) sind Ellipsenpunkte. Durch Ausrunden entsteht die Ellipse im Parallelogramm.']
  ];

  const BOOK_STATE = () => ({
    M: pt(320, 245),
    aMm: 48,
    bMm: 28,
    tiltDeg: 68,
    numDiv: 4,
    step: 5,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('ellp-svg');
  const player = bindStepPlayer('ellp', 5, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const SCALE_MM = 3.2;
    const aPx = st.aMm * SCALE_MM;
    const bPx = st.bMm * SCALE_MM;

    const res = Core.constructEllipseInParallelogram(st.M, aPx, bPx, st.tiltDeg, st.numDiv);

    // Parallelogramm zeichnen
    el(svg, 'polygon', {
      points: `${res.P1.x.toFixed(1)},${res.P1.y.toFixed(1)} ${res.P2.x.toFixed(1)},${res.P2.y.toFixed(1)} ${res.P3.x.toFixed(1)},${res.P3.y.toFixed(1)} ${res.P4.x.toFixed(1)},${res.P4.y.toFixed(1)}`,
      class: 'given-line', 'stroke-width': 1.8, fill: 'rgba(0, 75, 135, 0.02)'
    });

    // Achsen AB und CD
    SVG.line(svg, res.A, res.B, { cls: 'thin-line', dash: '5 3' });
    SVG.line(svg, res.C, res.D, { cls: 'thin-line', dash: '5 3' });

    SVG.point(svg, res.A, { label: 'A', dx: -16, dy: 14 });
    SVG.point(svg, res.B, { label: 'B', dx: 10, dy: 14 });
    SVG.point(svg, res.C, { label: 'C', dx: 10, dy: -8 });
    SVG.point(svg, res.D, { label: 'D', dx: -14, dy: 16 });

    SVG.centerMark(svg, st.M, 14);
    SVG.point(svg, st.M, { label: 'M', dx: -12, dy: 16 });

    // Schritt 1: Halbkreis mit r = MC um A ergibt E
    if (st.step >= 1) {
      const isHl = hl === 1;
      const angV = Core.angleBetween(res.A, res.E);

      // Halbkreis um A
      SVG.compassArc(svg, res.A, res.rMC, angV - 90, angV + 90, {
        cls: isHl ? 'hl-line' : 'arc-line', w: isHl ? 2.2 : 1.3
      });

      // Hilfsachse AE
      SVG.line(svg, res.A, res.E, { cls: 'thin-line', w: 1.1 });
      SVG.point(svg, res.E, { label: 'E', dx: -14, dy: -6 });

      SVG.stepNum(svg, res.A.x - 28, res.A.y - res.rMC * 0.6, 1, { hl: isHl });
    }

    // Schritt 2: AM teilen und Parallelen zu CD
    if (st.step >= 2) {
      const isHl = hl === 2;
      for (const item of res.divAM) {
        SVG.point(svg, item.pt, { r: 2.5 });
        SVG.text(svg, item.pt.x, item.pt.y + 14, String(item.k), {
          'font-size': 11, 'text-anchor': 'middle', fill: 'var(--muted)'
        });

        // Parallele zu CD durch Teilungspunkt
        const pTop = add(item.pt, res.v);
        const pBot = sub(item.pt, res.v);
        SVG.line(svg, pTop, pBot, {
          cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 1.8 : 0.9, dash: '3 2'
        });
      }

      // Ebenso BM teilen
      for (const item of res.divBM) {
        SVG.point(svg, item.pt, { r: 2.5 });
        SVG.text(svg, item.pt.x, item.pt.y + 14, String(item.k), {
          'font-size': 11, 'text-anchor': 'middle', fill: 'var(--muted)'
        });
        const pTop = add(item.pt, res.v);
        const pBot = sub(item.pt, res.v);
        SVG.line(svg, pTop, pBot, { cls: 'thin-line', w: 0.9, dash: '3 2' });
      }

      SVG.stepNum(svg, (res.A.x + st.M.x) / 2, res.A.y - 20, 2, { hl: isHl });
    }

    // Schritt 3: EA teilen und Punkte F am Kreisbogen
    if (st.step >= 3) {
      const isHl = hl === 3;
      for (const item of res.divEA) {
        SVG.point(svg, item.pt, { r: 2.5 });
        SVG.text(svg, item.pt.x - 12, item.pt.y, String(item.k), {
          'font-size': 11, 'text-anchor': 'middle', fill: 'var(--muted)'
        });

        // Projektion zum Kreisbogen F
        const angV = Core.angleBetween(res.A, res.E);
        const perpDir = { x: -Math.sin(angV * Core.DEG), y: Math.cos(angV * Core.DEG) };
        const h = Math.sqrt(Math.max(0, res.rMC * res.rMC - dist(res.A, item.pt) * dist(res.A, item.pt)));
        const ptF = add(item.pt, scale(perpDir, h));

        SVG.line(svg, item.pt, ptF, { cls: isHl ? 'hl-line' : 'thin-line', dash: '2 2' });
        SVG.point(svg, ptF, { label: item.k === 1 ? 'F' : null, dx: -12, dy: -4, r: 2.5 });
      }

      SVG.stepNum(svg, res.E.x + 14, res.E.y + 20, 3, { hl: isHl });
    }

    // Schritt 4: Parallelen zu AE und AB
    if (st.step >= 4) {
      const isHl = hl === 4;
      SVG.stepNum(svg, res.A.x + 22, res.A.y - res.rMC * 0.75, 4, { hl: isHl });
    }

    // Schritt 5: Schnittpunkte verbinden & Ellipse
    if (st.step >= 5) {
      const isHl = hl === 5;
      // Kurvenzug der Ellipse
      const ptsStr = res.curvePoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      el(svg, 'polygon', {
        points: ptsStr,
        class: isHl ? 'hl-line' : 'ellipse-line',
        fill: 'none',
        'stroke-width': 2.2
      });

      // Konstruierte Ellipsenpunkte
      for (const ep of res.ellipsePoints) {
        SVG.point(svg, ep.P, { r: 3.5, sel: true });
        SVG.text(svg, ep.P.x + 6, ep.P.y - 6, String(ep.k), {
          'font-size': 11, fill: 'var(--accent)', 'font-weight': '700'
        });
      }

      SVG.stepNum(svg, st.M.x - aPx * 0.35, st.M.y - bPx * 0.5, 5, { hl: isHl });
    }

    updateSide(res, SCALE_MM);
  }

  function updateSide(res, SCALE_MM) {
    $('ellp-result').innerHTML = `
      <b>Inskribierte Ellipse im Parallelogramm</b><br>
      <span style="font-size:0.8rem;color:var(--muted)">Scherwinkel: <b>${st.tiltDeg}°</b> • Halbachsen: <i>a</i> = ${fmt(st.aMm, 1)} mm, <i>b</i> = ${fmt(st.bMm, 1)} mm</span>
    `;

    $('ellp-details').innerHTML = `
      <dt>Hauptachse <i>AB</i> (2<i>a</i>):</dt><dd>${fmt(st.aMm * 2, 1)} mm</dd>
      <dt>Konjugierte Achse <i>CD</i> (2<i>b</i>):</dt><dd>${fmt(st.bMm * 2, 1)} mm</dd>
      <dt>Halbkreisradius <i>r</i> = <i>MC</i>:</dt><dd>${fmt(st.bMm, 1)} mm</dd>
      <dt>Neigungswinkel ψ der Achse CD:</dt><dd>${fmt(st.tiltDeg, 0)}°</dd>
      <dt>Teilungsschritte:</dt><dd>Halbieren, Vierteln (<i>n</i> = ${st.numDiv})</dd>
      <dt>Anwendung:</dt><dd style="font-size:0.75rem;color:var(--muted)">Konstruktion von Ellipsen in axonometrischen Schrägbildern (Isometrie 30°/30°, Dimetrie 7°/42° nach DIN ISO 5456-3).</dd>
    `;
  }

  $('ellp-a').addEventListener('input', e => {
    st.aMm = +e.target.value;
    $('ellp-a-out').textContent = `${st.aMm} mm`;
    render();
  });
  $('ellp-b').addEventListener('input', e => {
    st.bMm = +e.target.value;
    $('ellp-b-out').textContent = `${st.bMm} mm`;
    render();
  });
  $('ellp-tilt').addEventListener('input', e => {
    st.tiltDeg = +e.target.value;
    $('ellp-tilt-out').textContent = `${st.tiltDeg}°`;
    render();
  });

  function newQuiz() {
    const a = 40, b = 25;
    const rMC = b;
    st.quiz = { truth: rMC, answered: false };
    $('ellp-task').innerHTML = `Für ein Parallelogramm mit den Achsen <i>AB</i> = ${2 * a} mm und <i>CD</i> = ${2 * b} mm (Mittelpunkt M): Welchen Radius <i>r</i> = <i>MC</i> muss der Hilfshalbkreis um Punkt A besitzen?`;
    $('ellp-ans').value = '';
    $('ellp-ans-row').hidden = false;
    feedback('ellp-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('ellp-ans').value);
    if (isNaN(val)) {
      feedback('ellp-feedback', 'Bitte eine Zahl eingeben.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('ellp-feedback', ok
      ? `Richtig! Radius r = MC = ${fmt(st.quiz.truth, 1)} mm.`
      : `Leider falsch. Richtig wäre r = ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('ellp-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('ellp-quiz').addEventListener('click', newQuiz);
  $('ellp-check').addEventListener('click', checkQuiz);
  onEnter('ellp-ans', checkQuiz);

  UI.tabs['ellipse-parallelogramm'] = {
    render,
    reset() {
      Object.assign(st, BOOK_STATE());
      $('ellp-a').value = st.aMm;
      $('ellp-a-out').textContent = `${st.aMm} mm`;
      $('ellp-b').value = st.bMm;
      $('ellp-b-out').textContent = `${st.bMm} mm`;
      $('ellp-tilt').value = st.tiltDeg;
      $('ellp-tilt-out').textContent = `${st.tiltDeg}°`;
      player.updateStepUI();
      render();
    }
  };
})();

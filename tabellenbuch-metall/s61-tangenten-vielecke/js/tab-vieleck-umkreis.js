/* Reiter 5: Regelmäßiges Vieleck im Umkreis (Tabellenbuch Metall S. 61, 5. Zeile)
   Gegeben: Kreis mit Durchmesser d
   1. AB in n gleiche Teile teilen (nach Seite 60).
   2. Kreisbogen mit Radius r = AB um A schlagen -> ergibt C und D auf der Querachse.
   3. C und D mit 1, 3 ... (ungerade Zahlen) bzw. 2, 4 ... (gerade Zahlen) verbinden.
      Die Schnittpunkte mit dem Kreis ergeben das gesuchte Vieleck. */
(() => {
  'use strict';
  const { $, setSeg, seg, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist, polarPt, lerp } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 2.4; // 2.4 px = 1 mm
  const STEPS = [
    [1, 'AB in n Teile teilen', 'Vertikalen Durchmesser <span class="overline">AB</span> in <i>n</i> gleiche Teile teilen (nach Strahlensatz, Seite 60).'],
    [2, 'Polpunkte C und D', 'Kreisbogen mit Radius <i>r</i> = <span class="overline">AB</span> um A schlagen; schneidet die Querachse in C und D ($R\\sqrt{3}$).'],
    [3, 'Polstrahlen ziehen', 'C und D mit 1, 3 ... (ungerade Eckzahl) bzw. 2, 4 ... (gerade Eckzahl) verbinden $\\to$ Schnittpunkte mit Kreis.'],
    [4, 'Vieleck verbinden', 'Die Schnittpunkte mit dem Kreis zum gesuchten regelmäßigen Vieleck verbinden.']
  ];

  const BOOK_STATE = () => ({
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

  const st = BOOK_STATE();
  const svg = $('viel-svg');
  const player = bindStepPlayer('viel', 4, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const RMm = st.dMm / 2;
    const RPx = RMm * SCALE;
    const res = Core.constructRegularPolygonApprox(st.M, RPx, st.n);

    // Gegebener Umkreis
    SVG.circle(svg, st.M, RPx, { cls: 'given-line', w: 2.2 });
    SVG.centerMark(svg, st.M, 14);

    // Vertikaler Durchmesser AB und horizontale Mittellinie
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

    // Durchmesser AB Bemaßung links
    SVG.dimension(svg, { x: st.M.x - RPx, y: st.M.y - RPx }, { x: st.M.x - RPx, y: st.M.y + RPx }, '*d*', { offset: -35 });

    const { A, B, C, D, divisionPoints, rays, vertices, exactVertices } = res;

    SVG.point(svg, A, { label: 'A', dx: 0, dy: 18 });
    SVG.point(svg, B, { label: 'B', dx: 0, dy: -12 });

    // Schritt 1: AB in n Teile teilen
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

    // Schritt 2: Kreisbogen mit Radius AB = 2R um A -> C und D
    if (st.step >= 2) {
      const isHl = hl === 2;
      const rHelp = 2 * RPx;
      // Bogen um A durch C und D
      SVG.arcBetweenPoints(svg, A, rHelp, C, D, 12, {
        cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2
      });
      SVG.point(svg, C, { label: 'C', dx: -14, dy: -10, res: true });
      SVG.point(svg, D, { label: 'D', dx: 14, dy: -10, res: true });
      SVG.stepNum(svg, (D.x + st.M.x) / 2 + 10, st.M.y - 18, 2, { hl: isHl });
    }

    // Schritt 3: Strahlen durch Teilpunkte
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

    // Schritt 4: Vieleck verbinden
    if (st.step >= 4) {
      const isHl = hl === 4;
      const polyPts = vertices.map(v => `${v.pt.x.toFixed(1)},${v.pt.y.toFixed(1)}`).join(' ');
      el(svg, 'polygon', {
        points: polyPts,
        class: isHl ? 'hl-line' : 'res-line',
        'stroke-width': isHl ? 3.4 : 2.6,
        fill: 'rgba(56, 189, 248, 0.08)'
      });

      // Ecken markieren
      for (const v of vertices) {
        SVG.point(svg, v.pt, { r: 3.8, res: true });
      }

      // Optional: Theoretisch exaktes Vieleck zum optischen Vergleich
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
    resEl.innerHTML = `Regelmäßiges ${st.n}-Eck &nbsp;·&nbsp; Genauigkeit ${fmt(res.relAccuracyPct, 2)}%`;

    const sConstructMm = res.edgeLengths[0] / SCALE;
    const sExactMm = res.exactEdgeLen / SCALE;
    const maxDevMm = res.maxEdgeDev / SCALE;

    $('viel-details').innerHTML = [
      ['Eckzahl <i>n</i>', `${st.n} (${isOdd ? 'ungerade $\\to$ 1, 3...' : 'gerade $\\to$ 2, 4...'})`],
      ['Durchmesser <i>d</i>', `${fmt(st.dMm, 0)} mm`],
      ['Polabstand <span class="overline">MC</span> = <span class="overline">MD</span>', `${fmt(res.poleDist / SCALE, 1)} mm (<i>R</i>√3)`],
      ['Konstruierte Kantenlänge <i>s</i>', `${fmt(sConstructMm, 2)} mm`],
      ['Mathematisch exakte Kante', `${fmt(sExactMm, 2)} mm`],
      ['Maximale Abweichung Δ<i>s</i>', `${fmt(maxDevMm, 2)} mm (${fmt(100 - res.relAccuracyPct, 2)}%)`],
      ['Formel Polpunktabstand', `<i>x</i><sub>C,D</sub> = ± <i>R</i> · √3`]
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');

    $('viel-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} richtig` : '';
  }

  // Umschalten der Eckzahl n (3..10)
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
      ? `Ein Kreis mit Durchmesser <i>d</i> = <b>${d} mm</b> (<i>R</i> = ${R} mm) wird mit einem regelmäßigen <b>${n}-Eck</b> versehen. Wie groß ist die mathematisch exakte Kantenlänge <i>s</i> ($s = 2R \\cdot \\sin(180° / n)$)?`
      : `Ein Kreis hat den Radius <i>R</i> = <b>${R} mm</b>. In welchem horizontalen Abstand von der Mitte befinden sich die Polpunkte C und D ($x = R \\cdot \\sqrt{3}$)?`;

    $('viel-ans-unit').textContent = 'mm';
    $('viel-ans').value = '';
    $('viel-ans-row').hidden = false;
    feedback('viel-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('viel-ans').value);
    if (isNaN(val)) {
      feedback('viel-feedback', 'Bitte eine Zahl eingeben.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.3;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('viel-feedback', ok
      ? `Richtig! Wert: ${fmt(st.quiz.truth, 1)} mm.`
      : `Leider falsch. Richtig wäre: ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('viel-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('viel-quiz').addEventListener('click', newQuiz);
  $('viel-check').addEventListener('click', checkQuiz);
  onEnter('viel-ans', checkQuiz);

  UI.tabs['vieleck-umkreis'] = {
    render,
    reset() {
      Object.assign(st, BOOK_STATE());
      $('viel-d').value = st.dMm;
      $('viel-d-out').textContent = `${st.dMm} mm`;
      setSeg('viel-n', st.n);
      player.updateStepUI();
      render();
    }
  };
})();

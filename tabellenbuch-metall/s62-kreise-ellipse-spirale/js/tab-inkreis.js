/* Reiter 1: Inkreis eines Dreiecks (Tabellenbuch Metall S. 62, 1. Zeile)
   Gegeben: Dreieck
   1. Winkel alpha halbieren.
   2. Winkel beta halbieren (Schnittpunkt M).
   3. Inkreis um M. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 460;
  const STEPS = [
    [1, 'Winkel α halbieren', 'Mit Zirkel um Ecke A gleichen Bogen schlagen; Schnittpunkte auf AB und AC als Zentren für Kreuzungsbögen nutzen. Winkelhalbierende ziehen.'],
    [2, 'Winkel β halbieren', 'Ebenso Winkel β bei B halbieren. Der Schnittpunkt beider Winkelhalbierenden ist der Inkreismittelpunkt M.'],
    [3, 'Inkreis um M', 'Lot von M auf eine Dreiecksseite (z. B. AB) fällen; der Abstand ist der Inkreisradius r. Kreis um M zeichnen.']
  ];

  const BOOK_STATE = () => ({
    A: pt(100, 360),
    B: pt(540, 360),
    C: pt(180, 100),
    step: 3,
    showArcs: true,
    showLots: true,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('inkreis-svg');
  const player = bindStepPlayer('inkreis', 3, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const res = Core.constructIncircle(st.A, st.B, st.C);

    if (!res.ok) {
      SVG.line(svg, st.A, st.B, { cls: 'warn-arc' });
      SVG.point(svg, st.A, { drag: 'A', label: 'A' });
      SVG.point(svg, st.B, { drag: 'B', label: 'B' });
      SVG.point(svg, st.C, { drag: 'C', label: 'C' });
      $('inkreis-result').innerHTML = '<span style="color:var(--bad)">Dreieckspunkte sind kollinear (keine Fläche)!</span>';
      return;
    }

    // Gegebenes Dreieck ABC
    el(svg, 'polygon', {
      points: `${st.A.x},${st.A.y} ${st.B.x},${st.B.y} ${st.C.x},${st.C.y}`,
      class: 'given-line', 'stroke-width': 2.4, fill: 'rgba(0, 75, 135, 0.03)'
    });

    // Eckenbeschriftungen
    SVG.point(svg, st.A, { drag: 'A', label: 'A', dx: -18, dy: 18 });
    SVG.point(svg, st.B, { drag: 'B', label: 'B', dx: 12, dy: 18 });
    SVG.point(svg, st.C, { drag: 'C', label: 'C', dx: -8, dy: -14 });

    // Schritt 1: Winkel alpha halbieren
    if (st.step >= 1) {
      const isHl = hl === 1;
      const arcR = Math.min(dist(st.A, st.B), dist(st.A, st.C)) * 0.35;
      const angAB = Core.angleBetween(st.A, st.B);
      const angAC = Core.angleBetween(st.A, st.C);

      if (st.showArcs) {
        // Bogen um A
        SVG.compassArc(svg, st.A, arcR, Math.min(angAB, angAC), Math.max(angAB, angAC), {
          cls: isHl ? 'hl-line' : 'arc-line', w: isHl ? 2 : 1.2
        });
        // Kreuzungsbögen
        const p1 = Core.polarPt(st.A, arcR, angAB);
        const p2 = Core.polarPt(st.A, arcR, angAC);
        const crossR = arcR * 1.0;
        SVG.compassArc(svg, p1, crossR, angAB - 45, angAB + 45, { cls: 'thin-line', dash: '3 2' });
        SVG.compassArc(svg, p2, crossR, angAC - 45, angAC + 45, { cls: 'thin-line', dash: '3 2' });
      }

      // Winkelhalbierende Strahl durch A und M (verlängert)
      const rayLen = dist(st.A, res.M) * 1.35;
      const rayEnd = add(st.A, scale(res.bisectorA, rayLen));
      SVG.line(svg, st.A, rayEnd, {
        cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 2.4 : 1.3
      });

      // Ticks für halbe Winkel (wie im Buch: einfache Striche ')
      SVG.stepNum(svg, (st.A.x + res.M.x) / 2 - 8, (st.A.y + res.M.y) / 2 - 14, 1, { hl: isHl });
    }

    // Schritt 2: Winkel beta halbieren -> Schnittpunkt M
    if (st.step >= 2) {
      const isHl = hl === 2;
      const arcR = Math.min(dist(st.B, st.A), dist(st.B, st.C)) * 0.35;
      const angBA = Core.angleBetween(st.B, st.A);
      const angBC = Core.angleBetween(st.B, st.C);

      if (st.showArcs) {
        SVG.compassArc(svg, st.B, arcR, Math.min(angBA, angBC), Math.max(angBA, angBC), {
          cls: isHl ? 'hl-line' : 'arc-line', w: isHl ? 2 : 1.2
        });
        // Ticks am Winkel beta (wie im Buch: doppelte Striche '')
        const tickMid = Core.polarPt(st.B, arcR * 0.7, (angBA + angBC) / 2);
        SVG.text(svg, tickMid.x + 8, tickMid.y - 4, "''", { 'font-size': 12, fill: 'var(--muted)' });
      }

      const rayLen = dist(st.B, res.M) * 1.35;
      const rayEnd = add(st.B, scale(res.bisectorB, rayLen));
      SVG.line(svg, st.B, rayEnd, {
        cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 2.4 : 1.3
      });

      // Schnittpunkt M
      SVG.centerMark(svg, res.M, 14);
      SVG.point(svg, res.M, { label: 'M', dx: -18, dy: 6, sel: true });
      SVG.stepNum(svg, (st.B.x + res.M.x) / 2 + 10, (st.B.y + res.M.y) / 2 - 14, 2, { hl: isHl });
    }

    // Schritt 3: Inkreis um M
    if (st.step >= 3) {
      const isHl = hl === 3;
      // Inkreis
      SVG.circle(svg, res.M, res.inradius, {
        cls: isHl ? 'hl-line' : 'result-line', w: isHl ? 2.8 : 2.2
      });

      if (st.showLots) {
        // Lot von M auf AB
        SVG.line(svg, res.M, res.footAB, { cls: 'thin-line', dash: '3 2', w: 1.1 });
        SVG.line(svg, res.M, res.footBC, { cls: 'thin-line', dash: '3 2', w: 1.1 });
        SVG.line(svg, res.M, res.footCA, { cls: 'thin-line', dash: '3 2', w: 1.1 });

        // Berührpunkte
        SVG.point(svg, res.footAB, { r: 2.5, dx: 0, dy: 12 });
        SVG.point(svg, res.footBC, { r: 2.5, dx: 8, dy: -6 });
        SVG.point(svg, res.footCA, { r: 2.5, dx: -10, dy: -6 });

        // Rechtwinkelmarke
        SVG.rightAngleMark(svg, res.footAB, res.M, st.B, 9);
      }

      SVG.stepNum(svg, res.M.x + 8, res.M.y + res.inradius * 0.55, 3, { hl: isHl });
    }

    updateSide(res);
  }

  function updateSide(res) {
    const SCALE_MM = 3.2; // ca. 3.2 Pixel pro mm
    const aMm = res.a / SCALE_MM;
    const bMm = res.b / SCALE_MM;
    const cMm = res.c / SCALE_MM;
    const sMm = res.s / SCALE_MM;
    const rMm = res.inradius / SCALE_MM;
    const areaMm2 = res.area / (SCALE_MM * SCALE_MM);

    $('inkreis-result').innerHTML = `
      <b>Inkreisradius:</b> <i>r</i> = <b>${fmt(rMm, 1)} mm</b><br>
      <span style="font-size:0.8rem;color:var(--muted)">Inkreismittelpunkt M berührt alle drei Dreiecksseiten tangential.</span>
    `;

    $('inkreis-details').innerHTML = `
      <dt>Seite <i>a</i> (BC):</dt><dd>${fmt(aMm, 1)} mm</dd>
      <dt>Seite <i>b</i> (CA):</dt><dd>${fmt(bMm, 1)} mm</dd>
      <dt>Seite <i>c</i> (AB):</dt><dd>${fmt(cMm, 1)} mm</dd>
      <dt>Halber Umfang <i>s</i>:</dt><dd>${fmt(sMm, 1)} mm</dd>
      <dt>Dreiecksfläche <i>A</i>:</dt><dd>${fmt(areaMm2, 1)} mm²</dd>
      <dt>Inkreisradius <i>r</i> = <i>A</i>/<i>s</i>:</dt><dd>${fmt(rMm, 2)} mm</dd>
      <dt>Winkel α / β / γ:</dt><dd>${fmt(res.alphaDeg, 1)}° / ${fmt(res.betaDeg, 1)}° / ${fmt(res.gammaDeg, 1)}°</dd>
      <dt>Tangentenabschnitt <i>s</i> − <i>a</i>:</dt><dd>${fmt((res.segA / SCALE_MM), 1)} mm</dd>
    `;
  }

  // Interaktive Ziehpunkte
  SVG.makeDraggable(svg, (key, pos) => {
    if (key === 'A') st.A = pos;
    else if (key === 'B') st.B = pos;
    else if (key === 'C') st.C = pos;
    render();
  });

  chk('inkreis-arcs', v => { st.showArcs = v; render(); });
  chk('inkreis-lots', v => { st.showLots = v; render(); });

  // Vorlagen-Buttons
  $('inkreis-preset-book').addEventListener('click', () => {
    st.A = pt(100, 360); st.B = pt(540, 360); st.C = pt(180, 100);
    render();
  });
  $('inkreis-preset-right').addEventListener('click', () => {
    st.A = pt(140, 360); st.B = pt(460, 360); st.C = pt(140, 120);
    render();
  });
  $('inkreis-preset-equi').addEventListener('click', () => {
    st.A = pt(160, 360); st.B = pt(480, 360); st.C = pt(320, 360 - 320 * Math.sin(Math.PI / 3));
    render();
  });

  // Quiz
  function newQuiz() {
    const a = Math.floor(Math.random() * 4 + 4) * 10;
    const b = Math.floor(Math.random() * 4 + 3) * 10;
    const c = Math.floor(Math.random() * 4 + 4) * 10;
    const s = (a + b + c) / 2;
    if (s <= a || s <= b || s <= c) { newQuiz(); return; }
    const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
    const r = Math.round((area / s) * 10) / 10;

    st.quiz = { a, b, c, s, area, truth: r, answered: false };
    $('inkreis-task').innerHTML = `Gegeben ist ein Dreieck mit den Kanten <i>a</i> = <b>${a} mm</b>, <i>b</i> = <b>${b} mm</b> und <i>c</i> = <b>${c} mm</b> (halber Umfang <i>s</i> = ${fmt(s, 1)} mm, Fläche <i>A</i> = ${fmt(area, 1)} mm²). Berechnen Sie den Inkreisradius <i>r</i> = <i>A</i> / <i>s</i>!`;
    $('inkreis-ans').value = '';
    $('inkreis-ans-row').hidden = false;
    feedback('inkreis-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('inkreis-ans').value);
    if (isNaN(val)) {
      feedback('inkreis-feedback', 'Bitte eine Zahl eingeben.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('inkreis-feedback', ok
      ? `Richtig! Inkreisradius r = ${fmt(st.quiz.truth, 1)} mm.`
      : `Leider falsch. Richtig wäre r = ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('inkreis-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('inkreis-quiz').addEventListener('click', newQuiz);
  $('inkreis-check').addEventListener('click', checkQuiz);
  onEnter('inkreis-ans', checkQuiz);

  UI.tabs['inkreis'] = {
    render,
    reset() {
      Object.assign(st, BOOK_STATE());
      player.updateStepUI();
      render();
    }
  };
})();

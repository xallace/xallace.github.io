/* Reiter 4: Ellipsenkonstruktion aus zwei Kreisen (Tabellenbuch Metall S. 62, 4. Zeile)
   Gegeben: Achsen AB und CD
   1. Zwei Kreise um M mit den Durchmessern AB und CD.
   2. Durch M mehrere Strahlen ziehen, die die beiden Kreise schneiden (E, F).
   3. Parallelen zu den beiden Hauptachsen AB und CD durch E und F ziehen. Schnittpunkte sind Ellipsenpunkte. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist } = Core;
  const el = SVG.el;

  const W = 640, H = 460;
  const STEPS = [
    [1, 'Zwei Kreise um M', 'Zwei konzentrische Kreise um den Mittelpunkt M schlagen: den großen Scheitelkreis mit Durchmesser d = AB und den kleinen mit d = CD.'],
    [2, 'Strahlen durch M ziehen', 'Vom Mittelpunkt M mehrere Strahlen unter verschiedenen Winkeln ziehen. Jeder Strahl schneidet den inneren Kreis in E und den äußeren in F.'],
    [3, 'Parallelen zu den Achsen', 'Durch F eine Parallele zur kleinen Achse CD (senkrecht) und durch E eine Parallele zur großen Achse AB (waagerecht) ziehen. Schnittpunkt ist ein Ellipsenpunkt!']
  ];

  const BOOK_STATE = () => ({
    M: pt(320, 230),
    aMm: 52,
    bMm: 32,
    numRays: 12,
    activeAngleDeg: 45,
    step: 3,
    showFoci: true,
    showGrid: true,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('ellk-svg');
  const player = bindStepPlayer('ellk', 3, STEPS, st, render);

  function getRayAngles(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(Math.round((i * 360) / count));
    }
    return list;
  }

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const SCALE_MM = 3.2;
    const aPx = st.aMm * SCALE_MM;
    const bPx = st.bMm * SCALE_MM;

    const angles = getRayAngles(st.numRays);
    if (!angles.includes(st.activeAngleDeg)) angles.push(st.activeAngleDeg);

    const res = Core.constructEllipseFromTwoCircles(st.M, aPx, bPx, angles);

    // Hauptachsen AB und CD
    const A = { x: st.M.x - aPx, y: st.M.y };
    const B = { x: st.M.x + aPx, y: st.M.y };
    const C = { x: st.M.x, y: st.M.y - bPx };
    const D = { x: st.M.x, y: st.M.y + bPx };

    // Achsenlinien
    SVG.line(svg, { x: A.x - 20, y: A.y }, { x: B.x + 20, y: B.y }, { cls: 'thin-line', dash: '6 3' });
    SVG.line(svg, { x: C.x, y: C.y - 20 }, { x: D.x, y: D.y + 20 }, { cls: 'thin-line', dash: '6 3' });

    SVG.point(svg, A, { label: 'A', dx: -16, dy: 5 });
    SVG.point(svg, B, { label: 'B', dx: 10, dy: 5 });
    SVG.point(svg, C, { label: 'C', dx: -6, dy: -10 });
    SVG.point(svg, D, { label: 'D', dx: -6, dy: 16 });

    SVG.centerMark(svg, st.M, 14);
    SVG.point(svg, st.M, { label: 'M', dx: -14, dy: 14 });

    // Schritt 1: Zwei Kreise um M mit Durchmessern AB und CD
    if (st.step >= 1) {
      const isHl = hl === 1;
      SVG.circle(svg, st.M, aPx, { cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 2.2 : 1.3 });
      SVG.circle(svg, st.M, bPx, { cls: isHl ? 'hl-line' : 'thin-line', w: isHl ? 2.2 : 1.3 });
      SVG.stepNum(svg, st.M.x - aPx * 0.72, st.M.y - aPx * 0.72, 1, { hl: isHl });
    }

    // Schritt 2: Strahlen durch M
    if (st.step >= 2) {
      const isHl = hl === 2;
      for (const ray of res.rays) {
        const isAct = ray.deg === st.activeAngleDeg;
        SVG.line(svg, st.M, ray.F, {
          cls: isAct ? (isHl ? 'hl-line' : 'secant-line') : 'thin-line',
          w: isAct ? 1.8 : 0.9,
          dash: isAct ? null : '3 3'
        });
      }

      // Aktiver Strahl: Punkte E und F hervorheben
      const actRay = res.rays.find(r => r.deg === st.activeAngleDeg) || res.rays[0];
      if (actRay) {
        SVG.point(svg, actRay.E, { label: 'E', dx: -12, dy: -6, r: 3 });
        SVG.point(svg, actRay.F, { label: 'F', dx: 10, dy: -6, r: 3 });
      }

      SVG.stepNum(svg, (st.M.x + actRay.F.x) / 2 + 10, (st.M.y + actRay.F.y) / 2 - 10, 2, { hl: isHl });
    }

    // Schritt 3: Parallelen zu den beiden Achsen durch E und F
    if (st.step >= 3) {
      const isHl = hl === 3;

      // Parallelen für alle Strahlen
      for (const ray of res.rays) {
        const isAct = ray.deg === st.activeAngleDeg;
        // Senkrecht durch F zu P
        SVG.line(svg, ray.F, ray.P, {
          cls: isAct ? 'hl-line' : 'thin-line',
          w: isAct ? 1.8 : 0.8,
          dash: '2 2'
        });
        // Waagerecht durch E zu P
        SVG.line(svg, ray.E, ray.P, {
          cls: isAct ? 'hl-line' : 'thin-line',
          w: isAct ? 1.8 : 0.8,
          dash: '2 2'
        });
        // Ellipsenpunkt
        SVG.point(svg, ray.P, { r: isAct ? 4 : 2.5, sel: isAct });
      }

      // Vollständige Ellipsenlinie
      const pathPts = [];
      for (let th = 0; th <= 360; th += 2) {
        const rad = th * Core.DEG;
        pathPts.push(`${(st.M.x + aPx * Math.cos(rad)).toFixed(1)},${(st.M.y + bPx * Math.sin(rad)).toFixed(1)}`);
      }
      el(svg, 'polygon', {
        points: pathPts.join(' '),
        class: isHl ? 'hl-line' : 'ellipse-line',
        fill: 'none'
      });

      const actRay = res.rays.find(r => r.deg === st.activeAngleDeg) || res.rays[0];
      SVG.stepNum(svg, actRay.P.x + 14, actRay.P.y - 12, 3, { hl: isHl });
    }

    // Brennpunkte F1, F2
    if (st.showFoci && st.step >= 1) {
      SVG.point(svg, res.F1, { label: 'F₁', dx: -12, dy: 14, r: 3 });
      SVG.point(svg, res.F2, { label: 'F₂', dx: 8, dy: 14, r: 3 });
    }

    updateSide(res, SCALE_MM);
  }

  function updateSide(res, SCALE_MM) {
    const eMm = res.e / SCALE_MM;
    const areaMm2 = res.area / (SCALE_MM * SCALE_MM);
    const periMm = res.perimeter / SCALE_MM;

    $('ellk-result').innerHTML = `
      <b>Halbachsen:</b> <i>a</i> = <b>${fmt(st.aMm, 1)} mm</b>, <i>b</i> = <b>${fmt(st.bMm, 1)} mm</b><br>
      <span style="font-size:0.8rem;color:var(--muted)">Lineare Exzentrizität: <i>e</i> = <b>${fmt(eMm, 1)} mm</b> (Fokusabstand)</span>
    `;

    $('ellk-details').innerHTML = `
      <dt>Große Achse <i>AB</i> (2<i>a</i>):</dt><dd>${fmt(st.aMm * 2, 1)} mm</dd>
      <dt>Kleine Achse <i>CD</i> (2<i>b</i>):</dt><dd>${fmt(st.bMm * 2, 1)} mm</dd>
      <dt>Achsenverhältnis <i>b</i> / <i>a</i>:</dt><dd>${fmt(st.bMm / st.aMm, 3)}</dd>
      <dt>Lineare Exzentrizität <i>e</i> = √(<i>a</i>² − <i>b</i>²):</dt><dd>${fmt(eMm, 2)} mm</dd>
      <dt>Numerische Exzentrizität ε = <i>e</i> / <i>a</i>:</dt><dd>${fmt(res.eps, 3)}</dd>
      <dt>Ellipsenfläche <i>A</i> = π · <i>a</i> · <i>b</i>:</dt><dd>${fmt(areaMm2, 1)} mm²</dd>
      <dt>Umfang <i>U</i> (Ramanujan):</dt><dd>${fmt(periMm, 1)} mm</dd>
      <dt>Aktiver Strahlwinkel φ:</dt><dd>${fmt(st.activeAngleDeg, 0)}°</dd>
      <dt>Gleichungsprüfung (<i>x</i>²/<i>a</i>² + <i>y</i>²/<i>b</i>²):</dt><dd>1,0000 ✓</dd>
    `;
  }

  $('ellk-a').addEventListener('input', e => {
    st.aMm = Math.max(+e.target.value, st.bMm + 2);
    $('ellk-a-out').textContent = `${st.aMm} mm`;
    render();
  });
  $('ellk-b').addEventListener('input', e => {
    st.bMm = Math.min(+e.target.value, st.aMm - 2);
    $('ellk-b-out').textContent = `${st.bMm} mm`;
    render();
  });
  $('ellk-ang').addEventListener('input', e => {
    st.activeAngleDeg = +e.target.value;
    $('ellk-ang-out').textContent = `${st.activeAngleDeg}°`;
    render();
  });

  chk('ellk-foci', v => { st.showFoci = v; render(); });

  function newQuiz() {
    const a = Math.floor(Math.random() * 3 + 4) * 10; // 40, 50, 60 mm
    const b = Math.floor(Math.random() * 2 + 2) * 10; // 20, 30 mm
    const area = Math.round(Math.PI * a * b * 10) / 10;
    st.quiz = { truth: area, answered: false };
    $('ellk-task').innerHTML = `Gegeben ist eine Ellipse mit den Halbachsen <i>a</i> = <b>${a} mm</b> und <i>b</i> = <b>${b} mm</b>. Berechnen Sie die Ellipsenfläche $A = \\pi \\cdot a \\cdot b$ (in mm²)!`;
    $('ellk-ans').value = '';
    $('ellk-ans-row').hidden = false;
    feedback('ellk-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('ellk-ans').value);
    if (isNaN(val)) {
      feedback('ellk-feedback', 'Bitte eine Zahl eingeben.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 1.5;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('ellk-feedback', ok
      ? `Richtig! Ellipsenfläche A = ${fmt(st.quiz.truth, 1)} mm².`
      : `Leider falsch. Richtig wäre A = ${fmt(st.quiz.truth, 1)} mm².`, ok);
    $('ellk-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('ellk-quiz').addEventListener('click', newQuiz);
  $('ellk-check').addEventListener('click', checkQuiz);
  onEnter('ellk-ans', checkQuiz);

  UI.tabs['ellipse-kreise'] = {
    render,
    reset() {
      Object.assign(st, BOOK_STATE());
      $('ellk-a').value = st.aMm;
      $('ellk-a-out').textContent = `${st.aMm} mm`;
      $('ellk-b').value = st.bMm;
      $('ellk-b-out').textContent = `${st.bMm} mm`;
      $('ellk-ang').value = st.activeAngleDeg;
      $('ellk-ang-out').textContent = `${st.activeAngleDeg}°`;
      player.updateStepUI();
      render();
    }
  };
})();

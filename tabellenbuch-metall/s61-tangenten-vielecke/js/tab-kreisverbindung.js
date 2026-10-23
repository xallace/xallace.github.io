/* Reiter 4: Verbindung zweier Kreise durch Kreisbögen (Tabellenbuch Metall S. 61, 4. Zeile)
   Gegeben: Kreis 1 und Kreis 2; Radien Ri und Ra
   1. Kreis um M1 mit Radius Ri + r1.
   2. Kreis um M2 mit Radius Ri + r2 ergibt mit 1 den Schnittpunkt A.
   3. A mit M1 und M2 verbunden ergibt Berührungspunkte B und C für Innenradius Ri.
   4. Kreis um M1 mit Radius Ra - r1.
   5. Kreis um M2 mit Radius Ra - r2 ergibt mit 4 den Schnittpunkt D.
   6. D mit M1 und M2 verbunden und verlängert ergibt Berührungspunkte E und F für Außenradius Ra. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist, polarPt } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 2.4; // 2.4 px = 1 mm
  const STEPS = [
    [1, 'Bogen um M₁ (R_i + r₁)', 'Kreisbogen um M₁ mit Radius <i>R</i><sub>i</sub> + <i>r</i>₁ schlagen.'],
    [2, 'Bogen um M₂ (Schnittpunkt A)', 'Kreisbogen um M₂ mit Radius <i>R</i><sub>i</sub> + <i>r</i>₂ schlagen; ergibt Schnittpunkt A.'],
    [3, 'Innenbogen R_i (B und C)', 'A mit M₁ und M₂ verbinden $\\to$ Berührpunkte B und C; Kreisbogen um A von B nach C mit <i>R</i><sub>i</sub>.'],
    [4, 'Bogen um M₁ (R_a − r₁)', 'Kreisbogen um M₁ mit Radius <i>R</i><sub>a</sub> − <i>r</i>₁ schlagen.'],
    [5, 'Bogen um M₂ (Schnittpunkt D)', 'Kreisbogen um M₂ mit Radius <i>R</i><sub>a</sub> − <i>r</i>₂ schlagen; ergibt Schnittpunkt D.'],
    [6, 'Außenbogen R_a (E und F)', 'D mit M₁ und M₂ verbinden und verlängern $\\to$ Berührpunkte E und F; Bogen um D von E nach F mit <i>R</i><sub>a</sub> (Vollkontur).']
  ];

  const BOOK_STATE = () => ({
    M1: pt(200, 245),
    r1Mm: 22,
    r2Mm: 32,
    aMm: 96,
    RiMm: 55,
    RaMm: 110,
    step: 6,
    showHelpArcs: true,
    showLines: true,
    showFullOutline: true,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('verb-svg');
  const player = bindStepPlayer('verb', 6, STEPS, st, render);

  function getM2() {
    return pt(st.M1.x + st.aMm * SCALE, st.M1.y);
  }

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const M2 = getM2();
    const r1Px = st.r1Mm * SCALE;
    const r2Px = st.r2Mm * SCALE;
    const RiPx = st.RiMm * SCALE;
    const RaPx = st.RaMm * SCALE;

    const res = Core.constructTwoCircleBlend(st.M1, r1Px, M2, r2Px, RiPx, RaPx);

    // Gegebene Kreise
    SVG.circle(svg, st.M1, r1Px, { cls: 'given-line', w: 2.2 });
    SVG.circle(svg, M2, r2Px, { cls: 'given-line', w: 2.2 });
    SVG.centerMark(svg, st.M1, 14);
    SVG.centerMark(svg, M2, 14);
    SVG.point(svg, st.M1, { label: 'M₁', dx: -14, dy: 16 });
    SVG.point(svg, M2, { label: 'M₂', dx: 14, dy: 16 });

    // Achsenlinie M1 - M2
    el(svg, 'line', {
      x1: (st.M1.x - 30).toFixed(1), y1: st.M1.y.toFixed(1),
      x2: (M2.x + 40).toFixed(1), y2: M2.y.toFixed(1),
      class: 'thin-line', 'stroke-dasharray': '6 4'
    });

    if (!res.ok) {
      SVG.text(svg, W / 2, H / 2, 'Geometriebedingung verletzt (Radien zu klein für Achsabstand)', { 'text-anchor': 'middle', class: 'halo step-num' });
      updateSide(res);
      return;
    }

    const { A, B, C, D, E, F } = res;

    // Schritt 1: Kreisbogen um M1 mit Ri + r1
    if (st.step >= 1) {
      const isHl = hl === 1;
      if (st.showHelpArcs) {
        SVG.arcThroughPoint(svg, st.M1, res.R1i, A, 35, {
          cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.1
        });
      }
      SVG.stepNum(svg, (st.M1.x + A.x) / 2 - 16, (st.M1.y + A.y) / 2 - 14, 1, { hl: isHl });
    }

    // Schritt 2: Kreisbogen um M2 mit Ri + r2 -> A
    if (st.step >= 2) {
      const isHl = hl === 2;
      if (st.showHelpArcs) {
        SVG.arcThroughPoint(svg, M2, res.R2i, A, 35, {
          cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.1
        });
      }
      SVG.point(svg, A, { label: 'A', dx: 0, dy: -10, res: true });
      SVG.stepNum(svg, (M2.x + A.x) / 2 + 16, (M2.y + A.y) / 2 - 14, 2, { hl: isHl });
    }

    // Schritt 3: A mit M1 und M2 verbinden -> Berührpunkte B und C, Innenbogen Ri
    if (st.step >= 3) {
      const isHl = hl === 3;
      if (st.showLines) {
        el(svg, 'line', { x1: A.x.toFixed(1), y1: A.y.toFixed(1), x2: st.M1.x.toFixed(1), y2: st.M1.y.toFixed(1), class: 'thin-line', 'stroke-dasharray': '4 3' });
        el(svg, 'line', { x1: A.x.toFixed(1), y1: A.y.toFixed(1), x2: M2.x.toFixed(1), y2: M2.y.toFixed(1), class: 'thin-line', 'stroke-dasharray': '4 3' });
      }
      SVG.point(svg, B, { label: 'B', dx: -12, dy: -8 });
      SVG.point(svg, C, { label: 'C', dx: 12, dy: -8 });

      // Bogen Ri von B nach C
      SVG.arcBetweenPoints(svg, A, RiPx, B, C, 0, {
        cls: isHl ? 'hl-line' : 'res-line', w: isHl ? 3.5 : 2.8
      });
      SVG.stepNum(svg, (B.x + C.x) / 2, (B.y + C.y) / 2 + 18, 3, { hl: isHl });
    }

    // Schritt 4: Kreisbogen um M1 mit Ra - r1
    if (st.step >= 4) {
      const isHl = hl === 4;
      if (st.showHelpArcs) {
        SVG.arcThroughPoint(svg, st.M1, res.R1a, D, 35, {
          cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.1
        });
      }
      SVG.stepNum(svg, (st.M1.x + D.x) / 2 - 16, (st.M1.y + D.y) / 2 + 18, 4, { hl: isHl });
    }

    // Schritt 5: Kreis um M2 mit Ra - r2 -> D
    if (st.step >= 5) {
      const isHl = hl === 5;
      if (st.showHelpArcs) {
        SVG.arcThroughPoint(svg, M2, res.R2a, D, 35, {
          cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.1
        });
      }
      SVG.point(svg, D, { label: 'D', dx: 0, dy: 18, res: true });
      SVG.stepNum(svg, (M2.x + D.x) / 2 + 16, (M2.y + D.y) / 2 + 18, 5, { hl: isHl });
    }

    // Schritt 6: D mit M1 und M2 verbinden und verlängern -> E und F, Außenbogen Ra
    if (st.step >= 6) {
      const isHl = hl === 6;
      if (st.showLines) {
        el(svg, 'line', { x1: D.x.toFixed(1), y1: D.y.toFixed(1), x2: E.x.toFixed(1), y2: E.y.toFixed(1), class: 'thin-line', 'stroke-dasharray': '4 3' });
        el(svg, 'line', { x1: D.x.toFixed(1), y1: D.y.toFixed(1), x2: F.x.toFixed(1), y2: F.y.toFixed(1), class: 'thin-line', 'stroke-dasharray': '4 3' });
      }
      SVG.point(svg, E, { label: 'E', dx: -12, dy: 16 });
      SVG.point(svg, F, { label: 'F', dx: 14, dy: 16 });

      // Außenbogen Ra von E nach F
      SVG.arcBetweenPoints(svg, D, RaPx, E, F, 0, {
        cls: isHl ? 'hl-line' : 'res-line', w: isHl ? 3.5 : 2.8
      });
      SVG.stepNum(svg, (E.x + F.x) / 2, (E.y + F.y) / 2 - 16, 6, { hl: isHl });

      // Wenn Vollkontur aktiv: Kreisbögen auf Kreis 1 (E -> B) und Kreis 2 (C -> F) hervorheben
      if (st.showFullOutline) {
        SVG.arcBetweenPoints(svg, st.M1, r1Px, E, B, 0, { cls: 'res-line', w: 2.8 });
        SVG.arcBetweenPoints(svg, M2, r2Px, C, F, 0, { cls: 'res-line', w: 2.8 });
      }
    }

    updateSide(res);
  }

  function updateSide(res) {
    const resEl = $('verb-result');
    if (!res.ok) {
      resEl.className = 'result warn';
      resEl.textContent = 'Bögen schneiden sich nicht: Ungleichung |R1 - R2| < a < R1 + R2 prüfen';
    } else {
      resEl.className = 'result';
      resEl.innerHTML = `Nockenkontur tangential &nbsp;·&nbsp; 4 Berührpunkte B, C, E, F`;
    }

    $('verb-details').innerHTML = [
      ['Kreis 1 (<i>r</i>₁)', `${fmt(st.r1Mm, 0)} mm`],
      ['Kreis 2 (<i>r</i>₂)', `${fmt(st.r2Mm, 0)} mm`],
      ['Achsabstand <i>a</i> = <span class="overline">M₁M₂</span>', `${fmt(st.aMm, 0)} mm`],
      ['Innenradius <i>R</i><sub>i</sub>', `${fmt(st.RiMm, 0)} mm`],
      ['Bogen 1 & 2 für A (<i>R</i><sub>i</sub> + <i>r</i>)', `${fmt((st.RiMm + st.r1Mm), 0)} mm / ${fmt((st.RiMm + st.r2Mm), 0)} mm`],
      ['Außenradius <i>R</i><sub>a</sub>', `${fmt(st.RaMm, 0)} mm`],
      ['Bogen 4 & 5 für D (<i>R</i><sub>a</sub> − <i>r</i>)', `${fmt((st.RaMm - st.r1Mm), 0)} mm / ${fmt((st.RaMm - st.r2Mm), 0)} mm`]
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');

    $('verb-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} richtig` : '';
  }

  $('verb-r1').addEventListener('input', e => {
    st.r1Mm = +e.target.value;
    $('verb-r1-out').textContent = `${st.r1Mm} mm`;
    render();
  });
  $('verb-r2').addEventListener('input', e => {
    st.r2Mm = +e.target.value;
    $('verb-r2-out').textContent = `${st.r2Mm} mm`;
    render();
  });
  $('verb-a').addEventListener('input', e => {
    st.aMm = +e.target.value;
    $('verb-a-out').textContent = `${st.aMm} mm`;
    render();
  });
  $('verb-ri').addEventListener('input', e => {
    st.RiMm = +e.target.value;
    $('verb-ri-out').textContent = `${st.RiMm} mm`;
    render();
  });
  $('verb-ra').addEventListener('input', e => {
    st.RaMm = +e.target.value;
    $('verb-ra-out').textContent = `${st.RaMm} mm`;
    render();
  });

  chk('verb-help', v => { st.showHelpArcs = v; render(); });
  chk('verb-lines', v => { st.showLines = v; render(); });
  chk('verb-full', v => { st.showFullOutline = v; render(); });

  function newQuiz() {
    const r1 = 20, r2 = 30;
    const Ri = Math.floor(Math.random() * 4 + 4) * 10; // 40, 50, 60, 70
    const Ra = Math.floor(Math.random() * 4 + 9) * 10; // 90, 100, 110, 120

    const ask = Math.random() < 0.5 ? 'Ri1' : 'Ra2';
    const truth = ask === 'Ri1' ? (Ri + r1) : (Ra - r2);

    st.quiz = { r1, r2, Ri, Ra, ask, truth, answered: false };
    $('verb-task').innerHTML = ask === 'Ri1'
      ? `Kreis 1 hat <i>r</i>₁ = <b>${r1} mm</b> und der Innenbogen soll <i>R</i><sub>i</sub> = <b>${Ri} mm</b> betragen. Welchen Radius (in mm) muss Hilfsbogen 1 um M₁ haben ($R_1 = R_i + r_1$)?`
      : `Kreis 2 hat <i>r</i>₂ = <b>${r2} mm</b> und der Außenbogen soll <i>R</i><sub>a</sub> = <b>${Ra} mm</b> betragen. Welchen Radius (in mm) muss Hilfsbogen 5 um M₂ haben ($R_2 = R_a - r_2$)?`;

    $('verb-ans-unit').textContent = 'mm';
    $('verb-ans').value = '';
    $('verb-ans-row').hidden = false;
    feedback('verb-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('verb-ans').value);
    if (isNaN(val)) {
      feedback('verb-feedback', 'Bitte eine Zahl eingeben.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('verb-feedback', ok
      ? `Richtig! Radius = ${fmt(st.quiz.truth, 0)} mm.`
      : `Leider falsch. Richtig wäre: ${fmt(st.quiz.truth, 0)} mm.`, ok);
    $('verb-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('verb-quiz').addEventListener('click', newQuiz);
  $('verb-check').addEventListener('click', checkQuiz);
  onEnter('verb-ans', checkQuiz);

  UI.tabs['kreisverbindung'] = {
    render,
    reset() {
      Object.assign(st, BOOK_STATE());
      $('verb-r1').value = st.r1Mm;
      $('verb-r1-out').textContent = `${st.r1Mm} mm`;
      $('verb-r2').value = st.r2Mm;
      $('verb-r2-out').textContent = `${st.r2Mm} mm`;
      $('verb-a').value = st.aMm;
      $('verb-a-out').textContent = `${st.aMm} mm`;
      $('verb-ri').value = st.RiMm;
      $('verb-ri-out').textContent = `${st.RiMm} mm`;
      $('verb-ra').value = st.RaMm;
      $('verb-ra-out').textContent = `${st.RaMm} mm`;
      player.updateStepUI();
      render();
    }
  };
})();

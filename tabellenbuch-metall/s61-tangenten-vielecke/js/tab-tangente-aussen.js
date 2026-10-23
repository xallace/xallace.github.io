/* Reiter 2: Tangente von einem Punkt P an den Kreis (Tabellenbuch Metall S. 61, 2. Zeile)
   Gegeben: Kreis und Punkt P außerhalb
   1. MP halbieren. A ist Mittelpunkt.
   2. Kreis um A mit Radius r = AM. T ist Tangentenpunkt.
   3. T mit P verbinden.
   4. MT ist senkrecht zu PT. */
(() => {
  'use strict';
  const { $, chk, feedback, onEnter, bindStepPlayer } = UI;
  const { fmt, pt, sub, add, scale, unit, dist, polarPt, mid } = Core;
  const el = SVG.el;

  const W = 640, H = 460, SCALE = 3.0; // 3 px = 1 mm
  const STEPS = [
    [1, 'MP halbieren (A)', 'Strecke <span class="overline">MP</span> halbieren; der Mittelpunkt von <span class="overline">MP</span> ist A.'],
    [2, 'Thaleskreis um A (T)', 'Kreis um A mit Radius <i>r</i> = <span class="overline">AM</span> schlagen; schneidet den Kreis im Tangentenpunkt T.'],
    [3, 'Tangente PT verbinden', 'Punkt T mit P verbinden; ergibt die gesuchte Tangente <span class="overline">PT</span> an den Kreis.'],
    [4, 'Satz des Thales (MT ⊥ PT)', 'Radius <span class="overline">MT</span> einzeichnen; nach dem Satz des Thales steht <span class="overline">MT</span> senkrecht auf <span class="overline">PT</span> (90°).']
  ];

  const BOOK_STATE = () => ({
    M: pt(180, 240),
    RMm: 42,
    P: pt(490, 240),
    step: 4,
    showBoth: true,
    showThales: true,
    showBisectArcs: true,
    hoverStep: null,
    pinStep: null,
    quiz: null,
    score: [0, 0]
  });

  const st = BOOK_STATE();
  const svg = $('tana-svg');
  const player = bindStepPlayer('tana', 4, STEPS, st, render);

  function render() {
    const hl = st.hoverStep || st.pinStep;
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const RPx = st.RMm * SCALE;
    const res = Core.constructTangentFromPoint(st.M, RPx, st.P);

    // Gegebener Kreis um M
    SVG.circle(svg, st.M, RPx, { cls: 'given-line', w: 2.3 });
    SVG.centerMark(svg, st.M, 14);
    SVG.point(svg, st.M, { label: 'M', dx: -14, dy: 16 });

    // Verbindungslinie MP (Achse)
    el(svg, 'line', {
      x1: st.M.x.toFixed(1), y1: st.M.y.toFixed(1),
      x2: st.P.x.toFixed(1), y2: st.P.y.toFixed(1),
      class: 'thin-line', 'stroke-dasharray': '6 4'
    });

    if (!res.ok) {
      SVG.point(svg, st.P, { drag: 'P', label: 'P', dx: 14, dy: -8, sel: true });
      SVG.text(svg, W / 2, H / 2, 'Punkt P muss außerhalb des Kreises liegen!', { 'text-anchor': 'middle', class: 'halo step-num' });
      updateSide(res);
      return;
    }

    const { A, rA, T1, T2 } = res;

    // Schritt 1: MP halbieren. A ist Mittelpunkt.
    if (st.step >= 1) {
      const isHl = hl === 1;
      if (st.showBisectArcs) {
        // Hilfsbögen zur Mittelsenkrechten um M und P
        const rBisect = rA * 1.15;
        SVG.arcThroughPoint(svg, st.M, rBisect, pt(A.x, A.y - 40), 22, { cls: 'thin-arc' });
        SVG.arcThroughPoint(svg, st.M, rBisect, pt(A.x, A.y + 40), 22, { cls: 'thin-arc' });
        SVG.arcThroughPoint(svg, st.P, rBisect, pt(A.x, A.y - 40), 22, { cls: 'thin-arc' });
        SVG.arcThroughPoint(svg, st.P, rBisect, pt(A.x, A.y + 40), 22, { cls: 'thin-arc' });
        // Mittelsenkrechte
        el(svg, 'line', {
          x1: A.x.toFixed(1), y1: (A.y - 50).toFixed(1),
          x2: A.x.toFixed(1), y2: (A.y + 50).toFixed(1),
          class: isHl ? 'hl-line' : 'thin-line', 'stroke-width': 1.1
        });
      }
      SVG.point(svg, A, { label: 'A', dx: -8, dy: 16 });
      SVG.stepNum(svg, A.x + 8, A.y + 45, 1, { hl: isHl });
    }

    // Schritt 2: Kreis (Thaleskreis) um A mit Radius r = AM. T ist Tangentenpunkt.
    if (st.step >= 2) {
      const isHl = hl === 2;
      if (st.showThales) {
        SVG.circle(svg, A, rA, {
          cls: isHl ? 'hl-arc' : 'arc-line',
          w: isHl ? 2.0 : 1.2,
          dash: '5 3'
        });
      } else {
        // Zirkelbögen durch T1 und T2
        SVG.arcThroughPoint(svg, A, rA, T1, 30, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2 });
        if (st.showBoth) {
          SVG.arcThroughPoint(svg, A, rA, T2, 30, { cls: isHl ? 'hl-arc' : 'arc-line', w: isHl ? 2.0 : 1.2 });
        }
      }
      SVG.point(svg, T1, { label: 'T', dx: -12, dy: -10, res: true });
      if (st.showBoth) SVG.point(svg, T2, { label: "T'", dx: -12, dy: 16, res: true });
      SVG.stepNum(svg, (A.x + st.P.x) / 2 + 10, A.y - rA + 12, 2, { hl: isHl });
    }

    // Schritt 3: T mit P verbinden (Tangente PT)
    if (st.step >= 3) {
      const isHl = hl === 3;
      // Tangente über T hinaus verlängern
      const uPT1 = unit(sub(T1, st.P));
      const t1End = add(T1, scale(uPT1, 45));
      el(svg, 'line', {
        x1: st.P.x.toFixed(1), y1: st.P.y.toFixed(1),
        x2: t1End.x.toFixed(1), y2: t1End.y.toFixed(1),
        class: isHl ? 'hl-line' : 'res-line',
        'stroke-width': isHl ? 3.0 : 2.4
      });
      SVG.stepNum(svg, (st.P.x + T1.x) / 2 + 10, (st.P.y + T1.y) / 2 - 14, 3, { hl: isHl });

      if (st.showBoth) {
        const uPT2 = unit(sub(T2, st.P));
        const t2End = add(T2, scale(uPT2, 45));
        el(svg, 'line', {
          x1: st.P.x.toFixed(1), y1: st.P.y.toFixed(1),
          x2: t2End.x.toFixed(1), y2: t2End.y.toFixed(1),
          class: isHl ? 'hl-line' : 'res-line',
          'stroke-width': isHl ? 3.0 : 2.0
        });
      }
    }

    // Schritt 4: MT ist senkrecht zu PT (Satz des Thales)
    if (st.step >= 4) {
      const isHl = hl === 4;
      el(svg, 'line', {
        x1: st.M.x.toFixed(1), y1: st.M.y.toFixed(1),
        x2: T1.x.toFixed(1), y2: T1.y.toFixed(1),
        class: isHl ? 'hl-line' : 'thin-line',
        'stroke-width': isHl ? 2.4 : 1.3
      });
      SVG.rightAngle(svg, T1, st.M, st.P, 18);
      SVG.stepNum(svg, (st.M.x + T1.x) / 2 - 12, (st.M.y + T1.y) / 2 - 8, 4, { hl: isHl });

      if (st.showBoth) {
        el(svg, 'line', {
          x1: st.M.x.toFixed(1), y1: st.M.y.toFixed(1),
          x2: T2.x.toFixed(1), y2: T2.y.toFixed(1),
          class: 'thin-line', 'stroke-width': 1.1
        });
        SVG.rightAngle(svg, T2, st.M, st.P, 18);
      }
    }

    // Ziehbarer Punkt P
    SVG.point(svg, st.P, { drag: 'P', label: 'P', dx: 14, dy: -8, sel: true });

    updateSide(res);
  }

  function updateSide(res) {
    const resEl = $('tana-result');
    if (!res.ok) {
      resEl.className = 'result warn';
      resEl.innerHTML = `Punkt P liegt im Kreisinneren (Abstand ≤ ${fmt(st.RMm, 0)} mm)`;
    } else {
      resEl.className = 'result';
      resEl.innerHTML = `<span class="overline">MT</span> ⊥ <span class="overline">PT</span> &nbsp;·&nbsp; Thales-Winkel = ${fmt(res.angleMTPDeg1, 1)}°`;
    }

    const dMm = res.ok ? res.d / SCALE : 0;
    const lMm = res.ok ? res.tangentLen / SCALE : 0;
    $('tana-details').innerHTML = [
      ['Kreisradius <i>R</i>', `${fmt(st.RMm, 0)} mm`],
      ['Abstand <span class="overline">MP</span>', dMm ? `${fmt(dMm, 1)} mm` : '–'],
      ['Thalesradius <i>r</i> = ½ <span class="overline">MP</span>', dMm ? `${fmt(dMm / 2, 1)} mm` : '–'],
      ['Tangentenlänge <span class="overline">PT</span>', lMm ? `${fmt(lMm, 1)} mm` : '–'],
      ['Öffnungswinkel <i>α</i>', res.ok ? `${fmt(res.apexAngleDeg, 1)}°` : '–'],
      ['Pythagoras-Prüfung', res.ok ? `<i>R</i>² + <i>L</i>² = <span class="overline">MP</span>² ✓` : '–']
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');

    $('tana-score').textContent = st.score[1] ? `${st.score[0]} / ${st.score[1]} richtig` : '';
  }

  // Ziehen von Punkt P im Zeichenfeld (außerhalb des Kreises)
  svg.addEventListener('pointerdown', e => {
    const hit = e.target.closest('[data-drag="P"]');
    if (!hit) return;
    player.stopTimer();
    SVG.startDrag(svg, e, loc => {
      const minRPx = (st.RMm + 15) * SCALE;
      const dx = loc.x - st.M.x;
      const dy = loc.y - st.M.y;
      const curD = Math.hypot(dx, dy) || 1;
      const targetD = Math.max(minRPx, Math.min(320, curD));
      st.P.x = st.M.x + (dx / curD) * targetD;
      st.P.y = st.M.y + (dy / curD) * targetD;
      const dMm = Math.round(targetD / SCALE);
      $('tana-d').value = dMm;
      $('tana-d-out').textContent = `${dMm} mm`;
      render();
    });
  });

  $('tana-r').addEventListener('input', e => {
    st.RMm = +e.target.value;
    $('tana-r-out').textContent = `${st.RMm} mm`;
    // P sicherstellen außerhalb
    const d = dist(st.M, st.P) / SCALE;
    if (d < st.RMm + 15) {
      const u = unit(sub(st.P, st.M));
      st.P = add(st.M, scale(u, (st.RMm + 20) * SCALE));
      $('tana-d').value = Math.round(dist(st.M, st.P) / SCALE);
      $('tana-d-out').textContent = `${$('tana-d').value} mm`;
    }
    render();
  });

  $('tana-d').addEventListener('input', e => {
    const dMm = +e.target.value;
    $('tana-d-out').textContent = `${dMm} mm`;
    const u = unit(sub(st.P, st.M));
    st.P = add(st.M, scale(u, dMm * SCALE));
    render();
  });

  chk('tana-both', v => { st.showBoth = v; render(); });
  chk('tana-thales', v => { st.showThales = v; render(); });
  chk('tana-bisect', v => { st.showBisectArcs = v; render(); });

  function newQuiz() {
    // Pythagoreische Tripel (R, L, d): (30, 40, 50), (60, 80, 100), (50, 120, 130), (45, 60, 75)
    const triples = [[30, 40, 50], [60, 80, 100], [50, 120, 130], [45, 60, 75]];
    const [R, L, d] = triples[Math.floor(Math.random() * triples.length)];
    const ask = Math.random() < 0.5 ? 'L' : 'rA';
    const truth = ask === 'L' ? L : d / 2;

    st.quiz = { R, L, d, truth, ask, answered: false };
    $('tana-task').innerHTML = ask === 'L'
      ? `Ein Kreis hat den Radius <i>R</i> = <b>${R} mm</b>. Punkt P befindet sich im Abstand <span class="overline">MP</span> = <b>${d} mm</b>. Wie lang ist die Tangentenstrecke <span class="overline">PT</span> ($L = \\sqrt{\\overline{MP}^2 - R^2}$)?`
      : `Der Abstand vom Kreismittelpunkt M zum äußeren Punkt P beträgt <span class="overline">MP</span> = <b>${d} mm</b>. Welchen Radius <i>r</i> hat der Thaleskreis um den Mittelpunkt A?`;

    $('tana-ans-unit').textContent = 'mm';
    $('tana-ans').value = '';
    $('tana-ans-row').hidden = false;
    feedback('tana-feedback', '');
  }

  function checkQuiz() {
    if (!st.quiz || st.quiz.answered) return;
    const val = Core.parseNum($('tana-ans').value);
    if (isNaN(val)) {
      feedback('tana-feedback', 'Bitte eine Zahl eingeben.', false);
      return;
    }
    const ok = Math.abs(val - st.quiz.truth) <= 0.2;
    st.quiz.answered = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    feedback('tana-feedback', ok
      ? `Richtig! Ergebnis: ${fmt(st.quiz.truth, 1)} mm.`
      : `Leider falsch. Richtig wäre: ${fmt(st.quiz.truth, 1)} mm.`, ok);
    $('tana-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
  }

  $('tana-quiz').addEventListener('click', newQuiz);
  $('tana-check').addEventListener('click', checkQuiz);
  onEnter('tana-ans', checkQuiz);

  UI.tabs['tangente-aussen'] = {
    render,
    reset() {
      Object.assign(st, BOOK_STATE());
      $('tana-r').value = st.RMm;
      $('tana-r-out').textContent = `${st.RMm} mm`;
      $('tana-d').value = Math.round(dist(st.M, st.P) / SCALE);
      $('tana-d-out').textContent = `${$('tana-d').value} mm`;
      player.updateStepUI();
      render();
    }
  };
})();

/* Reiter 1: Kartesisches Koordinatensystem (Fortsetzung) – Diagramme mit mehreren Kennlinien
   Festigkeit Rm und Re über Temperatur T mit stark streuenden Messwerten (×, ○, □) nach DIN 461 */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback } = UI;
  const { fmt } = Core;
  const el = SVG.el;

  const W = 640, H = 500, PX0 = 96, PX1 = 584, PY0 = 420, PY1 = 36;
  const TEMPS = [0, 100, 200, 300, 400, 500, 600];

  // Messwerte [unten, oben] in N/mm² bei 0 … 600 °C, aus der Abbildung auf S. 59 abgelesen (± 10 N/mm²)
  const BOOK = () => ({
    Rm: [[1650, 1705], [1550, 1605], [1455, 1510], [1430, 1480], [1355, 1440], [1050, 1170], [425, 545]],
    Re: [[1205, 1255], [1160, 1200], [1125, 1165], [1070, 1120], [1020, 1065], [840, 920], [375, 485]],
    // Nicht im Buch: frei erfundener zweiter Werkstoff, um das dritte Zeichen □ zu zeigen
    Rp: [[920, 980], [890, 950], [850, 910], [790, 860], [710, 790], [560, 640], [260, 320]]
  });

  const SERIES_META = [
    { key: 'Rm', label: '*R*_{m}', html: '<i>R</i><sub>m</sub>', title: 'Zugfestigkeit', mark: 'cross', markSym: '×', cls: 'curve-rm', dash: null, lx: 225, lyOff: -24 },
    { key: 'Re', label: '*R*_{e}', html: '<i>R</i><sub>e</sub>', title: 'Streckgrenze', mark: 'circle', markSym: '○', cls: 'curve-re', dash: '9 5', lx: 225, lyOff: -22 },
    { key: 'Rp', label: '*R*_{e2}', html: '<i>R</i><sub>e2</sub>', title: 'Werkstoff 2', mark: 'square', markSym: '□', cls: 'curve-rp', dash: '10 4 2 4', lx: 225, lyOff: -22 }
  ];

  const RULES = [
    ['scatter', 'Streuende Messwerte', 'Bei stark streuenden Messwerten erhält jede Kennlinie ein eigenes Zeichen, z. B. ○, ×, □.'],
    ['symbols', 'Formelzeichen an der Linie', 'Bei derselben Linienart werden die Kennlinien durch die Namen oder Formelzeichen der Veränderlichen (<i>R</i><sub>m</sub>, <i>R</i><sub>e</sub>) gekennzeichnet.'],
    ['colors', 'Unterschiedliche Farben', 'Alternativ oder ergänzend unterscheiden Farben die Kennlinien (im Buch: <i>R</i><sub>m</sub> rot, <i>R</i><sub>e</sub> blau).'],
    ['linetypes', 'Unterschiedliche Linienarten', 'Volllinie, Strichlinie oder Strichpunktlinie trennen die Kennlinien auch im Schwarz-Weiß-Druck eindeutig.'],
    ['units', 'Einheit & Skalenbeginn', 'Einheiten (°C, N/mm²) stehen zwischen den letzten beiden Zahlen; die Ordinate beginnt hier bei 200 N/mm².']
  ];

  const st = {
    data: BOOK(),
    idMode: 'color',      // 'color' | 'dash' | 'both'
    fit: 'smooth',        // 'smooth' | 'band' | 'zigzag'
    marks: true,
    third: false,
    showRead: true,
    T: 300,
    hoverRule: null,
    pinRule: null,
    quiz: null,
    score: [0, 0]
  };
  const svg = $('m-svg');

  const activeSeries = () => SERIES_META.slice(0, st.third ? 3 : 2);
  const fnOf = key => Core.pchip(TEMPS, Core.scatterStats(st.data[key]).means);

  function render() {
    const X = Core.linScale(0, 600, PX0, PX1);
    const Y = Core.linScale(200, 1800, PY0, PY1);
    const hl = st.hoverRule || st.pinRule;

    SVG.clear(svg);
    SVG.background(svg, W, H);

    // Netzlinien und Kasten wie im Buch (0 … 600 °C, 200 … 1800 N/mm²)
    const gGrid = el(svg, 'g', { class: 'grid' });
    for (const t of Core.ticks(0, 600, 100)) {
      el(gGrid, 'line', { x1: X(t), y1: PY0, x2: X(t), y2: PY1, 'stroke-width': 0.65, opacity: 0.65 });
    }
    for (const f of Core.ticks(200, 1800, 200)) {
      el(gGrid, 'line', { x1: PX0, y1: Y(f), x2: PX1, y2: Y(f), 'stroke-width': 0.65, opacity: 0.65 });
    }

    // Achsen (unten bei 200 N/mm², links bei 0 °C)
    el(svg, 'line', { x1: PX0, y1: PY0, x2: PX1, y2: PY0, class: 'ax', 'stroke-width': 1.4 });
    el(svg, 'line', { x1: PX0, y1: PY0, x2: PX0, y2: PY1, class: 'ax', 'stroke-width': 1.4 });

    // Zahlenwerte und Einheiten genau wie auf S. 59:
    // Abszisse: 0, 100, 200, 300, 400, °C (bei 500), 600
    // Ordinate: 200, 400, 600, 800, 1000, 1200, N/mm² (bei 1400), 1600
    const hlUnit = hl === 'units' ? ' hl-text' : '';
    for (const t of Core.ticks(0, 600, 100)) {
      const isUnit = t === 500;
      SVG.text(svg, X(t), PY0 + 22, isUnit ? '°C' : String(t), {
        'text-anchor': 'middle', 'font-size': 14, class: isUnit ? hlUnit.trim() : null
      });
    }
    for (const f of Core.ticks(200, 1600, 200)) {
      const isUnit = f === 1400;
      SVG.text(svg, PX0 - 10, Y(f) + 5, isUnit ? 'N/mm^{2}' : String(f), {
        'text-anchor': 'end', 'font-size': 14, class: (hl === 'units' && (isUnit || f === 200)) ? 'hl-text' : null
      });
    }

    // Achsbenennungen mit parallelen Pfeilen wie im Buch
    const xm = (PX0 + PX1) / 2;
    SVG.text(svg, xm + 18, PY0 + 54, 'Temperatur', { 'text-anchor': 'end', 'font-size': 15 });
    SVG.arrow(svg, xm + 28, PY0 + 49, xm + 86, PY0 + 49, { w: 1.2, l: 11, b: 3.6 });
    const ym = (PY0 + PY1) / 2;
    SVG.text(svg, 28, ym + 42, 'Festigkeit', { 'text-anchor': 'start', 'font-size': 15, transform: `rotate(-90 28 ${ym + 42})` });
    SVG.arrow(svg, 23, ym - 46, 23, ym - 104, { w: 1.2, l: 11, b: 3.6 });

    // Streubänder (wenn gewählt)
    const series = activeSeries();
    if (st.fit === 'band') {
      for (const s of series) {
        const stats = Core.scatterStats(st.data[s.key]);
        const fLo = Core.pchip(TEMPS, stats.mins), fHi = Core.pchip(TEMPS, stats.maxs);
        const topPts = [], botPts = [];
        for (let i = 0; i <= 120; i++) {
          const t = 600 * i / 120;
          topPts.push([X(t), Y(fHi(t))]);
          botPts.push([X(t), Y(fLo(t))]);
        }
        el(svg, 'path', { d: SVG.path(topPts.concat(botPts.reverse()), true), class: 'band ' + s.cls });
      }
    }

    // Kennlinien zeichnen
    for (const s of series) {
      const f = fnOf(s.key);
      const useColor = st.idMode !== 'dash';
      const useDash = st.idMode !== 'color';
      const strokeCls = (useColor ? s.cls : 'curve-mono') + (hl === 'colors' || hl === 'linetypes' ? ' hl-curve' : '');
      let d;
      if (st.fit === 'zigzag') {
        const pts = [];
        TEMPS.forEach((t, i) => {
          const [lo, hi] = st.data[s.key][i];
          pts.push([X(t), Y(i % 2 ? lo : hi)]);
        });
        d = SVG.path(pts);
      } else {
        d = SVG.plotFn(f, 0, 600, X, Y, 180);
      }
      if (hl === 'colors' || hl === 'linetypes') {
        el(svg, 'path', { d, class: 'hl', 'stroke-width': 7 });
      }
      el(svg, 'path', {
        d,
        class: 'curve ' + strokeCls,
        'stroke-width': 2.5,
        'stroke-dasharray': useDash && s.dash ? s.dash : null
      });

      // Formelzeichen mit kurzer Hinweislinie wie im Buch (bei ~ 230 °C)
      if (st.idMode !== 'dash' || hl === 'symbols') {
        const tx = X(s.lx), ty = Y(f(s.lx)) + s.lyOff;
        const ax = X(s.lx + 24), ay = Y(f(s.lx + 24));
        el(svg, 'line', { x1: tx + 6, y1: ty + 4, x2: ax, y2: ay, class: 'callout' });
        SVG.text(svg, tx, ty, s.label, {
          'text-anchor': 'middle', 'font-size': 16,
          class: 'halo' + (hl === 'symbols' ? ' hl-text' : '')
        });
      }
    }

    // Streuende Messwerte (×, ○, □) und Zieh-Trefferflächen
    if (st.marks || hl === 'scatter') {
      for (const s of series) {
        const useColor = st.idMode !== 'dash';
        const mCls = 'pt-mark ' + (useColor ? s.cls : 'curve-mono') + (hl === 'scatter' ? ' hl-stroke' : '');
        TEMPS.forEach((t, i) => {
          st.data[s.key][i].forEach((val, j) => {
            const px = X(t), py = Y(val);
            if (hl === 'scatter') el(svg, 'circle', { cx: px, cy: py, r: 8, class: 'hl-ring' });
            SVG.marker(svg, s.mark, px, py, 4.6, mCls);
            if (!st.quiz) {
              el(svg, 'circle', { cx: px, cy: py, r: 11, class: 'pt-hit', 'data-key': s.key, 'data-i': i, 'data-j': j });
            }
          });
        });
      }
    }

    // Legende oben rechts bei Linienarten-Darstellung oder 3. Kennlinie
    if (st.idMode !== 'color' || st.third) {
      const lx = PX1 - 185, ly = PY1 + 10;
      el(svg, 'rect', { x: lx - 8, y: ly - 4, width: 185, height: series.length * 22 + 10, rx: 5, class: 'legend-box' });
      series.forEach((s, idx) => {
        const y = ly + 11 + idx * 22;
        const useColor = st.idMode !== 'dash';
        const useDash = st.idMode !== 'color';
        el(svg, 'line', {
          x1: lx, y1: y, x2: lx + 34, y2: y,
          class: 'curve ' + (useColor ? s.cls : 'curve-mono'),
          'stroke-width': 2.4,
          'stroke-dasharray': useDash && s.dash ? s.dash : null
        });
        SVG.marker(svg, s.mark, lx + 17, y, 4.2, 'pt-mark ' + (useColor ? s.cls : 'curve-mono'));
        SVG.text(svg, lx + 42, y + 4.5, `${s.label} (${s.title})`, { 'font-size': 12.5 });
      });
    }

    // Ableselinie bei Temperatur st.T (in der Übung erst nach Beantwortung)
    if ((st.showRead && !st.quiz) || (st.quiz && st.quiz.done)) {
      const T = st.quiz ? st.quiz.T : st.T;
      const x = X(T);
      const gR = el(svg, 'g', {});
      el(gR, 'line', { x1: x, y1: PY0, x2: x, y2: PY1, class: 'read', 'stroke-dasharray': '4 3' });
      for (const s of series) {
        const val = fnOf(s.key)(T);
        const y = Y(val);
        el(gR, 'line', { x1: x, y1: y, x2: PX0, y2: y, class: 'read' });
        SVG.arrowHead(gR, PX0 + 2, y, 180, 10, 3.4, 'read-head');
        el(gR, 'circle', { cx: x, cy: y, r: 4.5, class: 'pt sel' });
      }
    }

    updateSide();
  }

  function updateSide() {
    const fRm = fnOf('Rm'), fRe = fnOf('Re'), fRp = fnOf('Rp');
    if (st.quiz && !st.quiz.done) {
      $('m-result').textContent = '–';
      $('m-details').innerHTML = '<span>Während der Aufgabe ausgeblendet</span><span></span>';
      return;
    }
    const T = st.T;
    const rm = fRm(T), re = fRe(T);
    const idx = TEMPS.findIndex(t => Math.abs(t - T) < 1e-6);
    $('m-result').innerHTML = `<i>T</i> = ${fmt(T, 0)} °C → <i>R</i><sub>m</sub> ≈ ${fmt(Math.round(rm / 10) * 10, 0)} N/mm², <i>R</i><sub>e</sub> ≈ ${fmt(Math.round(re / 10) * 10, 0)} N/mm²`;
    const kv = [
      ['Zugfestigkeit <i>R</i><sub>m</sub> (×)', `${fmt(rm, 0)} N/mm²`],
      ['Streckgrenze <i>R</i><sub>e</sub> (○)', `${fmt(re, 0)} N/mm²`],
      ['Abstand <i>R</i><sub>m</sub> − <i>R</i><sub>e</sub>', `${fmt(rm - re, 0)} N/mm²`],
      ['Verhältnis <i>R</i><sub>e</sub> / <i>R</i><sub>m</sub>', fmt(re / rm, 2)]
    ];
    if (st.third) kv.splice(2, 0, ['Werkstoff 2 <i>R</i><sub>e2</sub> (□)', `${fmt(fRp(T), 0)} N/mm²`]);
    if (idx >= 0) {
      const [rm0, rm1] = st.data.Rm[idx], [re0, re1] = st.data.Re[idx];
      kv.push(
        [`Streuung <i>R</i><sub>m</sub> bei ${T} °C`, `${fmt(rm0, 0)}…${fmt(rm1, 0)} (Δ = ${fmt(rm1 - rm0, 0)}) N/mm²`],
        [`Streuung <i>R</i><sub>e</sub> bei ${T} °C`, `${fmt(re0, 0)}…${fmt(re1, 0)} (Δ = ${fmt(re1 - re0, 0)}) N/mm²`]
      );
    }
    $('m-details').innerHTML = kv.map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
  }

  function renderRules() {
    $('m-rules').innerHTML = RULES.map(([k, t, s]) =>
      `<li class="hover-able${st.pinRule === k ? ' active' : ''}" data-key="${k}"><b>${t}:</b> ${s}</li>`).join('');
  }

  const rulesEl = $('m-rules');
  rulesEl.addEventListener('mouseover', e => {
    const li = e.target.closest('li');
    const k = li ? li.dataset.key : null;
    if (k !== st.hoverRule) { st.hoverRule = k; render(); }
  });
  rulesEl.addEventListener('mouseleave', () => { st.hoverRule = null; render(); });
  rulesEl.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    st.pinRule = st.pinRule === li.dataset.key ? null : li.dataset.key;
    renderRules();
    render();
  });

  function syncSlider() {
    $('m-temp').value = st.T;
    $('m-temp-out').textContent = fmt(st.T, 0) + ' °C';
  }

  $('m-temp').addEventListener('input', e => {
    st.T = +e.target.value;
    syncSlider();
    render();
  });

  // Ziehen im Diagramm: entweder einzelnen Messpunkt (vertikal) oder Temperatur-Ableselinie (horizontal)
  svg.addEventListener('pointerdown', e => {
    if (st.quiz) return;
    const X = Core.linScale(0, 600, PX0, PX1);
    const Y = Core.linScale(200, 1800, PY0, PY1);
    const hit = e.target.closest && e.target.closest('.pt-hit');
    if (hit) {
      const key = hit.getAttribute('data-key'), i = +hit.getAttribute('data-i'), j = +hit.getAttribute('data-j');
      st.T = TEMPS[i];
      syncSlider();
      SVG.startDrag(svg, e, p => {
        const v = Math.round(Math.min(1780, Math.max(220, Y.inv(p.y))) / 10) * 10;
        st.data[key][i][j] = v;
        if (st.data[key][i][0] > st.data[key][i][1]) st.data[key][i].sort((a, b) => a - b);
        render();
      });
      return;
    }
    const move = p => {
      st.T = Math.round(Math.min(600, Math.max(0, X.inv(p.x))) / 10) * 10;
      syncSlider();
      render();
    };
    move(SVG.toLocal(svg, e));
    SVG.startDrag(svg, e, move);
  });

  // ---------------------------------------------------------------- Übung
  function newQuiz() {
    const fRm = fnOf('Rm'), fRe = fnOf('Re');
    const types = ['rm', 're', 'diff', 'temp'];
    const kind = types[Math.floor(Math.random() * types.length)];
    let T = UI.rnd(50, 550, 50), truth, unit = 'N/mm²', tol = 40, text = '';
    if (kind === 'rm') {
      truth = fRm(T);
      text = `Lies die Zugfestigkeit <i>R</i><sub>m</sub> (×) bei <i>T</i> = ${T} °C ab (Toleranz ± ${tol} N/mm²).`;
    } else if (kind === 're') {
      truth = fRe(T);
      text = `Lies die Streckgrenze <i>R</i><sub>e</sub> (○) bei <i>T</i> = ${T} °C ab (Toleranz ± ${tol} N/mm²).`;
    } else if (kind === 'diff') {
      T = UI.rnd(0, 500, 100);
      truth = fRm(T) - fRe(T);
      tol = 50;
      text = `Wie groß ist der Festigkeitsabstand <i>R</i><sub>m</sub> − <i>R</i><sub>e</sub> bei <i>T</i> = ${T} °C (Toleranz ± ${tol} N/mm²)?`;
    } else {
      const target = UI.rnd(600, 1500, 100);
      truth = Core.invert(fRm, target, 0, 600);
      T = Math.round(truth);
      unit = '°C';
      tol = 22;
      text = `Bei welcher Temperatur <i>T</i> sinkt die Zugfestigkeit <i>R</i><sub>m</sub> auf ${target} N/mm² (Toleranz ± ${tol} °C)?`;
    }
    st.quiz = { kind, T, truth, tol, unit, done: false };
    $('m-task').innerHTML = text;
    $('m-ans-unit').textContent = unit;
    $('m-ans').value = '';
    $('m-ans-row').hidden = false;
    $('m-quiz-end').hidden = false;
    feedback('m-feedback', '');
    render();
    $('m-ans').focus();
  }

  function checkQuiz() {
    const q = st.quiz;
    if (!q || q.done) return;
    const a = Core.parseNum($('m-ans').value);
    if (!isFinite(a)) { feedback('m-feedback', 'Bitte eine Zahl eingeben.', false); return; }
    const ok = Math.abs(a - q.truth) <= q.tol + 1e-9;
    q.done = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    $('m-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
    feedback('m-feedback', `${ok ? 'Richtig' : 'Daneben'}: Ausgleichskurve liefert ${fmt(q.truth, 0)} ${q.unit}, eingegeben ${fmt(a, 0)} ${q.unit}.`, ok);
    $('m-ans-row').hidden = true;
    st.T = Math.round(q.T / 10) * 10;
    syncSlider();
    render();
  }

  function endQuiz() {
    st.quiz = null;
    $('m-task').textContent = '';
    $('m-ans-row').hidden = true;
    $('m-quiz-end').hidden = true;
    feedback('m-feedback', '');
    render();
  }

  seg('m-id', v => { st.idMode = v; render(); });
  seg('m-fit', v => { st.fit = v; render(); });
  chk('m-marks', v => { st.marks = v; render(); });
  chk('m-third', v => { st.third = v; render(); });
  chk('m-read', v => { st.showRead = v; render(); });
  $('m-quiz').addEventListener('click', newQuiz);
  $('m-quiz-end').addEventListener('click', endQuiz);
  $('m-check').addEventListener('click', checkQuiz);
  UI.onEnter('m-ans', checkQuiz);

  function reset() {
    Object.assign(st, {
      data: BOOK(), idMode: 'color', fit: 'smooth',
      marks: true, third: false, showRead: true, T: 300, pinRule: null
    });
    setSeg('m-id', 'color');
    setSeg('m-fit', 'smooth');
    $('m-marks').checked = true;
    $('m-third').checked = false;
    $('m-read').checked = true;
    syncSlider();
    renderRules();
    endQuiz();
  }

  UI.register('kennlinien', { render, reset, state: st, newQuiz });
  syncSlider();
  renderRules();
  render();
})();

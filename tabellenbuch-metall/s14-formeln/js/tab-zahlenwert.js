/* Reiter 2: Zahlenwertgleichung M = 9550 · P / n – vorgeschriebene Einheiten, Fehlerbild, M-n-Kennlinie, Herleitung, Übung */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback, frac, q, ln } = UI;
  const { fmt } = Core;
  const el = SVG.el;

  const W = 640, H = 440, PX0 = 96, PX1 = 590, PY0 = 370, PY1 = 40, NMAX = 3000;
  const BOOK = () => ({ goal: 'M', pUnit: 'kW', P: 15, n: 750, M: 191 });
  const st = Object.assign(BOOK(), { grid: false, quiz: null, score: [0, 0], lockDom: null });
  const svg = $('z-svg');
  const NORM_P = [0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55];

  const why = (txt, cls = '') => `<div class="why ${cls}">${txt}</div>`;
  const mTxt = v => fmt(v, v < 10 ? 2 : 1, { group: true });
  const pTxt = v => fmt(v, v < 10 ? 2 : 1, { group: true });
  const nTxt = v => fmt(v, 1, { group: true });
  const NM = 'N&#8239;·&#8239;m', PER_MIN = frac('1', 'min');

  function solve() {
    if (st.goal === 'M') st.M = Core.moment(st.P, st.n);
    else if (st.goal === 'P') st.P = Core.leistung(st.M, st.n);
    else st.n = Core.drehzahlAusMoment(st.P, st.M);
  }

  // ---------------------------------------------------------------- Rechengang
  function calcHtml() {
    const wrong = st.pUnit === 'W' && st.goal !== 'P';
    const pVal = wrong ? st.P * 1000 : st.P;
    const out = [];
    if (st.goal === 'M') {
      const M = Core.moment(pVal, st.n);
      out.push(ln('<i>M</i>', frac('9550 · <i>P</i>', '<i>n</i>')));
      out.push(ln('', `${frac(`9550 · ${pTxt(pVal)}`, nTxt(st.n))}&#8239;${NM}`));
      out.push(ln('', `<span class="res${wrong ? ' bad' : ''}">${mTxt(M)}&#8239;${NM}</span>`));
    } else if (st.goal === 'P') {
      out.push(ln('<i>P</i>', frac('<i>M</i> · <i>n</i>', '9550')));
      out.push(ln('', `${frac(`${mTxt(st.M)} · ${nTxt(st.n)}`, '9550')}&#8239;kW`));
      out.push(ln('', `<span class="res">${pTxt(st.P)}&#8239;kW</span>`));
    } else {
      const n = Core.drehzahlAusMoment(pVal, st.M);
      out.push(ln('<i>n</i>', frac('9550 · <i>P</i>', '<i>M</i>')));
      out.push(ln('', `${frac(`9550 · ${pTxt(pVal)}`, mTxt(st.M))}&#8239;${PER_MIN}`));
      out.push(ln('', `<span class="res${wrong ? ' bad' : ''}">${nTxt(n)}&#8239;${PER_MIN}</span>`));
    }
    if (wrong) out.push(why(`Falsch: <i>P</i> wurde in W eingesetzt (${pTxt(st.P * 1000)} W). Vorgeschrieben ist kW: ${pTxt(st.P * 1000)} W = ${pTxt(st.P)} kW. Das Ergebnis ist 1000-fach zu groß.`, 'bad'));
    else out.push(why('Zahlenwerte in den vorgeschriebenen Einheiten einsetzen; die Einheit des Ergebnisses ist vorgegeben.'));
    return out.join('');
  }

  function formulaHtml() {
    if (st.goal === 'M') return `<i>M</i> = ${frac('9550 · <i>P</i>', '<i>n</i>')}`;
    if (st.goal === 'P') return `<i>P</i> = ${frac('<i>M</i> · <i>n</i>', '9550')}`;
    return `<i>n</i> = ${frac('9550 · <i>P</i>', '<i>M</i>')}`;
  }

  function deriveHtml() {
    return ln('<i>M</i>', frac('<i>P</i>', '2π · <i>n</i>'))
      + ln('', frac(`<i>P</i> · ${frac('1000&#8239;W', '1&#8239;kW')}`, `2π · <i>n</i> · ${frac('1&#8239;min', '60&#8239;s')}`))
      + ln('', `${frac('1000 · 60', '2π')} · ${frac('<i>P</i>', '<i>n</i>')}&#8239;W&#8239;·&#8239;s`)
      + ln('', `<span class="res">${fmt(Core.K_EXAKT, 1)}</span> · ${frac('<i>P</i>', '<i>n</i>')}&#8239;${NM}`);
  }

  // ---------------------------------------------------------------- Diagramm M über n bei P = konstant
  function domain() {
    if (st.lockDom) return st.lockDom;
    const raw = Math.max(2.2 * st.M, Core.moment(st.P, NMAX) * 1.5, 5);
    const step = Core.niceStep(raw, 6);
    return { M1: Core.niceUp(raw, step), ms: step };
  }

  function render() {
    const Dm = domain();
    const X = Core.linScale(0, NMAX, PX0, PX1), Y = Core.linScale(0, Dm.M1, PY0, PY1);
    SVG.clear(svg);
    SVG.background(svg, W, H);

    const nTicks = Core.ticks(0, NMAX, 500), mTicks = Core.ticks(0, Dm.M1, Dm.ms);
    if (st.grid) {
      const g = el(svg, 'g', { class: 'grid', 'stroke-width': 0.5, opacity: 0.45 });
      nTicks.forEach(v => el(g, 'line', { x1: X(v), y1: PY0, x2: X(v), y2: PY1 }));
      mTicks.forEach(v => el(g, 'line', { x1: PX0, y1: Y(v), x2: PX1, y2: Y(v) }));
    }
    el(svg, 'line', { x1: PX0, y1: PY0, x2: PX1 + 10, y2: PY0, class: 'ax', 'stroke-width': 1.2 });
    el(svg, 'line', { x1: PX0, y1: PY0, x2: PX0, y2: PY1 - 10, class: 'ax', 'stroke-width': 1.2 });
    const dm = Core.decimalsFor(Dm.ms);
    nTicks.forEach((v, i) => {
      el(svg, 'line', { x1: X(v), y1: PY0, x2: X(v), y2: PY0 - 6, class: 'tick' });
      if (i === nTicks.length - 1) SVG.text(svg, (X(v) + X(nTicks[i - 1])) / 2, PY0 + 22, '1/min', { 'text-anchor': 'middle', 'font-size': 14 });
      SVG.text(svg, X(v), PY0 + 22, fmt(v, 0), { 'text-anchor': 'middle', 'font-size': 14 });
    });
    mTicks.forEach((v, i) => {
      el(svg, 'line', { x1: PX0, y1: Y(v), x2: PX0 + 6, y2: Y(v), class: 'tick' });
      if (i === mTicks.length - 1) SVG.text(svg, PX0 - 9, (Y(v) + Y(mTicks[i - 1])) / 2 + 5, 'N · m', { 'text-anchor': 'end', 'font-size': 14 });
      SVG.text(svg, PX0 - 9, Y(v) + 5, Core.tickLabel(v, dm, { group: true }), { 'text-anchor': 'end', 'font-size': 14 });
    });
    const xm = (PX0 + PX1) / 2, ym = (PY0 + PY1) / 2;
    SVG.text(svg, xm + 10, PY0 + 54, 'Drehzahl *n*', { 'text-anchor': 'end', 'font-size': 15 });
    SVG.arrow(svg, xm + 20, PY0 + 49, xm + 80, PY0 + 49, { w: 1.1, l: 10, b: 3.5 });
    SVG.text(svg, 30, ym + 64, 'Drehmoment *M*', { 'font-size': 15, transform: `rotate(-90 30 ${ym + 64})` });
    SVG.arrow(svg, 25, ym - 74, 25, ym - 134, { w: 1.1, l: 10, b: 3.5 });

    // Hyperbel M = 9550 · P / n, beginnt dort, wo sie den oberen Rand verlässt
    const n0 = Math.max(Core.drehzahlAusMoment(st.P, Dm.M1), 1);
    el(svg, 'path', { d: SVG.plotFn(n => Core.moment(st.P, n), n0, NMAX, X, Y, 200), class: 'curve', 'stroke-width': 2.4 });
    const nl = NMAX * 0.93, Ml = Core.moment(st.P, nl);
    SVG.text(svg, X(nl), Y(Ml) - 12, `*P* = ${pTxt(st.P)} kW`, { 'text-anchor': 'end', 'font-size': 15, class: 'lbl-accent halo' });

    // Betriebspunkt A mit Ablesung
    if (isFinite(st.n) && isFinite(st.M) && st.n <= NMAX && st.M <= Dm.M1) {
      const ax = X(st.n), ay = Y(st.M);
      el(svg, 'line', { x1: ax, y1: PY0, x2: ax, y2: ay, class: 'read' });
      el(svg, 'line', { x1: PX0, y1: ay, x2: ax, y2: ay, class: 'read' });
      el(svg, 'circle', { cx: ax, cy: ay, r: 5, class: 'pt sel' });
      SVG.text(svg, ax + 9, ay - 9, 'A', { 'font-size': 16, class: 'halo lbl-strong' });
    }
    const bx = PX1 - 186, by = PY1 + 4;
    el(svg, 'rect', { x: bx, y: by, width: 186, height: 70, rx: 6, class: 'legend-box' });
    SVG.text(svg, bx + 10, by + 20, 'Betriebspunkt A', { 'font-size': 13.5, class: 'lbl-strong' });
    SVG.text(svg, bx + 10, by + 40, `*n* = ${nTxt(st.n)} 1/min`, { 'font-size': 13.5 });
    SVG.text(svg, bx + 10, by + 60, `*M* = ${mTxt(st.M)} N · m`, { 'font-size': 13.5 });

    $('z-formula').innerHTML = formulaHtml();
    $('z-flabel').textContent = st.goal === 'M' ? 'Zahlenwertgleichung für das Drehmoment' : `Nach ${st.goal} umgestellt`;
    $('z-calc').innerHTML = calcHtml();
    const kv = [];
    if (st.goal === 'M') kv.push(['exakt mit 60 000/(2π)', fmt(Core.moment(st.P, st.n, Core.K_EXAKT), 3, { group: true }) + ' N · m']);
    if (st.goal === 'P') kv.push(['exakt mit 60 000/(2π)', fmt(Core.leistung(st.M, st.n, Core.K_EXAKT), 3) + ' kW']);
    if (st.goal === 'n') kv.push(['exakt mit 60 000/(2π)', nTxt(Core.drehzahlAusMoment(st.P, st.M, Core.K_EXAKT)) + ' 1/min']);
    kv.push(['Abweichung durch 9550', fmt((Core.K_BUCH / Core.K_EXAKT - 1) * 100, 4, { sign: true }) + ' %']);
    $('z-details').innerHTML = kv.map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    const isBook = st.goal === 'M' && st.pUnit === 'kW' && st.P === 15 && st.n === 750;
    $('z-book').innerHTML = isBook
      ? 'Buchbeispiel: Elektromotor mit <i>P</i> = 15 kW und <i>n</i> = 750/min, <i>M</i> = 191 N · m.'
      : 'Eigene Werte. „Buchwerte laden“ stellt das Beispiel der Seite wieder her.';
    $('z-note').innerHTML = 'Bei gleicher Leistung fällt das Drehmoment mit steigender Drehzahl: <i>M</i> · <i>n</i> = 9550 · <i>P</i> bleibt konstant (Hyperbel). '
      + (st.goal === 'P' ? 'Ziehen im Diagramm verschiebt den Betriebspunkt frei; die Hyperbel folgt der neuen Leistung.' : st.goal === 'M' ? 'Ziehen im Diagramm ändert die Drehzahl.' : 'Ziehen im Diagramm ändert das Drehmoment.');
  }

  // ---------------------------------------------------------------- Regler und Ziehen
  function syncSliders() {
    $('z-row-P').hidden = st.goal === 'P';
    $('z-row-n').hidden = st.goal === 'n';
    $('z-row-M').hidden = st.goal === 'M';
    $('z-punit').style.visibility = st.goal === 'P' ? 'hidden' : '';
    UI.slider('z-P', st.P); UI.slider('z-n', st.n); UI.slider('z-M', st.M);
    $('z-P-out').textContent = `${pTxt(st.P)} kW`;
    $('z-n-out').textContent = `${nTxt(st.n)} 1/min`;
    $('z-M-out').textContent = `${mTxt(st.M)} N·m`;
  }
  function update() { solve(); syncSliders(); render(); }

  $('z-P').addEventListener('input', e => { st.P = +e.target.value; update(); });
  $('z-n').addEventListener('input', e => { st.n = +e.target.value; update(); });
  $('z-M').addEventListener('input', e => { st.M = +e.target.value; update(); });
  seg('z-goal', v => { st.goal = v; update(); });
  seg('z-punit', v => { st.pUnit = v; render(); });
  chk('z-grid', v => { st.grid = v; render(); });

  svg.addEventListener('pointerdown', e => {
    const Dm = domain();
    st.lockDom = Dm;
    const X = Core.linScale(0, NMAX, PX0, PX1), Y = Core.linScale(0, Dm.M1, PY0, PY1);
    const move = p => {
      const n = Math.min(NMAX, Math.max(50, Math.round(X.inv(p.x) / 10) * 10));
      const M = Math.min(Dm.M1, Math.max(1, Math.round(Y.inv(p.y))));
      if (st.goal === 'M') st.n = n;
      else if (st.goal === 'P') { st.n = n; st.M = M; }
      else st.M = Math.max(M, Math.ceil(Core.moment(st.P, NMAX)));
      update();
    };
    move(SVG.toLocal(svg, e));
    SVG.startDrag(svg, e, move, () => { st.lockDom = null; render(); });
  });

  // ---------------------------------------------------------------- Übung
  function newQuiz() {
    const t = UI.pick(['M', 'M', 'P', 'n']);
    let z;
    if (t === 'M') {
      const P = UI.pick(NORM_P), n = UI.rnd(100, 3000, 10), inW = Math.random() < 0.35;
      z = { t, P, n, inW, truth: Core.moment(P, n), unit: 'N · m', dec: 1,
        text: `Ein Motor gibt bei <i>n</i> = ${n}/min die Leistung <i>P</i> = ${inW ? fmt(P * 1000, 0, { group: true }) + ' W' : pTxt(P) + ' kW'} ab. Wie groß ist das Drehmoment <i>M</i> in N · m?` };
    } else if (t === 'P') {
      const M = UI.rnd(20, 900, 5), n = UI.rnd(60, 1500, 10);
      z = { t, M, n, truth: Core.leistung(M, n), unit: 'kW', dec: 2,
        text: `An einer Welle werden <i>M</i> = ${M} N · m bei <i>n</i> = ${n}/min gemessen. Welche Leistung <i>P</i> in kW wird übertragen?` };
    } else {
      let P, M, n;
      do { P = UI.pick(NORM_P); M = UI.rnd(10, 400, 5); n = Core.drehzahlAusMoment(P, M); } while (n < 100 || n > 6000);
      z = { t, P, M, truth: n, unit: '1/min', dec: 0,
        text: `Ein Antrieb mit <i>P</i> = ${pTxt(P)} kW soll das Drehmoment <i>M</i> = ${M} N · m liefern. Bei welcher Drehzahl <i>n</i> in 1/min ist das der Fall?` };
    }
    st.quiz = z;
    $('z-task').innerHTML = z.text + ' (Toleranz ± 1 %)';
    $('z-ans-unit').textContent = z.unit;
    $('z-ans').value = '';
    $('z-ans-row').hidden = false;
    feedback('z-feedback', '');
    $('z-ans').focus();
  }

  function solution(z) {
    const T = fmt(z.truth, z.dec + 1, { group: true });
    if (z.t === 'M') {
      const conv = z.inW ? why(`Erst umrechnen: ${fmt(z.P * 1000, 0, { group: true })} W = ${pTxt(z.P)} kW`) : '';
      return conv + ln('<i>M</i>', `${frac(`9550 · ${pTxt(z.P)}`, z.n)}&#8239;${NM}`) + ln('', `<b>${T}&#8239;${NM}</b>`);
    }
    if (z.t === 'P') return ln('<i>P</i>', `${frac(`${z.M} · ${z.n}`, '9550')}&#8239;kW`) + ln('', `<b>${T}&#8239;kW</b>`);
    return ln('<i>n</i>', `${frac(`9550 · ${pTxt(z.P)}`, z.M)}&#8239;${PER_MIN}`) + ln('', `<b>${T}&#8239;${PER_MIN}</b>`);
  }

  function checkQuiz() {
    const z = st.quiz;
    if (!z) return;
    const a = Core.parseNum($('z-ans').value);
    if (!isFinite(a)) { feedback('z-feedback', 'Bitte eine Zahl eingeben.', false); return; }
    const ok = Math.abs(a - z.truth) <= 0.01 * z.truth;
    const off1000 = !ok && Math.abs(a / (z.truth * 1000) - 1) < 0.01;
    st.score[1]++;
    if (ok) st.score[0]++;
    $('z-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
    const head = ok ? 'Richtig.' : off1000 ? 'Um den Faktor 1000 zu groß: Die Leistung muss in kW eingesetzt werden.' : `Nicht richtig, eingegeben ${fmt(a, 2, { group: true })} ${z.unit}.`;
    feedback('z-feedback', `${head}<div class="calc">${solution(z)}</div>`, ok);
    $('z-ans-row').hidden = true;
    st.quiz = null;
  }

  $('z-quiz').addEventListener('click', newQuiz);
  $('z-check').addEventListener('click', checkQuiz);
  UI.onEnter('z-ans', checkQuiz);

  function reset() {
    Object.assign(st, BOOK(), { grid: false, lockDom: null, quiz: null });
    setSeg('z-goal', st.goal); setSeg('z-punit', st.pUnit);
    $('z-grid').checked = false;
    $('z-task').textContent = '';
    $('z-ans-row').hidden = true;
    feedback('z-feedback', '');
    solve();
    syncSliders();
  }

  $('z-derive').innerHTML = deriveHtml();
  UI.register('zahlenwert', { render, reset, state: st });
  solve();
  syncSliders();
})();

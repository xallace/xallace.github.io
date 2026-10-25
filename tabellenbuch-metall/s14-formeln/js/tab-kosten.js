/* Reiter 4: Kostenfunktion, Erlösfunktion, Gewinnschwelle – Diagramm wie im Buch, Wertetabelle, Übung */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback, frac, ln } = UI;
  const { fmt } = Core;
  const el = SVG.el;

  const W = 640, H = 460, PX0 = 112, PX1 = 596, PY0 = 382, PY1 = 40;
  // Buchbeispiel: KG = 60 €/Stck · M + 200 000 €, E = 110 €/Stck · M; die übrigen Szenarien sind frei gewählt.
  // Bereiche der Regler je Szenario: [min, max, step]
  const PRESETS = {
    buch:   { Kf: 200000, Kv: 60, e: 110, M: 6000, kf: [0, 500000, 10000], kv: [0, 200, 1], ee: [1, 300, 1], m: [0, 8000, 100] },
    welle:  { Kf: 15000, Kv: 25, e: 65, M: 500, kf: [0, 50000, 500], kv: [0, 100, 1], ee: [1, 150, 1], m: [0, 1000, 10] },
    spritz: { Kf: 85000, Kv: 1.8, e: 4.5, M: 40000, kf: [0, 200000, 1000], kv: [0, 10, 0.05], ee: [0.1, 15, 0.05], m: [0, 80000, 500] },
    stanz:  { Kf: 45000, Kv: 0.75, e: 1.65, M: 75000, kf: [0, 100000, 1000], kv: [0, 3, 0.01], ee: [0.05, 5, 0.01], m: [0, 150000, 1000] },
  };
  const BOOK = () => ({ preset: 'buch', Kf: 200000, Kv: 60, e: 110, M: 6000 });
  const st = Object.assign(BOOK(), { areas: true, grid: false, hl: null, pinned: null, quiz: null, score: [0, 0], lockDom: null });
  const svg = $('k-svg');

  const eur = v => fmt(v, 0, { group: true }) + ' €';
  const eurS = v => fmt(v, 0, { group: true, sign: true }) + ' €';
  const pc = v => fmt(v, 2, { group: true });           // € je Stück
  const stk = v => fmt(v, 0, { group: true });
  const KG = '<i>K</i><sub>G</sub>', KF = '<i>K</i><sub>f</sub>', KV = '<i>K</i><sub>v</sub>';
  const gs = () => Core.gewinnschwelle(st.Kf, st.Kv, st.e);
  const isBook = () => st.Kf === 200000 && st.Kv === 60 && st.e === 110 && st.M === 6000;

  function domain() {
    if (st.lockDom) return st.lockDom;
    const M1 = PRESETS[st.preset].m[1];
    const raw = Math.max(Core.kosten(st.Kf, st.Kv, M1), Core.erloes(st.e, M1), 1);
    const ys = Core.niceStep(raw, 5), xs = Core.niceStep(M1, 4);
    return { M1, xs, Y1: Core.niceUp(raw, ys), ys };
  }

  function render() {
    const D = domain();
    const X = Core.linScale(0, D.M1, PX0, PX1), Y = Core.linScale(0, D.Y1, PY0, PY1);
    const kg = m => Core.kosten(st.Kf, st.Kv, m), er = m => Core.erloes(st.e, m);
    const g = gs(), gsIn = isFinite(g) && g > 0 && g <= D.M1;
    const hl = st.hl;
    SVG.clear(svg);
    SVG.background(svg, W, H);

    // Netzlinien, Achsen, Teilung
    const xt = Core.ticks(0, D.M1, D.xs), yt = Core.ticks(0, D.Y1, D.ys);
    if (st.grid) {
      const gg = el(svg, 'g', { class: 'grid', 'stroke-width': 0.5, opacity: 0.45 });
      xt.forEach(v => el(gg, 'line', { x1: X(v), y1: PY0, x2: X(v), y2: PY1 }));
      yt.forEach(v => el(gg, 'line', { x1: PX0, y1: Y(v), x2: PX1, y2: Y(v) }));
    }
    if (hl === 'm') el(svg, 'line', { x1: PX0, y1: PY0, x2: PX1, y2: PY0, class: 'hl-glow' });
    el(svg, 'line', { x1: PX0, y1: PY0, x2: PX1 + 10, y2: PY0, class: 'ax', 'stroke-width': 1.2 });
    el(svg, 'line', { x1: PX0, y1: PY0, x2: PX0, y2: PY1 - 10, class: 'ax', 'stroke-width': 1.2 });
    xt.forEach((v, i) => {
      el(svg, 'line', { x1: X(v), y1: PY0, x2: X(v), y2: PY0 - 6, class: 'tick' });
      SVG.text(svg, X(v), PY0 + 22, fmt(v, 0, { group: true }), { 'text-anchor': 'middle', 'font-size': 14 });
      if (i === xt.length - 2) SVG.text(svg, (X(v) + X(xt[i + 1])) / 2, PY0 + 22, 'Stück', { 'text-anchor': 'middle', 'font-size': 13 });
    });
    yt.forEach((v, i) => {
      el(svg, 'line', { x1: PX0, y1: Y(v), x2: PX0 + 6, y2: Y(v), class: 'tick' });
      SVG.text(svg, PX0 - 9, Y(v) + 5, fmt(v, 0, { group: true }), { 'text-anchor': 'end', 'font-size': 14 });
      if (i === yt.length - 2) SVG.text(svg, PX0 - 9, (Y(v) + Y(yt[i + 1])) / 2 + 5, '€', { 'text-anchor': 'end', 'font-size': 14 });
    });
    const xm = (PX0 + PX1) / 2, ym = (PY0 + PY1) / 2;
    SVG.text(svg, xm + 10, PY0 + 54, 'Menge *M*', { 'text-anchor': 'end', 'font-size': 15, class: hl === 'm' ? 'hl-text' : null });
    SVG.arrow(svg, xm + 20, PY0 + 49, xm + 80, PY0 + 49, { w: 1.1, l: 10, b: 3.5 });
    SVG.text(svg, 26, ym + 78, 'Kosten bzw. Erlös', { 'font-size': 15, transform: `rotate(-90 26 ${ym + 78})` });
    SVG.arrow(svg, 21, ym - 88, 21, ym - 148, { w: 1.1, l: 10, b: 3.5 });

    // Verlust- und Gewinnfläche zwischen den Geraden
    const poly = (m0, m1) => [[m0, kg(m0)], [m1, kg(m1)], [m1, er(m1)], [m0, er(m0)]].map(([m, v]) => `${X(m).toFixed(1)},${Y(Math.min(v, D.Y1)).toFixed(1)}`).join(' ');
    if (st.areas) {
      const mLoss = gsIn ? g : D.M1;
      if (!isFinite(g) || g > 0) el(svg, 'polygon', { points: poly(0, Math.min(mLoss, D.M1)), class: 'area-loss' });
      if (gsIn) el(svg, 'polygon', { points: poly(g, D.M1), class: 'area-gain' });
    }

    // Fixe Kosten als waagrechte Linie
    if (hl === 'kf') el(svg, 'line', { x1: X(0), y1: Y(st.Kf), x2: X(D.M1), y2: Y(st.Kf), class: 'hl-glow' });
    el(svg, 'line', { x1: X(0), y1: Y(st.Kf), x2: X(D.M1), y2: Y(st.Kf), class: 'fix' });

    // Geraden: Gesamtkosten durchgezogen, Erlös gestrichelt (wie im Buch)
    const line = (f, cls) => el(svg, 'path', { d: SVG.plotFn(f, 0, Math.min(D.M1, f === kg ? (D.Y1 - st.Kf) / Math.max(st.Kv, 1e-9) : D.Y1 / Math.max(st.e, 1e-9)), X, Y, 2), class: cls, 'stroke-width': 2.6 });
    if (hl === 'kg' || hl === 'kv') line(kg, 'hl-glow');
    if (hl === 'e') line(er, 'hl-glow');
    line(kg, 'curve');
    line(er, 'curve dash');
    if (hl === 'kf') el(svg, 'circle', { cx: X(0), cy: Y(st.Kf), r: 6, class: 'pt sel' });

    // Gewinnschwelle mit Ablesung
    if (gsIn) {
      const gx = X(g), gy = Y(er(g));
      el(svg, 'line', { x1: gx, y1: PY0, x2: gx, y2: gy, class: 'read' });
      el(svg, 'line', { x1: PX0, y1: gy, x2: gx, y2: gy, class: 'read' });
      el(svg, 'circle', { cx: gx, cy: gy, r: 5, class: 'pt sel' });
    }

    // Gewählte Menge M; die Beschriftungen liegen darüber und weichen der Linie aus
    const mx = X(st.M);
    el(svg, 'line', { x1: mx, y1: PY0, x2: mx, y2: PY1 + 22, class: 'm-mark' + (hl === 'm' ? ' hl' : '') });
    [kg(st.M), er(st.M)].forEach(v => { if (v <= D.Y1) el(svg, 'circle', { cx: mx, cy: Y(v), r: 4, class: 'pt' }); });

    // Beschriftungen: belegte Flächen [x0, y0, x1, y1, Gewicht]; Linien als schmale Streifen (1), gesetzte Beschriftungen (10)
    const taken = [[mx - 3, PY1, mx + 3, PY0, 1], [PX0, Y(st.Kf) - 3, PX1, Y(st.Kf) + 3, 1]];
    if (gsIn) taken.push([X(g) - 3, Y(er(g)), X(g) + 3, PY0, 1], [PX0, Y(er(g)) - 3, X(g), Y(er(g)) + 3, 1]);
    const boxOf = ([x, y, a, w]) => { const x0 = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x; return [x0, y - 14, x0 + w, y + 4]; };
    const crosses = (f, b) => {                         // schneidet die Gerade f die Fläche b?
      const ya = Y(f(X.inv(b[0]))), yb = Y(f(X.inv(b[2])));
      return Math.max(ya, yb) >= b[1] && Math.min(ya, yb) <= b[3];
    };
    const cost = b => (b[0] < PX0 + 2 || b[2] > W - 2 || b[1] < 2 ? 100 : 0) + 3 * crosses(kg, b) + 3 * crosses(er, b)
      + taken.reduce((s, o) => s + (b[2] < o[0] || b[0] > o[2] || b[3] < o[1] || b[1] > o[3] ? 0 : o[4]), 0);
    // Lagen [x, y, Ausrichtung, Breite, Zuschlag]; gesetzt wird die erste mit den wenigsten Überdeckungen
    const put = (cands, txt, attrs) => {
      let best = null, bc = Infinity;
      for (const k of cands) { const c = cost(boxOf(k)) + (k[4] || 0); if (c < bc) { best = k; bc = c; } }
      if (!best) return;
      SVG.text(svg, best[0], best[1], txt, Object.assign({ 'text-anchor': best[2] }, attrs));
      taken.push(boxOf(best).concat(10));
    };
    // Lage am rechten Ende der Geraden f: darüber am höchsten, darunter am tiefsten Punkt der Textbreite w ausgerichtet
    const atEnd = (f, w, above) => [PX1 - 4, above ? Y(f(D.M1)) - 10 : Y(f(X.inv(PX1 - 4 - w))) + 18, 'end', w];
    const fr = [0.74, 0.9, 0.6, 0.3, 0.15].map(f => f * D.M1);

    const mLbl = [mx + (st.M > D.M1 * 0.6 ? -6 : 6), PY1 + 16, st.M > D.M1 * 0.6 ? 'end' : 'start', 80];
    put([mLbl], `*M* = ${stk(st.M)}`, { 'font-size': 13.5, class: 'halo lbl-strong' });
    if (gsIn) {
      const gx = X(g), gy = Y(er(g));
      put([[gx - 10, gy - 14, 'end', 145], [gx + 10, gy + 24, 'start', 145, 1.5]], 'Gewinnschwelle (Gs)', { 'font-size': 14, class: 'halo lbl-strong' });
    }

    // Erlös am Ende seiner Geraden, Gesamtkosten links über der Kostengeraden oder am Ende
    const kEnd = kg(D.M1), eEnd = er(D.M1), eAbove = eEnd >= kEnd;
    if (eEnd <= D.Y1) put([atEnd(er, 40, eAbove)], 'Erlös', { 'font-size': 14, class: 'lbl-accent halo' });
    const kgC = [10, 40, 70].map(dx => {
      const s = PX0 + dx, r = X.inv(s + 100), y = Y(Math.min(kg(r), D.Y1)) - 9;
      return y - 14 > PY1 && Y(er(r)) > y + 4 ? [s, y, 'start', 100] : null;   // die Erlösgerade bleibt darunter
    }).filter(Boolean);
    if (kEnd <= D.Y1) kgC.push(atEnd(kg, 100, !eAbove));
    put(kgC, 'Gesamtkosten', { 'font-size': 14, class: 'lbl-accent halo' });
    // Fixe und variable Kosten
    if (PY0 - Y(st.Kf) > 22) put(fr.map(m => [X(m), Y(st.Kf) + 18, 'middle', 80]), 'fixe Kosten', { 'font-size': 13.5, class: 'halo ' + (hl === 'kf' ? 'hl-text' : 'lbl-muted') });
    put(fr.filter(m => Y(st.Kf) - Y(Math.min(kg(m), D.Y1)) > 30).map(m => [X(m), (Y(st.Kf) + Y(Math.min(kg(m), D.Y1))) / 2 + 5, 'middle', 108]),
      'variable Kosten', { 'font-size': 13.5, class: 'halo ' + (hl === 'kv' ? 'hl-text' : 'lbl-muted') });

    // Verlust und Gewinn zwischen den Geraden
    if (gsIn && st.areas) {
      const inGap = ms => ms.filter(m => Math.abs(Y(er(m)) - Y(kg(m))) > 26 && Math.max(er(m), kg(m)) <= D.Y1)
        .map(m => [X(m), (Y(er(m)) + Y(kg(m))) / 2 + 5, 'middle', 54]);
      // im Verlustdreieck auch zwischen Erlös und fixen Kosten bzw. zwischen fixen Kosten und Gesamtkosten
      const lossC = [0.45, 0.3, 0.2, 0.12, 0.65].map(f => f * g).flatMap(m => [[er(m), Math.min(kg(m), st.Kf)], [Math.max(er(m), st.Kf), kg(m)]]
        .filter(([a, b]) => Y(a) - Y(b) > 24).map(([a, b]) => [X(m), (Y(a) + Y(b)) / 2 + 5, 'middle', 54]));
      put(inGap([0.45, 0.3, 0.65, 0.2, 0.8].map(f => f * g)).concat(lossC), 'Verlust', { 'font-size': 14, class: 'lbl-bad halo' });
      put(inGap([0.72, 0.55, 0.88, 0.4, 0.3].map(f => g + f * (D.M1 - g))), 'Gewinn', { 'font-size': 14, class: 'lbl-ok halo' });
    }
    updateSide(g);
  }

  function updateSide(g) {
    const M = st.M;
    const cols = [0, isFinite(g) ? g : NaN, M];
    const row = (name, f, cls) => `<tr><th>${name}</th>${cols.map(m => {
      if (!isFinite(m)) return '<td>–</td>';
      const v = f(m), c = cls ? cls(v) : '';
      return `<td${c ? ` class="${c}"` : ''}>${v === null ? '–' : typeof v === 'number' ? fmt(v, 0, { group: true }) : v}</td>`;
    }).join('')}</tr>`;
    $('k-table').innerHTML = row('<i>M</i>', m => m)
      + row(KG, m => Core.kosten(st.Kf, st.Kv, m))
      + row('<i>E</i>', m => Core.erloes(st.e, m))
      + row(`<i>E</i> − ${KG}`, m => fmt(Math.round(Core.gewinn(st.Kf, st.Kv, st.e, m)), 0, { group: true, sign: true }),
        v => (/^\+/.test(v) ? 'gain' : /^−/.test(v) ? 'loss' : ''));

    const db = st.e - st.Kv;
    if (isFinite(g)) {
      $('k-calc').innerHTML = ln(KG, '<i>E</i>')
        + ln('<i>M</i><sub>Gs</sub>', frac(KF, `<i>E</i>/Stück − ${KV}`))
        + ln('', frac(eur(st.Kf), `${pc(st.e)} €/Stück − ${pc(st.Kv)} €/Stück`))
        + ln('', `<span class="res">${stk(Math.round(g * 100) / 100)} Stück</span>`);
    } else {
      $('k-calc').innerHTML = `<div class="why bad">Der Erlös je Stück (${pc(st.e)} €) liegt nicht über den variablen Kosten (${pc(st.Kv)} €): Jedes weitere Stück vergrößert den Verlust, eine Gewinnschwelle gibt es nicht.</div>`;
    }
    const G = Core.gewinn(st.Kf, st.Kv, st.e, M);
    $('k-details').innerHTML = [
      ['Deckungsbeitrag je Stück', pc(db) + ' €'],
      ['Kosten = Erlös an der Gs', isFinite(g) ? eur(Core.erloes(st.e, g)) : '–'],
      [`${G >= 0 ? 'Gewinn' : 'Verlust'} bei <i>M</i> = ${stk(M)}`, eurS(G)],
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    $('k-book').innerHTML = isBook()
      ? 'Buchbeispiel: <i>K</i><sub>G</sub> = 60 €/Stck · <i>M</i> + 200 000 €, <i>E</i> = 110 €/Stck · <i>M</i>; Gewinnschwelle bei 4000 Stück, Wertetabelle für <i>M</i> = 0, 4000 und 6000.'
      : st.preset === 'buch' ? 'Eigene Werte. „Buchwerte laden“ stellt das Beispiel der Seite wieder her.' : 'Frei gewähltes Zahlenbeispiel, nicht aus dem Buch.';
    $('k-note').innerHTML = `Steigung der Kostengeraden = variable Kosten ${KV} = ${pc(st.Kv)} €/Stück, Steigung der Erlösgeraden = ${pc(st.e)} €/Stück, Achsenabschnitt der Kostengeraden = fixe Kosten ${KF} = ${eur(st.Kf)}.`;
  }

  // ---------------------------------------------------------------- Regler
  function setRange(id, [min, max, step], v) {
    const r = $(id);
    Object.assign(r, { min, max, step });
    r.value = v;
  }
  function syncSliders() {
    const p = PRESETS[st.preset];
    setRange('k-kf', p.kf, st.Kf); setRange('k-kv', p.kv, st.Kv); setRange('k-e', p.ee, st.e); setRange('k-m', p.m, st.M);
    $('k-kf-out').textContent = eur(st.Kf);
    $('k-kv-out').textContent = pc(st.Kv) + ' €/Stück';
    $('k-e-out').textContent = pc(st.e) + ' €/Stück';
    $('k-m-out').textContent = stk(st.M) + ' Stück';
  }
  const num = v => +(+v).toFixed(4);
  $('k-kf').addEventListener('input', e => { st.Kf = num(e.target.value); syncSliders(); render(); });
  $('k-kv').addEventListener('input', e => { st.Kv = num(e.target.value); syncSliders(); render(); });
  $('k-e').addEventListener('input', e => { st.e = num(e.target.value); syncSliders(); render(); });
  $('k-m').addEventListener('input', e => { st.M = num(e.target.value); syncSliders(); render(); });
  seg('k-preset', v => {
    const p = PRESETS[v];
    Object.assign(st, { preset: v, Kf: p.Kf, Kv: p.Kv, e: p.e, M: p.M });
    syncSliders();
    render();
  });
  chk('k-areas', v => { st.areas = v; render(); });
  chk('k-grid', v => { st.grid = v; render(); });

  svg.addEventListener('pointerdown', e => {
    const D = domain();
    st.lockDom = D;
    const X = Core.linScale(0, D.M1, PX0, PX1), step = PRESETS[st.preset].m[2];
    const move = p => { st.M = Math.min(D.M1, Math.max(0, Math.round(X.inv(p.x) / step) * step)); syncSliders(); render(); };
    move(SVG.toLocal(svg, e));
    SVG.startDrag(svg, e, move, () => { st.lockDom = null; render(); });
  });

  // Variablen der Buchlegende: Zeigen hebt das Element im Diagramm hervor, Antippen hält es fest
  const vars = $('k-vars');
  function showHl(k) {
    st.hl = k || null;
    for (const li of vars.children) li.classList.toggle('active', li.dataset.key === st.pinned);
    render();
  }
  vars.addEventListener('mouseover', e => { const li = e.target.closest('li'); if (li && li.dataset.key !== st.hl) showHl(li.dataset.key); });
  vars.addEventListener('mouseleave', () => showHl(st.pinned));
  vars.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    st.pinned = st.pinned === li.dataset.key ? null : li.dataset.key;
    showHl(st.pinned);
  });

  // ---------------------------------------------------------------- Übung
  function newQuiz() {
    const db = UI.pick([20, 25, 30, 40, 50, 60, 75]), G0 = UI.rnd(200, 3000, 50), Kv = UI.rnd(10, 80, 5);
    const z = { t: UI.pick(['gs', 'g']), Kf: db * G0, Kv, e: Kv + db, gs: G0 };
    const given = `Fixe Kosten <i>K</i><sub>f</sub> = ${eur(z.Kf)}, variable Kosten <i>K</i><sub>v</sub> = ${z.Kv} €/Stück, Erlös ${z.e} €/Stück.`;
    if (z.t === 'gs') {
      Object.assign(z, { truth: G0, unit: 'Stück', text: `${given} Bei welcher Menge liegt die Gewinnschwelle?` });
    } else {
      let M;
      do M = UI.rnd(100, 4000, 50); while (M === G0);
      Object.assign(z, { M, truth: Core.gewinn(z.Kf, z.Kv, z.e, M), unit: '€', text: `${given} Wie groß ist das Ergebnis <i>E</i> − <i>K</i><sub>G</sub> bei <i>M</i> = ${stk(M)} Stück? (Verlust mit Minus eingeben)` });
    }
    st.quiz = z;
    $('k-task').innerHTML = z.text;
    $('k-ans-unit').textContent = z.unit;
    $('k-ans').value = '';
    $('k-ans-row').hidden = false;
    feedback('k-feedback', '');
    $('k-ans').focus();
  }
  function solution(z) {
    if (z.t === 'gs') return ln('<i>M</i><sub>Gs</sub>', frac(eur(z.Kf), `${z.e} €/Stück − ${z.Kv} €/Stück`)) + ln('', `<b>${stk(z.gs)} Stück</b>`);
    return ln('<i>E</i>', `${z.e} €/Stück · ${stk(z.M)} Stück = ${eur(z.e * z.M)}`)
      + ln(KG, `${z.Kv} €/Stück · ${stk(z.M)} Stück + ${eur(z.Kf)} = ${eur(Core.kosten(z.Kf, z.Kv, z.M))}`)
      + ln(`<i>E</i> − ${KG}`, `<b>${eurS(z.truth)}</b>`);
  }
  function checkQuiz() {
    const z = st.quiz;
    if (!z) return;
    const a = Core.parseNum($('k-ans').value);
    if (!isFinite(a)) { feedback('k-feedback', 'Bitte eine Zahl eingeben.', false); return; }
    const ok = Math.abs(a - z.truth) <= 0.5;
    st.score[1]++;
    if (ok) st.score[0]++;
    $('k-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
    const head = ok ? 'Richtig.' : z.t === 'g' && Math.abs(a + z.truth) <= 0.5 ? 'Vorzeichen falsch: Ist der Erlös kleiner als die Kosten, ist das Ergebnis ein Verlust (negativ).' : `Nicht richtig, eingegeben ${fmt(a, 0, { group: true })} ${z.unit}.`;
    feedback('k-feedback', `${head}<div class="calc">${solution(z)}</div>`, ok);
    $('k-ans-row').hidden = true;
    st.quiz = null;
  }
  $('k-quiz').addEventListener('click', newQuiz);
  $('k-check').addEventListener('click', checkQuiz);
  UI.onEnter('k-ans', checkQuiz);

  function reset() {
    Object.assign(st, BOOK(), { areas: true, grid: false, hl: null, pinned: null, lockDom: null, quiz: null });
    setSeg('k-preset', 'buch');
    $('k-areas').checked = true;
    $('k-grid').checked = false;
    for (const li of vars.children) li.classList.remove('active');
    $('k-task').textContent = '';
    $('k-ans-row').hidden = true;
    feedback('k-feedback', '');
    syncSliders();
  }

  UI.register('kosten', { render, reset, state: st });
  syncSliders();
})();

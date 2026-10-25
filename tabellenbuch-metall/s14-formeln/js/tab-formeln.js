/* Reiter 1: Formeln – Schnittgeschwindigkeit vc = π · d · n, Einheitenumformung im Rechengang, Übung */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback, frac, q, ln } = UI;
  const { fmt } = Core;
  const el = SVG.el;

  const W = 640, H = 400, SLOW = 50;   // Drehbewegung 50-fach verlangsamt
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Intern: d in mm, n in 1/min, vc in m/min
  const BOOK = () => ({ goal: 'vc', op: 'drehen', dUnit: 'mm', nUnit: '1/min', d: 200, n: 630, vc: Core.schnittgeschwindigkeit(0.2, 630) });
  const st = Object.assign(BOOK(), { anim: !reduced, angle: 0, quiz: null, score: [0, 0] });
  const svg = $('f-svg'), tab = $('tab-formeln');
  let rot = null, raf = 0, last = 0;

  // Formelbausteine mit ihrer Rolle (Formelzeichen, Operator, Konstante, Zahl) für die Hervorhebung
  const S = h => `<span data-p="sym">${h}</span>`;
  const O = h => `<span data-p="op">${h}</span>`;
  const K = h => `<span data-p="const">${h}</span>`;
  const N = h => `<span data-p="num">${h}</span>`;
  const VC = S('<i>v</i><sub>c</sub>'), D = S('<i>d</i>'), NN = S('<i>n</i>'), PI = K('π'), DOT = ` ${O('·')} `;
  const fr = (a, b) => frac(a, b, ' data-p="op"');      // Bruchstrich als Operator
  const why = (txt, cls = '') => `<div class="why ${cls}">${txt}</div>`;
  const res = h => `<span class="res">${h}</span>`;

  // Anzeige in der gewählten Einheit
  const dIn = (dmm, u) => dmm * 0.001 / Core.D_UNIT[u];
  const nIn = (n, u) => n / Core.N_UNIT[u];
  const dTxt = (dmm, u) => fmt(dIn(dmm, u), u === 'm' ? 4 : 2);
  const nTxt = (n, u) => fmt(nIn(n, u), u === '1/s' ? 2 : 1);
  const perMin = frac('1', 'min'), mPerMin = frac('m', 'min');
  const nUnitHtml = u => frac('1', u === '1/s' ? 's' : 'min');
  const vcTxt = v => fmt(v, 2, { keepZeros: true });

  function solve() {
    if (st.goal === 'vc') st.vc = Core.schnittgeschwindigkeit(st.d / 1000, st.n);
    else if (st.goal === 'n') st.n = Core.drehzahlAusVc(st.vc, st.d / 1000);
    else st.d = Core.durchmesserAusVc(st.vc, st.n) * 1000;
  }

  // ---------------------------------------------------------------- Rechengang wie auf der Buchseite
  const dConv = u => (u === 'm' ? '' : DOT + fr(q(N('1'), 'm'), q(N(u === 'mm' ? '1000' : '100'), u)));
  const nConv = u => (u === '1/s' ? DOT + fr(q(N('60'), 's'), q(N('1'), 'min')) : '');

  function calcHtml() {
    const dU = st.dUnit, nU = st.nUnit;
    const dq = q(N(dTxt(st.d, dU)), dU);
    const nq = `${N(nTxt(st.n, nU))}&#8239;${nUnitHtml(nU)}`;
    const vcq = `${N(vcTxt(st.vc))}&#8239;${mPerMin}`;
    const out = [];
    const convNote = [];
    if (dU !== 'm') convNote.push(`1 m = ${dU === 'mm' ? '1000 mm' : '100 cm'}`);
    if (nU === '1/s') convNote.push('1 min = 60 s');
    if (st.goal === 'vc') {
      out.push(ln(VC, `${PI}${DOT}${D}${DOT}${NN}`));
      out.push(ln('', `${PI}${DOT}${dq}${DOT}${nq}`));
      if (convNote.length) {
        out.push(ln('', `${PI}${DOT}${dq}${dConv(dU)}${DOT}${nq}${nConv(nU)}`));
        out.push(why(`Einheiten umformen (${convNote.join(', ')}), damit sich ${[dU !== 'm' ? dU : '', nU === '1/s' ? 's' : ''].filter(Boolean).join(' und ')} wegkürzt und m/min übrig bleibt.`));
      }
      out.push(ln('', res(`${vcTxt(st.vc)}&#8239;${mPerMin}`)));
    } else if (st.goal === 'n') {
      out.push(ln(NN, fr(VC, `${PI}${DOT}${D}`)));
      out.push(ln('', fr(vcq, `${PI}${DOT}${dq}`)));
      if (dU !== 'm') {
        out.push(ln('', fr(vcq, `${PI}${DOT}${dq}${dConv(dU)}`)));
        out.push(why(`Einheiten umformen (${convNote[0]}), damit sich m wegkürzt und 1/min übrig bleibt.`));
      }
      if (nU === '1/s') {
        out.push(ln('', `${N(fmt(st.n, 1))}&#8239;${perMin}${DOT}${fr(q(N('1'), 'min'), q(N('60'), 's'))}`));
        out.push(ln('', res(`${fmt(st.n / 60, 2)}&#8239;${frac('1', 's')}`)));
      } else out.push(ln('', res(`${fmt(st.n, 1)}&#8239;${perMin}`)));
    } else {
      out.push(ln(D, fr(VC, `${PI}${DOT}${NN}`)));
      out.push(ln('', fr(vcq, `${PI}${DOT}${nq}${nConv(nU)}`)));
      const dm = st.d / 1000;
      if (dU === 'm') out.push(ln('', res(q(fmt(dm, 4), 'm'))));
      else {
        out.push(ln('', `${q(N(fmt(dm, 4)), 'm')}${DOT}${fr(q(N(dU === 'mm' ? '1000' : '100'), dU), q(N('1'), 'm'))}`));
        out.push(ln('', res(q(dTxt(st.d, dU), dU))));
      }
      out.push(why('min kürzt sich weg: (m/min) : (1/min) = m.'));
    }
    return out.join('');
  }

  function formulaHtml() {
    if (st.goal === 'vc') return `${VC} = ${PI}${DOT}${D}${DOT}${NN}`;
    if (st.goal === 'n') return `${NN} = ${fr(VC, PI + DOT + D)}`;
    return `${D} = ${fr(VC, PI + DOT + NN)}`;
  }

  // ---------------------------------------------------------------- Zeichnung
  const P = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
  const pts = list => list.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

  function centerLines(cx, cy, r) {
    el(svg, 'line', { x1: cx - r - 16, y1: cy, x2: cx + r + 16, y2: cy, class: 'cl' });
    el(svg, 'line', { x1: cx, y1: cy - r - 16, x2: cx, y2: cy + r + 16, class: 'cl' });
  }

  // Drehrichtung: im Uhrzeigersinn (Winkel wächst im Bildschirm-Koordinatensystem)
  function nArrow(cx, cy, R, a0, a1, lblDeg) {
    const [x0, y0] = P(cx, cy, R, a0), [x1, y1] = P(cx, cy, R, a1 - 5);
    el(svg, 'path', { d: `M${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`, class: 'n-arc' });
    const [hx, hy] = P(cx, cy, R, a1);
    SVG.arrowHead(svg, hx, hy, a1 + 90, 12, 4.5, 'n-head');
    const [lx, ly] = P(cx, cy, R + 16, lblDeg);
    SVG.text(svg, lx, ly + 5, `*n* = ${nTxt(st.n, st.nUnit)}${st.nUnit === '1/s' ? '/s' : '/min'}`, { 'font-size': 15, 'text-anchor': lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle', class: 'lbl-n halo' });
  }

  // Durchmesser-Maß schräg durch die Mitte, Text auf der unteren linken Hälfte
  function diameter(cx, cy, r) {
    const a = 35 * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const A = [cx - r * c, cy + r * s], B = [cx + r * c, cy - r * s];
    el(svg, 'line', { x1: A[0], y1: A[1], x2: B[0], y2: B[1], class: 'dim' });
    SVG.arrowHead(svg, A[0], A[1], 180 - 35, 10, 3.5, 'dim-head');
    SVG.arrowHead(svg, B[0], B[1], -35, 10, 3.5, 'dim-head');
    const label = `⌀ ${dTxt(st.d, st.dUnit)} ${st.dUnit}`;
    if (r >= 70) {
      const tx = cx - r * 0.6 * c, ty = cy + r * 0.6 * s;
      SVG.text(svg, tx - 5 * s, ty - 5 * c, label, { 'font-size': 15, 'text-anchor': 'middle', transform: `rotate(-35 ${(tx - 5 * s).toFixed(1)} ${(ty - 5 * c).toFixed(1)})`, class: 'halo' });
    } else {
      SVG.text(svg, A[0] - 8, A[1] + 18, label, { 'font-size': 15, 'text-anchor': 'end', class: 'halo' });
    }
  }

  function drawLathe(r) {
    const cx = 225, cy = 205;
    el(svg, 'circle', { cx, cy, r, class: 'work' });
    rot = el(svg, 'g', {});
    for (const a of [0, 120, 240]) {
      const [x1, y1] = P(cx, cy, r * 0.5, a), [x2, y2] = P(cx, cy, r * 0.88, a);
      el(rot, 'line', { x1, y1, x2, y2, class: 'work-mark' });
    }
    centerLines(cx, cy, r);
    // Drehmeißel: Spanfläche in Mittenhöhe, Schneide am Umfang
    const x0 = cx + r + 1;
    el(svg, 'rect', { x: x0 + 36, y: cy, width: W - 12 - (x0 + 36), height: 26, class: 'shank' });
    el(svg, 'polygon', { points: pts([[x0, cy], [x0 + 42, cy], [x0 + 42, cy + 26], [x0 + 16, cy + 26]]), class: 'tool' });
    el(svg, 'path', { d: `M${x0 + 14} ${cy - 1} c 3 -13 17 -20 25 -12 c 5 6 -2 12 -8 8`, class: 'chip' });
    // Der Werkstoff läuft am Umfang mit vc auf die Schneide zu
    SVG.arrow(svg, x0 + 4, cy - 84, x0 + 4, cy - 5, { lineCls: 'vc', headCls: 'vc-head', l: 13, b: 5 });
    SVG.text(svg, x0 + 12, cy - 56, '*v*_{c}', { 'font-size': 18, class: 'lbl-vc halo' });
    nArrow(cx, cy, r + 16, -150, -40, -95);
    diameter(cx, cy, r);
    return [cx, cy];
  }

  function drawMill(r) {
    r = Math.min(r, 120);
    const cx = 230, cy = Math.max(60 + r, 160), ae = 0.25 * r;
    const yc = cy + r, yu = cy + r - ae, xe = cx + Math.sqrt(r * r - (r - ae) * (r - ae));
    // Werkstück: links bereits gefräst, rechts noch volle Höhe; Übergang folgt dem Fräserumfang
    el(svg, 'path', { d: `M16 ${yc} L${cx} ${yc} A ${r} ${r} 0 0 0 ${xe.toFixed(1)} ${yu.toFixed(1)} L${W - 16} ${yu.toFixed(1)} L${W - 16} ${H - 14} L16 ${H - 14} Z`, class: 'work' });
    el(svg, 'circle', { cx, cy, r, class: 'cutter' });
    rot = el(svg, 'g', {});
    const z = r < 50 ? 4 : 6, pitch = 360 / z, dEdge = Math.min(14, r * 0.3);
    for (let k = 0; k < z; k++) {
      const a = k * pitch;
      el(rot, 'polygon', { points: pts([P(cx, cy, r, a), P(cx, cy, r - dEdge, a), P(cx, cy, r - 1, a - pitch * 0.38)]), class: 'tool' });
    }
    el(svg, 'circle', { cx, cy, r: Math.max(6, r * 0.22), class: 'work' });
    centerLines(cx, cy, r);
    // vc am Umfang: oben tangential nach rechts
    SVG.arrow(svg, cx, cy - r - 7, cx + 80, cy - r - 7, { lineCls: 'vc', headCls: 'vc-head', l: 13, b: 5 });
    SVG.text(svg, cx + 86, cy - r - 2, '*v*_{c}', { 'font-size': 18, class: 'lbl-vc halo' });
    nArrow(cx, cy, r + 16, 175, 240, 205);
    diameter(cx, cy, r);
    return [cx, cy];
  }

  function drawInfo() {
    const x = 392, y = 12, w = 236, h = 84;
    el(svg, 'rect', { x, y, width: w, height: h, rx: 6, class: 'legend-box' });
    SVG.text(svg, x + 10, y + 22, `1 Umdrehung: *U* = π · *d* = ${fmt(Math.PI * st.d, 1)} mm`, { 'font-size': 13.5 });
    SVG.text(svg, x + 10, y + 46, `*n* = ${fmt(st.n, 1)} Umdrehungen je min`, { 'font-size': 13.5 });
    SVG.text(svg, x + 10, y + 70, `*v*_{c} = *U* · *n* = ${vcTxt(st.vc)} m/min`, { 'font-size': 13.5, class: 'lbl-vc' });
  }

  let center = [0, 0];
  function render() {
    const r = Math.max(22, Math.min(150, 25 + 0.36 * st.d));
    SVG.clear(svg);
    SVG.background(svg, W, H);
    center = st.op === 'drehen' ? drawLathe(r) : drawMill(r);
    rot.setAttribute('transform', `rotate(${st.angle.toFixed(2)} ${center[0]} ${center[1]})`);
    drawInfo();

    $('f-formula').innerHTML = formulaHtml();
    $('f-flabel').textContent = st.goal === 'vc' ? 'Formel für die Schnittgeschwindigkeit' : `Formel nach ${st.goal === 'n' ? 'n' : 'd'} umgestellt`;
    $('f-calc').innerHTML = calcHtml();
    $('f-details').innerHTML = [
      ['Umfang <i>U</i> = π · <i>d</i>', fmt(Math.PI * st.d, 1) + ' mm'],
      ['<i>v</i><sub>c</sub> in m/s', fmt(st.vc / 60, 2) + ' m/s'],
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    const isBook = st.goal === 'vc' && st.dUnit === 'mm' && st.nUnit === '1/min' && st.d === 200 && st.n === 630;
    $('f-book').innerHTML = isBook
      ? 'Buchbeispiel: <i>d</i> = 200 mm und <i>n</i> = 630/min ergeben <i>v</i><sub>c</sub> = 395,84 m/min.'
      : 'Eigene Werte. „Buchwerte laden“ stellt das Beispiel der Seite wieder her.';
    startAnim();
  }

  // ---------------------------------------------------------------- Bewegung
  function loop(t) {
    raf = 0;
    if (!st.anim || !tab.classList.contains('active') || !rot) return;
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
    last = t;
    st.angle = (st.angle + 360 * (st.n / 60) / SLOW * dt) % 360;
    rot.setAttribute('transform', `rotate(${st.angle.toFixed(2)} ${center[0]} ${center[1]})`);
    raf = requestAnimationFrame(loop);
  }
  function startAnim() {
    if (!raf && st.anim && tab.classList.contains('active')) { last = 0; raf = requestAnimationFrame(loop); }
  }

  // ---------------------------------------------------------------- Regler
  function syncSliders() {
    $('f-row-d').hidden = st.goal === 'd';
    $('f-row-n').hidden = st.goal === 'n';
    $('f-row-vc').hidden = st.goal === 'vc';
    UI.slider('f-d', st.d); UI.slider('f-n', st.n); UI.slider('f-vc', st.vc);
    $('f-d-out').textContent = `${dTxt(st.d, st.dUnit)} ${st.dUnit}`;
    $('f-n-out').textContent = `${nTxt(st.n, st.nUnit)} ${st.nUnit}`;
    $('f-vc-out').textContent = `${fmt(st.vc, 2)} m/min`;
  }
  function update() { solve(); syncSliders(); render(); }

  $('f-d').addEventListener('input', e => { st.d = +e.target.value; update(); });
  $('f-n').addEventListener('input', e => { st.n = +e.target.value; update(); });
  $('f-vc').addEventListener('input', e => { st.vc = +e.target.value; update(); });
  seg('f-goal', v => { st.goal = v; update(); });
  seg('f-op', v => { st.op = v; render(); });
  seg('f-dunit', v => { st.dUnit = v; update(); });
  seg('f-nunit', v => { st.nUnit = v; update(); });
  chk('f-anim', v => { st.anim = v; startAnim(); });

  // Bestandteile der Formel: Zeigen hebt hervor, Antippen hält die Hervorhebung fest
  let pinned = null;
  const parts = $('f-parts');
  function showHl(p) {
    if (p) tab.dataset.hl = p; else delete tab.dataset.hl;
    for (const li of parts.children) li.classList.toggle('active', li.dataset.part === pinned);
  }
  parts.addEventListener('mouseover', e => { const li = e.target.closest('li'); if (li) showHl(li.dataset.part); });
  parts.addEventListener('mouseleave', () => showHl(pinned));
  parts.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;
    pinned = pinned === li.dataset.part ? null : li.dataset.part;
    showHl(pinned);
  });

  // ---------------------------------------------------------------- Übung
  function newQuiz() {
    const t = UI.pick(['n', 'vc', 'd']);
    let z;
    if (t === 'n') {
      const d = UI.rnd(20, 160, 5), vc = UI.rnd(60, 300, 10);
      z = { t, d, vc, truth: Core.drehzahlAusVc(vc, d / 1000), unit: '1/min', dec: 0,
        text: `Eine Welle mit <i>d</i> = ${d} mm wird mit <i>v</i><sub>c</sub> = ${vc} m/min gedreht. Welche Drehzahl <i>n</i> in 1/min ist einzustellen?` };
    } else if (t === 'vc') {
      const d = UI.rnd(6, 40, 1), n = UI.rnd(500, 8000, 100);
      z = { t, d, n, truth: Core.schnittgeschwindigkeit(d / 1000, n), unit: 'm/min', dec: 1,
        text: `Ein Schaftfräser mit <i>d</i> = ${d} mm läuft mit <i>n</i> = ${n}/min. Wie groß ist die Schnittgeschwindigkeit <i>v</i><sub>c</sub> in m/min?` };
    } else {
      const vc = UI.rnd(80, 250, 10), n = UI.rnd(200, 2000, 10);
      z = { t, vc, n, truth: Core.durchmesserAusVc(vc, n) * 1000, unit: 'mm', dec: 1,
        text: `Bei <i>n</i> = ${n}/min soll am Umfang <i>v</i><sub>c</sub> = ${vc} m/min erreicht werden. Welcher Durchmesser <i>d</i> in mm gehört dazu?` };
    }
    st.quiz = z;
    $('f-task').innerHTML = z.text + ' (Toleranz ± 1 %)';
    $('f-ans-unit').textContent = z.unit;
    $('f-ans').value = '';
    $('f-ans-row').hidden = false;
    feedback('f-feedback', '');
    $('f-ans').focus();
  }

  function solution(z) {
    const T = fmt(z.truth, z.dec + 1);
    if (z.t === 'n') return ln(NN, fr(VC, `${PI}${DOT}${D}`)) + ln('', fr(`${z.vc}&#8239;${mPerMin}`, `π · ${z.d}&#8239;mm · ${frac('1&#8239;m', '1000&#8239;mm')}`)) + ln('', `<b>${T}&#8239;${perMin}</b>`);
    if (z.t === 'vc') return ln(VC, `π · ${z.d}&#8239;mm · ${frac('1&#8239;m', '1000&#8239;mm')} · ${z.n}&#8239;${perMin}`) + ln('', `<b>${T}&#8239;${mPerMin}</b>`);
    return ln(D, fr(`${z.vc}&#8239;${mPerMin}`, `π · ${z.n}&#8239;${perMin}`)) + ln('', `${fmt(z.truth / 1000, 5)}&#8239;m`) + ln('', `<b>${T}&#8239;mm</b>`);
  }

  function checkQuiz() {
    const z = st.quiz;
    if (!z) return;
    const a = Core.parseNum($('f-ans').value);
    if (!isFinite(a)) { feedback('f-feedback', 'Bitte eine Zahl eingeben.', false); return; }
    const ok = Math.abs(a - z.truth) <= 0.01 * z.truth;
    const off1000 = !ok && [1000, 0.001].some(f => Math.abs(a / (z.truth * f) - 1) < 0.01);
    st.score[1]++;
    if (ok) st.score[0]++;
    $('f-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
    const head = ok ? 'Richtig.' : off1000 ? 'Um den Faktor 1000 daneben: Millimeter in Meter umrechnen (1 m = 1000 mm).' : `Nicht richtig, eingegeben ${fmt(a, 2)} ${z.unit}.`;
    feedback('f-feedback', `${head}<div class="calc">${solution(z)}</div>`, ok);
    $('f-ans-row').hidden = true;
    st.quiz = null;
  }

  $('f-quiz').addEventListener('click', newQuiz);
  $('f-check').addEventListener('click', checkQuiz);
  UI.onEnter('f-ans', checkQuiz);

  function reset() {
    Object.assign(st, BOOK());
    setSeg('f-goal', st.goal); setSeg('f-op', st.op); setSeg('f-dunit', st.dUnit); setSeg('f-nunit', st.nUnit);
    st.quiz = null;
    $('f-task').textContent = '';
    $('f-ans-row').hidden = true;
    feedback('f-feedback', '');
    syncSliders();
  }

  $('f-anim').checked = st.anim;
  UI.register('formeln', { render, reset, state: st });
  syncSliders();
})();

/* Tab 1: Formulas – Cutting speed vc = π · d · n, explicit unit conversions, interactive exercise */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback, frac, q, ln } = UI;
  const { fmt } = Core;
  const el = SVG.el;

  const W = 640, H = 400, SLOW = 50;   // Rotation slowed down 50x
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Internal units: d in mm, n in 1/min, vc in m/min
  const DEFAULT_STATE = () => ({ goal: 'vc', op: 'drehen', dUnit: 'mm', nUnit: '1/min', d: 125, n: 800, vc: Core.schnittgeschwindigkeit(0.125, 800) });
  const st = Object.assign(DEFAULT_STATE(), { anim: !reduced, angle: 0, quiz: null, score: [0, 0] });
  const svg = $('f-svg'), tab = $('tab-formeln');
  let rot = null, raf = 0, last = 0;

  // Formula building blocks tagged with their role (symbol, operator, constant, number) for highlighting
  const S = h => `<span data-p="sym">${h}</span>`;
  const O = h => `<span data-p="op">${h}</span>`;
  const K = h => `<span data-p="const">${h}</span>`;
  const N = h => `<span data-p="num">${h}</span>`;
  const VC = S('<i>v</i><sub>c</sub>'), D = S('<i>d</i>'), NN = S('<i>n</i>'), PI = K('π'), DOT = ` ${O('·')} `;
  const fr = (a, b) => frac(a, b, ' data-p="op"');      // Fraction bar as division operator
  const why = (txt, cls = '') => `<div class="why ${cls}">${txt}</div>`;
  const res = h => `<span class="res">${h}</span>`;

  // Display in the selected unit
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

  // ---------------------------------------------------------------- Step-by-step calculation with carried units
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
        out.push(why(`Convert units (${convNote.join(', ')}) so ${[dU !== 'm' ? dU : '', nU === '1/s' ? 's' : ''].filter(Boolean).join(' and ')} cancel out, leaving m/min.`));
      }
      out.push(ln('', res(`${vcTxt(st.vc)}&#8239;${mPerMin}`)));
    } else if (st.goal === 'n') {
      out.push(ln(NN, fr(VC, `${PI}${DOT}${D}`)));
      out.push(ln('', fr(vcq, `${PI}${DOT}${dq}`)));
      if (dU !== 'm') {
        out.push(ln('', fr(vcq, `${PI}${DOT}${dq}${dConv(dU)}`)));
        out.push(why(`Convert units (${convNote[0]}) so m cancels out, leaving 1/min.`));
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
      out.push(why('min cancels out: (m/min) ÷ (1/min) = m.'));
    }
    return out.join('');
  }

  function formulaHtml() {
    if (st.goal === 'vc') return `${VC} = ${PI}${DOT}${D}${DOT}${NN}`;
    if (st.goal === 'n') return `${NN} = ${fr(VC, PI + DOT + D)}`;
    return `${D} = ${fr(VC, PI + DOT + NN)}`;
  }

  // ---------------------------------------------------------------- Drawing
  const P = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
  const pts = list => list.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

  function centerLines(cx, cy, r) {
    el(svg, 'line', { x1: cx - r - 16, y1: cy, x2: cx + r + 16, y2: cy, class: 'cl' });
    el(svg, 'line', { x1: cx, y1: cy - r - 16, x2: cx, y2: cy + r + 16, class: 'cl' });
  }

  // Rotation direction: dir = 1 clockwise (angles increase in screen coordinates), -1 counter-clockwise.
  // Turning: workpiece clockwise. Milling: cutter counter-clockwise, feed to the right → up milling (conventional).
  const DIR = { drehen: 1, fraesen: -1 };
  function nArrow(cx, cy, R, a0, a1, lblDeg, dir = 1) {
    const [x0, y0] = P(cx, cy, R, a0), [x1, y1] = P(cx, cy, R, a1 - 5 * dir);
    el(svg, 'path', { d: `M${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 0 ${dir > 0 ? 1 : 0} ${x1.toFixed(1)} ${y1.toFixed(1)}`, class: 'n-arc' });
    const [hx, hy] = P(cx, cy, R, a1);
    SVG.arrowHead(svg, hx, hy, a1 + 90 * dir, 12, 4.5, 'n-head');
    const [lx, ly] = P(cx, cy, R + 16, lblDeg);
    SVG.text(svg, lx, ly + 5, `*n* = ${nTxt(st.n, st.nUnit)}${st.nUnit === '1/s' ? '/s' : '/min'}`, { 'font-size': 15, 'text-anchor': lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle', class: 'lbl-n halo' });
  }

  // Diameter dimension slanted through the center, label on lower-left half
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
    // Turning tool: rake face on centerline, cutting edge at circumference
    const x0 = cx + r + 1;
    el(svg, 'rect', { x: x0 + 36, y: cy, width: W - 12 - (x0 + 36), height: 26, class: 'shank' });
    el(svg, 'polygon', { points: pts([[x0, cy], [x0 + 42, cy], [x0 + 42, cy + 26], [x0 + 16, cy + 26]]), class: 'tool' });
    el(svg, 'path', { d: `M${x0 + 14} ${cy - 1} c 3 -13 17 -20 25 -12 c 5 6 -2 12 -8 8`, class: 'chip' });
    // Workpiece surface moves past cutting edge at tangential speed vc
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
    // Workpiece: left side already milled, right side full height (feed to the right); shoulder follows cutter arc.
    // Cutter turns counter-clockwise: each tooth enters at the milled surface (chip thickness 0) and leaves at the top → up milling.
    el(svg, 'path', { d: `M16 ${yc} L${cx} ${yc} A ${r} ${r} 0 0 0 ${xe.toFixed(1)} ${yu.toFixed(1)} L${W - 16} ${yu.toFixed(1)} L${W - 16} ${H - 14} L16 ${H - 14} Z`, class: 'work' });
    // Cutter body inside the tooth roots; thin cutting circle (⌀ d) through the tooth tips
    const z = r < 50 ? 4 : 6, pitch = 360 / z, h = Math.max(5, Math.min(16, 0.22 * r)), rb = r - h;
    el(svg, 'circle', { cx, cy, r: rb, class: 'cutter' });
    el(svg, 'circle', { cx, cy, r, class: 'cl' });
    rot = el(svg, 'g', {});
    // Saw teeth: radial rake face in front (direction of rotation), cutting edge at the tip on the cutting circle,
    // back falls away behind the tip (clearance), so only the edge touches the material
    const back = -DIR.fraesen * 0.7 * pitch;
    for (let k = 0; k < z; k++) {
      const a = k * pitch, tooth = [P(cx, cy, rb - 2, a), P(cx, cy, r, a)];
      for (let i = 1; i <= 6; i++) tooth.push(P(cx, cy, r - h * (i / 6) ** 1.5 - (i === 6 ? 2 : 0), a + back * i / 6));
      el(rot, 'polygon', { points: pts(tooth), class: 'tool' });
    }
    el(svg, 'circle', { cx, cy, r: Math.max(6, r * 0.22), class: 'work' });
    centerLines(cx, cy, r);
    // vc at circumference: top tangent pointing left, ending at the top point
    SVG.arrow(svg, cx + 80, cy - r - 7, cx, cy - r - 7, { lineCls: 'vc', headCls: 'vc-head', l: 13, b: 5 });
    SVG.text(svg, cx + 86, cy - r - 2, '*v*_{c}', { 'font-size': 18, class: 'lbl-vc halo' });
    nArrow(cx, cy, r + 16, 240, 175, 205, DIR.fraesen);
    diameter(cx, cy, r);
    return [cx, cy];
  }

  function drawInfo() {
    const x = 392, y = 12, w = 236, h = 84;
    el(svg, 'rect', { x, y, width: w, height: h, rx: 6, class: 'legend-box' });
    SVG.text(svg, x + 10, y + 22, `1 rev: *C* = π · *d* = ${fmt(Math.PI * st.d, 1)} mm`, { 'font-size': 13.5 });
    SVG.text(svg, x + 10, y + 46, `*n* = ${fmt(st.n, 1)} rev per min`, { 'font-size': 13.5 });
    SVG.text(svg, x + 10, y + 70, `*v*_{c} = *C* · *n* = ${vcTxt(st.vc)} m/min`, { 'font-size': 13.5, class: 'lbl-vc' });
  }

  let center = [0, 0];
  const setRot = () => rot.setAttribute('transform', `rotate(${(DIR[st.op] * st.angle).toFixed(2)} ${center[0]} ${center[1]})`);
  function render() {
    const r = Math.max(22, Math.min(150, 25 + 0.36 * st.d));
    SVG.clear(svg);
    SVG.background(svg, W, H);
    center = st.op === 'drehen' ? drawLathe(r) : drawMill(r);
    setRot();
    drawInfo();

    $('f-formula').innerHTML = formulaHtml();
    $('f-flabel').textContent = st.goal === 'vc' ? 'Formula for Cutting Speed' : `Formula rearranged for ${st.goal === 'n' ? 'n' : 'd'}`;
    $('f-calc').innerHTML = calcHtml();
    $('f-details').innerHTML = [
      ['Circumference <i>C</i> = π · <i>d</i>', fmt(Math.PI * st.d, 1) + ' mm'],
      ['<i>v</i><sub>c</sub> in m/s', fmt(st.vc / 60, 2) + ' m/s'],
    ].map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
    const isDefault = st.goal === 'vc' && st.dUnit === 'mm' && st.nUnit === '1/min' && st.d === 125 && st.n === 800;
    $('f-preset-note').innerHTML = isDefault
      ? 'Reference setup: turning steel bar Ø <i>d</i> = 125 mm at <i>n</i> = 800/min yields <i>v</i><sub>c</sub> = 314.16 m/min.'
      : 'Custom values. "Reset Defaults" restores the reference turning example.';
    startAnim();
  }

  // ---------------------------------------------------------------- Animation
  function loop(t) {
    raf = 0;
    if (!st.anim || !tab.classList.contains('active') || !rot) return;
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
    last = t;
    st.angle = (st.angle + 360 * (st.n / 60) / SLOW * dt) % 360;
    setRot();
    raf = requestAnimationFrame(loop);
  }
  function startAnim() {
    if (!raf && st.anim && tab.classList.contains('active')) { last = 0; raf = requestAnimationFrame(loop); }
  }

  // ---------------------------------------------------------------- Controls
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

  // Components of a formula: hover highlights temporarily, click pins highlight
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

  // ---------------------------------------------------------------- Exercise
  function newQuiz() {
    const t = UI.pick(['n', 'vc', 'd']);
    let z;
    if (t === 'n') {
      const d = UI.rnd(20, 160, 5), vc = UI.rnd(60, 300, 10);
      z = { t, d, vc, truth: Core.drehzahlAusVc(vc, d / 1000), unit: '1/min', dec: 0,
        text: `A shaft with <i>d</i> = ${d} mm is turned at <i>v</i><sub>c</sub> = ${vc} m/min. What rotational speed <i>n</i> in 1/min must be set?` };
    } else if (t === 'vc') {
      const d = UI.rnd(6, 40, 1), n = UI.rnd(500, 8000, 100);
      z = { t, d, n, truth: Core.schnittgeschwindigkeit(d / 1000, n), unit: 'm/min', dec: 1,
        text: `An end mill with <i>d</i> = ${d} mm runs at <i>n</i> = ${n}/min. What is the cutting speed <i>v</i><sub>c</sub> in m/min?` };
    } else {
      const vc = UI.rnd(80, 250, 10), n = UI.rnd(200, 2000, 10);
      z = { t, vc, n, truth: Core.durchmesserAusVc(vc, n) * 1000, unit: 'mm', dec: 1,
        text: `At <i>n</i> = ${n}/min, a cutting speed <i>v</i><sub>c</sub> = ${vc} m/min is to be reached at the circumference. What diameter <i>d</i> in mm corresponds to this?` };
    }
    st.quiz = z;
    $('f-task').innerHTML = z.text + ' (Tolerance ± 1 %)';
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
    if (!isFinite(a)) { feedback('f-feedback', 'Please enter a number.', false); return; }
    const ok = Math.abs(a - z.truth) <= 0.01 * z.truth;
    const off1000 = !ok && [1000, 0.001].some(f => Math.abs(a / (z.truth * f) - 1) < 0.01);
    st.score[1]++;
    if (ok) st.score[0]++;
    $('f-score').textContent = `${st.score[0]} / ${st.score[1]} correct`;
    const head = ok ? 'Correct.' : off1000 ? 'Off by a factor of 1000: convert millimeters to meters (1 m = 1000 mm).' : `Incorrect, entered ${fmt(a, 2)} ${z.unit}.`;
    feedback('f-feedback', `${head}<div class="calc">${solution(z)}</div>`, ok);
    $('f-ans-row').hidden = true;
    st.quiz = null;
  }

  $('f-quiz').addEventListener('click', newQuiz);
  $('f-check').addEventListener('click', checkQuiz);
  UI.onEnter('f-ans', checkQuiz);

  function reset() {
    Object.assign(st, DEFAULT_STATE());
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

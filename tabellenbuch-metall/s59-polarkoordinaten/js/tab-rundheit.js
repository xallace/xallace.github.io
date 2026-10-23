/* Reiter 3: Beispiel Polarkoordinatensystem – Rundheitsprüfung einer gedrehten Buchse
   Maßstab 10 mm ≙ 5 µm, Unrundheit durch zu starkes Spannen im Backenfutter */
(() => {
  'use strict';
  const { $, seg, setSeg, chk, feedback } = UI;
  const { fmt, polarToScreen, screenToPolar, umToMm, mmToUm, magnification, roundnessDelta, roundnessStats } = Core;
  const el = SVG.el;

  const W = 640, H = 500, CX = 310, CY = 252;
  const RING_PX = 36;           // 1 Kreisring-Abstand im Diagramm ≙ 10 mm auf dem Messschrieb
  const REF_RING = 3;           // 3. Kreis von innen = gestrichelter Referenz-/Sollkreis (Δr = 0 µm)
  const MAX_RINGS = 5;

  // Backen an den Erhebungen des Messschriebs (siehe Core.roundnessDelta)
  const JAW_ANGLES = {
    book: [90, 210, 330],
    oval: [0, 180],
    '3jaw': [0, 120, 240],
    '4jaw': [0, 90, 180, 270]
  };

  const st = {
    kind: 'book',               // 'book' | 'oval' | '3jaw' | '4jaw'
    umPer10mm: 5,               // Buchwert: 10 mm ≙ 5 µm
    amp: 4.0,                   // Verformungsamplitude in µm
    tol: 6.0,                   // geforderte Rundheitstoleranz t in µm (Band ± t/2)
    deg: 90,                    // Ablesewinkel φ
    showTol: true,
    showJaws: true,
    quiz: null,
    score: [0, 0]
  };
  const svg = $('r-svg');

  // Radius in Pixel für eine Abweichung Δr in µm
  function deltaToPx(um) {
    const mm = umToMm(um, st.umPer10mm);
    const rings = REF_RING + mm / 10;
    return Math.max(RING_PX * 0.4, Math.min((MAX_RINGS + 0.45) * RING_PX, rings * RING_PX));
  }

  function render() {
    SVG.clear(svg);
    el(svg, 'rect', { x: 0, y: 0, width: W, height: H, class: 'bg-plain' });

    const refPx = REF_RING * RING_PX;
    const outerPx = MAX_RINGS * RING_PX;
    const stats = roundnessStats(st.kind, st.amp);
    const inTol = stats.ront <= st.tol + 1e-6;

    // 1. Toleranzband: zwei konzentrische Kreise im Abstand t, mittig zwischen größter und kleinster
    //    Abweichung. So liegt die Kurve genau dann im Band, wenn die Unrundheit ≤ t ist.
    if (st.showTol) {
      const mid = (stats.max + stats.min) / 2;
      const rOuterTol = deltaToPx(mid + st.tol / 2);
      const rInnerTol = deltaToPx(mid - st.tol / 2);
      const dOuter = SVG.arcPath(CX, CY, rOuterTol, 0, 360);
      const dInner = SVG.arcPath(CX, CY, rInnerTol, 0, 360);
      el(svg, 'path', {
        d: `${dOuter} ${dInner}`,
        'fill-rule': 'evenodd',
        class: inTol ? 'tol-band-ok' : 'tol-band-bad'
      });
      el(svg, 'circle', { cx: CX, cy: CY, r: rOuterTol, class: inTol ? 'tol-line-ok' : 'tol-line-bad', fill: 'none' });
      el(svg, 'circle', { cx: CX, cy: CY, r: rInnerTol, class: inTol ? 'tol-line-ok' : 'tol-line-bad', fill: 'none' });
    }

    // 2. Konzentrische Kreise im Abstand 10 mm (≙ umPer10mm µm)
    const gRings = el(svg, 'g', { class: 'grid' });
    for (let k = 1; k <= MAX_RINGS; k++) {
      const isRef = k === REF_RING;
      el(gRings, 'circle', {
        cx: CX, cy: CY, r: k * RING_PX,
        fill: 'none',
        'stroke-width': isRef ? 1.3 : k === MAX_RINGS ? 1.15 : 0.75,
        'stroke-dasharray': isRef ? '7 4' : null,
        opacity: isRef ? 0.95 : 0.65
      });
      const umVal = (k - REF_RING) * st.umPer10mm;
      if (k > 1) {
        const [rx, ry] = polarToScreen(CX, CY, k * RING_PX - 4, 312);
        SVG.text(svg, rx, ry,
          umVal === 0 ? 'Soll (0 µm)' : `${fmt(umVal, 1, { plus: true })} µm`,
          { 'font-size': 11.5, class: 'halo lbl-muted' });
      }
    }

    // 3. Waagrechte und senkrechte Achse (in der Mitte für den Maßstabstext unterbrochen wie im Buch)
    const axExt = outerPx + 8;
    const gap = RING_PX * 0.92;
    el(svg, 'line', { x1: CX - axExt, y1: CY, x2: CX - gap, y2: CY, class: 'ax', 'stroke-width': 1.2 });
    el(svg, 'line', { x1: CX + gap, y1: CY, x2: CX + axExt, y2: CY, class: 'ax', 'stroke-width': 1.2 });
    el(svg, 'line', { x1: CX, y1: CY - axExt, x2: CX, y2: CY - 18, class: 'ax', 'stroke-width': 1.2 });
    el(svg, 'line', { x1: CX, y1: CY + 12, x2: CX, y2: CY + axExt, class: 'ax', 'stroke-width': 1.2 });
    el(svg, 'line', { x1: CX - 4, y1: CY, x2: CX + 4, y2: CY, class: 'ax', 'stroke-width': 1.1 });
    el(svg, 'line', { x1: CX, y1: CY - 4, x2: CX, y2: CY + 4, class: 'ax', 'stroke-width': 1.1 });

    // Maßstabsangabe im inneren Kreis genau wie im Buch: „10 mm ≙ 5 µm“
    SVG.text(svg, CX, CY - 4, `10 mm ≙ ${fmt(st.umPer10mm, 1)} µm`, {
      'text-anchor': 'middle', 'font-size': 13.5, class: 'halo lbl-strong'
    });

    // 4. Hauptwinkel-Beschriftungen: 0° (360°), 90°, 180°, 270° – nach außen gerückt, wo ein Backenpfeil sitzt
    const jawAt = d => st.showJaws && (JAW_ANGLES[st.kind] || []).includes(d);
    const lblPad = jawAt(0) ? 42 : 24;
    SVG.text(svg, CX + axExt + lblPad, CY - 4, '0°', { 'text-anchor': 'middle', 'font-size': 15 });
    SVG.text(svg, CX + axExt + lblPad, CY + 16, '(360°)', { 'text-anchor': 'middle', 'font-size': 14 });
    SVG.text(svg, CX, CY - axExt - (jawAt(90) ? 28 : 10), '90°', { 'text-anchor': 'middle', 'font-size': 15 });
    SVG.text(svg, CX - axExt - (jawAt(180) ? 30 : 8), CY + 5, '180°', { 'text-anchor': 'end', 'font-size': 15 });
    SVG.text(svg, CX, CY + axExt + (jawAt(270) ? 38 : 20), '270°', { 'text-anchor': 'middle', 'font-size': 15 });

    // 5. Spannbacken-Symbolik am Außenrand (zeigt, wo das Backenfutter drückt)
    if (st.showJaws) {
      const jaws = JAW_ANGLES[st.kind] || [0, 180];
      const gJaws = el(svg, 'g', {});
      for (const jd of jaws) {
        const [jx1, jy1] = polarToScreen(CX, CY, outerPx + 28, jd);
        const [jx2, jy2] = polarToScreen(CX, CY, outerPx + 3, jd);
        SVG.arrow(gJaws, jx1, jy1, jx2, jy2, { lineCls: 'jaw-arrow', headCls: 'jaw-head', w: 2.2, l: 10, b: 4 });
      }
    }

    // 6. Blaue Rundheits-Kennlinie r(φ)
    const dCurve = SVG.plotPolar(deg => roundnessDelta(deg, st.kind, st.amp), CX, CY, deltaToPx, 240);
    el(svg, 'path', { d: dCurve, class: 'curve-re', fill: 'none', 'stroke-width': 2.5 });

    // 7. Messtaster / Ablesestelle bei Winkel φ
    const curDeg = st.quiz && !st.quiz.done && st.quiz.deg != null ? st.quiz.deg : st.deg;
    const curUm = roundnessDelta(curDeg, st.kind, st.amp);
    const curPx = deltaToPx(curUm);
    const [sx, sy] = polarToScreen(CX, CY, refPx, curDeg);
    const [px, py] = polarToScreen(CX, CY, curPx, curDeg);
    const gProbe = el(svg, 'g', {});
    el(gProbe, 'line', { x1: CX, y1: CY, x2: px, y2: py, class: 'read', 'stroke-dasharray': '4 3' });
    el(gProbe, 'line', { x1: sx, y1: sy, x2: px, y2: py, class: 'proj', 'stroke-width': 2.4 });
    el(gProbe, 'circle', { cx: sx, cy: sy, r: 3.5, class: 'pt' });
    el(gProbe, 'circle', { cx: px, cy: py, r: 5.5, class: 'pt sel' });
    el(gProbe, 'circle', { cx: px, cy: py, r: 16, class: 'pt-hit' });

    if (!st.quiz || st.quiz.done) {
      const [lx, ly] = polarToScreen(CX, CY, Math.max(curPx, refPx) + 22, curDeg);
      SVG.text(gProbe, lx, ly + 4, `Δ*r* = ${fmt(curUm, 1, { plus: true })} µm`, {
        'text-anchor': 'middle', 'font-size': 13.5, class: 'halo sel-text'
      });
    }

    updateSide(stats, curDeg, curUm, inTol);
  }

  function updateSide(stats, curDeg, curUm, inTol) {
    if (st.quiz && !st.quiz.done) {
      $('r-result').textContent = '–';
      $('r-details').innerHTML = '<span>Während der Aufgabe ausgeblendet</span><span></span>';
      return;
    }
    const curMm = umToMm(curUm, st.umPer10mm);
    const rontMm = umToMm(stats.ront, st.umPer10mm);
    $('r-result').innerHTML = `Unrundheit Δ<i>r</i><sub>ges</sub> = ${fmt(stats.ront, 1)} µm `
      + `<span class="badge ${inTol ? 'ok' : 'bad'}">${inTol ? 'innerhalb Toleranz' : 'Toleranz überschritten'}</span>`;
    const kv = [
      ['Maßstab im Diagramm', `10 mm ≙ ${fmt(st.umPer10mm, 1)} µm (${magnification(st.umPer10mm)} : 1)`],
      [`Ablesung bei <i>φ</i> = ${fmt(curDeg, 0)}°`, `${fmt(curUm, 2, { plus: true })} µm (${fmt(curMm, 1, { plus: true })} mm)`],
      [`Größte Ausbauchung (${stats.maxDeg}°)`, `${fmt(stats.max, 2, { plus: true })} µm`],
      [`Größte Einschnürung (${stats.minDeg}°)`, `${fmt(stats.min, 2, { plus: true })} µm`],
      ['Unrundheit (Max − Min)', `${fmt(stats.ront, 2)} µm (≙ ${fmt(rontMm, 1)} mm)`],
      ['Geforderte Toleranz <i>t</i>', `${fmt(st.tol, 1)} µm (± ${fmt(st.tol / 2, 1)} µm)`]
    ];
    $('r-details').innerHTML = kv.map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join('');
  }

  function syncSliders() {
    $('r-amp').value = st.amp;
    $('r-amp-out').textContent = '± ' + fmt(st.amp, 1) + ' µm';
    $('r-tol').value = st.tol;
    $('r-tol-out').textContent = fmt(st.tol, 1) + ' µm';
    $('r-deg').value = st.deg;
    $('r-deg-out').textContent = fmt(st.deg, 0) + '°';
  }

  $('r-amp').addEventListener('input', e => { st.amp = +e.target.value; syncSliders(); render(); });
  $('r-tol').addEventListener('input', e => { st.tol = +e.target.value; syncSliders(); render(); });
  $('r-deg').addEventListener('input', e => { st.deg = +e.target.value; syncSliders(); render(); });

  svg.addEventListener('pointerdown', e => {
    if (st.quiz) return;
    const move = p => {
      const pol = screenToPolar(CX, CY, p.x, p.y, 1);
      st.deg = Math.round(pol.deg / 5) * 5 % 360;
      syncSliders();
      render();
    };
    move(SVG.toLocal(svg, e));
    SVG.startDrag(svg, e, move);
  });

  // ---------------------------------------------------------------- Übung
  function newQuiz() {
    const types = ['mmToUm', 'umToMm', 'ront', 'readDeg'];
    const kind = types[Math.floor(Math.random() * types.length)];
    let truth, tol = 0.2, unit = 'µm', text = '', deg = st.deg;
    if (kind === 'mmToUm') {
      const mm = UI.rnd(2, 16, 2);
      truth = mmToUm(mm, st.umPer10mm);
      tol = 0.1;
      text = `Maßstab <b>10 mm ≙ ${fmt(st.umPer10mm, 1)} µm</b>: Die Kennlinie weicht im Diagramm um <b>${mm} mm</b> vom Sollkreis ab. Wie vielen <b>µm</b> entspricht das an der Buchse?`;
    } else if (kind === 'umToMm') {
      const um = UI.rnd(1, 8, 1);
      truth = umToMm(um, st.umPer10mm);
      unit = 'mm';
      tol = 0.2;
      text = `Maßstab <b>10 mm ≙ ${fmt(st.umPer10mm, 1)} µm</b>: Eine Abweichung von <b>${um} µm</b> wird im Diagramm als welcher Abstand (in <b>mm</b>) vom Sollkreis gezeichnet?`;
    } else if (kind === 'ront') {
      const stats = roundnessStats(st.kind, st.amp);
      truth = stats.ront;
      tol = 0.6;
      text = `Wie groß ist die gesamte Unrundheit Δ<i>r</i><sub>max</sub> − Δ<i>r</i><sub>min</sub> der gezeigten Kennlinie (in <b>µm</b>, Toleranz ± ${fmt(tol, 1)} µm)?`;
    } else {
      const angles = [0, 90, 180, 270];
      deg = angles[Math.floor(Math.random() * angles.length)];
      st.deg = deg;
      syncSliders();
      truth = Math.abs(roundnessDelta(deg, st.kind, st.amp));
      tol = 0.5;
      text = `Wie groß ist der Betrag der Abweichung |Δ<i>r</i>| bei <b><i>φ</i> = ${deg}°</b> (in <b>µm</b>, Toleranz ± ${fmt(tol, 1)} µm)?`;
    }
    st.quiz = { kind, deg, truth, tol, unit, done: false };
    $('r-task').innerHTML = text;
    $('r-ans-unit').textContent = unit;
    $('r-ans').value = '';
    $('r-ans-row').hidden = false;
    $('r-quiz-end').hidden = false;
    feedback('r-feedback', '');
    render();
    $('r-ans').focus();
  }

  function checkQuiz() {
    const q = st.quiz;
    if (!q || q.done) return;
    const a = Core.parseNum($('r-ans').value);
    if (!isFinite(a)) { feedback('r-feedback', 'Bitte eine Zahl eingeben.', false); return; }
    const ok = Math.abs(a - q.truth) <= q.tol + 1e-9;
    q.done = true;
    st.score[1]++;
    if (ok) st.score[0]++;
    $('r-score').textContent = `${st.score[0]} / ${st.score[1]} richtig`;
    feedback('r-feedback', `${ok ? 'Richtig' : 'Daneben'}: Gesucht war ${fmt(q.truth, 2)} ${q.unit}, eingegeben ${fmt(a, 2)} ${q.unit}.`, ok);
    $('r-ans-row').hidden = true;
    render();
  }

  function endQuiz() {
    st.quiz = null;
    $('r-task').textContent = '';
    $('r-ans-row').hidden = true;
    $('r-quiz-end').hidden = true;
    feedback('r-feedback', '');
    render();
  }

  seg('r-kind', v => { st.kind = v; render(); });
  seg('r-scale', v => { st.umPer10mm = +v; render(); });
  chk('r-tol-show', v => { st.showTol = v; render(); });
  chk('r-jaws', v => { st.showJaws = v; render(); });
  $('r-quiz').addEventListener('click', newQuiz);
  $('r-quiz-end').addEventListener('click', endQuiz);
  $('r-check').addEventListener('click', checkQuiz);
  UI.onEnter('r-ans', checkQuiz);

  function reset() {
    Object.assign(st, { kind: 'book', umPer10mm: 5, amp: 4.0, tol: 6.0, deg: 90, showTol: true, showJaws: true });
    setSeg('r-kind', 'book');
    setSeg('r-scale', '5');
    $('r-tol-show').checked = $('r-jaws').checked = true;
    syncSliders();
    endQuiz();
  }

  UI.register('rundheit', { render, reset, state: st, newQuiz });
  syncSliders();
  render();
})();

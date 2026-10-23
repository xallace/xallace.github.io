/* Reiter 3: Diagramm-Ausschnitt (Wärmedehnung) und lineare/logarithmische Teilung (Drehzahldiagramm) */
(() => {
  'use strict';
  const { $, seg, setSeg, chk } = UI;
  const { fmt } = Core;
  const el = SVG.el;

  // Achsen mit Teilung, Zahlenwerten, Einheit zwischen den letzten beiden Zahlen,
  // Formelzeichen mit parallelem Pfeil. Linienbreiten Netz : Achse : Kennlinie = 0,6 : 1,2 : 2,4.
  // o: { xt, yt: [{v, label}], xMinor, yMinor, grid, xSym, ySym, xUnit, yUnit, frame }
  function axes(svg, X, Y, o) {
    const [x0, x1] = X.range, [y0, y1] = Y.range;           // y0 unten, y1 oben
    const g = el(svg, 'g', {});
    if (o.grid) {
      const gg = el(g, 'g', { class: 'grid' });
      for (const v of o.xMinor || []) el(gg, 'line', { x1: X(v), y1: y0, x2: X(v), y2: y1, 'stroke-width': 0.35, opacity: 0.35 });
      for (const v of o.yMinor || []) el(gg, 'line', { x1: x0, y1: Y(v), x2: x1, y2: Y(v), 'stroke-width': 0.35, opacity: 0.35 });
      for (const t of o.xt) el(gg, 'line', { x1: X(t.v), y1: y0, x2: X(t.v), y2: y1, 'stroke-width': 0.6, opacity: 0.6 });
      for (const t of o.yt) el(gg, 'line', { x1: x0, y1: Y(t.v), x2: x1, y2: Y(t.v), 'stroke-width': 0.6, opacity: 0.6 });
    }
    if (o.frame) el(g, 'rect', { x: x0, y: y1, width: x1 - x0, height: y0 - y1, class: 'grid', fill: 'none', 'stroke-width': 0.6 });
    el(g, 'line', { x1: x0, y1: y0, x2: x1 + 6, y2: y0, class: 'ax', 'stroke-width': 1.2 });
    el(g, 'line', { x1: x0, y1: y0, x2: x0, y2: y1 - 6, class: 'ax', 'stroke-width': 1.2 });
    for (const v of o.xMinor || []) el(g, 'line', { x1: X(v), y1: y0, x2: X(v), y2: y0 + 3, class: 'tick', 'stroke-width': 0.8 });
    for (const v of o.yMinor || []) el(g, 'line', { x1: x0 - 3, y1: Y(v), x2: x0, y2: Y(v), class: 'tick', 'stroke-width': 0.8 });
    for (const t of o.xt) {
      el(g, 'line', { x1: X(t.v), y1: y0, x2: X(t.v), y2: y0 + 5, class: 'tick', 'stroke-width': 1 });
      SVG.text(g, X(t.v), y0 + 20, t.label, { 'text-anchor': 'middle', 'font-size': 13 });
    }
    for (const t of o.yt) {
      el(g, 'line', { x1: x0 - 5, y1: Y(t.v), x2: x0, y2: Y(t.v), class: 'tick', 'stroke-width': 1 });
      SVG.text(g, x0 - 8, Y(t.v) + 4.5, t.label, { 'text-anchor': 'end', 'font-size': 13 });
    }
    // Einheit zwischen den beiden letzten Zahlen (bei log-Teilung: geometrische Mitte)
    const n = o.xt.length, m = o.yt.length;
    SVG.text(g, (X(o.xt[n - 2].v) + X(o.xt[n - 1].v)) / 2, y0 + 20, o.xUnit, { 'text-anchor': 'middle', 'font-size': 13 });
    SVG.text(g, x0 - 8, (Y(o.yt[m - 2].v) + Y(o.yt[m - 1].v)) / 2 + 4.5, o.yUnit, { 'text-anchor': 'end', 'font-size': 13 });
    // Formelzeichen vor Pfeilen parallel zu den Achsen
    const xm = (x0 + x1) / 2, ya = y0 + 40;
    SVG.arrow(g, xm + 6, ya, xm + 60, ya, { w: 1.1, l: 10, b: 3.5 });
    SVG.text(g, xm, ya + 5, o.xSym, { 'text-anchor': 'end', 'font-size': 15 });
    const xa = 16, ym = (y0 + y1) / 2;
    SVG.arrow(g, xa, ym - 6, xa, ym - 60, { w: 1.1, l: 10, b: 3.5 });
    SVG.text(g, xa, ym + 14, o.ySym, { 'text-anchor': 'middle', 'font-size': 15 });
  }

  const linTicks = (a, b, step, dec, group) => Core.ticks(a, b, step).map(v => ({ v, label: Core.tickLabel(v, dec, { group }) }));

  // ================================================================ Ausschnitt
  const L0 = 1000, T0 = 20;
  const ex = { alpha: 12, grid: true, hover: null };
  const len = t => L0 * (1 + ex.alpha * 1e-6 * (t - T0));
  const svgFull = $('s-full'), svgCut = $('s-cut');
  const TEMPS = [20, 40, 60, 80, 100, 120];

  function cutRange() {
    const lmax = len(120), span = lmax - L0;
    const step = Core.niceStep(span, 6);
    return { lo: L0, hi: +(L0 + step * Math.ceil(span / step + 0.25)).toFixed(6), step };
  }

  function drawSeries(svg, X, Y) {
    el(svg, 'path', { d: SVG.plotFn(len, 20, 120, X, Y, 20), class: 'curve', 'stroke-width': 2.4 });
    for (const t of TEMPS) el(svg, 'circle', { cx: X(t), cy: Y(len(t)), r: 4, class: 'pt' });
  }

  function renderCut() {
    $('s-alpha-out').textContent = fmt(ex.alpha, 1) + ' · 10⁻⁶/K';
    // Mit Nullpunkt
    SVG.clear(svgFull);
    SVG.background(svgFull, 440, 360);
    let X = Core.linScale(0, 120, 82, 410), Y = Core.linScale(0, 1200, 290, 30);
    axes(svgFull, X, Y, { xt: linTicks(0, 120, 20, 0), yt: linTicks(0, 1200, 200, 0), grid: ex.grid,
      xSym: '*ϑ*', ySym: '*l*', xUnit: '°C', yUnit: 'mm' });
    drawSeries(svgFull, X, Y);
    const r = cutRange();
    const top = Math.min(Y(r.hi), Y(r.lo) - 5);
    el(svgFull, 'rect', { x: X(20) - 3, y: top - 3, width: X(120) - X(20) + 6, height: Y(r.lo) - top + 6, class: 'target' });
    el(svgFull, 'line', { x1: X(70), y1: Y(r.lo) + 4, x2: X(70), y2: Y(720) - 16, class: 'callout' });
    SVG.text(svgFull, X(70), Y(720), 'Ausschnitt rechts', { 'text-anchor': 'middle', 'font-size': 14, class: 'callout-text halo' });

    // Ausschnitt mit unterdrücktem Nullpunkt
    SVG.clear(svgCut);
    SVG.background(svgCut, 440, 360);
    X = Core.linScale(20, 120, 82, 410);
    Y = Core.linScale(r.lo, r.hi, 290, 30);
    const dec = Core.decimalsFor(r.step);
    axes(svgCut, X, Y, { xt: linTicks(20, 120, 20, 0), yt: linTicks(r.lo, r.hi, r.step, dec), grid: ex.grid, frame: true,
      xSym: '*ϑ*', ySym: '*l*', xUnit: '°C', yUnit: 'mm' });
    drawSeries(svgCut, X, Y);
    if (ex.hover != null) {
      const t = ex.hover, l = len(t);
      el(svgCut, 'line', { x1: X(t), y1: Y(r.lo), x2: X(t), y2: Y(l), class: 'read' });
      el(svgCut, 'line', { x1: X(t), y1: Y(l), x2: X(20), y2: Y(l), class: 'read' });
      el(svgCut, 'circle', { cx: X(t), cy: Y(l), r: 4.5, class: 'pt sel' });
      $('s-readout').innerHTML = `<i>ϑ</i> = ${fmt(t, 0)} °C → <i>l</i> = ${fmt(l, 3, { keepZeros: true })} mm`;
    } else {
      $('s-readout').innerHTML = `Δ<i>l</i> bei 100 K: ${fmt(len(120) - L0, 2)} mm`;
    }
    svgCut._X = X;
  }

  svgCut.addEventListener('pointermove', e => {
    const p = SVG.toLocal(svgCut, e), X = svgCut._X;
    const t = Math.round(Math.min(120, Math.max(20, X.inv(p.x))));
    if (t !== ex.hover) { ex.hover = t; renderCut(); }
  });
  svgCut.addEventListener('pointerleave', () => { ex.hover = null; renderCut(); });

  $('s-alpha').addEventListener('input', e => {
    ex.alpha = +e.target.value;
    setSeg('s-preset', ['12', '16.5', '23.5'].includes(e.target.value) ? e.target.value : '');
    renderCut();
  });
  seg('s-preset', v => { ex.alpha = +v; $('s-alpha').value = v; renderCut(); });
  chk('s-grid', v => { ex.grid = v; renderCut(); });

  // ================================================================ Lineare / logarithmische Teilung
  const VC = [25, 50, 100, 200];
  const lg = { xs: 'log', ys: 'log', vc: 100, hover: null };
  const svgLog = $('l-svg');
  const LW = 760, LH = 440, PX0 = 92, PX1 = 690, PY0 = 360, PY1 = 30;

  function scales() {
    const X = lg.xs === 'log' ? Core.logScale(1, 1000, PX0, PX1) : Core.linScale(0, 1000, PX0, PX1);
    const Y = lg.ys === 'log' ? Core.logScale(1, 100000, PY0, PY1) : Core.linScale(0, 70000, PY0, PY1);
    return { X, Y };
  }

  function renderLog() {
    const { X, Y } = scales();
    SVG.clear(svgLog);
    SVG.background(svgLog, LW, LH);
    const lt = Core.logTicks;
    const xt = X.log ? lt(1, 1000).major.map(v => ({ v, label: fmt(v, 0) })) : linTicks(0, 1000, 200, 0);
    const yt = Y.log ? lt(1, 100000).major.map(v => ({ v, label: fmt(v, 0, { group: true }) })) : linTicks(0, 70000, 10000, 0, true);
    axes(svgLog, X, Y, { xt, yt, xMinor: X.log ? lt(1, 1000).minor : [], yMinor: Y.log ? lt(1, 100000).minor : [],
      grid: true, xSym: '*d*', ySym: '*n*', xUnit: 'mm', yUnit: '1/min' });

    const defs = el(svgLog, 'defs', {});
    const cp = el(defs, 'clipPath', { id: 'l-clip' });
    el(cp, 'rect', { x: PX0, y: PY1, width: PX1 - PX0, height: PY0 - PY1 });
    const g = el(svgLog, 'g', { 'clip-path': 'url(#l-clip)' });
    const dMin = X.log ? 1 : 0.5;
    for (const vc of VC) {
      if (vc === lg.vc) continue;
      el(g, 'path', { d: SVG.plotFn(d => Core.drehzahl(vc, d), dMin, 1000, X, Y, 400), class: 'curve-muted', 'stroke-width': 1.2 });
    }
    el(g, 'path', { d: SVG.plotFn(d => Core.drehzahl(lg.vc, d), dMin, 1000, X, Y, 400), class: 'curve', 'stroke-width': 2.4 });

    // Direkte Beschriftung am rechten Ende, wo die Linien getrennt liegen (nur doppelt logarithmisch)
    if (X.log && Y.log) {
      for (const vc of VC) {
        SVG.text(svgLog, PX1 + 8, Y(Core.drehzahl(vc, 1000)) + 4, String(vc),
          { 'font-size': 13, class: vc === lg.vc ? 'lbl-strong' : 'lbl-muted' });
      }
      SVG.text(svgLog, PX1 + 8, Y(Core.drehzahl(200, 1000)) - 14, '*v*_{c} in m/min', { 'font-size': 12, class: 'lbl-muted' });
    }

    // Legende oben rechts
    const lgX = PX1 - 150, lgY = PY1 + 12;
    el(svgLog, 'rect', { x: lgX - 10, y: lgY - 4, width: 160, height: VC.length * 20 + 12, rx: 5, class: 'legend-box' });
    VC.forEach((vc, i) => {
      const y = lgY + 10 + i * 20, on = vc === lg.vc;
      el(svgLog, 'line', { x1: lgX, y1: y, x2: lgX + 28, y2: y, class: on ? 'curve' : 'curve-muted', 'stroke-width': on ? 2.4 : 1.2 });
      SVG.text(svgLog, lgX + 36, y + 4.5, `*v*_{c} = ${vc} m/min`, { 'font-size': 13, class: on ? 'lbl-strong' : 'lbl-muted' });
    });

    // Ablesung unter dem Zeiger
    if (lg.hover != null) {
      const d = lg.hover, n = Core.drehzahl(lg.vc, d);
      const inY = n >= Y.domain[0] && n <= Y.domain[1];
      const yy = inY ? Y(n) : PY1;
      el(svgLog, 'line', { x1: X(d), y1: PY0, x2: X(d), y2: yy, class: 'read' });
      if (inY) {
        el(svgLog, 'line', { x1: X(d), y1: yy, x2: PX0, y2: yy, class: 'read' });
        el(svgLog, 'circle', { cx: X(d), cy: yy, r: 4.5, class: 'pt sel' });
      }
      $('l-readout').innerHTML = `<i>d</i> = ${fmt(d, d < 10 ? 1 : 0)} mm, <i>v</i><sub>c</sub> = ${lg.vc} m/min → <i>n</i> = ${fmt(n, 0, { group: true })} 1/min`
        + (inY ? '' : ' (außerhalb der Skala)');
    } else {
      $('l-readout').textContent = '';
    }
  }

  svgLog.addEventListener('pointermove', e => {
    const p = SVG.toLocal(svgLog, e);
    if (p.x < PX0 || p.x > PX1 || p.y < PY1 - 10 || p.y > PY0 + 10) { if (lg.hover != null) { lg.hover = null; renderLog(); } return; }
    const { X } = scales();
    let d = X.inv(p.x);
    // auf gut ablesbare Werte runden: 2 signifikante Stellen
    const mag = Math.pow(10, Math.floor(Math.log10(d)) - 1);
    d = Math.max(1, Math.round(d / mag) * mag);
    if (d !== lg.hover) { lg.hover = +d.toPrecision(6); renderLog(); }
  });
  svgLog.addEventListener('pointerleave', () => { lg.hover = null; renderLog(); });

  seg('l-xs', v => { lg.xs = v; renderLog(); });
  seg('l-ys', v => { lg.ys = v; renderLog(); });
  seg('l-vc', v => { lg.vc = +v; renderLog(); });

  function render() { renderCut(); renderLog(); }

  function reset() {
    Object.assign(ex, { alpha: 12, grid: true, hover: null });
    $('s-alpha').value = 12; setSeg('s-preset', '12'); $('s-grid').checked = true;
    Object.assign(lg, { xs: 'log', ys: 'log', vc: 100, hover: null });
    setSeg('l-xs', 'log'); setSeg('l-ys', 'log'); setSeg('l-vc', '100');
    render();
  }

  UI.register('skalen', { render, reset, ex, lg });
  render();
})();

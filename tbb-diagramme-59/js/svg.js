/* SVG-Hilfen für Tabellenbuch Metall S. 59:
   Elemente, Text mit Kursiv/Index, Pfeile, Messwertzeichen (○, ×, □), Kreisbögen, Sektoren, Polarkurven, Ziehen */
const SVG = (() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  function el(parent, tag, attrs = {}, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  // Text mit kleiner Auszeichnung: *kursiv*, _{tief}, ^{hoch}. Schriftgröße über attrs['font-size'].
  function text(parent, x, y, markup, attrs = {}) {
    const fs = +(attrs['font-size'] || 14);
    const t = el(parent, 'text', Object.assign({ x: +x.toFixed(1), y: +y.toFixed(1), 'font-size': fs }, attrs));
    let italic = false, offset = 0;
    const parts = String(markup).match(/\*|_\{[^}]*\}|\^\{[^}]*\}|[^*_^]+|[_^]/g) || [];
    for (const p of parts) {
      if (p === '*') { italic = !italic; continue; }
      let str = p, shift = 0, small = false;
      if (/^[_^]\{/.test(p)) { str = p.slice(2, -1); shift = p[0] === '_' ? 0.3 * fs : -0.4 * fs; small = true; }
      el(t, 'tspan', {
        dy: shift - offset ? +(shift - offset).toFixed(2) : null,
        'font-size': small ? +(0.72 * fs).toFixed(1) : null,
        'font-style': italic ? 'italic' : null
      }, str);
      offset = shift;
    }
    return t;
  }

  const nameMarkup = name => String(name).replace(/^([A-Za-z]+)(\d+)$/, '$1_{$2}');

  // Gefüllte Pfeilspitze mit Spitze in (x, y), Richtung in Grad (SVG-Koordinaten: 0 = rechts, −90 = oben, 90 = unten)
  function arrowHead(parent, x, y, deg, l = 12, b = 4, cls = 'ax-head') {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const bx = x - l * c, by = y - l * s;
    const pts = [[x, y], [bx - b * s, by + b * c], [bx + b * s, by - b * c]];
    return el(parent, 'polygon', { points: pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '), class: cls });
  }

  function arrow(parent, x1, y1, x2, y2, opts = {}) {
    const l = opts.l || 12, b = opts.b || 4;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ex = x2 - (x2 - x1) / len * l * 0.8, ey = y2 - (y2 - y1) / len * l * 0.8;
    const g = el(parent, 'g', { class: opts.cls || null });
    el(g, 'line', { x1, y1, x2: ex, y2: ey, class: opts.lineCls || 'ax', 'stroke-width': opts.w || null });
    arrowHead(g, x2, y2, Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, l, b, opts.headCls || 'ax-head');
    return g;
  }

  // Besondere Zeichen für streuende Messwerte nach DIN 461: 'cross' (×), 'circle' (○), 'square' (□), 'triangle' (△)
  function marker(parent, kind, x, y, r = 4.6, cls = 'pt-mark') {
    const cx = +x.toFixed(1), cy = +y.toFixed(1);
    if (kind === 'cross') {
      const d = (r * 0.88).toFixed(1);
      return el(parent, 'path', {
        d: `M${(cx - d).toFixed(1)} ${(cy - d).toFixed(1)}L${(+cx + +d).toFixed(1)} ${(+cy + +d).toFixed(1)}M${(+cx + +d).toFixed(1)} ${(cy - d).toFixed(1)}L${(cx - d).toFixed(1)} ${(+cy + +d).toFixed(1)}`,
        class: cls + ' mark-cross'
      });
    }
    if (kind === 'square') {
      const s = +(r * 0.86).toFixed(1);
      return el(parent, 'rect', { x: (cx - s).toFixed(1), y: (cy - s).toFixed(1), width: (2 * s).toFixed(1), height: (2 * s).toFixed(1), class: cls + ' mark-open' });
    }
    if (kind === 'triangle') {
      const h = r * 1.1;
      const pts = `${cx},${(cy - h).toFixed(1)} ${(cx - h * 0.9).toFixed(1)},${(cy + h * 0.7).toFixed(1)} ${(cx + h * 0.9).toFixed(1)},${(cy + h * 0.7).toFixed(1)}`;
      return el(parent, 'polygon', { points: pts, class: cls + ' mark-open' });
    }
    return el(parent, 'circle', { cx, cy, r: (r * 0.92).toFixed(1), class: cls + ' mark-open' });
  }

  function path(points, closed = false) {
    if (!points.length) return '';
    return points.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + (closed ? ' Z' : '');
  }

  function plotFn(f, a, b, sx, sy, n = 160) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n;
      const y = f(x);
      if (isFinite(y)) pts.push([sx(x), sy(y)]);
    }
    return path(pts);
  }

  // Polare Kurve rFn(deg) für 0°…360° als geschlossener Pfad; rToPx bildet den Radius auf Pixel ab
  function plotPolar(rFn, cx, cy, rToPx, n = 240) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const deg = 360 * i / n;
      const rPx = rToPx(rFn(deg));
      pts.push(Core.polarToScreen(cx, cy, rPx, deg));
    }
    return path(pts, true);
  }

  // Kreisbogen von deg0 nach deg1 (mathematisch positiv = gegen den Uhrzeigersinn)
  function arcPath(cx, cy, rPx, deg0, deg1) {
    const span = deg1 - deg0;
    if (Math.abs(span) < 1e-6) return '';
    if (Math.abs(span) >= 359.99) {
      return `M ${(cx + rPx).toFixed(1)} ${cy.toFixed(1)} A ${rPx.toFixed(1)} ${rPx.toFixed(1)} 0 1 0 ${(cx - rPx).toFixed(1)} ${cy.toFixed(1)} A ${rPx.toFixed(1)} ${rPx.toFixed(1)} 0 1 0 ${(cx + rPx).toFixed(1)} ${cy.toFixed(1)}`;
    }
    const [x0, y0] = Core.polarToScreen(cx, cy, rPx, deg0);
    const [x1, y1] = Core.polarToScreen(cx, cy, rPx, deg1);
    const large = Math.abs(span) > 180 ? 1 : 0;
    const sweep = span > 0 ? 0 : 1; // SVG y-Achse nach unten: gegen Uhrzeigersinn ist sweep = 0
    return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${rPx.toFixed(1)} ${rPx.toFixed(1)} 0 ${large} ${sweep} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }

  // Kreissektor (Tortenscheibe) von deg0 nach deg1 gegen den Uhrzeigersinn
  function sectorPath(cx, cy, rPx, deg0, deg1) {
    const span = deg1 - deg0;
    if (Math.abs(span) <= 1e-6) return '';
    if (Math.abs(span) >= 359.99) return arcPath(cx, cy, rPx, 0, 360) + ' Z';
    const [x0, y0] = Core.polarToScreen(cx, cy, rPx, deg0);
    const [x1, y1] = Core.polarToScreen(cx, cy, rPx, deg1);
    const large = Math.abs(span) > 180 ? 1 : 0;
    const sweep = span > 0 ? 0 : 1;
    return `M ${cx.toFixed(1)} ${cy.toFixed(1)} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${rPx.toFixed(1)} ${rPx.toFixed(1)} 0 ${large} ${sweep} ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
  }

  // Winkelbogen mit Pfeilspitze am Ende deg1 (für +φ im Polardiagramm und Mittelpunktswinkel α)
  function angleArc(parent, cx, cy, rPx, deg0, deg1, opts = {}) {
    const span = deg1 - deg0;
    if (Math.abs(span) < 0.5) return null;
    const g = el(parent, 'g', { class: opts.cls || null });
    const l = opts.l || 10, b = opts.b || 3.4;
    const dDeg = Math.sign(span) * Math.min(Math.abs(span) * 0.35, (l * 0.75 / rPx) * 180 / Math.PI);
    const arcEnd = deg1 - dDeg;
    el(g, 'path', { d: arcPath(cx, cy, rPx, deg0, arcEnd), class: opts.lineCls || 'ax', fill: 'none', 'stroke-width': opts.w || 1.2 });
    const [tx, ty] = Core.polarToScreen(cx, cy, rPx, deg1);
    const [bx, by] = Core.polarToScreen(cx, cy, rPx, deg1 - Math.sign(span) * Math.max(1.5, Math.abs(dDeg)));
    const headDeg = Math.atan2(ty - by, tx - bx) * 180 / Math.PI;
    arrowHead(g, tx, ty, headDeg, l, b, opts.headCls || 'ax-head');
    if (opts.bothHeads && Math.abs(span) > 14) {
      const [sx, sy] = Core.polarToScreen(cx, cy, rPx, deg0);
      const [sbx, sby] = Core.polarToScreen(cx, cy, rPx, deg0 + Math.sign(span) * Math.max(1.5, Math.abs(dDeg)));
      arrowHead(g, sx, sy, Math.atan2(sy - sby, sx - sbx) * 180 / Math.PI, l, b, opts.headCls || 'ax-head');
    }
    return g;
  }

  function toLocal(svg, evt) {
    const p = svg.createSVGPoint();
    p.x = evt.clientX; p.y = evt.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  function startDrag(svg, evt, onMove, onEnd) {
    evt.preventDefault();
    const move = e => onMove(toLocal(svg, e), e);
    const up = e => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (onEnd) onEnd(e);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function background(svg, w, h, cls = 'bg') {
    return el(svg, 'rect', { x: 0, y: 0, width: w, height: h, class: cls });
  }

  return {
    NS, el, clear, text, nameMarkup, arrowHead, arrow, marker, path, plotFn,
    plotPolar, arcPath, sectorPath, angleArc, toLocal, startDrag, background
  };
})();

/* SVG helpers: elements, markup text with italics/sub/superscripts, arrows, axes, pointer coords, dragging */
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

  // Text with lightweight markup: *italic*, _{sub}, ^{sup}. Font size via attrs['font-size'].
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

  // Format point names like 'P1' with subscript number
  const nameMarkup = name => String(name).replace(/^([A-Za-z]+)(\d+)$/, '$1_{$2}');

  // Filled arrowhead with tip at (x, y), angle in degrees (0 = right, −90 = up)
  function arrowHead(parent, x, y, deg, l = 12, b = 4, cls = 'ax-head') {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const bx = x - l * c, by = y - l * s;
    const pts = [[x, y], [bx - b * s, by + b * c], [bx + b * s, by - b * c]];
    return el(parent, 'polygon', { points: pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '), class: cls });
  }

  // Arrow from (x1, y1) to (x2, y2); shaft ends just inside the arrowhead base
  function arrow(parent, x1, y1, x2, y2, opts = {}) {
    const l = opts.l || 12, b = opts.b || 4;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ex = x2 - (x2 - x1) / len * l * 0.8, ey = y2 - (y2 - y1) / len * l * 0.8;
    const g = el(parent, 'g', { class: opts.cls || null });
    el(g, 'line', { x1, y1, x2: ex, y2: ey, class: opts.lineCls || 'ax', 'stroke-width': opts.w || null });
    arrowHead(g, x2, y2, Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, l, b, opts.headCls || 'ax-head');
    return g;
  }

  function path(points) {
    return points.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  }

  // Sample function f over [a, b] onto scales sx, sy as an SVG path
  function plotFn(f, a, b, sx, sy, n = 160) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const x = sx.log ? Math.pow(10, Math.log10(a) + (Math.log10(b) - Math.log10(a)) * i / n) : a + (b - a) * i / n;
      const y = f(x);
      if (isFinite(y)) pts.push([sx(x), sy(y)]);
    }
    return path(pts);
  }

  // Pointer position in SVG viewBox coordinates
  function toLocal(svg, evt) {
    const p = svg.createSVGPoint();
    p.x = evt.clientX; p.y = evt.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  // Dragging via window listeners so the SVG may be re-rendered during drag
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

  // Diagram plot background (uses gradient from global defs in index.html)
  function background(svg, w, h, cls = 'bg') {
    return el(svg, 'rect', { x: 0, y: 0, width: w, height: h, class: cls });
  }

  return { NS, el, clear, text, nameMarkup, arrowHead, arrow, path, plotFn, toLocal, startDrag, background };
})();

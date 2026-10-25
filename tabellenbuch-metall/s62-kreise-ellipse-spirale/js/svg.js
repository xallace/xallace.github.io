/* SVG-Hilfen für Tabellenbuch Metall S. 62 (3.2 Geometrische Grundkonstruktionen:
   Inkreis, Umkreis, Kreismittelpunkt, Ellipse, Spirale):
   Zirkelbögen, Kreise, Dreiecke, Mittelsenkrechte, Ellipsen, Spiralbögen,
   rote Schrittzahlen 1..6 wie im Buch, Rechtwinkelzeichen, ziehbare Punkte */
const SVG = (() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  function el(parent, tag, attrs = {}, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  // Text mit kleiner Auszeichnung: *kursiv*, _{tief}, ^{hoch}.
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

  // Gefüllte Pfeilspitze
  function arrowHead(parent, x, y, deg, l = 11, b = 3.4, cls = 'ax-head') {
    const a = deg * DEG, c = Math.cos(a), s = Math.sin(a);
    const bx = x - l * c, by = y - l * s;
    const pts = [[x, y], [bx - b * s, by + b * c], [bx + b * s, by - b * c]];
    return el(parent, 'polygon', { points: pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '), class: cls });
  }

  function arrow(parent, x1, y1, x2, y2, opts = {}) {
    const l = opts.l || 11, b = opts.b || 3.4;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ex = x2 - (x2 - x1) / len * l * 0.75, ey = y2 - (y2 - y1) / len * l * 0.75;
    const g = el(parent, 'g', { class: opts.cls || null });
    el(g, 'line', {
      x1: x1.toFixed(1), y1: y1.toFixed(1), x2: ex.toFixed(1), y2: ey.toFixed(1),
      class: opts.lineCls || 'thin-line', 'stroke-width': opts.w || 1.1
    });
    arrowHead(g, x2, y2, Math.atan2(y2 - y1, x2 - x1) * RAD, l, b, opts.headCls || 'ax-head');
    return g;
  }

  function screenPolar(center, r, screenDeg) {
    const a = screenDeg * DEG;
    return { x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) };
  }

  // Zirkelbogen um center mit Radius r von screenDeg0 bis screenDeg1
  function compassArc(parent, center, r, screenDeg0, screenDeg1, opts = {}) {
    let span = screenDeg1 - screenDeg0;
    if (Math.abs(span) < 1e-4 || r <= 0) return null;
    const p0 = screenPolar(center, r, screenDeg0);
    const p1 = screenPolar(center, r, screenDeg1);
    const large = Math.abs(span) > 180 ? 1 : 0;
    const sweep = span > 0 ? 1 : 0;
    const d = `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 ${large} ${sweep} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    return el(parent, 'path', {
      d,
      class: opts.cls || 'arc-line',
      'stroke-width': opts.w || 1.3,
      'stroke-dasharray': opts.dash || null
    });
  }

  // Kreis
  function circle(parent, center, r, opts = {}) {
    return el(parent, 'circle', {
      cx: center.x.toFixed(1),
      cy: center.y.toFixed(1),
      r: r.toFixed(1),
      class: opts.cls || 'thin-line',
      'stroke-width': opts.w || 1.2,
      fill: opts.fill || 'none',
      'stroke-dasharray': opts.dash || null
    });
  }

  // Linie
  function line(parent, p1, p2, opts = {}) {
    return el(parent, 'line', {
      x1: p1.x.toFixed(1), y1: p1.y.toFixed(1),
      x2: p2.x.toFixed(1), y2: p2.y.toFixed(1),
      class: opts.cls || 'thin-line',
      'stroke-width': opts.w || 1.2,
      'stroke-dasharray': opts.dash || null
    });
  }

  // DIN-Mittelpunktskreuz
  function centerMark(parent, c, size = 12) {
    const g = el(parent, 'g', { class: 'center-mark' });
    const s = size / 2;
    el(g, 'line', { x1: (c.x - s).toFixed(1), y1: c.y.toFixed(1), x2: (c.x + s).toFixed(1), y2: c.y.toFixed(1), class: 'thin-line', 'stroke-width': 1.1 });
    el(g, 'line', { x1: c.x.toFixed(1), y1: (c.y - s).toFixed(1), x2: c.x.toFixed(1), y2: (c.y + s).toFixed(1), class: 'thin-line', 'stroke-width': 1.1 });
    return g;
  }

  // Rote Schrittnummer 1..6 wie im Tabellenbuch
  function stepNum(parent, x, y, num, opts = {}) {
    const g = el(parent, 'g', { class: 'step-tag' });
    const isHl = opts.hl;
    el(g, 'text', {
      x: x.toFixed(1), y: y.toFixed(1),
      class: 'step-num halo',
      'font-size': isHl ? 18 : 15,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      fill: isHl ? 'var(--hl)' : 'var(--accent)'
    }, String(num));
    return g;
  }

  // Konstruktionspunkt mit Beschriftung
  function point(parent, p, opts = {}) {
    const g = el(parent, 'g', { class: 'geom-pt' });
    const r = opts.r || (opts.drag ? 5.5 : 3.5);
    const cls = opts.drag ? 'pt-drag' : 'pt-circ';
    const c = el(g, 'circle', {
      cx: p.x.toFixed(1), cy: p.y.toFixed(1), r,
      class: cls + (opts.sel ? ' selected' : ''),
      'data-pt': opts.drag || null
    });
    if (opts.label) {
      const dx = opts.dx != null ? opts.dx : 8;
      const dy = opts.dy != null ? opts.dy : -8;
      text(g, p.x + dx, p.y + dy, opts.label, {
        class: 'pt-label halo',
        'font-size': opts.fs || 13,
        'text-anchor': opts.anchor || (dx < 0 ? 'end' : 'start')
      });
    }
    return g;
  }

  // Rechtwinkel-Markierung mit Punkt (DIN ISO 128)
  function rightAngleMark(parent, vertex, arm1Pt, arm2Pt, size = 11) {
    const u1 = { x: arm1Pt.x - vertex.x, y: arm1Pt.y - vertex.y };
    const u2 = { x: arm2Pt.x - vertex.x, y: arm2Pt.y - vertex.y };
    const l1 = Math.hypot(u1.x, u1.y) || 1, l2 = Math.hypot(u2.x, u2.y) || 1;
    const e1 = { x: (u1.x / l1) * size, y: (u1.y / l1) * size };
    const e2 = { x: (u2.x / l2) * size, y: (u2.y / l2) * size };
    const corner = { x: vertex.x + e1.x + e2.x, y: vertex.y + e1.y + e2.y };
    const p1 = { x: vertex.x + e1.x, y: vertex.y + e1.y };
    const p2 = { x: vertex.x + e2.x, y: vertex.y + e2.y };
    const g = el(parent, 'g', { class: 'right-angle' });
    el(g, 'polyline', {
      points: `${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${corner.x.toFixed(1)},${corner.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`,
      class: 'thin-line', 'stroke-width': 1.1, fill: 'none'
    });
    // Punkt in der Ecke
    el(g, 'circle', {
      cx: (vertex.x + (e1.x + e2.x) * 0.5).toFixed(1),
      cy: (vertex.y + (e1.y + e2.y) * 0.5).toFixed(1),
      r: 1.6, fill: 'var(--ink)'
    });
    return g;
  }

  // Zieh-Handler für interaktive Punkte
  function makeDraggable(svgEl, onDrag) {
    let activeKey = null;

    function getPos(e) {
      const rect = svgEl.getBoundingClientRect();
      const scaleX = svgEl.viewBox.baseVal.width / rect.width;
      const scaleY = svgEl.viewBox.baseVal.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    svgEl.addEventListener('pointerdown', e => {
      const target = e.target.closest('[data-pt]');
      if (!target) return;
      activeKey = target.getAttribute('data-pt');
      svgEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    svgEl.addEventListener('pointermove', e => {
      if (!activeKey) return;
      const p = getPos(e);
      onDrag(activeKey, p);
      e.preventDefault();
    });

    const stop = e => {
      if (activeKey) {
        activeKey = null;
        if (e.pointerId && svgEl.hasPointerCapture && svgEl.hasPointerCapture(e.pointerId)) {
          svgEl.releasePointerCapture(e.pointerId);
        }
      }
    };

    svgEl.addEventListener('pointerup', stop);
    svgEl.addEventListener('pointercancel', stop);
  }

  return {
    el, clear, text, arrowHead, arrow, screenPolar, compassArc, circle, line, centerMark, stepNum, point, rightAngleMark, makeDraggable
  };
})();

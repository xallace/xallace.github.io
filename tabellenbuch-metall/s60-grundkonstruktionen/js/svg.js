/* SVG-Hilfen für Tabellenbuch Metall S. 60 (3.2 Geometrische Grundkonstruktionen):
   Strecken mit Endstrichen, Zirkelbögen, Radiuspfeile r, rote Schrittzahlen 1..5,
   Rechtwinkelzeichen (Bogen mit Punkt), Winkelbögen, ziehbare Punkte */
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

  // Gefüllte Pfeilspitze mit Spitze in (x, y), Richtung deg in SVG-Bildschirmkoordinaten (0° rechts, +90° unten)
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

  // Punkt auf Kreis um center mit Radius r bei Bildschirmwinkel screenDeg (0° rechts, +90° unten)
  function screenPolar(center, r, screenDeg) {
    const a = screenDeg * DEG;
    return { x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) };
  }

  function screenAngle(center, pt) {
    return Math.atan2(pt.y - center.y, pt.x - center.x) * RAD;
  }

  // Zirkelbogen um center mit Radius r von screenDeg0 bis screenDeg1 (in Bildschirmgrad, im Uhrzeigersinn wenn screenDeg1 > screenDeg0)
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
      'stroke-width': opts.w || null,
      'stroke-dasharray': opts.dash || null
    });
  }

  // Zirkelbogen um center mit Radius r, zentriert um die Richtung zu targetPt mit ±halfSpanDeg Überstand
  function arcThroughPoint(parent, center, r, targetPt, halfSpanDeg = 22, opts = {}) {
    const midDeg = screenAngle(center, targetPt);
    return compassArc(parent, center, r, midDeg - halfSpanDeg, midDeg + halfSpanDeg, opts);
  }

  // Zirkelbogen um center mit Radius r, der durch zwei Schnittpunkte pA und pB läuft (mit ±padDeg Überstand)
  function arcBetweenPoints(parent, center, r, pA, pB, padDeg = 14, opts = {}) {
    let a1 = screenAngle(center, pA);
    let a2 = screenAngle(center, pB);
    let diff = ((a2 - a1 + 540) % 360) - 180;
    if (diff >= 0) return compassArc(parent, center, r, a1 - padDeg, a1 + diff + padDeg, opts);
    return compassArc(parent, center, r, a1 + diff - padDeg, a1 + padDeg, opts);
  }

  // Radiuspfeil vom Zentrum zum Zirkelbogen bei screenDeg mit Beschriftung „r“ (wie im Tabellenbuch)
  function radiusArrow(parent, center, r, screenDeg, label = '*r*', opts = {}) {
    const tip = screenPolar(center, r, screenDeg);
    const startFrac = opts.startFrac != null ? opts.startFrac : 0.0;
    const p0 = screenPolar(center, r * startFrac, screenDeg);
    const g = arrow(parent, p0.x, p0.y, tip.x, tip.y, {
      lineCls: opts.lineCls || 'thin-line',
      headCls: opts.headCls || 'ax-head',
      w: opts.w || 1.05,
      l: 11, b: 3.3
    });
    if (label) {
      const labelFrac = opts.labelFrac || 0.54;
      const midP = screenPolar(center, r * labelFrac, screenDeg);
      const nAngle = (screenDeg + (opts.labelSide === 'right' ? 90 : -90)) * DEG;
      const off = opts.labelOffset || 11;
      text(g, midP.x + Math.cos(nAngle) * off, midP.y + Math.sin(nAngle) * off + 4, label, {
        'text-anchor': 'middle', 'font-size': 14.5, class: 'halo ' + (opts.textCls || '')
      });
    }
    return g;
  }

  // Strecke AB mit senkrechten Endstrichen (wie bei „Strecke AB“ im Tabellenbuch S. 60)
  function segmentWithTicks(parent, A, B, opts = {}) {
    const g = el(parent, 'g', { class: opts.cls || null });
    el(g, 'line', {
      x1: A.x.toFixed(1), y1: A.y.toFixed(1), x2: B.x.toFixed(1), y2: B.y.toFixed(1),
      class: opts.lineCls || 'given-line', 'stroke-width': opts.w || 2.3
    });
    const tickHalf = opts.tickHalf || 5.5;
    const dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l * tickHalf, ny = dx / l * tickHalf;
    if (opts.tickA !== false) {
      el(g, 'line', {
        x1: (A.x - nx).toFixed(1), y1: (A.y - ny).toFixed(1),
        x2: (A.x + nx).toFixed(1), y2: (A.y + ny).toFixed(1),
        class: opts.lineCls || 'given-line', 'stroke-width': 1.7
      });
    }
    if (opts.tickB !== false) {
      el(g, 'line', {
        x1: (B.x - nx).toFixed(1), y1: (B.y - ny).toFixed(1),
        x2: (B.x + nx).toFixed(1), y2: (B.y + ny).toFixed(1),
        class: opts.lineCls || 'given-line', 'stroke-width': 1.7
      });
    }
    return g;
  }

  // Rote Schrittzahl 1..5 im Buchstil
  function stepNum(parent, x, y, num, opts = {}) {
    return text(parent, x, y, String(num), {
      'text-anchor': opts.anchor || 'middle',
      'font-size': opts.size || 15.5,
      class: 'halo step-num' + (opts.hl ? ' hl-text' : '')
    });
  }

  // Rechtwinkelbogen mit Punkt im Scheitel V zwischen P1 und P2
  function rightAngle(parent, V, P1, P2, r = 18, opts = {}) {
    const a1 = screenAngle(V, P1);
    const a2 = screenAngle(V, P2);
    let diff = ((a2 - a1 + 540) % 360) - 180;
    const g = el(parent, 'g', { class: opts.cls || null });
    compassArc(g, V, r, a1, a1 + diff, { cls: opts.lineCls || 'thin-line', w: 1.15 });
    const midA = (a1 + diff / 2) * DEG;
    el(g, 'circle', {
      cx: (V.x + r * 0.52 * Math.cos(midA)).toFixed(1),
      cy: (V.y + r * 0.52 * Math.sin(midA)).toFixed(1),
      r: 1.7,
      class: 'ax-head'
    });
    return g;
  }

  // Winkelbogen mit zwei Pfeilspitzen nach innen (wie beim Winkel α im Buch)
  function angleArcBoth(parent, V, P1, P2, r = 46, label = '*α*', opts = {}) {
    const a1 = screenAngle(V, P1);
    const a2 = screenAngle(V, P2);
    let diff = ((a2 - a1 + 540) % 360) - 180;
    if (Math.abs(diff) < 3) return null;
    const g = el(parent, 'g', { class: opts.cls || null });
    compassArc(g, V, r, a1, a1 + diff, { cls: opts.lineCls || 'thin-line', w: 1.15 });
    const sgn = Math.sign(diff);
    // Tangentiale Pfeilspitzen an beiden Schenkeln
    const pStart = screenPolar(V, r, a1);
    const pEnd = screenPolar(V, r, a1 + diff);
    arrowHead(g, pStart.x, pStart.y, a1 - sgn * 90 + (sgn > 0 ? 4 : -4), 10, 3.1, opts.headCls || 'ax-head');
    arrowHead(g, pEnd.x, pEnd.y, a1 + diff + sgn * 90 - (sgn > 0 ? 4 : -4), 10, 3.1, opts.headCls || 'ax-head');
    if (label) {
      const midA = a1 + diff * (opts.labelPos || 0.5);
      const lp = screenPolar(V, r + (opts.labelOffset || -14), midA);
      text(g, lp.x, lp.y + 4, label, { 'text-anchor': 'middle', 'font-size': 15, class: 'halo ' + (opts.textCls || '') });
    }
    return g;
  }

  // Offener Punkt-Kreis (wie P, A, B, S im Buch) + optional ziehbarer Hit-Bereich
  function point(parent, P, opts = {}) {
    const g = el(parent, 'g', {});
    el(g, 'circle', {
      cx: P.x.toFixed(1), cy: P.y.toFixed(1),
      r: opts.r || 4.2,
      class: 'pt' + (opts.sel ? ' sel' : '') + (opts.res ? ' pt-res' : '')
    });
    if (opts.drag) {
      el(g, 'circle', {
        cx: P.x.toFixed(1), cy: P.y.toFixed(1),
        r: 15,
        class: 'pt-hit',
        'data-drag': opts.drag
      });
    }
    if (opts.label) {
      text(g, P.x + (opts.dx || 0), P.y + (opts.dy != null ? opts.dy : -10), opts.label, {
        'text-anchor': opts.anchor || 'middle',
        'font-size': opts.fontSize || 15,
        class: 'halo ' + (opts.labelCls || '')
      });
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

  return {
    NS, el, clear, text, arrowHead, arrow,
    screenPolar, screenAngle, compassArc, arcThroughPoint, arcBetweenPoints,
    radiusArrow, segmentWithTicks, stepNum, rightAngle, angleArcBoth, point,
    toLocal, startDrag
  };
})();

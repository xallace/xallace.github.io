/* Calculation core without DOM: number formatting, point notations, scales, interpolation.
   Runs in the browser (window.Core) and in Node (module.exports) for tests/verify.js. */
(function (root) {
  'use strict';

  const MINUS = '−';
  const THIN = ' ';

  // Number formatting: decimal point, true minus sign, no trailing zeros.
  // opts.noMinus omits the minus sign (only for the error demonstration in Tab 2),
  // opts.group separates thousands from 10 000 upward with a thin space.
  function fmt(v, dec = 2, opts = {}) {
    if (!isFinite(v)) return '–';
    if (Math.abs(v) < 0.5 * Math.pow(10, -dec)) v = 0;
    let s = Math.abs(v).toFixed(dec);
    if (!opts.keepZeros && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    let [int, frac] = s.split('.');
    if (opts.group && int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
    s = frac ? int + '.' + frac : int;
    return (v < 0 && !opts.noMinus ? MINUS : '') + s;
  }

  // Axis tick label: all numbers on an axis share the same decimal places (0.8  1.0  1.2), except 0 without
  function tickLabel(v, dec, opts = {}) {
    return Math.abs(v) < 1e-12 ? '0' : fmt(v, dec, Object.assign({ keepZeros: true }, opts));
  }

  // Parse input: decimal point or comma, minus as - or −
  function parseNum(str) {
    const s = String(str).trim().replace(/[−–]/g, '-').replace(/\s/g, '').replace(',', '.');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }

  // Parses 'P3(−1.5; 2)', 'Q(2 | −1)', 'P(3.5, 1.5)', 'P3(−1,5; 2)', or just '3.5; 1.5'.
  // Returns {name, x, y} or {error}. With decimal commas, comma separation is only
  // unambiguous when a space follows the separating comma.
  function parsePoint(str) {
    const s = String(str).trim().replace(/[−–]/g, '-');
    if (!s) return { error: 'Please enter a point, e.g., P(3.5; 1.5)' };
    const m = s.match(/^([A-Za-z]\w*)?\s*\((.*)\)$/);
    const name = m ? (m[1] || '') : '';
    const body = (m ? m[2] : s).trim();
    let parts;
    if (body.includes(';')) parts = body.split(';');
    else if (body.includes('|')) parts = body.split('|');
    else if (/,\s+/.test(body)) parts = body.split(/,\s+/);
    else {
      const commas = (body.match(/,/g) || []).length;
      if (commas === 1) parts = body.split(',');
      else if (commas === 0) return { error: 'Enter two coordinates: x first, then y' };
      else return { error: 'Ambiguous: when using decimal commas, separate coordinates with ";" or "|"' };
    }
    if (parts.length !== 2) return { error: 'Enter exactly two coordinates: x first, then y' };
    const x = parseNum(parts[0]), y = parseNum(parts[1]);
    if (!isFinite(x) || !isFinite(y)) return { error: 'Unreadable number: ' + (isFinite(x) ? parts[1] : parts[0]).trim() };
    return { name, x, y };
  }

  // Point in one of three notations: 'semi' P(x; y), 'bar' P(x | y), 'comma' P(x, y)
  function pointText(name, x, y, style, dec = 2) {
    const sx = fmt(x, dec), sy = fmt(y, dec);
    const sep = style === 'bar' ? ' | ' : style === 'comma' ? ', ' : '; ';
    return name + '(' + sx + sep + sy + ')';
  }

  // Location of a point: Quadrant I–IV, Origin, or on an axis
  function quadrant(x, y) {
    if (x === 0 && y === 0) return 'Origin';
    if (y === 0) return 'on the x-axis';
    if (x === 0) return 'on the y-axis';
    if (x > 0) return y > 0 ? 'Quadrant I' : 'Quadrant IV';
    return y > 0 ? 'Quadrant II' : 'Quadrant III';
  }

  // Linear scale data -> pixel with inverse mapping
  function linScale(d0, d1, r0, r1) {
    const k = (r1 - r0) / (d1 - d0);
    const f = v => r0 + (v - d0) * k;
    f.inv = p => d0 + (p - r0) / k;
    f.domain = [d0, d1];
    f.range = [r0, r1];
    f.log = false;
    return f;
  }

  // Logarithmic scale (base-10 log), values > 0
  function logScale(d0, d1, r0, r1) {
    const l0 = Math.log10(d0), l1 = Math.log10(d1), k = (r1 - r0) / (l1 - l0);
    const f = v => r0 + (Math.log10(v) - l0) * k;
    f.inv = p => Math.pow(10, l0 + (p - r0) / k);
    f.domain = [d0, d1];
    f.range = [r0, r1];
    f.log = true;
    return f;
  }

  // Tick marks spaced by step between min and max (free of floating-point rounding noise)
  function ticks(min, max, step) {
    const out = [];
    const n0 = Math.ceil(min / step - 1e-9), n1 = Math.floor(max / step + 1e-9);
    for (let n = n0; n <= n1; n++) out.push(+(n * step).toFixed(10));
    return out;
  }

  // Nice step size 1, 2, 5 · 10^n for roughly target intervals
  function niceStep(span, target = 7) {
    const raw = span / target;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }

  // Decimal places needed for a tick step (0.25 -> 2)
  function decimalsFor(step) {
    const s = String(+step.toFixed(10));
    return s.includes('.') ? s.split('.')[1].length : 0;
  }

  // Decades and intermediate ticks (2 … 9) of a logarithmic scale
  function logTicks(min, max) {
    const major = [], minor = [];
    for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) {
      for (let k = 1; k <= 9; k++) {
        const v = +(k * Math.pow(10, e)).toPrecision(12);
        if (v < min * (1 - 1e-9) || v > max * (1 + 1e-9)) continue;
        (k === 1 ? major : minor).push(v);
      }
    }
    return { major, minor };
  }

  // Polyline through data pairs; extended beyond endpoints with end slopes
  function linear(xs, ys) {
    const n = xs.length;
    const seg = x => { let i = 0; while (i < n - 2 && x > xs[i + 1]) i++; return i; };
    const f = x => {
      const i = seg(x);
      return ys[i] + (ys[i + 1] - ys[i]) * (x - xs[i]) / (xs[i + 1] - xs[i]);
    };
    f.deriv = x => { const i = seg(x); return (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]); };
    return f;
  }

  // Monotone cubic Hermite interpolation (Fritsch-Carlson; slopes matching scipy PchipInterpolator):
  // smooth curve through all points without overshoot; monotonic data remains monotonic.
  function pchip(xs, ys) {
    const n = xs.length;
    if (n < 3) return linear(xs, ys);
    const h = [], d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) { h.push(xs[i + 1] - xs[i]); d.push((ys[i + 1] - ys[i]) / h[i]); }
    for (let k = 1; k < n - 1; k++) {
      if (d[k - 1] * d[k] <= 0) { m[k] = 0; continue; }
      const w1 = 2 * h[k] + h[k - 1], w2 = h[k] + 2 * h[k - 1];
      m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k]);
    }
    const edge = (h0, h1, d0, d1) => {
      let t = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
      if (Math.sign(t) !== Math.sign(d0)) t = 0;
      else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(t) > Math.abs(3 * d0)) t = 3 * d0;
      return t;
    };
    m[0] = edge(h[0], h[1], d[0], d[1]);
    m[n - 1] = edge(h[n - 2], h[n - 3], d[n - 2], d[n - 3]);
    const seg = x => { let i = 0; while (i < n - 2 && x > xs[i + 1]) i++; return i; };
    const f = x => {
      const i = seg(x), t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i]
        + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
    };
    f.deriv = x => {
      const i = seg(x), t = (x - xs[i]) / h[i], t2 = t * t;
      return ((6 * t2 - 6 * t) * ys[i] + (6 * t2 - 6 * t) * -ys[i + 1]) / h[i]
        + (3 * t2 - 4 * t + 1) * m[i] + (3 * t2 - 2 * t) * m[i + 1];
    };
    return f;
  }

  // Inverse of an increasing function on [a, b] via bisection
  function invert(f, y, a, b) {
    let lo = a, hi = b;
    if (y < f(lo) || y > f(hi)) return NaN;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) < y) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Cutting speed -> rotational speed: n = vc / (π · d), vc in m/min, d in mm, n in 1/min
  const drehzahl = (vc, d) => vc * 1000 / (Math.PI * d);

  const Core = { MINUS, fmt, tickLabel, parseNum, parsePoint, pointText, quadrant, linScale, logScale, ticks, niceStep,
    decimalsFor, logTicks, linear, pchip, invert, drehzahl };
  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  else root.Core = Core;
})(this);

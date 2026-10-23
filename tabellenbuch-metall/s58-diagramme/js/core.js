/* Rechenkern ohne DOM: Zahlenformat, Punkt-Schreibweisen, Skalen, Interpolation.
   Läuft im Browser (window.Core) und in Node (module.exports) für tests/verify.js. */
(function (root) {
  'use strict';

  const MINUS = '−';
  const THIN = ' ';

  // Zahl im deutschen Format: Dezimalkomma, echtes Minuszeichen, ohne überflüssige Nullen.
  // opts.noMinus lässt das Vorzeichen weg (nur für das Fehlerbild in Reiter 2),
  // opts.group trennt ab 10 000 Dreiergruppen mit schmalem Leerzeichen.
  function fmt(v, dec = 2, opts = {}) {
    if (!isFinite(v)) return '–';
    if (Math.abs(v) < 0.5 * Math.pow(10, -dec)) v = 0;
    let s = Math.abs(v).toFixed(dec);
    if (!opts.keepZeros && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    let [int, frac] = s.split('.');
    if (opts.group && int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
    s = frac ? int + ',' + frac : int;
    return (v < 0 && !opts.noMinus ? MINUS : '') + s;
  }

  // Skalenbeschriftung: alle Zahlen einer Achse mit gleich vielen Nachkommastellen (0,8  1,0  1,2), die Null ohne
  function tickLabel(v, dec, opts = {}) {
    return Math.abs(v) < 1e-12 ? '0' : fmt(v, dec, Object.assign({ keepZeros: true }, opts));
  }

  // Eingabe lesen: Komma oder Punkt als Dezimalzeichen, Minus als - oder −
  function parseNum(str) {
    const s = String(str).trim().replace(/[−–]/g, '-').replace(/\s/g, '').replace(',', '.');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }

  // Liest „P3(−1,5; 2)“, „Q(2 | −1)“, „P(3,5, 1,5)“ oder nur „3,5; 1,5“.
  // Ergebnis {name, x, y} oder {error}. Bei Dezimalkomma ist die Komma-Schreibweise
  // nur mit Leerzeichen nach dem trennenden Komma eindeutig.
  function parsePoint(str) {
    const s = String(str).trim().replace(/[−–]/g, '-');
    if (!s) return { error: 'Bitte einen Punkt eingeben, z. B. P(3,5; 1,5)' };
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
      else if (commas === 0) return { error: 'Zwei Koordinaten angeben: zuerst x, dann y' };
      else return { error: 'Mehrdeutig: Bei Dezimalkomma die Werte mit „;“ oder „|“ trennen' };
    }
    if (parts.length !== 2) return { error: 'Genau zwei Koordinaten angeben: zuerst x, dann y' };
    const x = parseNum(parts[0]), y = parseNum(parts[1]);
    if (!isFinite(x) || !isFinite(y)) return { error: 'Zahl nicht lesbar: ' + (isFinite(x) ? parts[1] : parts[0]).trim() };
    return { name, x, y };
  }

  // Punkt in einer der drei Schreibweisen: 'semi' P(x; y), 'bar' P(x | y), 'comma' P(x, y)
  function pointText(name, x, y, style, dec = 2) {
    const sx = fmt(x, dec), sy = fmt(y, dec);
    const sep = style === 'bar' ? ' | ' : style === 'comma' ? ', ' : '; ';
    return name + '(' + sx + sep + sy + ')';
  }

  // Lage eines Punktes: Quadrant I–IV oder auf einer Achse
  function quadrant(x, y) {
    if (x === 0 && y === 0) return 'Nullpunkt';
    if (y === 0) return 'auf der x-Achse';
    if (x === 0) return 'auf der y-Achse';
    if (x > 0) return y > 0 ? 'I. Quadrant' : 'IV. Quadrant';
    return y > 0 ? 'II. Quadrant' : 'III. Quadrant';
  }

  // Lineare Skala Daten → Pixel mit Umkehrung
  function linScale(d0, d1, r0, r1) {
    const k = (r1 - r0) / (d1 - d0);
    const f = v => r0 + (v - d0) * k;
    f.inv = p => d0 + (p - r0) / k;
    f.domain = [d0, d1];
    f.range = [r0, r1];
    f.log = false;
    return f;
  }

  // Logarithmische Skala (Zehnerlogarithmus), Werte > 0
  function logScale(d0, d1, r0, r1) {
    const l0 = Math.log10(d0), l1 = Math.log10(d1), k = (r1 - r0) / (l1 - l0);
    const f = v => r0 + (Math.log10(v) - l0) * k;
    f.inv = p => Math.pow(10, l0 + (p - r0) / k);
    f.domain = [d0, d1];
    f.range = [r0, r1];
    f.log = true;
    return f;
  }

  // Teilstriche im Abstand step zwischen min und max (ohne Rundungsreste)
  function ticks(min, max, step) {
    const out = [];
    const n0 = Math.ceil(min / step - 1e-9), n1 = Math.floor(max / step + 1e-9);
    for (let n = n0; n <= n1; n++) out.push(+(n * step).toFixed(10));
    return out;
  }

  // Runder Teilungsschritt 1, 2, 5 · 10^n für etwa target Teilungen
  function niceStep(span, target = 7) {
    const raw = span / target;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }

  // Nachkommastellen, die ein Teilungsschritt braucht (0,25 → 2)
  function decimalsFor(step) {
    const s = String(+step.toFixed(10));
    return s.includes('.') ? s.split('.')[1].length : 0;
  }

  // Dekaden und Zwischenteilung (2 … 9) einer logarithmischen Skala
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

  // Polygonzug durch die Wertepaare; außerhalb mit der Randsteigung verlängert
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

  // Monotone kubische Hermite-Interpolation (Fritsch–Carlson; Steigungen wie scipy PchipInterpolator):
  // glatte Kurve durch alle Punkte ohne Überschwinger, monotone Daten bleiben monoton.
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

  // Umkehrung einer im Intervall [a, b] steigenden Funktion durch Bisektion
  function invert(f, y, a, b) {
    let lo = a, hi = b;
    if (y < f(lo) || y > f(hi)) return NaN;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) < y) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Schnittgeschwindigkeit → Drehzahl: n = vc / (π · d), vc in m/min, d in mm, n in 1/min
  const drehzahl = (vc, d) => vc * 1000 / (Math.PI * d);

  const Core = { MINUS, fmt, tickLabel, parseNum, parsePoint, pointText, quadrant, linScale, logScale, ticks, niceStep,
    decimalsFor, logTicks, linear, pchip, invert, drehzahl };
  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  else root.Core = Core;
})(this);

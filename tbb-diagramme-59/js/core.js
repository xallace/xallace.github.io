/* Rechenkern ohne DOM für Tabellenbuch Metall S. 59:
   Zahlenformat, Kennlinien-Streuung, Polarkoordinaten, Rundheitsprüfung, Flächendiagramme (Mittelpunktswinkel).
   Läuft im Browser (window.Core) und in Node (module.exports) für tests/verify.js. */
(function (root) {
  'use strict';

  const MINUS = '−';
  const THIN = ' ';

  // Zahl im deutschen Format: Dezimalkomma, echtes Minuszeichen, ohne überflüssige Nullen.
  function fmt(v, dec = 2, opts = {}) {
    if (!isFinite(v)) return '–';
    if (Math.abs(v) < 0.5 * Math.pow(10, -dec)) v = 0;
    let s = Math.abs(v).toFixed(dec);
    if (!opts.keepZeros && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    let [int, frac] = s.split('.');
    if (opts.group && int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
    s = frac ? int + ',' + frac : int;
    const sign = v < 0 && !opts.noMinus ? MINUS : (v > 0 && opts.plus ? '+' : '');
    return sign + s;
  }

  function tickLabel(v, dec, opts = {}) {
    return Math.abs(v) < 1e-12 ? '0' : fmt(v, dec, Object.assign({ keepZeros: true }, opts));
  }

  function parseNum(str) {
    const s = String(str).trim().replace(/[−–]/g, '-').replace(/[°%\s]/g, '').replace(',', '.');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }

  // Lineare Skala Daten → Pixel mit Umkehrung
  function linScale(d0, d1, r0, r1) {
    const k = (r1 - r0) / (d1 - d0);
    const f = v => r0 + (v - d0) * k;
    f.inv = p => d0 + (p - r0) / k;
    f.domain = [d0, d1];
    f.range = [r0, r1];
    return f;
  }

  function ticks(min, max, step) {
    const out = [];
    const n0 = Math.ceil(min / step - 1e-9), n1 = Math.floor(max / step + 1e-9);
    for (let n = n0; n <= n1; n++) out.push(+(n * step).toFixed(10));
    return out;
  }

  function niceStep(span, target = 7) {
    const raw = span / target;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }

  function decimalsFor(step) {
    const s = String(+step.toFixed(10));
    return s.includes('.') ? s.split('.')[1].length : 0;
  }

  // Polygonzug durch Wertepaare
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

  // Monotone kubische Hermite-Interpolation (Fritsch–Carlson)
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

  // Umkehrung einer monoton steigenden oder fallenden Funktion im Intervall [a, b]
  function invert(f, y, a, b) {
    let lo = a, hi = b;
    const fa = f(a), fb = f(b);
    const inc = fb >= fa;
    const yMin = inc ? fa : fb, yMax = inc ? fb : fa;
    if (y < yMin - 1e-9 || y > yMax + 1e-9) return NaN;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (inc ? f(mid) < y : f(mid) > y) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // ================================================================ 1. Mehrere Kennlinien (Streuung)
  // Aus Messwertpaaren [u, o] je Stützstelle: Mittelwerte, Spannen, Minimum und Maximum
  function scatterStats(pairs) {
    const means = [], spans = [], mins = [], maxs = [];
    for (const [a, b] of pairs) {
      const lo = Math.min(a, b), hi = Math.max(a, b);
      mins.push(lo);
      maxs.push(hi);
      means.push((lo + hi) / 2);
      spans.push(hi - lo);
    }
    return { means, spans, mins, maxs };
  }

  // ================================================================ 2. Polarkoordinatensystem
  function normDeg(deg) {
    const d = ((deg % 360) + 360) % 360;
    return Math.abs(d - 360) < 1e-9 || Math.abs(d) < 1e-9 ? 0 : +d.toFixed(8);
  }

  function polarToCart(r, deg) {
    const rad = deg * Math.PI / 180;
    return {
      x: +(r * Math.cos(rad)).toFixed(10),
      y: +(r * Math.sin(rad)).toFixed(10)
    };
  }

  function cartToPolar(x, y) {
    const r = Math.hypot(x, y);
    if (r < 1e-12) return { r: 0, deg: 0 };
    return { r: +r.toFixed(10), deg: normDeg(Math.atan2(y, x) * 180 / Math.PI) };
  }

  // Polarkoordinaten (r, φ in Grad, 0° rechts, +φ gegen Uhrzeigersinn) ↔ Bildschirmkoordinaten (SVG y nach unten)
  function polarToScreen(cx, cy, rPx, deg) {
    const rad = deg * Math.PI / 180;
    return [cx + rPx * Math.cos(rad), cy - rPx * Math.sin(rad)];
  }

  function screenToPolar(cx, cy, px, py, pxPerUnit = 1) {
    const dx = px - cx, dy = cy - py;
    const r = Math.hypot(dx, dy) / pxPerUnit;
    const deg = r < 1e-9 ? 0 : normDeg(Math.atan2(dy, dx) * 180 / Math.PI);
    return { r, deg };
  }

  // Liest Polarpunkt „P1(3,5; 60°)“, „P(4 | 135)“ oder „3,5; 60“
  function parsePolar(str) {
    const s = String(str).trim().replace(/[−–]/g, '-');
    if (!s) return { error: 'Bitte Polarkoordinaten eingeben, z. B. P(3,5; 60°)' };
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
      else if (commas === 0) return { error: 'Radius r und Winkel φ angeben, z. B. P(3,5; 60°)' };
      else return { error: 'Mehrdeutig: Bei Dezimalkomma mit „;“ oder „|“ trennen' };
    }
    if (parts.length !== 2) return { error: 'Genau zwei Werte angeben: zuerst Radius r, dann Winkel φ' };
    const r = parseNum(parts[0]), deg = parseNum(parts[1]);
    if (!isFinite(r) || !isFinite(deg)) return { error: 'Zahl nicht lesbar' };
    if (r < 0) return { error: 'Der Radius r muss ≥ 0 sein' };
    return { name, r, deg: normDeg(deg), rawDeg: deg };
  }

  function polarText(name, r, deg, style = 'semi', decR = 1, decDeg = 0) {
    const sr = fmt(r, decR), sd = fmt(deg, decDeg) + '°';
    const sep = style === 'bar' ? ' | ' : style === 'comma' ? ', ' : '; ';
    return name + '(' + sr + sep + sd + ')';
  }

  function polarRegion(r, deg) {
    if (r === 0) return 'Nullpunkt (Pol)';
    const d = normDeg(deg);
    if (d === 0) return '0°-Achse (rechts)';
    if (d === 90) return '90°-Achse (oben)';
    if (d === 180) return '180°-Achse (links)';
    if (d === 270) return '270°-Achse (unten)';
    if (d < 90) return 'I. Quadrant (0°…90°)';
    if (d < 180) return 'II. Quadrant (90°…180°)';
    if (d < 270) return 'III. Quadrant (180°…270°)';
    return 'IV. Quadrant (270°…360°)';
  }

  // Geschlossene Beispiel-Kennlinie r(φ) des oberen Polardiagramms auf Seite 59
  function upperPolarCurve(deg) {
    const rad = deg * Math.PI / 180;
    return 3.75 - 0.32 * Math.cos(2 * rad) + 0.14 * Math.sin(rad) - 0.12 * Math.cos(3 * rad);
  }

  // ================================================================ 3. Rundheitsprüfung
  // Maßstab im Buch: 10 mm ≙ 5 µm (umPer10mm = 5 → Vergrößerung 2000 : 1)
  function umToMm(um, umPer10mm = 5) {
    return um * 10 / umPer10mm;
  }

  function mmToUm(mm, umPer10mm = 5) {
    return mm * umPer10mm / 10;
  }

  function magnification(umPer10mm = 5) {
    return Math.round(10000 / umPer10mm);
  }

  // Abweichung Δr(φ) in µm vom Sollkreis, gemessen nach dem Ausspannen: Die Backen haben die dünnwandige
  // Buchse beim Drehen eingedrückt, nach dem Ausspannen federt sie zurück und hat an jeder Backe eine Erhebung.
  // Spitze-Tal-Wert immer 2 · amp.
  // 'book' : Messschrieb der Buchseite, aus der Abbildung digitalisiert (Harmonische 2 … 5, Mittelpunkt
  //          ausgeglichen): Dreiecksform mit Erhebungen bei etwa 90°, 210°, 330° (Dreibackenfutter)
  // 'oval' : 2 Backen bei 0° und 180° (Ovalität)
  // '3jaw' : 3 Backen bei 0°, 120°, 240° (Gleichdick)
  // '4jaw' : 4 Backen bei 0°, 90°, 180°, 270°
  const BOOK_HARMONICS = [   // [k, a, b] für a · cos kφ + b · sin kφ
    [2, -0.040, -0.133], [3, -0.034, -0.840], [4, -0.077, -0.022], [5, -0.036, -0.014]
  ];
  const bookShape = rad => BOOK_HARMONICS.reduce((s, [k, a, b]) => s + a * Math.cos(k * rad) + b * Math.sin(k * rad), 0);
  const BOOK_NORM = (() => {
    let min = Infinity, max = -Infinity;
    for (let d = 0; d < 360; d += 0.5) {
      const v = bookShape(d * Math.PI / 180);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    return 2 / (max - min);
  })();

  function roundnessDelta(deg, kind = 'book', amp = 3.5) {
    const rad = deg * Math.PI / 180;
    if (kind === 'oval') return amp * Math.cos(2 * rad);
    if (kind === '3jaw') return amp * Math.cos(3 * rad);
    if (kind === '4jaw') return amp * Math.cos(4 * rad);
    return amp * BOOK_NORM * bookShape(rad);
  }

  function roundnessStats(kind = 'book', amp = 3.5) {
    let min = Infinity, max = -Infinity, minDeg = 0, maxDeg = 0;
    for (let d = 0; d < 360; d += 0.5) {
      const v = roundnessDelta(d, kind, amp);
      if (v < min) { min = v; minDeg = d; }
      if (v > max) { max = v; maxDeg = d; }
    }
    return {
      min: +min.toFixed(4),
      max: +max.toFixed(4),
      minDeg: Math.round(minDeg),
      maxDeg: Math.round(maxDeg),
      ront: +(max - min).toFixed(4)
    };
  }

  // ================================================================ 4. Flächendiagramme
  // Mittelpunktswinkel α = (360° · x %) / 100 %
  function pctToAngle(pct) {
    return +(360 * pct / 100).toFixed(8);
  }

  function angleToPct(deg) {
    return +(deg * 100 / 360).toFixed(8);
  }

  // Zerlegt einen Legierungskurznamen wie „CuZn36Pb3“ in [{sym: 'Cu', pct: 61}, {sym: 'Zn', pct: 36}, {sym: 'Pb', pct: 3}]
  function parseAlloy(code) {
    const tokens = String(code).trim().match(/[A-Z][a-z]?\d*(?:[.,]\d+)?/g);
    if (!tokens || tokens.length < 2) return null;
    const baseSym = tokens[0].replace(/[\d.,]/g, '');
    const rest = [];
    let sum = 0;
    for (let i = 1; i < tokens.length; i++) {
      const m = tokens[i].match(/^([A-Z][a-z]?)(\d+(?:[.,]\d+)?)$/);
      if (!m) return null;
      const pct = Number(m[2].replace(',', '.'));
      sum += pct;
      rest.push({ sym: m[1], pct });
    }
    if (sum >= 100) return null;
    return [{ sym: baseSym, pct: +(100 - sum).toFixed(4) }, ...rest];
  }

  const Core = {
    MINUS, fmt, tickLabel, parseNum, linScale, ticks, niceStep, decimalsFor, linear, pchip, invert,
    scatterStats, normDeg, polarToCart, cartToPolar, polarToScreen, screenToPolar,
    parsePolar, polarText, polarRegion, upperPolarCurve,
    umToMm, mmToUm, magnification, roundnessDelta, roundnessStats,
    pctToAngle, angleToPct, parseAlloy
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  else root.Core = Core;
})(this);

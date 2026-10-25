/* Rechenkern ohne DOM: Zahlenformat, Skalen und die Formeln der Seite 14.
   Läuft im Browser (window.Core) und in Node (module.exports) für tests/verify.js. */
(function (root) {
  'use strict';

  const MINUS = '−';
  const THIN = ' ';

  // Zahl im deutschen Format: Dezimalkomma, echtes Minuszeichen, ohne überflüssige Nullen.
  // opts.keepZeros behält die Nachkommastellen (395,80), opts.group trennt ab 10 000
  // Dreiergruppen mit schmalem Leerzeichen wie im Buch (200 000, aber 4000), opts.sign setzt „+“ vor positive Werte.
  function fmt(v, dec = 2, opts = {}) {
    if (!isFinite(v)) return '–';
    if (Math.abs(v) < 0.5 * Math.pow(10, -dec)) v = 0;
    let s = Math.abs(v).toFixed(dec);
    if (!opts.keepZeros && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    let [int, frac] = s.split('.');
    if (opts.group && int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
    s = frac ? int + ',' + frac : int;
    return (v < 0 ? MINUS : opts.sign && v > 0 ? '+' : '') + s;
  }

  // Skalenbeschriftung: alle Zahlen einer Achse mit gleich vielen Nachkommastellen, die Null ohne
  function tickLabel(v, dec, opts = {}) {
    return Math.abs(v) < 1e-12 ? '0' : fmt(v, dec, Object.assign({ keepZeros: true }, opts));
  }

  // Eingabe lesen: Komma oder Punkt als Dezimalzeichen, Minus als - oder −, Leerzeichen als Tausendertrenner.
  // „24.000“ und „1.250,5“ gelten als Tausenderpunkte, „0.5“ als Dezimalpunkt.
  function parseNum(str) {
    let s = String(str).trim().replace(/[−–]/g, '-').replace(/[\s  ]/g, '').replace(/€$/, '');
    if (/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '');
    s = s.replace(',', '.');
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

  // Kleinster Teilstrich ≥ max
  const niceUp = (max, step) => +(step * Math.max(1, Math.ceil(max / step - 1e-9))).toFixed(10);

  // Nachkommastellen, die ein Teilungsschritt braucht (0,25 → 2)
  function decimalsFor(step) {
    const s = String(+step.toFixed(10));
    return s.includes('.') ? s.split('.')[1].length : 0;
  }

  // ---------------------------------------------------------------- 1 Formeln: vc = π · d · n
  // Größengleichung: d in m, n in 1/min, vc in m/min. Die Tabellen geben den Faktor auf die Rechen-Einheit an.
  const D_UNIT = { mm: 0.001, cm: 0.01, m: 1 };
  const N_UNIT = { '1/min': 1, '1/s': 60 };
  const schnittgeschwindigkeit = (d, n) => Math.PI * d * n;
  const drehzahlAusVc = (vc, d) => vc / (Math.PI * d);
  const durchmesserAusVc = (vc, n) => vc / (Math.PI * n);

  // ---------------------------------------------------------------- 2 Zahlenwertgleichung: M = 9550 · P / n
  // P in kW, n in 1/min, M in N·m. Der exakte Faktor folgt aus P = M · 2π · n: 1000 W/kW · 60 s/min / 2π.
  const K_BUCH = 9550;
  const K_EXAKT = 60000 / (2 * Math.PI);
  const moment = (P, n, k = K_BUCH) => k * P / n;
  const leistung = (M, n, k = K_BUCH) => M * n / k;
  const drehzahlAusMoment = (P, M, k = K_BUCH) => k * P / M;

  // ---------------------------------------------------------------- 3 Lineare Funktion: y = m · x + b
  const linear = (m, b, x) => m * x + b;
  const nullstelle = (m, b) => (Math.abs(m) < 1e-12 ? NaN : -b / m);

  // ---------------------------------------------------------------- 4 Kosten, Erlös, Gewinnschwelle
  // KG = Kv · M + Kf, E = e · M (e = Erlös je Stück); Gewinnschwelle bei KG = E
  const kosten = (Kf, Kv, M) => Kv * M + Kf;
  const erloes = (e, M) => e * M;
  const gewinn = (Kf, Kv, e, M) => erloes(e, M) - kosten(Kf, Kv, M);
  const gewinnschwelle = (Kf, Kv, e) => (e > Kv ? Kf / (e - Kv) : NaN);

  const Core = { MINUS, THIN, fmt, tickLabel, parseNum, linScale, ticks, niceStep, niceUp, decimalsFor,
    D_UNIT, N_UNIT, schnittgeschwindigkeit, drehzahlAusVc, durchmesserAusVc,
    K_BUCH, K_EXAKT, moment, leistung, drehzahlAusMoment,
    linear, nullstelle, kosten, erloes, gewinn, gewinnschwelle };
  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  else root.Core = Core;
})(this);

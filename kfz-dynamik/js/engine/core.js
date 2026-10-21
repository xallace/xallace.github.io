/* KfzDyn – gemeinsame Mathematik-Helfer.
   Klassische Skripte (kein ES-Modul), damit die App auch per file:// läuft.
   Alle Engine-Dateien hängen sich an globalThis.KfzDyn. */
(function (root) {
  'use strict';
  const K = root.KfzDyn = root.KfzDyn || {};

  const G_ACC = 9.81;
  const DEG = Math.PI / 180;

  // ---- komplexe Zahlen als [re, im] ----
  const C = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
    div: (a, b) => {
      const d = b[0] * b[0] + b[1] * b[1];
      return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
    },
    abs: (a) => Math.hypot(a[0], a[1]),
    arg: (a) => Math.atan2(a[1], a[0]),
    scale: (a, s) => [a[0] * s, a[1] * s],
  };

  // Gauß-Elimination mit Pivotsuche für komplexe n×n-Systeme A·x = b
  function solveComplex(A, b) {
    const n = b.length;
    const M = A.map((row, i) => row.map((v) => v.slice()).concat([b[i].slice()]));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (C.abs(M[r][c]) > C.abs(M[p][c])) p = r;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < n; r++) {
        const f = C.div(M[r][c], M[c][c]);
        for (let k = c; k <= n; k++) M[r][k] = C.sub(M[r][k], C.mul(f, M[c][k]));
      }
    }
    const x = new Array(n);
    for (let r = n - 1; r >= 0; r--) {
      let s = M[r][n];
      for (let k = r + 1; k < n; k++) s = C.sub(s, C.mul(M[r][k], x[k]));
      x[r] = C.div(s, M[r][r]);
    }
    return x;
  }

  // lineare Interpolation in einer Tabelle [[x, y], ...]; außerhalb wird der Randwert gehalten
  function interp(table, x) {
    if (x <= table[0][0]) return table[0][1];
    const last = table[table.length - 1];
    if (x >= last[0]) return last[1];
    let lo = 0, hi = table.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (table[mid][0] <= x) lo = mid; else hi = mid;
    }
    const [x0, y0] = table[lo], [x1, y1] = table[hi];
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  }

  function linspace(a, b, n) {
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = a + (b - a) * i / (n - 1);
    return out;
  }

  function logspace(a, b, n) {
    return linspace(Math.log10(a), Math.log10(b), n).map((e) => Math.pow(10, e));
  }

  // Trapezregel über Stützstellen
  function trapz(xs, ys) {
    let s = 0;
    for (let i = 1; i < xs.length; i++) s += 0.5 * (ys[i] + ys[i - 1]) * (xs[i] - xs[i - 1]);
    return s;
  }

  // Nullstelle per Bisektion, f(a) und f(b) mit verschiedenem Vorzeichen
  function bisect(f, a, b, tol = 1e-9, maxIt = 200) {
    let fa = f(a);
    for (let i = 0; i < maxIt; i++) {
      const m = 0.5 * (a + b), fm = f(m);
      if (Math.abs(b - a) < tol) return m;
      if ((fa <= 0) === (fm <= 0)) { a = m; fa = fm; } else b = m;
    }
    return 0.5 * (a + b);
  }

  // ein klassischer Runge-Kutta-Schritt für y' = f(t, y)
  function rk4Step(f, t, y, h) {
    const k1 = f(t, y);
    const k2 = f(t + h / 2, y.map((v, i) => v + h / 2 * k1[i]));
    const k3 = f(t + h / 2, y.map((v, i) => v + h / 2 * k2[i]));
    const k4 = f(t + h, y.map((v, i) => v + h * k3[i]));
    return y.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }

  // reproduzierbarer Zufallsgenerator (mulberry32) für Straßenprofile
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  K.core = { G: G_ACC, DEG, C, solveComplex, interp, linspace, logspace, trapz, bisect, rk4Step, rng };
})(typeof globalThis !== 'undefined' ? globalThis : this);

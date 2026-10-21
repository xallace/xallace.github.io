/* Teil III – Schwingungen, Viertelfahrzeug mit Sitz-Mensch (Kap. 11–13).
   Bewegungsgleichungen (13.1)–(13.3), Unebenheitsspektrum (11.92),
   Streuungen (13.12), (13.15), (13.16) und Bewertete Schwingstärken (13.13)/(13.14). */
(function (root) {
  'use strict';
  const K = root.KfzDyn;
  const { C, solveComplex, interp, linspace, trapz, rk4Step, rng } = K.core;

  // Beispielfahrzeug 1 aus Tab. 13.1 (Mittelklasse-Pkw, Werte je Rad), Straße nach S. 372
  const DEFAULTS = {
    m1: 31, m2: 229, m3: 28,          // kg   Rad, Aufbau, Sitz-Mensch
    c1: 128000, c2: 20200, c3: 9900,  // N/m  Reifen, Aufbaufeder, Sitzfeder
    k2: 1140, k3: 260,                // Ns/m Aufbau-, Sitzdämpfer
    Fzstat: 2820,                     // N    statische Radlast
    PhiOmega0: 4e-6,                  // m³   Unebenheitsmaß Φh(Ω0) = 4 cm³
    Omega0: 1,                        // 1/m
    w: 2,                             // –    Welligkeit
    v: 20,                            // m/s
    fMax: 25,                         // Hz   obere Integrationsgrenze ω = 50π
    bSet: '13.2',                     // Bewertungsfunktionen: '13.2' oder '12.7'
  };

  /* Bewertungsfunktionen B in s²/m für vertikale Anregung [f in Hz, B]. Das Buch gibt sie nur als
     Diagramme an, deshalb digitalisiert. Es gibt zwei Fassungen:
     - Abb. 13.2 f/k (als 1,26²·B² aufgetragen): damit sind die Beispielwerte in Kap. 13 gerechnet
       (KSitz = 18,5, KFuß = 5,9). Standard in der App.
     - Abb. 12.7 b–d: die Bewertungsfunktionen aus Kap. 12; unter etwa 2 Hz um 30–50 % höher.
     Für die Hand gibt es nur Abb. 12.7 d. */
  const B_SITZ_132 = [[0.4, 50.2], [0.75, 38.1], [1, 31.9], [1.25, 25.8], [1.5, 20.8], [1.75, 17.5], [2, 14.9],
    [2.25, 13.6], [2.5, 13.6], [2.75, 14.7], [3, 17.1], [3.25, 19.5], [3.5, 21.9], [3.75, 23.9], [4, 26.0],
    [4.25, 27.8], [4.5, 29.7], [5, 31.1], [5.25, 29.5], [5.5, 28.1], [5.75, 26.7], [6, 25.5], [6.5, 23.4],
    [7, 21.6], [7.5, 20.0], [8, 18.6], [8.5, 17.1], [9, 15.9], [9.5, 14.8], [10, 13.6], [11, 12.1], [12, 10.8],
    [13, 9.7], [14, 8.8], [15, 7.7], [16, 6.7], [17, 6.4], [18, 6.0], [20, 4.5], [25, 3.5]];
  const B_FUSS_132 = [[0.6, 20.2], [0.75, 17.8], [1, 13.25], [1.25, 10.2], [1.5, 8.4], [1.75, 7.15], [2, 5.97],
    [2.25, 5.04], [2.5, 4.58], [2.75, 4.11], [3, 4.04], [3.25, 4.04], [3.5, 4.24], [4, 4.93], [4.5, 5.58],
    [5, 6.30], [5.5, 7.06], [6, 7.67], [6.5, 8.36], [7, 9.0], [7.5, 9.55], [8, 10.15], [8.25, 10.1], [8.5, 9.84],
    [9, 9.29], [10, 8.31], [11, 7.46], [12, 6.58], [13, 5.9], [14, 5.14], [15, 4.46], [16, 3.62], [17, 3.07],
    [18, 2.56], [20, 2.0], [25, 1.5]];
  const B_SITZ = [[0.5, 61.4], [0.75, 54.2], [1, 44.6], [1.25, 34.4], [1.5, 27.6], [1.75, 22.1], [2, 17.6],
    [2.25, 14.9], [2.5, 13.2], [2.75, 12.7], [3, 12.9], [3.25, 13.9], [3.5, 15.4], [3.75, 17.5], [4.25, 23.3],
    [4.5, 26.7], [4.75, 29.6], [5, 29.1], [5.5, 27.0], [6, 24.8], [6.5, 22.9], [7, 21.1], [7.5, 19.6], [8, 18.2],
    [9, 16.0], [10, 14.2], [11, 12.7], [12, 11.4], [13, 10.2], [14, 9.3], [15, 8.4], [16, 7.8], [17, 7.3],
    [18, 6.9], [19, 6.7], [20, 6.6]];
  const B_FUSS = [[0.63, 20.7], [0.75, 19.1], [1, 16.6], [1.25, 14.1], [1.5, 12.5], [1.75, 10.9], [2, 8.9],
    [2.25, 7.3], [2.5, 5.9], [2.75, 4.6], [3, 4.3], [3.25, 4.3], [3.5, 4.55], [4, 5.1], [5, 6.3], [6, 7.5],
    [7, 8.8], [7.75, 9.6], [8, 10.0], [8.25, 9.7], [9, 8.9], [10, 7.9], [11, 7.1], [12, 6.4], [13, 5.7],
    [14, 5.2], [15, 4.5], [16, 4.05], [17, 3.6], [18, 3.3], [19, 3.0], [20, 2.8]];
  const B_HAND = [[0.5, 35.4], [0.75, 33.1], [1, 28.5], [1.25, 25.6], [1.5, 22.9], [1.75, 20.0], [2, 17.7],
    [2.25, 15.1], [2.5, 12.7], [2.75, 10.8], [3, 8.6], [3.25, 7.0], [3.5, 5.8], [3.75, 5.1], [4, 4.9],
    [4.25, 4.9], [4.5, 5.2], [5, 5.9], [5.5, 6.9], [6, 7.9], [6.5, 9.2], [7, 10.6], [7.5, 11.6], [8, 12.0],
    [8.5, 11.3], [9, 10.4], [9.5, 9.3], [10, 8.5], [11, 7.0], [12, 5.85], [13, 4.9], [14, 4.1], [15, 3.4],
    [16, 2.9], [17, 2.5], [18, 2.3], [19, 2.15], [20, 2.1]];
  const G_STOCH = 1.26;   // Tab. 12.1
  const G_MA = { sitz: 1.1, hand: 0.75, fuss: 1.3 };

  function withDefaults(params) {
    return Object.assign({}, DEFAULTS, params);
  }

  // bezogene Kenngrößen (13.4)–(13.10)
  function characteristics(p) {
    const nu1 = Math.sqrt((p.c1 + p.c2) / p.m1), nu2 = Math.sqrt(p.c2 / p.m2);
    const nu3 = p.m3 > 0 ? Math.sqrt(p.c3 / p.m3) : NaN;
    return {
      f1: nu1 / (2 * Math.PI), f2: nu2 / (2 * Math.PI), f3: nu3 / (2 * Math.PI),
      D1: p.k2 / (2 * p.m1 * nu1), D2: p.k2 / (2 * Math.sqrt(p.c2 * p.m2)),
      D3: p.m3 > 0 ? p.k3 / (2 * Math.sqrt(p.c3 * p.m3)) : NaN,
      m3m2: p.m3 / p.m2, m1m2: p.m1 / p.m2, s1: p.Fzstat / p.c1,
    };
  }

  // komplexe Antworten z1, z2, z3 auf h = 1 bei Kreisfrequenz ω
  function response(p, w) {
    const jw = [0, w];
    const Z2 = C.add([p.c2, 0], C.scale(jw, p.k2));   // c2 + jω k2
    const Z3 = C.add([p.c3, 0], C.scale(jw, p.k3));
    const w2 = w * w;
    if (p.m3 > 0) {
      const A = [
        [C.add([-p.m1 * w2 + p.c1, 0], Z2), C.scale(Z2, -1), [0, 0]],
        [C.scale(Z2, -1), C.add(C.add([-p.m2 * w2, 0], Z2), Z3), C.scale(Z3, -1)],
        [[0, 0], C.scale(Z3, -1), C.add([-p.m3 * w2, 0], Z3)],
      ];
      const [z1, z2, z3] = solveComplex(A, [[p.c1, 0], [0, 0], [0, 0]]);
      return { z1, z2, z3 };
    }
    const A = [
      [C.add([-p.m1 * w2 + p.c1, 0], Z2), C.scale(Z2, -1)],
      [C.scale(Z2, -1), C.add([-p.m2 * w2, 0], Z2)],
    ];
    const [z1, z2] = solveComplex(A, [[p.c1, 0], [0, 0]]);
    return { z1, z2, z3: z2 };
  }

  // Beträge der Vergrößerungsfunktionen (Abb. 13.2 b, d, h, m, p)
  function magnitudes(p, w) {
    const { z1, z2, z3 } = response(p, w);
    const w2 = w * w;
    return {
      acc2: w2 * C.abs(z2),                       // |z̈2/ĥ|  1/s²
      acc3: w2 * C.abs(z3),                       // |z̈3/ĥ|
      force: p.c1 * C.abs(C.sub([1, 0], z1)),     // |F̂z/ĥ|  N/m
      dz32: C.abs(C.sub(z3, z2)),                 // |Δẑ32/ĥ|
      dz21: C.abs(C.sub(z2, z1)),                 // |Δẑ21/ĥ|
    };
  }

  // Unebenheitsspektrum: Φh(Ω) nach (11.92), Φh(ω) = Φh(Ω)/v mit Ω = ω/v
  function roadPSD(p, w) {
    const Om = w / p.v;
    return p.PhiOmega0 * Math.pow(Om / p.Omega0, -p.w) / p.v;
  }

  function weightings(bSet) {
    return bSet === '12.7'
      ? { sitz: B_SITZ, fuss: B_FUSS, hand: B_HAND }
      : { sitz: B_SITZ_132, fuss: B_FUSS_132, hand: B_HAND };
  }

  function evaluate(params, nPts = 4000) {
    const p = withDefaults(params);
    const B = weightings(p.bSet);
    const wMax = 2 * Math.PI * p.fMax;
    const W = linspace(1e-3, wMax, nPts);
    const cols = { acc2: [], acc3: [], force: [], dz32: [], dz21: [], kSitz: [], kHand: [], kFuss: [], phiH: [] };
    for (const w of W) {
      const m = magnitudes(p, w), Ph = roadPSD(p, w), f = w / (2 * Math.PI);
      cols.phiH.push(Ph);
      cols.acc2.push(m.acc2 * m.acc2 * Ph);
      cols.acc3.push(m.acc3 * m.acc3 * Ph);
      cols.force.push(m.force * m.force * Ph);
      cols.dz32.push(m.dz32 * m.dz32 * Ph);
      cols.dz21.push(m.dz21 * m.dz21 * Ph);
      cols.kSitz.push(Math.pow(G_STOCH * interp(B.sitz, f) * m.acc3, 2) * Ph);
      cols.kHand.push(Math.pow(G_STOCH * interp(B.hand, f) * m.acc2, 2) * Ph);
      cols.kFuss.push(Math.pow(G_STOCH * interp(B.fuss, f) * m.acc2, 2) * Ph);
    }
    const I = (k) => trapz(W, cols[k]);
    const sigmaF = Math.sqrt(I('force'));
    const Ksitz = Math.sqrt(I('kSitz')), Khand = Math.sqrt(I('kHand')), Kfuss = Math.sqrt(I('kFuss'));
    const Kges = Math.sqrt(Math.pow(G_MA.sitz * Ksitz, 2) + Math.pow(G_MA.hand * Khand, 2) + Math.pow(G_MA.fuss * Kfuss, 2));
    return {
      sigmaF, sigmaFrel: sigmaF / p.Fzstat,
      sigmaAcc2: Math.sqrt(I('acc2')), sigmaAcc3: Math.sqrt(I('acc3')),
      sigmaDz32: Math.sqrt(I('dz32')), sigmaDz21: Math.sqrt(I('dz21')),
      Ksitz, Khand, Kfuss, Kges, char: characteristics(p),
      spectra: { w: W, ...cols },
    };
  }

  // Frequenzkurven für die Diagramme (Abszisse Erregerfrequenz in Hz)
  function frequencyCurves(params, n = 600) {
    const p = withDefaults(params);
    const F = linspace(0.05, p.fMax, n);
    const rows = F.map((f) => magnitudes(p, 2 * Math.PI * f));
    return {
      f: F,
      acc2: rows.map((r) => r.acc2), acc3: rows.map((r) => r.acc3), force: rows.map((r) => r.force),
      dz32: rows.map((r) => r.dz32), dz21: rows.map((r) => r.dz21),
    };
  }

  /* Konfliktschaubild (Abb. 13.12 b): für feste Aufbaueigenfrequenzen ν2/2π wird D2 variiert.
     Liefert je Kurve Punkte (σF/Fzstat, Kges). */
  function conflict(params, f2List = [0.8, 1.1, 1.5, 1.8, 2.1], D2List = null) {
    const p = withDefaults(params);
    const Ds = D2List || [0.05, 0.08, 0.11, 0.15, 0.2, 0.25, 0.3, 0.37, 0.45, 0.55, 0.7];
    return f2List.map((f2) => {
      const nu2 = 2 * Math.PI * f2, c2 = p.m2 * nu2 * nu2;
      const pts = Ds.map((D2) => {
        const k2 = D2 * 2 * Math.sqrt(c2 * p.m2);
        const r = evaluate({ ...p, c2, k2 }, 1500);
        return { D2, x: r.sigmaFrel, y: r.Kges };
      });
      return { f2, pts };
    });
  }

  /* Zeitsimulation auf einem stochastischen Straßenprofil, das aus dem Spektrum (11.92)
     als Summe von Kosinusschwingungen mit Zufallsphasen erzeugt wird. */
  function roadProfile(params, seed = 7, nWaves = 200) {
    const p = withDefaults(params);
    const r = rng(seed);
    const OmMin = 0.05, OmMax = 2 * Math.PI * p.fMax / Math.max(p.v, 1) * 1.2;
    const waves = [];
    const lnMin = Math.log(OmMin), lnMax = Math.log(Math.max(OmMax, OmMin * 2));
    for (let k = 0; k < nWaves; k++) {
      const Om = Math.exp(lnMin + (lnMax - lnMin) * (k + 0.5) / nWaves);
      const dOm = Om * (lnMax - lnMin) / nWaves;
      const PhiOm = p.PhiOmega0 * Math.pow(Om / p.Omega0, -p.w);
      waves.push({ Om, amp: Math.sqrt(2 * PhiOm * dOm), ph: 2 * Math.PI * r() });
    }
    return (x) => {
      let h = 0;
      for (const wv of waves) h += wv.amp * Math.cos(wv.Om * x + wv.ph);
      return h;
    };
  }

  function simulate(params, duration = 8, dt = 0.001, seed = 7) {
    const p = withDefaults(params);
    const road = roadProfile(p, seed);
    const hasSeat = p.m3 > 0;
    // Zustand [z1, z2, z3, ż1, ż2, ż3] relativ zur statischen Ruhelage
    const f = (t, y) => {
      const h = road(p.v * t);
      const [z1, z2, z3, v1, v2, v3] = y;
      const F2 = p.k2 * (v2 - v1) + p.c2 * (z2 - z1);
      const F3 = hasSeat ? p.k3 * (v3 - v2) + p.c3 * (z3 - z2) : 0;
      const a1 = (F2 + p.c1 * (h - z1)) / p.m1;
      const a2 = (-F2 + F3) / p.m2;
      const a3 = hasSeat ? -F3 / p.m3 : a2;
      return [v1, v2, hasSeat ? v3 : v2, a1, a2, a3];
    };
    // Start in Ruhe auf der Höhe des Profils, damit kein Anfangssprung entsteht
    const h0 = road(0);
    let y = [h0, h0, h0, 0, 0, 0];
    const out = { t: [], x: [], h: [], z1: [], z2: [], z3: [], Fdyn: [], acc2: [] };
    const every = Math.max(1, Math.round(0.01 / dt));
    let k = 0;
    for (let t = 0; t <= duration; t += dt, k++) {
      if (k % every === 0) {
        const h = road(p.v * t), d = f(t, y);
        out.t.push(t); out.x.push(p.v * t); out.h.push(h);
        out.z1.push(y[0]); out.z2.push(y[1]); out.z3.push(y[2]);
        out.Fdyn.push(p.c1 * (h - y[0])); out.acc2.push(d[4]);
      }
      y = rk4Step(f, t, y, dt);
    }
    out.road = road;
    return out;
  }

  K.schwingung = { DEFAULTS, B_SITZ, B_FUSS, B_HAND, B_SITZ_132, B_FUSS_132, weightings, G_STOCH, G_MA,
    withDefaults, characteristics, response,
    magnitudes, roadPSD, evaluate, frequencyCurves, conflict, roadProfile, simulate };
})(typeof globalThis !== 'undefined' ? globalThis : this);

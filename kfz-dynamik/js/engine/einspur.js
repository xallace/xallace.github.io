/* Teil IV – Lineares Einspurmodell (Kap. 20–22).
   Differenzialgleichungen (20.25)/(20.26) mit δL* = δL/iL und c′αV nach (20.27),
   Kreisfahrt (Tab. 21.2/21.3), Stabilität, Eigenfrequenz und Dämpfung (22.4)–(22.6),
   Zeitverläufe für Lenkwinkeleingaben, Frequenzgänge (Tab. 22.1). */
(function (root) {
  'use strict';
  const K = root.KfzDyn;
  const { G: g, C, DEG, rk4Step, logspace } = K.core;

  // Fahrzeug 1 aus Tab. 21.7: l = 2,5 m, iL = 19, VL = 1, i/l = 0,46
  const DEFAULTS = {
    m: 1000,         // kg
    l: 2.5,          // m
    lVrel: 0.5,      // lV/l
    caV: 50000,      // N/rad  Seitenkraftbeiwert Vorderachse (beide Reifen)
    caH: 50000,      // N/rad
    nV: 0.06,        // m      Gesamtnachlauf
    CL: 10000,       // Nm/rad Lenkungssteifigkeit
    iL: 19,          // –      Lenkübersetzung
    VL: 1,           // –      Lenkverstärkung
    iRel: 0.46,      // –      bezogener Trägheitsradius i/l, Jz = m·i²
    v: 22.2,         // m/s
  };

  function withDefaults(params) {
    return Object.assign({}, DEFAULTS, params);
  }

  function derived(params) {
    const p = withDefaults(params);
    const lV = p.lVrel * p.l, lH = p.l - lV;
    const caV1 = p.caV / (1 + p.caV * p.nV / p.CL);                // (20.27)
    const Jz = p.m * Math.pow(p.iRel * p.l, 2);
    const G = p.m * g, FzV = G * lH / p.l, FzH = G * lV / p.l;     // (20.5) ohne Auftrieb
    const EK = p.caH * lH - caV1 * lV;                            // Zählerterm cαH·lH − c′αV·lV
    const vch2 = caV1 * p.caH * p.l * p.l / (p.m * EK);           // Tab. 21.2 (2a)
    const SQ = (caV1 / FzV) / (p.caH / FzH);                      // (4c)
    return { p, lV, lH, caV1, Jz, G, FzV, FzH, EK, vch2, SQ,
      vch: vch2 > 0 ? Math.sqrt(vch2) : NaN, vkrit: vch2 < 0 ? Math.sqrt(-vch2) : NaN,
      // Eigenlenkgradient dδL/d(ay) in rad/(m/s²), Tab. 21.2 (1a) ohne den Anteil iL·l/ρ
      EGrad: p.m * p.iL * EK / (caV1 * p.caH * p.l) };
  }

  // stationäre Kreisfahrt auf Radius ρ, Tab. 21.2
  function steadyCircle(params, rho, ay) {
    const d = derived(params), p = d.p;
    const dL = p.iL * p.l / rho + p.m * p.iL * d.EK / (d.caV1 * p.caH * p.l) * ay;                 // (1a)
    const dV = p.l / rho + p.m * (p.caH * d.lH - p.caV * d.lV) / (p.caV * p.caH * p.l) * ay;      // (3)
    const beta = d.lH / rho - p.m * d.lV / (p.caH * p.l) * ay;                                     // (4a)
    const ML = p.m * p.nV * d.lH / (p.iL * p.VL * p.l) * ay;                                       // (6a)
    return { dL, dV, beta, ML };
  }

  // Kreisfahrtwerte (Verstärkungsfaktoren) über v, Tab. 21.3
  function gains(params, v) {
    const d = derived(params), p = d.p;
    const q = 1 + v * v / d.vch2;
    return {
      yawRate: v / (p.iL * p.l * q),                                              // (1) ψ̇/δL
      beta: d.lH / (p.iL * p.l) * (1 - p.m * d.lV * v * v / (p.caH * d.lH * p.l)) / q,  // (2a) β/δL
      latAcc: v * v / (p.iL * p.l * q),                                            // (3) ÿ/δL
      torque: p.m * d.lH * p.nV * v * v / (p.iL * p.iL * p.l * p.l * p.VL * q),       // (4a) ML/δL
    };
  }

  // charakteristische Gleichung s² + 2σf s + νf² = 0, (22.4)–(22.6)
  function eigen(params, v) {
    const d = derived(params), p = d.p;
    const twoSigma = (p.m * (d.caV1 * d.lV * d.lV + p.caH * d.lH * d.lH) + d.Jz * (d.caV1 + p.caH)) / (d.Jz * p.m * v);
    const nu2 = (d.caV1 * p.caH * p.l * p.l + p.m * v * v * d.EK) / (d.Jz * p.m * v * v);
    const sigma = twoSigma / 2;
    const stable = sigma > 0 && nu2 > 0;
    const nu = nu2 > 0 ? Math.sqrt(nu2) : NaN;
    const D = nu2 > 0 ? sigma / nu : NaN;
    const disc = sigma * sigma - nu2;
    const roots = disc >= 0
      ? [[-sigma + Math.sqrt(disc), 0], [-sigma - Math.sqrt(disc), 0]]
      : [[-sigma, Math.sqrt(-disc)], [-sigma, -Math.sqrt(-disc)]];
    return { sigma, nu2, nu, D, fUndamped: nu / (2 * Math.PI),
      fDamped: disc < 0 ? Math.sqrt(-disc) / (2 * Math.PI) : 0, stable, roots };
  }

  // Zustandsraum ẋ = A x + B δL mit x = [β, ψ̇]
  function stateSpace(params, v) {
    const d = derived(params), p = d.p;
    const mv = p.m * v;
    const A = [
      [-(d.caV1 + p.caH) / mv, -(p.m * v * v - d.EK) / (mv * v)],
      [d.EK / d.Jz, -(d.caV1 * d.lV * d.lV + p.caH * d.lH * d.lH) / (d.Jz * v)],
    ];
    const B = [d.caV1 / (p.iL * mv), d.caV1 * d.lV / (p.iL * d.Jz)];
    return { A, B, d };
  }

  // Lenkradwinkel-Eingaben δL(t) in rad
  function steerInput(kind, opts) {
    const amp = opts.amplitude;
    switch (kind) {
      case 'sprung': return (t) => (t >= opts.t0 ? amp : 0);
      case 'rampe': {
        const rate = opts.rate;   // rad/s
        return (t) => (t < opts.t0 ? 0 : Math.min(amp, rate * (t - opts.t0)));
      }
      case 'sinus': return (t) => (t < opts.t0 ? 0 : amp * Math.sin(2 * Math.PI * opts.freq * (t - opts.t0)));
      case 'spurwechsel': {
        const T = 1 / opts.freq;
        return (t) => (t < opts.t0 || t > opts.t0 + T ? 0 : amp * Math.sin(2 * Math.PI * (t - opts.t0) / T));
      }
      default: return () => 0;
    }
  }

  function simulate(params, input, duration = 4, dt = 0.002) {
    const { A, B, d } = stateSpace(params, withDefaults(params).v);
    const v = d.p.v;
    const f = (t, x) => {
      const u = input(t);
      return [A[0][0] * x[0] + A[0][1] * x[1] + B[0] * u, A[1][0] * x[0] + A[1][1] * x[1] + B[1] * u];
    };
    let x = [0, 0], X = 0, Y = 0, psi = 0;
    const out = { t: [], dL: [], beta: [], yawRate: [], latAcc: [], psi: [], X: [], Y: [], aV: [], aH: [] };
    const every = Math.max(1, Math.round(0.01 / dt));
    let k = 0;
    for (let t = 0; t <= duration + 1e-9; t += dt, k++) {
      const u = input(t), dx = f(t, x);
      if (k % every === 0) {
        const dLstar = u / d.p.iL;
        const kL = d.p.caV * d.p.nV / d.p.CL;
        const dV = (dLstar + kL * (x[0] + d.lV * x[1] / v)) / (1 + kL);   // (20.23)
        out.t.push(t); out.dL.push(u); out.beta.push(x[0]); out.yawRate.push(x[1]);
        out.latAcc.push(v * (dx[0] + x[1]));                               // (20.15)
        out.psi.push(psi); out.X.push(X); out.Y.push(Y);
        out.aV.push(-x[0] + dV - d.lV * x[1] / v);                         // (20.19a)
        out.aH.push(-x[0] + d.lH * x[1] / v);                              // (20.19b)
      }
      // Bahnkurve des Schwerpunkts (20.16)
      const xn = rk4Step(f, t, x, dt);
      const course = psi + x[0];
      X += v * Math.cos(course) * dt; Y += v * Math.sin(course) * dt;
      psi += 0.5 * (x[1] + xn[1]) * dt;
      x = xn;
    }
    return out;
  }

  // Kennwerte der Sprungantwort bzw. Rampenantwort (Tab. 22.4)
  function responseMetrics(series, input50Time) {
    const r = series.yawRate;
    let iMax = 0;
    for (let i = 1; i < r.length; i++) if (Math.abs(r[i]) > Math.abs(r[iMax])) iMax = i;
    const stat = r[r.length - 1];
    return {
      peak: r[iMax], stat, tPeak: series.t[iMax],
      tPeakFrom50: series.t[iMax] - input50Time,
      overshoot: stat !== 0 ? (r[iMax] - stat) / stat : 0,
    };
  }

  // Frequenzgänge H(jω) = C (jωI − A)⁻¹ B für ψ̇, β, ÿ bezogen auf δL (Tab. 22.1)
  function frequencyResponse(params, fMin = 0.05, fMax = 5, n = 300) {
    const p = withDefaults(params);
    const { A, B } = stateSpace(p, p.v);
    const F = logspace(fMin, fMax, n);
    const res = { f: F, yawMag: [], yawPh: [], betaMag: [], betaPh: [], latMag: [], latPh: [] };
    for (const f of F) {
      const w = 2 * Math.PI * f;
      // M = jωI − A
      const a = [-A[0][0], w], b = [-A[0][1], 0], c = [-A[1][0], 0], dd = [-A[1][1], w];
      const det = C.sub(C.mul(a, dd), C.mul(b, c));
      // x = M⁻¹ B
      const x0 = C.div(C.sub(C.scale(dd, B[0]), C.scale(b, B[1])), det);
      const x1 = C.div(C.sub(C.scale(a, B[1]), C.scale(c, B[0])), det);
      // ÿ = v (β̇ + ψ̇) = v (jω β + ψ̇)
      const lat = C.scale(C.add(C.mul([0, w], x0), x1), p.v);
      res.yawMag.push(C.abs(x1)); res.yawPh.push(C.arg(x1) / DEG);
      res.betaMag.push(C.abs(x0)); res.betaPh.push(C.arg(x0) / DEG);
      res.latMag.push(C.abs(lat)); res.latPh.push(C.arg(lat) / DEG);
    }
    return res;
  }

  K.einspur = { DEFAULTS, withDefaults, derived, steadyCircle, gains, eigen, stateSpace, steerInput, simulate,
    responseMetrics, frequencyResponse };
})(typeof globalThis !== 'undefined' ? globalThis : this);

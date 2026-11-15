/* Part II – Braking (Ch. 9).
   Axle loads (9.44)/(9.45), friction utilization (9.46), ideal brake force distribution (9.54)/(9.56),
   fixed distribution, braking efficiency zmax/μh (9.40), stopping distance (9.17)/(9.18). */
(function (root) {
  'use strict';
  const K = root.KfzDyn;
  const { G: g } = K.core;

  // Vehicle from Fig. 9.12; φ = 0.76 yields the textbook numbers on p. 227 (μV = μH = 0.8 at z = 0.8)
  const DEFAULTS = {
    m: 880,         // kg
    lVrel: 0.42,    // lV/l
    hRel: 0.225,    // h/l
    phi: 0.76,      // BV/(BV + BH), fixed distribution
    muH: 0.8,       // road friction coefficient
    // Stopping distance, example p. 217 / Table 9.1
    vA: 80 / 3.6, decel: 5.8, tr: 0.64, ta: 0.05, ts: 0.17,
  };

  function withDefaults(params) {
    return Object.assign({}, DEFAULTS, params);
  }

  // normalized axle loads FzV/G, FzH/G at deceleration z
  function axleLoads(p, z) {
    const lH = 1 - p.lVrel;
    return { V: lH + p.hRel * z, H: p.lVrel - p.hRel * z };
  }

  // ideal brake forces BVid/G, BHid/G (9.56)
  function ideal(p, z) {
    const a = axleLoads(p, z);
    return { BV: z * a.V, BH: z * a.H };
  }

  // friction utilization with fixed distribution (9.46)
  function utilization(p, z) {
    const a = axleLoads(p, z);
    return { muV: a.V > 0 ? p.phi * z / a.V : Infinity, muH: a.H > 0 ? (1 - p.phi) * z / a.H : Infinity };
  }

  // Deceleration at which front or rear axle reaches available friction μh
  function lockLimits(p, mu) {
    const lH = 1 - p.lVrel;
    // φ·z = μ·(lH + h·z)  →  z = μ·lH / (φ − μ·h)
    const zV = p.phi - mu * p.hRel > 0 ? mu * lH / (p.phi - mu * p.hRel) : Infinity;
    // (1−φ)·z = μ·(lV − h·z)  →  z = μ·lV / ((1−φ) + μ·h)
    const zH = mu * p.lVrel / ((1 - p.phi) + mu * p.hRel);
    const zmax = Math.min(zV, zH);
    return { zV, zH, zmax, first: zV <= zH ? 'front axle' : 'rear axle', guete: zmax / mu };
  }

  // Deceleration at which fixed distribution intersects ideal distribution (μV = μH)
  function criticalZ(p) {
    // φ·z/(lH + h z) = (1−φ)·z/(lV − h z)  →  φ(lV − h z) = (1−φ)(lH + h z)
    const lH = 1 - p.lVrel;
    return (p.phi * p.lVrel - (1 - p.phi) * lH) / p.hRel;
  }

  // ideal distribution as front share φid(z) = BVid/(BVid+BHid)
  function idealPhi(p, z) {
    return axleLoads(p, z).V;
  }

  /* Stopping distance per Eq. (9.17): reaction tr, response ta, buildup ts (linear ramp),
     then full deceleration. Returns summary values and time series (Fig. 9.4). */
  function stopping(params) {
    const p = withDefaults(params);
    const vA = p.vA, a = p.decel, { tr, ta, ts } = p;
    const s = vA * (tr + ta + ts / 2) + vA * vA / (2 * a) - a / 24 * ts * ts;     // (9.17)
    const sApprox = vA * (tr + ta + ts / 2) + vA * vA / (2 * a);                   // (9.18a)
    const sBrake = vA * (ta + ts / 2) + vA * vA / (2 * a);                         // (9.18b)
    const t = tr + ta + ts / 2 + vA / a;                                            // (9.19a)
    const parts = { s1: vA * (tr + ta), s2: vA * ts - a / 6 * ts * ts };
    parts.s3 = s - parts.s1 - parts.s2;
    // Time series
    const T = [], V = [], X = [], A = [];
    const dt = 0.005;
    let v = vA, x = 0;
    for (let tt = 0; v > 0 && tt < 60; tt += dt) {
      let dec;
      if (tt < tr + ta) dec = 0;
      else if (tt < tr + ta + ts) dec = a * (tt - tr - ta) / ts;
      else dec = a;
      T.push(tt); V.push(v); X.push(x); A.push(-dec);
      v = Math.max(0, v - dec * dt); x += v * dt;
    }
    T.push(T[T.length - 1] + dt); V.push(0); X.push(x); A.push(-a);
    return { s, sApprox, sBrake, t, parts, series: { t: T, v: V, x: X, a: A } };
  }

  K.bremsung = { DEFAULTS, withDefaults, axleLoads, ideal, utilization, lockLimits, criticalZ, idealPhi, stopping };
})(typeof globalThis !== 'undefined' ? globalThis : this);

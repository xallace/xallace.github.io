/* Part II – Driving resistances, tractive force diagram, driving performance (Ch. 5 and 7).
   Tractive demand per Eqs. (5.29)/(5.30):  Z = G·(fR + p) + λ·m·ẍ + cW·A·ρ/2·v²
   Tractive supply per Eq. (7.1):          Z = iK·η·MM(n) / r,  iK = iG·iA */
(function (root) {
  'use strict';
  const K = root.KfzDyn;
  const { G: g, interp, bisect } = K.core;

  // Passenger car from Figs. 5.5a, 7.1, and 7.10 (37 kW, 4-speed manual transmission)
  const DEFAULTS = {
    m: 880,          // kg
    fR: 0.01,        // –      rolling resistance coefficient
    cWA: 0.77,       // m²     cW·A
    rho: 1.226,      // kg/m³  Eq. (3.12b)
    r: 0.30,         // m      wheel radius
    iA: 3.9, etaA: 0.92,
    gears: [         // gear ratio, efficiency, rotational inertia factor λ (Figs. 7.1e, 7.10)
      { i: 3.45, eta: 0.92, lambda: 1.47 },
      { i: 1.94, eta: 0.93, lambda: 1.16 },
      { i: 1.37, eta: 0.94, lambda: 1.09 },
      { i: 0.97, eta: 0.95, lambda: 1.06 },
    ],
    nMin: 900, nMax: 5500,                   // rpm
    // Full-load torque curve MM(n) digitized from Fig. 7.1c, [rpm, Nm]
    torque: [[900, 0], [1000, 17], [1083, 27], [1167, 37], [1250, 45], [1333, 52], [1417, 58], [1500, 63],
      [1667, 72], [1833, 78], [2000, 82], [2167, 85.5], [2333, 87.7], [2500, 89.3], [3000, 90], [3500, 88.7],
      [4000, 83.8], [4500, 78.5], [5000, 70.7], [5250, 62], [5500, 0]],
    p: 0,            // road grade (tan), for acceleration and vmax
    shiftTime: 0,    // s, Fig. 7.11 assumes zero shift pauses
  };

  function withDefaults(params) {
    return Object.assign({}, DEFAULTS, params);
  }

  function engineTorque(p, n) {
    if (n < p.nMin || n > p.nMax) return 0;
    return Math.max(0, interp(p.torque, n));
  }

  function engineSpeed(p, gear, v) {
    return v / p.r * gear.i * p.iA * 60 / (2 * Math.PI);
  }

  // Tractive force at the wheels in a given gear [N]
  function tractive(p, gear, v) {
    const n = engineSpeed(p, gear, v);
    return gear.i * p.iA * gear.eta * p.etaA * engineTorque(p, n) / p.r;
  }

  function rollAir(p, v) {
    const G = p.m * g;
    return { FR: p.fR * G, FL: 0.5 * p.rho * p.cWA * v * v };
  }

  // Tractive demand for q = p + λ·ẍ/g (curve family in Figs. 5.5 and 7.1g)
  function demand(p, v, q) {
    const { FR, FL } = rollAir(p, v);
    return FR + FL + p.m * g * q;
  }

  // Speed range of a gear [vMin, vMax] from nMin…nMax
  function gearRange(p, gear) {
    const k = p.r * 2 * Math.PI / 60 / (gear.i * p.iA);
    return [p.nMin * k, p.nMax * k];
  }

  // Peak full-load power [W] and corresponding engine speed
  function maxPower(p) {
    let best = { P: 0, n: 0 };
    for (let n = p.nMin; n <= p.nMax; n += 5) {
      const P = engineTorque(p, n) * n * 2 * Math.PI / 60;
      if (P > best.P) best = { P, n };
    }
    return best;
  }

  // Top speed: highest intersection of tractive force = driving resistance at grade p
  function vmax(params) {
    const p = withDefaults(params);
    let best = { v: 0, gear: -1, limitedBy: '' };
    p.gears.forEach((gear, gi) => {
      const [v0, v1] = gearRange(p, gear);
      const excess = (v) => tractive(p, gear, v) - demand(p, v, p.p);
      // scan downward so the upper intersection is found
      const N = 400;
      let prevV = v1 * 0.9999, prev = excess(prevV);
      if (prev >= 0 && v1 > best.v) { best = { v: v1, gear: gi, limitedBy: 'engine speed' }; return; }
      for (let k = N - 1; k >= 0; k--) {
        const vv = v0 + (v1 - v0) * k / N, e = excess(vv);
        if (e >= 0 && prev < 0) {
          const root = bisect(excess, vv, prevV, 1e-6);
          if (root > best.v) best = { v: root, gear: gi, limitedBy: 'driving resistance' };
          break;
        }
        prevV = vv; prev = e;
      }
    });
    return best;
  }

  // Gradeability per gear: p = (Z − FR − FL)/G, maximum over v (Sec. 7.3)
  function gradeability(params) {
    const p = withDefaults(params);
    return p.gears.map((gear) => {
      const [v0, v1] = gearRange(p, gear);
      let best = { p: -Infinity, v: 0 };
      for (let k = 0; k <= 300; k++) {
        const v = v0 + (v1 - v0) * k / 300;
        const q = (tractive(p, gear, v) - demand(p, v, 0)) / (p.m * g);
        if (q > best.p) best = { p: q, v };
      }
      return best;
    });
  }

  // Longitudinal acceleration ẍ in a given gear (Fig. 7.10)
  function accelInGear(p, gear, v) {
    const Z = tractive(p, gear, v);
    if (Z <= 0) return null;
    return (Z - demand(p, v, p.p)) / (gear.lambda * p.m);
  }

  /* Acceleration run per Sec. 7.5.1 / Fig. 7.11:
     Launch in 1st gear with constant acceleration (= peak of 1st gear),
     then always choose the gear giving the highest acceleration, optionally with shift pauses. */
  function accelerationRun(params, vEnd, dt = 0.01) {
    const p = withDefaults(params);
    const first = p.gears[0];
    const [v10, v11] = gearRange(p, first);
    let a1max = 0, vPeak = v10;
    for (let k = 0; k <= 400; k++) {
      const v = v10 + (v11 - v10) * k / 400, a = accelInGear(p, first, v);
      if (a !== null && a > a1max) { a1max = a; vPeak = v; }
    }
    const bestGear = (v) => {
      if (v < vPeak) return { a: a1max, gi: 0, launch: true };
      let best = { a: -Infinity, gi: -1, launch: false };
      p.gears.forEach((gear, gi) => {
        const [lo, hi] = gearRange(p, gear);
        if (v < lo || v > hi) return;
        const a = accelInGear(p, gear, v);
        if (a !== null && a > best.a) best = { a, gi, launch: false };
      });
      return best;
    };
    const out = { t: [0], v: [0], x: [0], a: [a1max], gear: [0] };
    let t = 0, v = 0, x = 0, gi = 0, shiftLeft = 0;
    const tMax = 200;
    while (v < vEnd && t < tMax) {
      let a;
      if (shiftLeft > 0) {
        a = -demand(p, v, p.p) / p.m;     // tractive power interruption
        shiftLeft -= dt;
      } else {
        const b = bestGear(v);
        if (b.gi < 0 || b.a <= 1e-4) break;   // vmax reached
        if (b.gi !== gi && p.shiftTime > 0) { shiftLeft = p.shiftTime; gi = b.gi; continue; }
        gi = b.gi; a = b.a;
      }
      v += a * dt; x += v * dt; t += dt;
      out.t.push(t); out.v.push(v); out.x.push(x); out.a.push(a); out.gear.push(gi);
    }
    return { ...out, a1max, vPeak, reached: v >= vEnd, tEnd: t, xEnd: x };
  }

  // Time required to cover a given distance (for “1000 m standing start”)
  function timeForDistance(params, dist) {
    const run = accelerationRun(params, 1e9, 0.01);
    for (let i = 0; i < run.x.length; i++) if (run.x[i] >= dist) return run.t[i];
    // vmax reached: cover remainder at constant top speed
    const vEnd = run.v[run.v.length - 1];
    return run.tEnd + (dist - run.xEnd) / Math.max(vEnd, 1e-6);
  }

  K.laengs = { DEFAULTS, withDefaults, engineTorque, engineSpeed, tractive, rollAir, demand, gearRange, maxPower,
    vmax, gradeability, accelInGear, accelerationRun, timeForDistance };
})(typeof globalThis !== 'undefined' ? globalThis : this);

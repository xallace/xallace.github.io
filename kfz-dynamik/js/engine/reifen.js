/* Part I – Tires.
   Extended HSRI tire model per Table 2.3 (p. 51) with
   - longitudinal and lateral force under combined slip,
   - aligning torque Mz = Fy·ny − Fx·nx,
   - cornering stiffness cα(Fz) per Eq. (2.35),
   - linear camber thrust per Eq. (2.37), incorporated here as an equivalent slip angle.
   Sign convention: Sx > 0 driving, Sx < 0 braking (magnitude defined as in Table 2.3). */
(function (root) {
  'use strict';
  const K = root.KfzDyn;

  // Tire 205/60 R 15 from Fig. 2.44 (Fz = 4000 N, dry).
  // cx and k are stated in text p. 49; μ0, kR, a are fitted to Fig. 2.44
  // (test speed is not stated in the book; 60 km/h is assumed).
  const DEFAULTS = {
    Fz: 4000,       // N      wheel load
    v: 16.7,        // m/s    travel speed ẋR
    cx: 47000,      // N      longitudinal stiffness (p. 49)
    ca1: 25.6,      // 1/rad  cα = (cα1 − cα2·Fz/FzNenn)·Fz, curve shape per Fig. 2.37,
    ca2: 13.1,      // 1/rad  scaled to cα = 50 kN/rad at 4 kN (Fig. 2.44a)
    FzNenn: 4000,   // N
    mu01: 1.17,     // –      μ0 = μ01 + μ02·Fz
    mu02: 0,        // 1/N
    kR: 0.32,       // –      μ = μ0·[1 − kR·tanh((a·vg)²)]
    a: 0.09,        // s/m
    cgRel: 0.1,     // –      camber stiffness cγ = cgRel·cα (assumed, not in book)
    R0: 0.30,       // m      dynamic rolling radius
    c1: 200000,     // N/m    vertical tire stiffness
    Ckor: 1,        // –      correction factor; 1 makes ny continuous at s̄R = 0.5
  };

  function cAlpha(p, Fz) {
    return (p.ca1 - p.ca2 * Fz / p.FzNenn) * Fz;
  }

  /* Forces and aligning torque at the wheel.
     Sx: longitudinal slip (−1 … 1), alpha: slip angle [rad], gamma: camber [rad] */
  function forces(params, Sx, alpha, gamma = 0) {
    const p = Object.assign({}, DEFAULTS, params);
    const Fz = Math.max(p.Fz, 1);
    const ca = Math.max(cAlpha(p, Fz), 1);
    const cg = p.cgRel * ca;
    // Eq. (2.37) Fy = cα·α − cγ·γ  →  equivalent slip angle
    const tanA = Math.tan(alpha) - (cg / ca) * gamma;
    const s = Math.min(Math.abs(Sx), 0.999);
    const sgn = Sx < 0 ? -1 : 1;

    const vg = p.v * Math.sqrt(s * s + tanA * tanA);                     // sliding velocity
    const mu0 = p.mu01 + p.mu02 * Fz;
    const mu = mu0 * (1 - p.kR * Math.tanh(Math.pow(p.a * vg, 2)));      // friction coefficient
    const sR = Math.hypot(p.cx * s, ca * tanA) / (mu * Fz * (1 - s));     // s̄R

    // Table 2.3 writes the linearized form Fx = cx·Sx in the adhesion zone.
    // Here the factor 1/(1 − Sx) is kept as in partial sliding so curves remain continuous at s̄R = 0.5.
    const f = sR <= 0.5 ? 1 : (sR - 0.25) / (sR * sR);
    const Fx = sgn * p.cx * s / (1 - s) * f;
    const Fy = ca * tanA / (1 - s) * f;

    // Aligning torque, moment arms per Table 2.3
    const s1 = Fz / p.c1;                    // tire deflection (2.25)
    const lL = Math.sqrt(2 * p.R0 * s1);      // half contact-patch length
    const cy = p.c1 / 2;                      // carcass stiffness
    let ny, nx;
    if (sR <= 0.5) {
      ny = lL / 3 * (1 + 2 * sR * (0.5 - sR));
      nx = 4 / 3 * lL * tanA + Fy / cy;
    } else {
      ny = lL * ((12 - 1 / (sR * sR)) / (12 - 3 / sR) - 1) * (1 - (sR - 0.5)) / p.Ckor;
      // Fy/cy placed outside parentheses here (otherwise units are inconsistent)
      nx = lL * tanA * (sR - 1 / 3) / (sR * (sR - 0.25)) + Fy / cy;
    }
    const Mz = Fy * ny - Fx * nx;

    return { Fx, Fy, Fz, Mz, mu, mu0, sR, vg, ca, cg, ny, nx, lL, regime: sR <= 0.5 ? 'Adhesion' : 'Partial sliding' };
  }

  // Slip from wheel angular speed and vehicle speed (Table 2.3)
  function slipFromWheel(v, omegaR, R0) {
    const vr = omegaR * R0;
    if (vr >= v) return vr > 0 ? 1 - v / vr : 0;   // driving
    return v > 0 ? -(1 - vr / v) : 0;              // braking (negative)
  }

  // Curve families as in Fig. 2.44
  function curvesVsSlip(params, alphasDeg, n = 160) {
    const S = K.core.linspace(0, 0.99, n);
    return alphasDeg.map((ad) => {
      const r = S.map((s) => forces(params, s, ad * K.core.DEG));
      return { alphaDeg: ad, S, Fx: r.map((o) => o.Fx), Fy: r.map((o) => o.Fy), Mz: r.map((o) => o.Mz) };
    });
  }

  function curvesVsAlpha(params, slips, n = 160, maxDeg = 15) {
    const A = K.core.linspace(0, maxDeg, n);
    return slips.map((sx) => {
      const r = A.map((ad) => forces(params, sx, ad * K.core.DEG));
      return { Sx: sx, A, Fx: r.map((o) => o.Fx), Fy: r.map((o) => o.Fy), Mz: r.map((o) => o.Mz) };
    });
  }

  K.reifen = { DEFAULTS, cAlpha, forces, slipFromWheel, curvesVsSlip, curvesVsAlpha };
})(typeof globalThis !== 'undefined' ? globalThis : this);

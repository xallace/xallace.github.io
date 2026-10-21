/* Teil I – Reifen.
   Erweitertes HSRI-Reifenmodell nach Tab. 2.3 (S. 51) mit
   - Umfangs- und Seitenkraft bei kombiniertem Schlupf,
   - Rückstellmoment Mz = Fy·ny − Fx·nx,
   - Seitenkraftbeiwert cα(Fz) nach Gl. (2.35),
   - Sturzseitenkraft linear nach Gl. (2.37), hier als Ersatz-Schräglaufwinkel eingerechnet.
   Vorzeichen: Sx > 0 Antrieb, Sx < 0 Bremsen (Betrag wie in Tab. 2.3 definiert). */
(function (root) {
  'use strict';
  const K = root.KfzDyn;

  // Reifen 205/60 R 15 nach Abb. 2.44 (Fz = 4000 N, trocken).
  // cx und k stehen im Text S. 49; μ0, kR, a sind an Abb. 2.44 angepasst
  // (die Fahrgeschwindigkeit der Messung nennt das Buch nicht, angenommen 60 km/h).
  const DEFAULTS = {
    Fz: 4000,       // N      Radlast
    v: 16.7,        // m/s    Fahrgeschwindigkeit ẋR
    cx: 47000,      // N      Umfangssteifigkeit (S. 49)
    ca1: 25.6,      // 1/rad  cα = (cα1 − cα2·Fz/FzNenn)·Fz, Form nach Abb. 2.37,
    ca2: 13.1,      // 1/rad  skaliert auf cα = 50 kN/rad bei 4 kN (Abb. 2.44a)
    FzNenn: 4000,   // N
    mu01: 1.17,     // –      μ0 = μ01 + μ02·Fz
    mu02: 0,        // 1/N
    kR: 0.32,       // –      μ = μ0·[1 − kR·tanh((a·vg)²)]
    a: 0.09,        // s/m
    cgRel: 0.1,     // –      Sturzsteifigkeit cγ = cgRel·cα (Annahme, nicht aus dem Buch)
    R0: 0.30,       // m      dynamischer Halbmesser
    c1: 200000,     // N/m    vertikale Reifensteifigkeit
    Ckor: 1,        // –      Korrekturwert, 1 macht ny bei s̄R = 0,5 stetig
  };

  function cAlpha(p, Fz) {
    return (p.ca1 - p.ca2 * Fz / p.FzNenn) * Fz;
  }

  /* Kräfte und Moment am Rad.
     Sx: Umfangsschlupf (−1 … 1), alpha: Schräglaufwinkel [rad], gamma: Sturz [rad] */
  function forces(params, Sx, alpha, gamma = 0) {
    const p = Object.assign({}, DEFAULTS, params);
    const Fz = Math.max(p.Fz, 1);
    const ca = Math.max(cAlpha(p, Fz), 1);
    const cg = p.cgRel * ca;
    // Gl. (2.37) Fy = cα·α − cγ·γ  →  Ersatz-Schräglaufwinkel
    const tanA = Math.tan(alpha) - (cg / ca) * gamma;
    const s = Math.min(Math.abs(Sx), 0.999);
    const sgn = Sx < 0 ? -1 : 1;

    const vg = p.v * Math.sqrt(s * s + tanA * tanA);                     // Gleitgeschwindigkeit
    const mu0 = p.mu01 + p.mu02 * Fz;
    const mu = mu0 * (1 - p.kR * Math.tanh(Math.pow(p.a * vg, 2)));      // „Haftbeiwert“
    const sR = Math.hypot(p.cx * s, ca * tanA) / (mu * Fz * (1 - s));     // s̄R

    // Tab. 2.3 schreibt im Haftbereich die linearisierte Form Fx = cx·Sx.
    // Hier steht wie im Teilgleitbereich der Faktor 1/(1 − Sx), damit die Kurven bei s̄R = 0,5 stetig sind.
    const f = sR <= 0.5 ? 1 : (sR - 0.25) / (sR * sR);
    const Fx = sgn * p.cx * s / (1 - s) * f;
    const Fy = ca * tanA / (1 - s) * f;

    // Rückstellmoment, Hebelarme nach Tab. 2.3
    const s1 = Fz / p.c1;                    // Reifensubtangente (2.25)
    const lL = Math.sqrt(2 * p.R0 * s1);      // halbe Latschlänge
    const cy = p.c1 / 2;                      // Karkassensteifigkeit
    let ny, nx;
    if (sR <= 0.5) {
      ny = lL / 3 * (1 + 2 * sR * (0.5 - sR));
      nx = 4 / 3 * lL * tanA + Fy / cy;
    } else {
      ny = lL * ((12 - 1 / (sR * sR)) / (12 - 3 / sR) - 1) * (1 - (sR - 0.5)) / p.Ckor;
      // Fy/cy steht hier außerhalb der Klammer (sonst stimmt die Einheit nicht)
      nx = lL * tanA * (sR - 1 / 3) / (sR * (sR - 0.25)) + Fy / cy;
    }
    const Mz = Fy * ny - Fx * nx;

    return { Fx, Fy, Fz, Mz, mu, mu0, sR, vg, ca, cg, ny, nx, lL, regime: sR <= 0.5 ? 'Haften' : 'Teilgleiten' };
  }

  // Schlupf aus Rad- und Fahrgeschwindigkeit (Tab. 2.3)
  function slipFromWheel(v, omegaR, R0) {
    const vr = omegaR * R0;
    if (vr >= v) return vr > 0 ? 1 - v / vr : 0;   // Antrieb
    return v > 0 ? -(1 - vr / v) : 0;              // Bremsen (negativ)
  }

  // Kurvenscharen wie Abb. 2.44
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

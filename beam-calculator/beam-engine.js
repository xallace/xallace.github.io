/**
 * ============================================================================
 * BeamEngine: Structural Mechanics Calculation Core
 * Simply Supported Beam with Uniformly Distributed Load (UDL)
 * Reference: StructX Beam Formulas 001 / Eurocode 3 / DIN 1025 / AISC
 * ============================================================================
 */

export const MATERIALS = {
  steel_s235: {
    name: "Structural Steel (S235 / A36)",
    E_metric: 210, // GPa
    E_imperial: 30450, // ksi
    yield_metric: 235, // MPa
    yield_imperial: 36, // ksi
    density_metric: 7850, // kg/m3
  },
  steel_s355: {
    name: "High-Strength Steel (S355 / A572)",
    E_metric: 210, // GPa
    E_imperial: 30450, // ksi
    yield_metric: 355, // MPa
    yield_imperial: 50, // ksi
    density_metric: 7850, // kg/m3
  },
  stainless_304: {
    name: "Stainless Steel (1.4301 / 304)",
    E_metric: 195, // GPa
    E_imperial: 28300, // ksi
    yield_metric: 210, // MPa
    yield_imperial: 30, // ksi
    density_metric: 7900, // kg/m3
  },
  aluminum_6082: {
    name: "Aluminium (EN AW-6082 T6 / 6061-T6)",
    E_metric: 70, // GPa
    E_imperial: 10150, // ksi
    yield_metric: 260, // MPa
    yield_imperial: 35, // ksi
    density_metric: 2700, // kg/m3
  },
  timber_c24: {
    name: "Structural Timber (C24 Softwood)",
    E_metric: 11, // GPa
    E_imperial: 1600, // ksi
    yield_metric: 24, // MPa (bending strength)
    yield_imperial: 3.5, // ksi
    density_metric: 420, // kg/m3
  },
  concrete_c25: {
    name: "Reinforced Concrete (C25/30)",
    E_metric: 31, // GPa
    E_imperial: 4500, // ksi
    yield_metric: 25, // MPa (compressive)
    yield_imperial: 3.6, // ksi
    density_metric: 2400, // kg/m3
  },
  custom: {
    name: "Custom Material",
    E_metric: 210,
    E_imperial: 30450,
    yield_metric: 250,
    yield_imperial: 36,
    density_metric: 7850,
  }
};

export const STANDARD_PROFILES = {
  IPE100: { name: "IPE 100", h: 100, b: 55, tw: 4.1, tf: 5.7, Iy: 171, Wy: 34.2, A: 10.3 }, // cm4, cm3, cm2
  IPE160: { name: "IPE 160", h: 160, b: 82, tw: 5.0, tf: 7.4, Iy: 869, Wy: 109, A: 20.1 },
  IPE200: { name: "IPE 200", h: 200, b: 100, tw: 5.6, tf: 8.5, Iy: 1940, Wy: 194, A: 28.5 },
  IPE240: { name: "IPE 240", h: 240, b: 120, tw: 6.2, tf: 9.8, Iy: 3890, Wy: 324, A: 39.1 },
  HEB100: { name: "HEB 100", h: 100, b: 100, tw: 6.0, tf: 10.0, Iy: 450, Wy: 89.9, A: 26.0 },
  HEB160: { name: "HEB 160", h: 160, b: 160, tw: 8.0, tf: 13.0, Iy: 2490, Wy: 311, A: 54.3 },
  HEB200: { name: "HEB 200", h: 200, b: 200, tw: 9.0, tf: 15.0, Iy: 5700, Wy: 570, A: 78.1 }
};

/**
 * Calculates cross-section properties:
 * - Second moment of area Iy (cm4 or in4)
 * - Section modulus Wy (cm3 or in3)
 * - Area A (cm2 or in2)
 * - Height h (mm or in)
 */
export function calculateSectionProperties(type, params, unit = "metric") {
  // All internal math in consistent basic units:
  // metric: mm -> outputs converted to cm4, cm3, cm2
  // imperial: in -> outputs in in4, in3, in2
  let Iy = 0;
  let Wy = 0;
  let A = 0;
  let h_total = 0;

  if (type === "rect") {
    // b, h in mm (metric) or in (imperial)
    const b = parseFloat(params.b) || 100;
    const h = parseFloat(params.h) || 200;
    h_total = h;
    A = b * h;
    Iy = (b * Math.pow(h, 3)) / 12;
    Wy = (b * Math.pow(h, 2)) / 6;

    if (unit === "metric") {
      // Convert mm4 -> cm4, mm3 -> cm3, mm2 -> cm2
      Iy = Iy / 1e4;
      Wy = Wy / 1e3;
      A = A / 1e2;
    }
  } else if (type === "i_beam") {
    const h = parseFloat(params.h) || 200;
    const b = parseFloat(params.b) || 100;
    const tw = parseFloat(params.tw) || 6;
    const tf = parseFloat(params.tf) || 9;
    h_total = h;
    const hw = Math.max(0, h - 2 * tf);
    A = 2 * (b * tf) + hw * tw;
    // Iy = (b*h^3 - (b - tw)*hw^3) / 12
    Iy = (b * Math.pow(h, 3) - (b - tw) * Math.pow(hw, 3)) / 12;
    Wy = Iy / (h / 2);

    if (unit === "metric") {
      Iy = Iy / 1e4;
      Wy = Wy / 1e3;
      A = A / 1e2;
    }
  } else if (type === "hollow_rect") {
    const B = parseFloat(params.b) || 120;
    const H = parseFloat(params.h) || 160;
    const t = parseFloat(params.t) || 6;
    h_total = H;
    const bi = Math.max(0, B - 2 * t);
    const hi = Math.max(0, H - 2 * t);
    A = (B * H) - (bi * hi);
    Iy = (B * Math.pow(H, 3) - bi * Math.pow(hi, 3)) / 12;
    Wy = Iy / (H / 2);

    if (unit === "metric") {
      Iy = Iy / 1e4;
      Wy = Wy / 1e3;
      A = A / 1e2;
    }
  } else if (type === "round_solid") {
    const d = parseFloat(params.d) || 80;
    h_total = d;
    A = (Math.PI * Math.pow(d, 2)) / 4;
    Iy = (Math.PI * Math.pow(d, 4)) / 64;
    Wy = (Math.PI * Math.pow(d, 3)) / 32;

    if (unit === "metric") {
      Iy = Iy / 1e4;
      Wy = Wy / 1e3;
      A = A / 1e2;
    }
  } else if (type === "round_tube") {
    const D = parseFloat(params.D) || 100;
    const t = parseFloat(params.t) || 5;
    h_total = D;
    const d = Math.max(0, D - 2 * t);
    A = (Math.PI * (Math.pow(D, 2) - Math.pow(d, 2))) / 4;
    Iy = (Math.PI * (Math.pow(D, 4) - Math.pow(d, 4))) / 64;
    Wy = Iy / (D / 2);

    if (unit === "metric") {
      Iy = Iy / 1e4;
      Wy = Wy / 1e3;
      A = A / 1e2;
    }
  } else if (type === "standard") {
    const profile = STANDARD_PROFILES[params.name] || STANDARD_PROFILES.IPE200;
    h_total = profile.h;
    if (unit === "metric") {
      Iy = profile.Iy; // already in cm4
      Wy = profile.Wy; // cm3
      A = profile.A;   // cm2
    } else {
      // Convert cm4 -> in4 (1 cm4 = 0.024025 in4)
      Iy = profile.Iy * 0.0240251;
      Wy = profile.Wy * 0.0610237;
      A = profile.A * 0.155;
      h_total = profile.h / 25.4;
    }
  } else {
    // direct custom I
    Iy = parseFloat(params.custom_I) || 1000;
    h_total = parseFloat(params.custom_h) || (unit === "metric" ? 200 : 8);
    Wy = Iy / (h_total / (unit === "metric" ? 20 : 2));
    A = 50;
  }

  return {
    Iy: Math.max(0.0001, Iy),
    Wy: Math.max(0.0001, Wy),
    A: Math.max(0.0001, A),
    h: h_total
  };
}

/**
 * Solves the complete static & deflection problem for a Simply Supported Beam under UDL
 *
 * Formula reference:
 * - Total load: W = w * L
 * - Reaction forces: R_A = R_B = (w * L) / 2
 * - Shear force: V(x) = w * (L / 2 - x)
 * - Maximum shear: V_max = R_A = (w * L) / 2 (at x = 0 and x = L)
 * - Bending moment: M(x) = (w * x / 2) * (L - x)
 * - Maximum moment: M_max = (w * L^2) / 8 (at x = L / 2)
 * - Maximum deflection: delta_max = (5 * w * L^4) / (384 * E * I) (at x = L / 2)
 * - Deflection at x: delta(x) = (w * x) / (24 * E * I) * (L^3 - 2 * L * x^2 + x^3)
 * - Support rotation angle: theta_A = theta_B = (w * L^3) / (24 * E * I)
 * - Maximum bending stress: sigma_max = M_max / W
 */
export function solveBeamUDL({ L, w, x, E, I, W_mod, unit = "metric" }) {
  // Sanitize inputs
  const span = Math.max(0.001, parseFloat(L) || 1);
  const load = Math.max(0, parseFloat(w) || 0);
  const pos = Math.max(0, Math.min(span, parseFloat(x) || 0));
  const modE = Math.max(0.001, parseFloat(E) || 1);
  const momI = Math.max(0.0001, parseFloat(I) || 1);
  const secW = Math.max(0.0001, parseFloat(W_mod) || 1);

  // Total Load
  const W_total = load * span;

  // Reaction Forces
  const R_A = (load * span) / 2;
  const R_B = R_A;

  // Shear Force
  const V_max = R_A;
  const V_x = load * (span / 2 - pos);

  // Bending Moment
  const M_max = (load * Math.pow(span, 2)) / 8;
  const M_x = (load * pos / 2) * (span - pos);

  // Deflections calculation:
  // We need consistent fundamental SI units (N, m) or Imperial (lbf, in)
  let delta_max = 0;
  let delta_x = 0;
  let theta_A_rad = 0;
  let sigma_max = 0;
  let sigma_x = 0;

  if (unit === "metric") {
    // Inputs:
    // L in m
    // w in kN/m -> w_N_m = w * 1e3 N/m
    // x in m
    // E in GPa -> E_Pa = E * 1e9 N/m2
    // I in cm4 -> I_m4 = I * 1e-8 m4
    // W in cm3 -> W_m3 = W * 1e-6 m3
    const w_SI = load * 1e3; // N/m
    const E_SI = modE * 1e9; // N/m2
    const I_SI = momI * 1e-8; // m4
    const W_SI = secW * 1e-6; // m3

    // delta_max = (5 * w * L^4) / (384 * E * I) [m] -> convert to mm (* 1000)
    const d_max_m = (5 * w_SI * Math.pow(span, 4)) / (384 * E_SI * I_SI);
    delta_max = d_max_m * 1000; // mm

    // delta(x) = (w * x) / (24 * E * I) * (L^3 - 2*L*x^2 + x^3) [m] -> mm
    const d_x_m = ((w_SI * pos) / (24 * E_SI * I_SI)) * (Math.pow(span, 3) - 2 * span * Math.pow(pos, 2) + Math.pow(pos, 3));
    delta_x = d_x_m * 1000; // mm

    // Support rotation (radians)
    theta_A_rad = (w_SI * Math.pow(span, 3)) / (24 * E_SI * I_SI);

    // Bending Stress: sigma = M / W [N/m2] -> convert to MPa (N/mm2)
    // M_max is in kN*m -> M_Nm = M_max * 1e3
    const M_max_Nm = M_max * 1e3;
    sigma_max = (M_max_Nm / W_SI) / 1e6; // MPa

    const M_x_Nm = M_x * 1e3;
    sigma_x = (M_x_Nm / W_SI) / 1e6; // MPa
  } else {
    // Imperial Units:
    // L in ft -> convert to in (* 12)
    // w in lbf/ft -> convert to lbf/in (/ 12)
    // x in ft -> convert to in (* 12)
    // E in ksi (or Mpsi) -> E in psi (E * 1000)
    // I in in4
    // W in in3
    const L_in = span * 12;
    const w_in = load / 12; // lbf/in
    const x_in = pos * 12;
    const E_psi = modE * 1000; // if E in ksi -> psi
    const I_in4 = momI;
    const W_in3 = secW;

    // delta_max [in]
    delta_max = (5 * w_in * Math.pow(L_in, 4)) / (384 * E_psi * I_in4);

    // delta_x [in]
    delta_x = ((w_in * x_in) / (24 * E_psi * I_in4)) * (Math.pow(L_in, 3) - 2 * L_in * Math.pow(x_in, 2) + Math.pow(x_in, 3));

    theta_A_rad = (w_in * Math.pow(L_in, 3)) / (24 * E_psi * I_in4);

    // M in lbf*ft -> convert to lbf*in (* 12)
    const M_max_lbf_in = M_max * 12;
    sigma_max = (M_max_lbf_in / W_in3) / 1000; // ksi

    const M_x_lbf_in = M_x * 12;
    sigma_x = (M_x_lbf_in / W_in3) / 1000; // ksi
  }

  // Deflection span ratio (e.g. L / 350)
  const span_for_ratio = unit === "metric" ? span * 1000 : span * 12; // in mm or in
  const ratio_max = delta_max > 0.00001 ? Math.round(span_for_ratio / delta_max) : 999999;

  return {
    L: span,
    w: load,
    x: pos,
    E: modE,
    I: momI,
    W_sec: secW,
    unit,
    W_total,
    R_A,
    R_B,
    V_max,
    V_x,
    M_max,
    M_x,
    delta_max: Math.abs(delta_max),
    delta_x: Math.abs(delta_x),
    theta_A_rad: Math.abs(theta_A_rad),
    theta_A_deg: Math.abs(theta_A_rad * (180 / Math.PI)),
    sigma_max,
    sigma_x,
    ratio_max,
  };
}

/**
 * Generate sampling points for diagrams
 */
export function generateDiagramCurves(solution, numPoints = 120) {
  const { L, w, E, I, unit } = solution;
  const points = [];

  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * L;
    const solAtX = solveBeamUDL({ L, w, x, E, I, W_mod: solution.W_sec, unit });

    points.push({
      x,
      x_rel: x / L,
      V: solAtX.V_x,
      M: solAtX.M_x,
      delta: solAtX.delta_x,
      sigma: solAtX.sigma_x
    });
  }

  return points;
}

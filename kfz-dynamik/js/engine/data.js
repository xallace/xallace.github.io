/* Example data from Mitschke/Wallentowitz, Dynamik der Kraftfahrzeuge, 5th ed. 2014.
   Each preset cites its source. Values in SI units. */
(function (root) {
  'use strict';
  const K = root.KfzDyn;

  // Table 21.7: l = 2.5 m, iL = 19, VL = 1, i/l = 0.46
  const einspurFahrzeuge = [
    { name: 'Veh. 1', title: 'Baseline vehicle, understeering', p: { m: 1000, lVrel: 0.5, caV: 50000, caH: 50000, nV: 0.06, CL: 10000 } },
    { name: 'Veh. 2', title: 'High cornering-stiffness tires', p: { m: 1000, lVrel: 0.5, caV: 75000, caH: 75000, nV: 0.06, CL: 10000 } },
    { name: 'Veh. 3', title: 'Low cornering-stiffness tires', p: { m: 1000, lVrel: 0.5, caV: 25000, caH: 25000, nV: 0.06, CL: 10000 } },
    { name: 'Veh. 4', title: 'Stiff steering, small caster trail', p: { m: 1000, lVrel: 0.5, caV: 50000, caH: 50000, nV: 0.04, CL: 20000 } },
    { name: 'Veh. 5', title: 'Compliant steering, large caster trail', p: { m: 1000, lVrel: 0.5, caV: 50000, caH: 50000, nV: 0.08, CL: 5000 } },
    { name: 'Veh. 6', title: 'Rear-heavy, strongly understeering', p: { m: 1000, lVrel: 0.6, caV: 45000, caH: 55000, nV: 0.06, CL: 10000 } },
    { name: 'Veh. 7', title: 'Front-heavy', p: { m: 1000, lVrel: 0.4, caV: 55000, caH: 45000, nV: 0.06, CL: 10000 } },
    { name: 'Veh. 8', title: 'Loaded, oversteering (vcrit = 33.4 m/s)', p: { m: 1400, lVrel: 0.6, caV: 50000, caH: 50000, nV: 0.06, CL: 10000 } },
  ].map((v) => ({ ...v, p: { l: 2.5, iL: 19, VL: 1, iRel: 0.46, ...v.p } }));

  // Table 13.1, values per wheel (spring rates in N/m, damping in Ns/m)
  const base13 = { Fzstat: 2820, m1: 31, m2: 229, m3: 28, c1: 128000, c2: 20200, c3: 9900, k2: 1140, k3: 260 };
  const schwingungFahrzeuge = [
    { name: 'Veh. 1', title: 'Mid-size passenger car, 1 occupant (baseline)', p: {} },
    { name: 'Veh. 2', title: 'Soft body spring, ν2/2π = 0.8 Hz', p: { c2: 5100 } },
    { name: 'Veh. 4', title: 'Stiff body spring, ν2/2π = 2.1 Hz', p: { c2: 40400 } },
    { name: 'Veh. 8', title: 'Very lightly damped, D2 = 0.05', p: { k2: 230 } },
    { name: 'Veh. 5', title: 'Lightly damped, D2 = 0.16', p: { k2: 680 } },
    { name: 'Veh. 6', title: 'Heavily damped, D2 = 0.37', p: { k2: 1590 } },
    { name: 'Veh. 20', title: 'Heavy wheel mass, m1 = 62 kg', p: { m1: 62, Fzstat: 3120 } },
    { name: 'Veh. 22', title: 'Soft tire, c1 = 94 kN/m', p: { c1: 94000 } },
    { name: 'Veh. 23', title: 'No occupants (2-mass system)', p: { Fzstat: 2450, m2: 219, m3: 0 } },
    { name: 'Veh. 25', title: '3 occupants + luggage, suspension unadjusted', p: { Fzstat: 4410, m2: 335, m3: 84, c3: 29800, k3: 790 } },
    { name: 'Veh. 28', title: '3 occupants + luggage, body spring adjusted (c2 = 27.5 kN/m)', p: { Fzstat: 4410, m2: 335, m3: 84, c2: 27500, c3: 29800, k3: 790 } },
  ].map((v) => ({ ...v, p: { ...base13, ...v.p } }));

  // Table 11.5 (ISO 8608), mean values at w = 2
  const strassenklassen = [
    { name: 'A · Very good', PhiOmega0: 1e-6 },
    { name: 'B · Good', PhiOmega0: 4e-6 },
    { name: 'C · Average', PhiOmega0: 16e-6 },
    { name: 'D · Poor', PhiOmega0: 64e-6 },
    { name: 'E · Very poor', PhiOmega0: 256e-6 },
  ];

  // Table 9.1 Reaction times (mean, 2 %, 98 %)
  const reaktion = [
    { name: 'direct gaze', tr: [0.64, 0.36, 0.78] },
    { name: 'eye shift 0.5–5°', tr: [1.12, 0.68, 1.33] },
    { name: 'eye shift > 5°', tr: [1.25, 0.77, 1.48] },
  ];

  // Fig. 2.44, Tire 205/60 R 15, Fz = 4000 N, dry – digitized from plots
  const reifenMessung = {
    FxVsSlip: [[0.14, 4830], [0.2, 4700], [0.3, 4400], [0.4, 4050], [0.5, 3800], [0.6, 3600], [0.8, 3330], [1.0, 3170]],
    FyVsAlpha: [[3, 2600], [6, 3200], [9, 3600], [12, 3850], [15, 3900]],
  };

  K.data = { einspurFahrzeuge, schwingungFahrzeuge, strassenklassen, reaktion, reifenMessung };
})(typeof globalThis !== 'undefined' ? globalThis : this);

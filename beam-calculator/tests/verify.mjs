// Analytical Euler-Bernoulli, cross-section & SI<->US verification for beam-engine.js
// Run with: node tests/verify.mjs
import { readFileSync } from 'node:fs';

globalThis.window = globalThis;
(0, eval)(readFileSync(new URL('../beam-engine.js', import.meta.url), 'utf8'));

const E = window.BEAM_ENGINE;

let failed = 0;
function approx(a, b, relTol = 1e-4) {
  const denom = Math.max(1e-9, Math.abs(b));
  return Math.abs(a - b) / denom <= relTol;
}
function check(name, ok, detail) {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}: ${detail}`);
  if (!ok) failed++;
}

// 1. Classic Metric analytical case: L=6m, w=15 kN/m, IPE200, S235
{
  const sec = E.calculateSectionProperties('standard', { name: 'IPE200' }, 'metric');
  const sol = E.solveBeamUDL({
    L: 6.0, w: 15.0, x: 3.0, E: 210, I: sec.Iy, W_mod: sec.Wy, h_depth: sec.h, yieldVal: 235, unit: 'metric',
  });
  check('Reactions RA=RB=45 kN', approx(sol.R_A, 45) && approx(sol.R_B, 45), `RA=${sol.R_A}, RB=${sol.R_B}`);
  check('Midspan Shear V(L/2)=0', Math.abs(sol.V_x) < 1e-9, `V(3)=${sol.V_x}`);
  check('Peak Moment Mmax=67.5 kNm', approx(sol.M_max, 67.5) && approx(sol.M_x, 67.5), `Mmax=${sol.M_max}`);
  // delta_max = 5 * 15e3 * 6^4 / (384 * 210e9 * 1940e-8) = 0.062107... wait: 5*15000*1296 / (384*210e9*1.94e-5) = 97.2e6 / 1.564416e9 = 0.0621318? Wait: 1940e-8 = 1.94e-5; 384*210e9*1.94e-5 = 1,564,416,000 -> 97,200,000 / 1,564,416,000 = 0.0621318 m? No: 97.2e6/1.564416e9 = 0.0621318... WAIT check!
  // Let's verify exact formula: 5 * 15000 * 1296 = 97,200,000; 384 * 210e9 * 1940e-8 = 384 * 2.1e11 * 1.94e-5 = 384 * 4.074e6 = 1,564,416,000 -> wait 97.2e6 / 1564.416e6 = 0.062132 m = 62.13 mm? Wait: 6^4 = 1296. Let's compute!
  const expectedDeltaMm = ((5 * 15000 * Math.pow(6, 4)) / (384 * 210e9 * 1940e-8)) * 1000;
  check('Peak Deflection exact Euler-Bernoulli', approx(sol.delta_max, expectedDeltaMm, 1e-6), `delta=${sol.delta_max.toFixed(4)} mm vs ${expectedDeltaMm.toFixed(4)} mm`);
  const expectedSigma = (67.5e3 / (194e-6)) / 1e6;
  check('Peak Stress sigma=347.94 MPa & yield FAIL', approx(sol.sigma_max, expectedSigma, 1e-5) && !sol.strengthOk, `sigma=${sol.sigma_max.toFixed(2)} MPa`);
}

// 2. Boundary conditions & differential equilibrium dM/dx = V
{
  const sec = E.calculateSectionProperties('rect', { b: 80, h: 200 }, 'metric');
  const s0 = E.solveBeamUDL({ L: 4, w: 3.5, x: 0, E: 11, I: sec.Iy, W_mod: sec.Wy, h_depth: sec.h, yieldVal: 24, unit: 'metric' });
  const sL = E.solveBeamUDL({ L: 4, w: 3.5, x: 4, E: 11, I: sec.Iy, W_mod: sec.Wy, h_depth: sec.h, yieldVal: 24, unit: 'metric' });
  const dx = 1e-4;
  const sA = E.solveBeamUDL({ L: 4, w: 3.5, x: 1.2 - dx, E: 11, I: sec.Iy, W_mod: sec.Wy, h_depth: sec.h, yieldVal: 24, unit: 'metric' });
  const sB = E.solveBeamUDL({ L: 4, w: 3.5, x: 1.2 + dx, E: 11, I: sec.Iy, W_mod: sec.Wy, h_depth: sec.h, yieldVal: 24, unit: 'metric' });
  const sM = E.solveBeamUDL({ L: 4, w: 3.5, x: 1.2, E: 11, I: sec.Iy, W_mod: sec.Wy, h_depth: sec.h, yieldVal: 24, unit: 'metric' });
  const dMdx = (sB.M_x - sA.M_x) / (2 * dx);

  check('Boundary conditions M=0, delta=0 at x=0 and x=L',
    Math.abs(s0.M_x) < 1e-9 && Math.abs(sL.M_x) < 1e-9 && Math.abs(s0.delta_x) < 1e-9 && Math.abs(sL.delta_x) < 1e-9,
    `M(0)=${s0.M_x}, M(L)=${sL.M_x}, d(0)=${s0.delta_x}, d(L)=${sL.delta_x}`);
  check('Differential identity dM/dx = V(x)', approx(dMdx, sM.V_x, 1e-5), `dM/dx=${dMdx.toFixed(5)} vs V=${sM.V_x.toFixed(5)}`);
}

// 3. SI <-> Imperial physical invariance (same beam in metric vs imperial yields identical physical sag & stress!)
{
  const secM = E.calculateSectionProperties('standard', { name: 'IPE200' }, 'metric');
  const secI = E.calculateSectionProperties('standard', { name: 'IPE200' }, 'imperial');
  const solM = E.solveBeamUDL({
    L: 6.0, w: 8.0, x: 1.5, E: 210, I: secM.Iy, W_mod: secM.Wy, h_depth: secM.h, yieldVal: 235, unit: 'metric',
  });
  const solI = E.solveBeamUDL({
    L: 6.0 * 3.2808399,
    w: 8.0 * 68.5217659,
    x: 1.5 * 3.2808399,
    E: 210 * 145.0377377,
    I: secI.Iy,
    W_mod: secI.Wy,
    h_depth: secI.h,
    yieldVal: 235 * 0.1450377377,
    unit: 'imperial',
  });
  const deltaI_in_mm = solI.delta_max * 25.4;
  const sigmaI_in_MPa = solI.sigma_max / 0.1450377377;
  check('SI <-> US deflection invariance', approx(solM.delta_max, deltaI_in_mm, 1e-3),
    `SI=${solM.delta_max.toFixed(3)} mm vs US=${deltaI_in_mm.toFixed(3)} mm`);
  check('SI <-> US bending stress invariance', approx(solM.sigma_max, sigmaI_in_MPa, 1e-3),
    `SI=${solM.sigma_max.toFixed(2)} MPa vs US=${sigmaI_in_MPa.toFixed(2)} MPa`);
  check('SI <-> US rotation angle invariance', approx(solM.theta_A_rad, solI.theta_A_rad, 1e-3),
    `SI=${solM.theta_A_rad.toFixed(6)} rad vs US=${solI.theta_A_rad.toFixed(6)} rad`);
}

// 4. All cross-section shapes analytical checks
{
  const r = E.calculateSectionProperties('rect', { b: 100, h: 200 }, 'metric');
  check('Rectangular Iy = bh³/12', approx(r.Iy, (100 * 200 ** 3) / 12 / 1e4, 1e-6), `Iy=${r.Iy.toFixed(2)} cm⁴`);

  const c = E.calculateSectionProperties('round_solid', { d: 100 }, 'metric');
  check('Round solid Iy = πd⁴/64', approx(c.Iy, (Math.PI * 100 ** 4) / 64 / 1e4, 1e-6), `Iy=${c.Iy.toFixed(2)} cm⁴`);

  const h = E.calculateSectionProperties('hollow_rect', { b: 100, h: 140, t: 6 }, 'metric');
  const expH = (100 * 140 ** 3 - 88 * 128 ** 3) / 12 / 1e4;
  check('Hollow RHS Iy exact', approx(h.Iy, expH, 1e-6), `Iy=${h.Iy.toFixed(2)} cm⁴`);
}

// 5. All 5 Scenario Presets & 7 Tour Stops finite and behave as documented
{
  const presets = Object.values(E.SCENARIO_PRESETS);
  let allFinite = true;
  for (const sc of presets) {
    const mat = E.MATERIALS[sc.materialKey];
    const sec = E.calculateSectionProperties(
      sc.sectionType,
      sc.sectionType === 'standard' ? { name: sc.standardProfileKey } : sc.sectionParams,
      'metric'
    );
    const sol = E.solveBeamUDL({
      L: sc.L, w: sc.w, x: sc.L * sc.xFrac, E: mat.E_metric, I: sec.Iy, W_mod: sec.Wy, h_depth: sec.h, yieldVal: mat.yield_metric, unit: 'metric',
    });
    if (!Number.isFinite(sol.delta_max) || !Number.isFinite(sol.sigma_max) || !Number.isFinite(sol.M_max)) {
      allFinite = false;
    }
    console.log(`  Preset [${sc.id}]: Mmax=${sol.M_max.toFixed(1)} kNm, sigma=${sol.sigma_max.toFixed(1)} MPa (${sol.utilizationPct.toFixed(0)}% fy), delta=${sol.delta_max.toFixed(2)} mm (L/${sol.ratio_max}), ULS=${sol.strengthOk}, SLS=${sol.serviceOk}`);
  }
  check('All 5 scenario presets finite', allFinite && presets.length === 5, `${presets.length} presets checked`);
  check('All 7 tour stops & 6 concept cards defined', E.TOUR_STOPS.length === 7 && E.CONCEPT_CARDS.length === 6, `${E.TOUR_STOPS.length} stops, ${E.CONCEPT_CARDS.length} concepts`);
}

console.log(`\nSummary: ${failed === 0 ? 'ALL CHECKS PASSED' : `${failed} FAILED`}`);
if (failed > 0) process.exit(1);

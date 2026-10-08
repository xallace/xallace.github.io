/**
 * ============================================================================
 * BeamLab Application Controller
 * Handles reactivity, state sync, unit switching, cross-section inputs,
 * and live formula substitution.
 * ============================================================================
 */

import { MATERIALS, STANDARD_PROFILES, calculateSectionProperties, solveBeamUDL, generateDiagramCurves } from './beam-engine.js';
import { DiagramRenderer } from './diagram-renderer.js';

// Application State
const state = {
  unit: 'metric', // 'metric' | 'imperial'
  L: 6.0,
  w: 15.0,
  x: 3.0,
  materialKey: 'steel_s235',
  customE: 210,
  sectionType: 'standard', // 'standard' | 'rect' | 'i_beam' | 'hollow_rect' | 'round_solid' | 'round_tube' | 'custom'
  standardProfileKey: 'IPE200',
  sectionParams: {
    b: 100,
    h: 200,
    tw: 6,
    tf: 9,
    t: 6,
    d: 80,
    D: 100,
    custom_I: 1940,
    custom_h: 200
  },
  momentTensionBottom: true,
};

let diagramRenderer = null;

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  initDiagramRenderer();
  restoreStateFromURL();
  renderSectionParamInputs();
  updateUIUnits();
  recalculate();
  bindInputEvents();
});

function initDiagramRenderer() {
  diagramRenderer = new DiagramRenderer({
    containerFBD: document.getElementById('viewport-fbd'),
    containerSFD: document.getElementById('viewport-sfd'),
    containerBMD: document.getElementById('viewport-bmd'),
    containerDeflection: document.getElementById('viewport-deflection'),
    onProbeChange: (newX) => {
      state.x = newX;
      syncSliderAndInput('x', state.x);
      recalculate();
    }
  });
}

function bindInputEvents() {
  // Span L
  const sliderL = document.getElementById('slider-L');
  const inpL = document.getElementById('inp-L');
  sliderL.addEventListener('input', (e) => {
    state.L = parseFloat(e.target.value) || 1;
    inpL.value = state.L.toFixed(2);
    // Clamp x to new L
    if (state.x > state.L) state.x = state.L;
    syncSliderAndInput('x', state.x);
    recalculate();
  });
  inpL.addEventListener('change', (e) => {
    state.L = Math.max(0.1, parseFloat(e.target.value) || 1);
    sliderL.value = state.L;
    if (state.x > state.L) state.x = state.L;
    syncSliderAndInput('x', state.x);
    recalculate();
  });

  // Load w
  const sliderW = document.getElementById('slider-w');
  const inpW = document.getElementById('inp-w');
  sliderW.addEventListener('input', (e) => {
    state.w = parseFloat(e.target.value) || 0;
    inpW.value = state.w.toFixed(2);
    recalculate();
  });
  inpW.addEventListener('change', (e) => {
    state.w = Math.max(0, parseFloat(e.target.value) || 0);
    sliderW.value = state.w;
    recalculate();
  });

  // Probe x
  const sliderX = document.getElementById('slider-x');
  const inpX = document.getElementById('inp-x');
  sliderX.addEventListener('input', (e) => {
    state.x = parseFloat(e.target.value) || 0;
    inpX.value = state.x.toFixed(2);
    recalculate();
  });
  inpX.addEventListener('change', (e) => {
    state.x = Math.max(0, Math.min(state.L, parseFloat(e.target.value) || 0));
    sliderX.value = state.x;
    recalculate();
  });
}

function syncSliderAndInput(key, val) {
  const slider = document.getElementById(`slider-${key}`);
  const inp = document.getElementById(`inp-${key}`);
  if (slider) slider.value = val;
  if (inp) inp.value = val.toFixed(2);
}

// Global functions exposed to window for HTML onclick/onchange
window.setUnit = function(newUnit) {
  if (state.unit === newUnit) return;

  // Convert current parameters smoothly
  if (newUnit === 'imperial') {
    // Metric -> Imperial
    state.L = state.L * 3.28084; // m -> ft
    state.x = state.x * 3.28084;
    state.w = state.w * 68.52176; // kN/m -> lbf/ft
  } else {
    // Imperial -> Metric
    state.L = state.L / 3.28084; // ft -> m
    state.x = state.x / 3.28084;
    state.w = state.w / 68.52176; // lbf/ft -> kN/m
  }

  state.unit = newUnit;

  document.getElementById('btn-unit-metric').classList.toggle('active', state.unit === 'metric');
  document.getElementById('btn-unit-imperial').classList.toggle('active', state.unit === 'imperial');

  updateUIUnits();
  renderSectionParamInputs();
  recalculate();
};

window.toggleMomentConvention = function() {
  state.momentTensionBottom = !state.momentTensionBottom;
  diagramRenderer.momentTensionBottom = state.momentTensionBottom;
  const label = document.getElementById('moment-convention-label');
  if (label) {
    label.textContent = state.momentTensionBottom ? 'BMD: Tension Down (EC)' : 'BMD: Math Plot (+ Up)';
  }
  recalculate();
};

window.setPreset = function(key, val) {
  if (key === 'L') {
    state.L = state.unit === 'metric' ? val : val * 3.28084;
    if (state.x > state.L) state.x = state.L;
    syncSliderAndInput('x', state.x);
  } else if (key === 'w') {
    state.w = state.unit === 'metric' ? val : val * 68.52;
  }
  syncSliderAndInput(key, state[key]);
  recalculate();
};

window.setProbePreset = function(fraction) {
  state.x = fraction * state.L;
  syncSliderAndInput('x', state.x);
  recalculate();
};

window.onMaterialChange = function() {
  const sel = document.getElementById('sel-material');
  state.materialKey = sel.value;
  const customWrap = document.getElementById('custom-E-wrap');

  if (state.materialKey === 'custom') {
    customWrap.style.display = 'flex';
  } else {
    customWrap.style.display = 'none';
  }
  recalculate();
};

window.onCustomEChange = function() {
  const inp = document.getElementById('inp-custom-E');
  state.customE = parseFloat(inp.value) || 210;
  recalculate();
};

window.onSectionTypeChange = function() {
  const sel = document.getElementById('sel-section-type');
  state.sectionType = sel.value;

  const standardWrap = document.getElementById('cs-standard-wrap');
  const paramsWrap = document.getElementById('cs-params-wrap');

  if (state.sectionType === 'standard') {
    standardWrap.style.display = 'block';
    paramsWrap.style.display = 'none';
  } else {
    standardWrap.style.display = 'none';
    paramsWrap.style.display = 'grid';
    renderSectionParamInputs();
  }
  recalculate();
};

window.onStandardProfileChange = function() {
  const sel = document.getElementById('sel-standard-profile');
  state.standardProfileKey = sel.value;
  recalculate();
};

function renderSectionParamInputs() {
  const wrap = document.getElementById('cs-params-wrap');
  if (!wrap) return;

  const uLen = state.unit === 'metric' ? 'mm' : 'in';
  const uI = state.unit === 'metric' ? 'cm⁴' : 'in⁴';
  const p = state.sectionParams;

  let html = '';
  if (state.sectionType === 'rect') {
    html = `
      <div class="cs-input-group">
        <label class="cs-label">Width b (${uLen})</label>
        <input type="number" class="cs-input" value="${p.b}" onchange="updateCSParam('b', this.value)">
      </div>
      <div class="cs-input-group">
        <label class="cs-label">Height h (${uLen})</label>
        <input type="number" class="cs-input" value="${p.h}" onchange="updateCSParam('h', this.value)">
      </div>
    `;
  } else if (state.sectionType === 'i_beam') {
    html = `
      <div class="cs-input-group">
        <label class="cs-label">Total Height h (${uLen})</label>
        <input type="number" class="cs-input" value="${p.h}" onchange="updateCSParam('h', this.value)">
      </div>
      <div class="cs-input-group">
        <label class="cs-label">Flange Width b (${uLen})</label>
        <input type="number" class="cs-input" value="${p.b}" onchange="updateCSParam('b', this.value)">
      </div>
      <div class="cs-input-group">
        <label class="cs-label">Web tw (${uLen})</label>
        <input type="number" class="cs-input" value="${p.tw}" onchange="updateCSParam('tw', this.value)">
      </div>
      <div class="cs-input-group">
        <label class="cs-label">Flange tf (${uLen})</label>
        <input type="number" class="cs-input" value="${p.tf}" onchange="updateCSParam('tf', this.value)">
      </div>
    `;
  } else if (state.sectionType === 'hollow_rect') {
    html = `
      <div class="cs-input-group">
        <label class="cs-label">Width B (${uLen})</label>
        <input type="number" class="cs-input" value="${p.b}" onchange="updateCSParam('b', this.value)">
      </div>
      <div class="cs-input-group">
        <label class="cs-label">Height H (${uLen})</label>
        <input type="number" class="cs-input" value="${p.h}" onchange="updateCSParam('h', this.value)">
      </div>
      <div class="cs-input-group" style="grid-column: span 2;">
        <label class="cs-label">Wall Thickness t (${uLen})</label>
        <input type="number" class="cs-input" value="${p.t}" onchange="updateCSParam('t', this.value)">
      </div>
    `;
  } else if (state.sectionType === 'round_solid') {
    html = `
      <div class="cs-input-group" style="grid-column: span 2;">
        <label class="cs-label">Diameter d (${uLen})</label>
        <input type="number" class="cs-input" value="${p.d}" onchange="updateCSParam('d', this.value)">
      </div>
    `;
  } else if (state.sectionType === 'round_tube') {
    html = `
      <div class="cs-input-group">
        <label class="cs-label">Outer Ø D (${uLen})</label>
        <input type="number" class="cs-input" value="${p.D}" onchange="updateCSParam('D', this.value)">
      </div>
      <div class="cs-input-group">
        <label class="cs-label">Wall Thickness t (${uLen})</label>
        <input type="number" class="cs-input" value="${p.t}" onchange="updateCSParam('t', this.value)">
      </div>
    `;
  } else if (state.sectionType === 'custom') {
    html = `
      <div class="cs-input-group">
        <label class="cs-label">Moment of Inertia I (${uI})</label>
        <input type="number" class="cs-input" value="${p.custom_I}" onchange="updateCSParam('custom_I', this.value)">
      </div>
      <div class="cs-input-group">
        <label class="cs-label">Outer Depth h (${uLen})</label>
        <input type="number" class="cs-input" value="${p.custom_h}" onchange="updateCSParam('custom_h', this.value)">
      </div>
    `;
  }

  wrap.innerHTML = html;
}

window.updateCSParam = function(paramKey, val) {
  state.sectionParams[paramKey] = parseFloat(val) || 0;
  recalculate();
};

function updateUIUnits() {
  const isMetric = state.unit === 'metric';
  document.getElementById('unit-L').textContent = isMetric ? 'm' : 'ft';
  document.getElementById('unit-w').textContent = isMetric ? 'kN/m' : 'lbf/ft';
  document.getElementById('unit-x').textContent = isMetric ? 'm' : 'ft';
  document.getElementById('unit-E').textContent = isMetric ? 'GPa' : 'ksi';

  // Slider limits
  const sliderL = document.getElementById('slider-L');
  sliderL.max = isMetric ? 30 : 100;

  const sliderW = document.getElementById('slider-w');
  sliderW.max = isMetric ? 120 : 6000;

  // KPI Units
  document.getElementById('kpi-unit-R').textContent = isMetric ? 'kN' : 'lbf';
  document.getElementById('kpi-unit-V').textContent = isMetric ? 'kN' : 'lbf';
  document.getElementById('kpi-unit-M').textContent = isMetric ? 'kNm' : 'lbf·ft';
  document.getElementById('kpi-unit-delta').textContent = isMetric ? 'mm' : 'in';
  document.getElementById('kpi-unit-sigma').textContent = isMetric ? 'MPa' : 'ksi';
}

function recalculate() {
  const isMetric = state.unit === 'metric';

  // 1. Cross-section properties
  let csParams = { ...state.sectionParams, name: state.standardProfileKey };
  const secProp = calculateSectionProperties(state.sectionType, csParams, state.unit);

  // 2. Material E
  let modE = 0;
  let yieldVal = 250;
  if (state.materialKey === 'custom') {
    modE = state.customE;
    yieldVal = isMetric ? 250 : 36;
  } else {
    const mat = MATERIALS[state.materialKey] || MATERIALS.steel_s235;
    modE = isMetric ? mat.E_metric : mat.E_imperial;
    yieldVal = isMetric ? mat.yield_metric : mat.yield_imperial;
  }

  // Update slider x max
  const sliderX = document.getElementById('slider-x');
  sliderX.max = state.L;

  // 3. Solve static & deflection system
  const solution = solveBeamUDL({
    L: state.L,
    w: state.w,
    x: state.x,
    E: modE,
    I: secProp.Iy,
    W_mod: secProp.Wy,
    unit: state.unit
  });

  const points = generateDiagramCurves(solution, 120);

  // 4. Update Header displays
  document.getElementById('disp-L').textContent = `${state.L.toFixed(2)} ${isMetric ? 'm' : 'ft'}`;
  document.getElementById('disp-w').textContent = `${state.w.toFixed(2)} ${isMetric ? 'kN/m' : 'lbf/ft'}`;
  document.getElementById('disp-x').textContent = `${state.x.toFixed(2)} ${isMetric ? 'm' : 'ft'} (${((state.x / state.L) * 100).toFixed(0)}% L)`;
  document.getElementById('disp-E').textContent = `${modE} ${isMetric ? 'GPa' : 'ksi'}`;
  document.getElementById('disp-I').textContent = `${secProp.Iy.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${isMetric ? 'cm⁴' : 'in⁴'}`;
  document.getElementById('disp-W').textContent = `${secProp.Wy.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${isMetric ? 'cm³' : 'in³'}`;
  document.getElementById('disp-A').textContent = `${secProp.A.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${isMetric ? 'cm²' : 'in²'}`;

  // 5. Update KPI Cards
  document.getElementById('kpi-R').textContent = solution.R_A.toFixed(2);
  document.getElementById('kpi-W-total').textContent = `${solution.W_total.toFixed(2)} ${isMetric ? 'kN' : 'lbf'}`;
  document.getElementById('kpi-Vmax').textContent = solution.V_max.toFixed(2);
  document.getElementById('kpi-Vx').textContent = `${solution.V_x.toFixed(2)} ${isMetric ? 'kN' : 'lbf'}`;
  document.getElementById('kpi-Mmax').textContent = solution.M_max.toFixed(2);
  document.getElementById('kpi-Mx').textContent = `${solution.M_x.toFixed(2)} ${isMetric ? 'kNm' : 'lbf·ft'}`;
  document.getElementById('kpi-dmax').textContent = solution.delta_max.toFixed(3);
  document.getElementById('kpi-dx').textContent = `${solution.delta_x.toFixed(3)} ${isMetric ? 'mm' : 'in'}`;
  document.getElementById('kpi-ratio').textContent = `L / ${solution.ratio_max}`;
  document.getElementById('kpi-sigma').textContent = solution.sigma_max.toFixed(1);
  document.getElementById('kpi-theta').textContent = `${solution.theta_A_deg.toFixed(2)}° (${solution.theta_A_rad.toFixed(4)} rad)`;

  // Yield Stress Check
  const yieldCheckEl = document.getElementById('kpi-yield-check');
  const utilization = (solution.sigma_max / yieldVal) * 100;
  if (utilization <= 100) {
    yieldCheckEl.textContent = `OK (${utilization.toFixed(0)}% fy)`;
    yieldCheckEl.style.color = 'var(--accent-emerald)';
  } else {
    yieldCheckEl.textContent = `Yield Exceeded (${utilization.toFixed(0)}% fy)`;
    yieldCheckEl.style.color = 'var(--accent-rose)';
  }

  // 6. Render SVG Diagrams
  if (diagramRenderer) {
    diagramRenderer.render(solution, points);
  }

  // 7. Update Live Substitution Box
  updateLiveSubstitution(solution, modE, secProp);

  // 8. Update URL hash
  updateURLHash();
}

function updateLiveSubstitution(sol, modE, secProp) {
  const isMetric = sol.unit === 'metric';
  const uW = isMetric ? 'kN/m' : 'lbf/ft';
  const uL = isMetric ? 'm' : 'ft';
  const uR = isMetric ? 'kN' : 'lbf';
  const uM = isMetric ? 'kNm' : 'lbf·ft';
  const uDef = isMetric ? 'mm' : 'in';

  document.getElementById('subst-step1').innerHTML = `
    <strong>1. Reaction Forces:</strong> R_A = R_B = (${sol.w.toFixed(2)} ${uW} × ${sol.L.toFixed(2)} ${uL}) / 2 = <strong>${sol.R_A.toFixed(2)} ${uR}</strong>
  `;

  document.getElementById('subst-step2').innerHTML = `
    <strong>2. Maximum Bending Moment:</strong> M_max = (${sol.w.toFixed(2)} × ${sol.L.toFixed(2)}²) / 8 = (${sol.w.toFixed(2)} × ${(sol.L * sol.L).toFixed(2)}) / 8 = <strong>${sol.M_max.toFixed(2)} ${uM}</strong>
  `;

  document.getElementById('subst-step3').innerHTML = `
    <strong>3. Max Deflection (Euler-Bernoulli):</strong> δ_max = (5 × ${sol.w.toFixed(2)} × ${sol.L.toFixed(2)}⁴) / (384 × ${modE} × ${secProp.Iy.toFixed(0)}) = <strong>${sol.delta_max.toFixed(3)} ${uDef}</strong> (L / ${sol.ratio_max})
  `;

  document.getElementById('subst-step4').innerHTML = `
    <strong>4. Point of Interest x = ${sol.x.toFixed(2)} ${uL}:</strong> V(x) = <strong>${sol.V_x.toFixed(2)} ${uR}</strong> | M(x) = <strong>${sol.M_x.toFixed(2)} ${uM}</strong> | δ(x) = <strong>${sol.delta_x.toFixed(3)} ${uDef}</strong>
  `;
}

function updateURLHash() {
  const p = new URLSearchParams();
  p.set('u', state.unit);
  p.set('L', state.L.toFixed(2));
  p.set('w', state.w.toFixed(2));
  p.set('x', state.x.toFixed(2));
  p.set('m', state.materialKey);
  p.set('sec', state.sectionType);
  if (state.sectionType === 'standard') {
    p.set('prof', state.standardProfileKey);
  }
  history.replaceState(null, '', '#' + p.toString());
}

function restoreStateFromURL() {
  if (!window.location.hash || window.location.hash.length < 2) return;
  try {
    const p = new URLSearchParams(window.location.hash.slice(1));
    if (p.has('u')) state.unit = p.get('u');
    if (p.has('L')) state.L = parseFloat(p.get('L')) || state.L;
    if (p.has('w')) state.w = parseFloat(p.get('w')) || state.w;
    if (p.has('x')) state.x = parseFloat(p.get('x')) || state.x;
    if (p.has('m')) state.materialKey = p.get('m');
    if (p.has('sec')) state.sectionType = p.get('sec');
    if (p.has('prof')) state.standardProfileKey = p.get('prof');

    // Sync input controls
    syncSliderAndInput('L', state.L);
    syncSliderAndInput('w', state.w);
    syncSliderAndInput('x', state.x);

    const selMat = document.getElementById('sel-material');
    if (selMat) selMat.value = state.materialKey;

    const selSec = document.getElementById('sel-section-type');
    if (selSec) selSec.value = state.sectionType;

    const selProf = document.getElementById('sel-standard-profile');
    if (selProf) selProf.value = state.standardProfileKey;
  } catch (err) {
    console.warn("Could not restore URL parameters:", err);
  }
}

window.copyReport = function() {
  const isMetric = state.unit === 'metric';
  const uW = isMetric ? 'kN/m' : 'lbf/ft';
  const uL = isMetric ? 'm' : 'ft';
  const uR = isMetric ? 'kN' : 'lbf';
  const uM = isMetric ? 'kNm' : 'lbf·ft';
  const uDef = isMetric ? 'mm' : 'in';
  const uSig = isMetric ? 'MPa' : 'ksi';

  const report = `=======================================================
BeamLab · Simply Supported Beam with Uniformly Distributed Load (UDL)
Reference: StructX Beam Formulas 001 / Eurocode 3 / AISC
=======================================================
SPAN & LOADING:
  * Span Length L:          ${state.L.toFixed(2)} ${uL}
  * Uniform Load w:         ${state.w.toFixed(2)} ${uW}
  * Total Resultant Load W: ${(state.w * state.L).toFixed(2)} ${uR}
  * Evaluation Position x:  ${state.x.toFixed(2)} ${uL}

REACTION FORCES & SHEAR:
  * Reaction R_A = R_B:     ${document.getElementById('kpi-R').textContent} ${uR}
  * Maximum Shear V_max:    ${document.getElementById('kpi-Vmax').textContent} ${uR}
  * Shear at x V(x):        ${document.getElementById('kpi-Vx').textContent}

BENDING MOMENT & STRESS:
  * Maximum Moment M_max:   ${document.getElementById('kpi-Mmax').textContent} ${uM}
  * Moment at x M(x):       ${document.getElementById('kpi-Mx').textContent}
  * Maximum Stress σ_max:   ${document.getElementById('kpi-sigma').textContent} ${uSig}

DEFLECTION & SLOPE:
  * Maximum Deflection:     ${document.getElementById('kpi-dmax').textContent} ${uDef} (${document.getElementById('kpi-ratio').textContent})
  * Deflection at x δ(x):   ${document.getElementById('kpi-dx').textContent}
  * Support Rotation θ:     ${document.getElementById('kpi-theta').textContent}
=======================================================
Calculated with BeamLab by Walter Lehn (@xallace)
URL: ${window.location.href}
`;

  navigator.clipboard.writeText(report).then(() => {
    alert("✅ Calculation report copied to clipboard!");
  }).catch(() => {
    prompt("Copy calculation summary:", report);
  });
};

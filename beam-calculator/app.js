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
  bindInputEvents();

  ensureKaTeXReady(() => {
    renderStaticFormulas();
    recalculate();
  });
});

window.addEventListener('load', () => {
  ensureKaTeXReady(() => {
    renderStaticFormulas();
  });
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
  updateLiveSubstitution(solution, modE, secProp, yieldVal);

  // 8. Update URL hash
  updateURLHash();
}

/**
 * Render dynamic mathematical step-by-step substitution using KaTeX.
 */
function updateLiveSubstitution(sol, modE, secProp, yieldVal = 235) {
  const isMetric = sol.unit === 'metric';
  const uW = isMetric ? '\\text{kN/m}' : '\\text{lbf/ft}';
  const uL = isMetric ? '\\text{m}' : '\\text{ft}';
  const uR = isMetric ? '\\text{kN}' : '\\text{lbf}';
  const uM = isMetric ? '\\text{kNm}' : '\\text{lbf}\\!\\cdot\\!\\text{ft}';
  const uDef = isMetric ? '\\text{mm}' : '\\text{in}';
  const uSig = isMetric ? '\\text{MPa}' : '\\text{ksi}';
  const uIy = isMetric ? '\\text{cm}^4' : '\\text{in}^4';
  const uWy = isMetric ? '\\text{cm}^3' : '\\text{in}^3';
  const uE = isMetric ? '\\text{GPa}' : '\\text{ksi}';

  // Step 1: Support Reaction Forces
  const step1El = document.getElementById('subst-step1');
  if (step1El) {
    step1El.innerHTML = `
      <div class="subst-step-label">
        <span class="step-num">1</span>
        <strong>Support Reaction Forces (Auflagerkräfte):</strong>
      </div>
      <div class="subst-step-eq" id="subst-eq-1"></div>
      <div class="subst-step-sub">Symmetrie bedingt: Gleichmäßige Lastaufteilung auf beide Lager A und B (\(R_A + R_B = W_{\\text{total}} = ${(sol.w * sol.L).toFixed(2)}\\text{ ${isMetric ? 'kN' : 'lbf'}}\)).</div>
    `;
    const latex1 = `R_A = R_B = \\frac{w \\cdot L}{2} = \\frac{${sol.w.toFixed(2)} \\cdot ${sol.L.toFixed(2)}}{2} = \\mathbf{${sol.R_A.toFixed(2)} \\text{ ${uR}}}`;
    renderLatex(document.getElementById('subst-eq-1'), latex1, true);
    renderMath(step1El.querySelector('.subst-step-sub'));
  }

  // Step 2: Maximum Bending Moment
  const step2El = document.getElementById('subst-step2');
  if (step2El) {
    step2El.innerHTML = `
      <div class="subst-step-label">
        <span class="step-num">2</span>
        <strong>Maximum Bending Moment (Maximales Biegemoment bei x = L/2):</strong>
      </div>
      <div class="subst-step-eq" id="subst-eq-2"></div>
      <div class="subst-step-sub">Parabolischer Verlauf mit Scheitelpunkt in Trägermitte bei Feldmitte \(x = ${(sol.L / 2).toFixed(2)}\\text{ ${isMetric ? 'm' : 'ft'}}\).</div>
    `;
    const latex2 = `M_{\\max} = \\frac{w \\cdot L^2}{8} = \\frac{${sol.w.toFixed(2)} \\cdot (${sol.L.toFixed(2)})^2}{8} = \\frac{${sol.w.toFixed(2)} \\cdot ${(sol.L * sol.L).toFixed(2)}}{8} = \\mathbf{${sol.M_max.toFixed(2)} \\text{ ${uM}}}`;
    renderLatex(document.getElementById('subst-eq-2'), latex2, true);
    renderMath(step2El.querySelector('.subst-step-sub'));
  }

  // Step 3: Elastic Deflection (Euler-Bernoulli)
  const step3El = document.getElementById('subst-step3');
  if (step3El) {
    step3El.innerHTML = `
      <div class="subst-step-label">
        <span class="step-num">3</span>
        <strong>Max Elastic Deflection (Biegelinie nach Euler-Bernoulli bei x = L/2):</strong>
      </div>
      <div class="subst-step-eq" id="subst-eq-3"></div>
      <div class="subst-step-sub">Biegesteifigkeit: \(E = ${modE}\\text{ ${isMetric ? 'GPa' : 'ksi'}}\), \(I_y = ${secProp.Iy.toLocaleString(undefined, { maximumFractionDigits: 1 })}\\text{ ${isMetric ? 'cm⁴' : 'in⁴'}}\). Verhältnis: \(L / ${sol.ratio_max}\).</div>
    `;
    const latex3 = `\\delta_{\\max} = \\frac{5 \\cdot w \\cdot L^4}{384 \\cdot E \\cdot I_y} = \\mathbf{${sol.delta_max.toFixed(3)} \\text{ ${uDef}}} \\quad \\left[\\text{Gebrauchstauglichkeit: } \\frac{L}{${sol.ratio_max}}\\right]`;
    renderLatex(document.getElementById('subst-eq-3'), latex3, true);
    renderMath(step3El.querySelector('.subst-step-sub'));
  }

  // Step 4: Point of Interest Evaluation at Probe x
  const step4El = document.getElementById('subst-step4');
  if (step4El) {
    step4El.innerHTML = `
      <div class="subst-step-label">
        <span class="step-num">4</span>
        <strong>Internal Forces at Evaluation Point (Schnittgrößen bei x = ${sol.x.toFixed(2)} ${isMetric ? 'm' : 'ft'}):</strong>
      </div>
      <div class="subst-step-eq" id="subst-eq-4"></div>
      <div class="subst-step-sub">Lokale Querkraft \(V(x)\), Biegemoment \(M(x)\) und elastische Absenkung \(\\delta(x)\) am Tastpunkt.</div>
    `;
    const latex4 = `x = ${sol.x.toFixed(2)} \\text{ ${uL}} \\implies \\begin{cases} V(x) = w \\cdot \\left(\\frac{L}{2} - x\\right) = \\mathbf{${sol.V_x.toFixed(2)} \\text{ ${uR}}} \\\\[4pt] M(x) = \\frac{w \\cdot x}{2} \\cdot (L - x) = \\mathbf{${sol.M_x.toFixed(2)} \\text{ ${uM}}} \\\\[4pt] \\delta(x) = \\frac{w \\cdot x}{24 E I_y} \\left(L^3 - 2Lx^2 + x^3\\right) = \\mathbf{${sol.delta_x.toFixed(3)} \\text{ ${uDef}}} \\end{cases}`;
    renderLatex(document.getElementById('subst-eq-4'), latex4, true);
    renderMath(step4El.querySelector('.subst-step-sub'));
  }

  // Step 5: Bending Stress Verification
  const step5El = document.getElementById('subst-step5');
  if (step5El) {
    const utilization = (sol.sigma_max / yieldVal) * 100;
    const ok = utilization <= 100;
    const statusText = ok ? `\\text{OK } (${utilization.toFixed(0)}\\% \\le f_y)` : `\\text{Yield Exceeded } (${utilization.toFixed(0)}\\% > f_y)`;
    step5El.innerHTML = `
      <div class="subst-step-label">
        <span class="step-num">5</span>
        <strong>Maximum Bending Stress &amp; Section Modulus (Biegespannungsnachweis):</strong>
      </div>
      <div class="subst-step-eq" id="subst-eq-5"></div>
      <div class="subst-step-sub">Widerstandsmoment: \(W_y = ${secProp.Wy.toLocaleString(undefined, { maximumFractionDigits: 1 })}\\text{ ${isMetric ? 'cm³' : 'in³'}}\), Fließgrenze: \(f_y = ${yieldVal}\\text{ ${isMetric ? 'MPa' : 'ksi'}}\).</div>
    `;
    const latex5 = `\\sigma_{\\max} = \\frac{M_{\\max}}{W_y} = \\frac{${sol.M_max.toFixed(2)} \\text{ ${uM}}}{${secProp.Wy.toFixed(1)} \\text{ ${uWy}}} = \\mathbf{${sol.sigma_max.toFixed(1)} \\text{ ${uSig}}} \\quad \\left[\\mathbf{${statusText}}\\right]`;
    renderLatex(document.getElementById('subst-eq-5'), latex5, true);
    renderMath(step5El.querySelector('.subst-step-sub'));
  }
}

/**
 * Render a specific LaTeX string into a target DOM element using KaTeX.
 */
export function renderLatex(el, latex, displayMode = true) {
  if (!el) return;
  if (typeof window.katex !== 'undefined') {
    try {
      window.katex.render(latex, el, {
        displayMode: displayMode,
        throwOnError: false
      });
      return;
    } catch (err) {
      console.warn('KaTeX render error:', err);
    }
  }
  el.textContent = latex;
}

/**
 * Auto-render math delimiters in a DOM subtree ($$...$$, \(...\), etc.)
 */
export function renderMath(rootEl = document.body) {
  if (!rootEl) return;
  if (typeof window.renderMathInElement === 'function') {
    try {
      window.renderMathInElement(rootEl, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
          { left: '$', right: '$', display: false }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'input', 'select'],
        throwOnError: false
      });
    } catch (err) {
      console.warn('KaTeX auto-render error:', err);
    }
  }
}

/**
 * Renders all static formulas and formula badges across the page.
 */
function renderStaticFormulas() {
  const theoryGrid = document.querySelector('.formula-grid');
  if (theoryGrid) {
    renderMath(theoryGrid);
  }
  const badges = document.querySelectorAll('.kpi-formula-badge, .diagram-badge');
  badges.forEach(b => renderMath(b));
}

/**
 * Ensures KaTeX and auto-render are ready before executing callback.
 * Includes dynamic CDN fallback if local vendor fails to load.
 */
function ensureKaTeXReady(callback) {
  if (typeof window.katex !== 'undefined' && typeof window.renderMathInElement === 'function') {
    callback();
    return;
  }
  let attempts = 0;
  const poll = setInterval(() => {
    attempts++;
    if (typeof window.katex !== 'undefined' && typeof window.renderMathInElement === 'function') {
      clearInterval(poll);
      callback();
    } else if (attempts > 30) {
      clearInterval(poll);
      console.warn('KaTeX local vendor not responding; loading from CDN fallback...');
      loadKaTeXFromCDN(callback);
    }
  }, 50);
}

function loadKaTeXFromCDN(callback) {
  if (typeof window.katex !== 'undefined' && typeof window.renderMathInElement === 'function') {
    if (callback) callback();
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
  document.head.appendChild(link);

  const s1 = document.createElement('script');
  s1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
  s1.onload = () => {
    const s2 = document.createElement('script');
    s2.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
    s2.onload = () => {
      if (callback) callback();
    };
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
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

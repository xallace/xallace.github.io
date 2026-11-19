/* ==========================================================================
   app.js — BeamLab Interactive Application Controller
   Wires 1967 Book-Plate UI, Scenario Presets, Unit Conversions, Guided Tour,
   Live Probe Inspector, Cross-Section Modeler & KaTeX Step-by-Step Math.
   ========================================================================== */
(function () {
  'use strict';

  const E = window.BEAM_ENGINE;
  const D = window.BEAM_DIAGRAMS;

  // Unit conversion constants
  const M_TO_FT = 3.2808399;
  const KNM_TO_LBFFT = 68.5217659;
  const MM_TO_IN = 1 / 25.4;
  const CM4_TO_IN4 = 0.024025096;
  const GPA_TO_KSI = 145.0377377;

  const state = {
    tab: 'plate',
    unit: 'metric', // 'metric' | 'imperial'
    activeScenario: 'office_safe',
    L: 6.0,
    w: 8.0,
    x: 3.0,
    materialKey: 'steel_s235',
    customE: 210,
    sectionType: 'standard',
    standardProfileKey: 'IPE240',
    sectionParams: {
      b: 100,
      h: 200,
      tw: 6,
      tf: 9,
      t: 6,
      d: 80,
      D: 100,
      custom_I: 1940,
      custom_h: 200,
    },
    momentTensionBottom: true,
    showCallouts: true,
    showFiberColors: true,
    showDeformation: true,
  };

  let renderer = null;
  let lastSolution = null;
  let lastSecProp = null;

  // Tour state
  let tourActive = false;
  let tourIdx = 0;
  let tourTimer = null;
  let toastTimer = null;

  document.addEventListener('DOMContentLoaded', () => {
    initRenderer();
    buildScenarioBar();
    buildConceptsAndHandbook();
    bindTabs();
    bindHeaderControls();
    bindHudToggles();
    bindSidebarInputs();
    bindTourControls();

    const restored = restoreStateFromURL();
    if (!restored) {
      applyScenario('office_safe', { silent: true });
    } else {
      syncAllControlsFromState();
    }

    renderUnitPresets();
    renderSectionParamInputs();
    updateUIUnits();

    ensureKaTeXReady(() => {
      renderStaticMath();
      recalculate();
    });
  });

  function initRenderer() {
    renderer = new D.DiagramRenderer({
      containerFBD: document.getElementById('viewport-fbd'),
      containerSFD: document.getElementById('viewport-sfd'),
      containerBMD: document.getElementById('viewport-bmd'),
      containerDeflection: document.getElementById('viewport-deflection'),
      containerCut: document.getElementById('viewport-cut'),
      containerSection: document.getElementById('viewport-section'),
      onProbeChange: (newX) => {
        state.x = newX;
        syncSliderAndInput('x', state.x);
        recalculate();
      },
    });
  }

  /* ------------------------------------------------------------------------
     Tab Navigation
     ------------------------------------------------------------------------ */
  function bindTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    const openMathBtn = document.getElementById('btn-open-math');
    if (openMathBtn) {
      openMathBtn.addEventListener('click', () => switchTab('math'));
    }
  }

  function switchTab(tabName) {
    state.tab = tabName;
    document.querySelectorAll('.tab-btn').forEach((b) => {
      const isAct = b.dataset.tab === tabName;
      b.classList.toggle('active', isAct);
      b.setAttribute('aria-selected', String(isAct));
    });

    document.getElementById('interactive-shell').classList.toggle('hidden', tabName !== 'plate');
    document.getElementById('math-view').classList.toggle('hidden', tabName !== 'math');
    document.getElementById('concepts-view').classList.toggle('hidden', tabName !== 'concepts');

    if (tabName === 'math' && lastSolution) {
      updateLiveSubstitution(lastSolution, lastSecProp);
      renderMathIn(document.getElementById('math-view'));
    } else if (tabName === 'concepts') {
      renderMathIn(document.getElementById('concepts-view'));
    }
  }

  /* ------------------------------------------------------------------------
     Scenario Presets
     ------------------------------------------------------------------------ */
  function buildScenarioBar() {
    const bar = document.getElementById('scenario-bar');
    if (!bar) return;
    bar.innerHTML = Object.values(E.SCENARIO_PRESETS)
      .map(
        (sc) =>
          `<button class="fig-chip${sc.id === state.activeScenario ? ' active' : ''}" data-scenario="${sc.id}" title="${sc.summary}">${sc.shortLabel}</button>`
      )
      .join('');

    bar.querySelectorAll('.fig-chip').forEach((btn) => {
      btn.addEventListener('click', () => applyScenario(btn.dataset.scenario));
    });
  }

  function applyScenario(scenarioId, opts) {
    const sc = E.SCENARIO_PRESETS[scenarioId];
    if (!sc) return;
    state.activeScenario = scenarioId;

    const isImp = state.unit === 'imperial';
    state.L = isImp ? sc.L * M_TO_FT : sc.L;
    state.w = isImp ? sc.w * KNM_TO_LBFFT : sc.w;
    const xFrac = opts && typeof opts.xFrac === 'number' ? opts.xFrac : sc.xFrac;
    state.x = state.L * xFrac;
    state.materialKey = sc.materialKey;
    state.sectionType = sc.sectionType;

    if (sc.standardProfileKey) {
      state.standardProfileKey = sc.standardProfileKey;
    }
    if (sc.sectionParams) {
      const factor = isImp ? MM_TO_IN : 1;
      Object.keys(sc.sectionParams).forEach((k) => {
        state.sectionParams[k] = Number((sc.sectionParams[k] * factor).toFixed(2));
      });
    }

    syncAllControlsFromState();
    renderSectionParamInputs();
    updateScenarioHeader();

    if (!(opts && opts.silent)) {
      recalculate();
    }
  }

  function markCustomScenario() {
    state.activeScenario = 'custom';
    updateScenarioHeader();
  }

  function updateScenarioHeader() {
    document.querySelectorAll('#scenario-bar .fig-chip').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.scenario === state.activeScenario);
    });
    const kickerEl = document.getElementById('scenario-kicker');
    const titleEl = document.getElementById('scenario-title');
    const sc = E.SCENARIO_PRESETS[state.activeScenario];
    if (sc) {
      kickerEl.textContent = sc.kicker;
      titleEl.textContent = sc.label;
    } else {
      kickerEl.textContent = 'CUSTOM PARAMETRIC BEAM · PLATE 001';
      titleEl.textContent = 'Custom Beam Configuration';
    }
  }

  /* ------------------------------------------------------------------------
     Header & HUD Controls
     ------------------------------------------------------------------------ */
  function bindHeaderControls() {
    document.querySelectorAll('#unit-toggle-group .mini-btn').forEach((btn) => {
      btn.addEventListener('click', () => setUnit(btn.dataset.unit));
    });

    document.getElementById('btn-copy-report').addEventListener('click', copyReport);
    document.getElementById('btn-print-report').addEventListener('click', () => window.print());
  }

  function bindHudToggles() {
    document.querySelectorAll('#bmd-conv-group .mini-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.momentTensionBottom = btn.dataset.conv === 'down';
        renderer.momentTensionBottom = state.momentTensionBottom;
        document.querySelectorAll('#bmd-conv-group .mini-btn').forEach((b) => {
          b.classList.toggle('active', b === btn);
        });
        recalculate();
      });
    });

    const btnCallouts = document.getElementById('btn-toggle-callouts');
    btnCallouts.addEventListener('click', () => {
      state.showCallouts = !state.showCallouts;
      renderer.showCallouts = state.showCallouts;
      btnCallouts.classList.toggle('active', state.showCallouts);
      recalculate();
    });

    const btnFibers = document.getElementById('btn-toggle-fibers');
    btnFibers.addEventListener('click', () => {
      state.showFiberColors = !state.showFiberColors;
      renderer.showFiberColors = state.showFiberColors;
      btnFibers.classList.toggle('active', state.showFiberColors);
      recalculate();
    });

    const btnDeform = document.getElementById('btn-toggle-deform');
    btnDeform.addEventListener('click', () => {
      state.showDeformation = !state.showDeformation;
      renderer.showDeformation = state.showDeformation;
      btnDeform.classList.toggle('active', state.showDeformation);
      recalculate();
    });
  }

  function setUnit(newUnit) {
    if (state.unit === newUnit) return;
    const toImp = newUnit === 'imperial';

    state.L = toImp ? state.L * M_TO_FT : state.L / M_TO_FT;
    state.x = toImp ? state.x * M_TO_FT : state.x / M_TO_FT;
    state.w = toImp ? state.w * KNM_TO_LBFFT : state.w / KNM_TO_LBFFT;
    state.customE = toImp ? state.customE * GPA_TO_KSI : state.customE / GPA_TO_KSI;

    // Convert custom cross-section dimensions smoothly
    const lenFac = toImp ? MM_TO_IN : 1 / MM_TO_IN;
    ['b', 'h', 'tw', 'tf', 't', 'd', 'D', 'custom_h'].forEach((k) => {
      state.sectionParams[k] = Number((state.sectionParams[k] * lenFac).toFixed(2));
    });
    state.sectionParams.custom_I = Number(
      (toImp ? state.sectionParams.custom_I * CM4_TO_IN4 : state.sectionParams.custom_I / CM4_TO_IN4).toFixed(2)
    );

    state.unit = newUnit;

    document.getElementById('btn-unit-metric').classList.toggle('active', !toImp);
    document.getElementById('btn-unit-imperial').classList.toggle('active', toImp);

    updateUIUnits();
    renderUnitPresets();
    syncAllControlsFromState();
    renderSectionParamInputs();
    recalculate();
  }

  function updateUIUnits() {
    const isMetric = state.unit === 'metric';
    document.getElementById('unit-L').textContent = isMetric ? 'm' : 'ft';
    document.getElementById('unit-w').textContent = isMetric ? 'kN/m' : 'lbf/ft';
    document.getElementById('unit-x').textContent = isMetric ? 'm' : 'ft';
    document.getElementById('unit-E').textContent = isMetric ? 'GPa' : 'ksi';

    const sliderL = document.getElementById('slider-L');
    sliderL.min = isMetric ? 0.5 : 2;
    sliderL.max = isMetric ? 20 : 65;
    sliderL.step = isMetric ? 0.1 : 0.5;

    const sliderW = document.getElementById('slider-w');
    sliderW.min = 0;
    sliderW.max = isMetric ? 80 : 5000;
    sliderW.step = isMetric ? 0.5 : 25;
  }

  function renderUnitPresets() {
    const isMetric = state.unit === 'metric';
    const lPresets = isMetric ? [2, 4, 6, 8, 12] : [8, 12, 20, 28, 40];
    const wPresets = isMetric ? [3, 8, 15, 30, 50] : [200, 500, 1000, 2000, 3500];

    const wrapL = document.getElementById('presets-L');
    wrapL.innerHTML = lPresets
      .map((v) => `<button class="preset-btn" data-preset-l="${v}">${v} ${isMetric ? 'm' : 'ft'}</button>`)
      .join('');
    wrapL.querySelectorAll('.preset-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const val = parseFloat(b.dataset.presetL);
        const rel = state.L > 0 ? state.x / state.L : 0.5;
        state.L = val;
        state.x = state.L * rel;
        markCustomScenario();
        syncSliderAndInput('L', state.L);
        syncSliderAndInput('x', state.x);
        recalculate();
      });
    });

    const wrapW = document.getElementById('presets-w');
    wrapW.innerHTML = wPresets
      .map((v) => `<button class="preset-btn" data-preset-w="${v}">${v}</button>`)
      .join('');
    wrapW.querySelectorAll('.preset-btn').forEach((b) => {
      b.addEventListener('click', () => {
        state.w = parseFloat(b.dataset.presetW);
        markCustomScenario();
        syncSliderAndInput('w', state.w);
        recalculate();
      });
    });
  }

  /* ------------------------------------------------------------------------
     Sidebar Inputs & Cross-Section Controls
     ------------------------------------------------------------------------ */
  function bindSidebarInputs() {
    const sliderL = document.getElementById('slider-L');
    const inpL = document.getElementById('inp-L');
    sliderL.addEventListener('input', (e) => {
      const rel = state.L > 0 ? state.x / state.L : 0.5;
      state.L = Math.max(0.2, parseFloat(e.target.value) || 1);
      state.x = Math.min(state.L, state.L * rel);
      inpL.value = state.L.toFixed(2);
      markCustomScenario();
      syncSliderAndInput('x', state.x);
      recalculate();
    });
    inpL.addEventListener('change', (e) => {
      state.L = Math.max(0.2, parseFloat(e.target.value) || 1);
      sliderL.value = Math.min(parseFloat(sliderL.max), state.L);
      if (state.x > state.L) state.x = state.L;
      markCustomScenario();
      syncSliderAndInput('x', state.x);
      recalculate();
    });

    const sliderW = document.getElementById('slider-w');
    const inpW = document.getElementById('inp-w');
    sliderW.addEventListener('input', (e) => {
      state.w = Math.max(0, parseFloat(e.target.value) || 0);
      inpW.value = state.w.toFixed(2);
      markCustomScenario();
      recalculate();
    });
    inpW.addEventListener('change', (e) => {
      state.w = Math.max(0, parseFloat(e.target.value) || 0);
      sliderW.value = Math.min(parseFloat(sliderW.max), state.w);
      markCustomScenario();
      recalculate();
    });

    const sliderX = document.getElementById('slider-x');
    const inpX = document.getElementById('inp-x');
    sliderX.addEventListener('input', (e) => {
      state.x = Math.max(0, Math.min(state.L, parseFloat(e.target.value) || 0));
      inpX.value = state.x.toFixed(2);
      recalculate();
    });
    inpX.addEventListener('change', (e) => {
      state.x = Math.max(0, Math.min(state.L, parseFloat(e.target.value) || 0));
      sliderX.value = state.x;
      recalculate();
    });

    // Probe fraction buttons + FBD callout items
    document.querySelectorAll('[data-xfrac]').forEach((el) => {
      el.addEventListener('click', () => {
        const frac = parseFloat(el.dataset.xfrac);
        state.x = state.L * frac;
        syncSliderAndInput('x', state.x);
        recalculate();
      });
    });

    // Material
    document.getElementById('sel-material').addEventListener('change', (e) => {
      state.materialKey = e.target.value;
      document.getElementById('custom-E-wrap').classList.toggle('hidden', state.materialKey !== 'custom');
      markCustomScenario();
      recalculate();
    });

    document.getElementById('inp-custom-E').addEventListener('input', (e) => {
      state.customE = Math.max(0.1, parseFloat(e.target.value) || 210);
      markCustomScenario();
      recalculate();
    });

    // Section type & standard profile
    document.getElementById('sel-section-type').addEventListener('change', (e) => {
      state.sectionType = e.target.value;
      updateSectionVisibility();
      renderSectionParamInputs();
      markCustomScenario();
      recalculate();
    });

    document.getElementById('sel-standard-profile').addEventListener('change', (e) => {
      state.standardProfileKey = e.target.value;
      markCustomScenario();
      recalculate();
    });
  }

  function updateSectionVisibility() {
    const isStd = state.sectionType === 'standard';
    document.getElementById('cs-standard-wrap').classList.toggle('hidden', !isStd);
    document.getElementById('cs-params-wrap').classList.toggle('hidden', isStd);
  }

  function syncSliderAndInput(key, val) {
    const slider = document.getElementById(`slider-${key}`);
    const inp = document.getElementById(`inp-${key}`);
    if (slider) {
      if (key === 'x') slider.max = state.L;
      slider.value = val;
    }
    if (inp) {
      if (key === 'x') inp.max = state.L;
      inp.value = val.toFixed(2);
    }
  }

  function syncAllControlsFromState() {
    syncSliderAndInput('L', state.L);
    syncSliderAndInput('w', state.w);
    syncSliderAndInput('x', state.x);

    document.getElementById('sel-material').value = state.materialKey;
    document.getElementById('custom-E-wrap').classList.toggle('hidden', state.materialKey !== 'custom');
    document.getElementById('inp-custom-E').value = state.customE.toFixed(1);

    document.getElementById('sel-section-type').value = state.sectionType;
    document.getElementById('sel-standard-profile').value = state.standardProfileKey;
    updateSectionVisibility();

    document.getElementById('btn-unit-metric').classList.toggle('active', state.unit === 'metric');
    document.getElementById('btn-unit-imperial').classList.toggle('active', state.unit === 'imperial');
  }

  function renderSectionParamInputs() {
    const wrap = document.getElementById('cs-params-wrap');
    if (!wrap) return;
    const uLen = state.unit === 'metric' ? 'mm' : 'in';
    const uI = state.unit === 'metric' ? 'cm⁴' : 'in⁴';
    const p = state.sectionParams;
    let fields = [];

    if (state.sectionType === 'rect') {
      fields = [
        { k: 'b', label: `Width b (${uLen})` },
        { k: 'h', label: `Height h (${uLen})` },
      ];
    } else if (state.sectionType === 'i_beam') {
      fields = [
        { k: 'h', label: `Total Height h (${uLen})` },
        { k: 'b', label: `Flange Width b (${uLen})` },
        { k: 'tw', label: `Web tw (${uLen})` },
        { k: 'tf', label: `Flange tf (${uLen})` },
      ];
    } else if (state.sectionType === 'hollow_rect') {
      fields = [
        { k: 'b', label: `Width B (${uLen})` },
        { k: 'h', label: `Height H (${uLen})` },
        { k: 't', label: `Wall t (${uLen})`, span2: true },
      ];
    } else if (state.sectionType === 'round_solid') {
      fields = [{ k: 'd', label: `Diameter d (${uLen})`, span2: true }];
    } else if (state.sectionType === 'round_tube') {
      fields = [
        { k: 'D', label: `Outer Ø D (${uLen})` },
        { k: 't', label: `Wall t (${uLen})` },
      ];
    } else if (state.sectionType === 'custom') {
      fields = [
        { k: 'custom_I', label: `Inertia Iy (${uI})` },
        { k: 'custom_h', label: `Outer Depth h (${uLen})` },
      ];
    }

    wrap.innerHTML = fields
      .map(
        (f) => `
        <div class="cs-input-group"${f.span2 ? ' style="grid-column:span 2;"' : ''}>
          <label class="cs-label">${f.label}</label>
          <input type="number" class="cs-input" step="any" min="0.01" data-cskey="${f.k}" value="${p[f.k]}">
        </div>
      `
      )
      .join('');

    wrap.querySelectorAll('.cs-input').forEach((inp) => {
      inp.addEventListener('input', () => {
        const val = parseFloat(inp.value);
        if (Number.isFinite(val) && val > 0) {
          state.sectionParams[inp.dataset.cskey] = val;
          markCustomScenario();
          recalculate();
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     Core Recalculation & UI Binding
     ------------------------------------------------------------------------ */
  function recalculate() {
    const isMetric = state.unit === 'metric';
    const uL = isMetric ? 'm' : 'ft';
    const uW = isMetric ? 'kN/m' : 'lbf/ft';
    const uF = isMetric ? 'kN' : 'lbf';
    const uM = isMetric ? 'kNm' : 'lbf·ft';
    const uD = isMetric ? 'mm' : 'in';
    const uS = isMetric ? 'MPa' : 'ksi';
    const uE = isMetric ? 'GPa' : 'ksi';
    const uI = isMetric ? 'cm⁴' : 'in⁴';
    const uWy = isMetric ? 'cm³' : 'in³';
    const uA = isMetric ? 'cm²' : 'in²';

    const secProp = E.calculateSectionProperties(
      state.sectionType,
      { ...state.sectionParams, name: state.standardProfileKey },
      state.unit
    );

    const mat = E.MATERIALS[state.materialKey] || E.MATERIALS.steel_s235;
    const modE = state.materialKey === 'custom'
      ? state.customE
      : (isMetric ? mat.E_metric : mat.E_imperial);
    const yieldVal = isMetric ? mat.yield_metric : mat.yield_imperial;

    const sliderX = document.getElementById('slider-x');
    sliderX.max = state.L;
    if (state.x > state.L) {
      state.x = state.L;
      syncSliderAndInput('x', state.x);
    }

    const sol = E.solveBeamUDL({
      L: state.L,
      w: state.w,
      x: state.x,
      E: modE,
      I: secProp.Iy,
      W_mod: secProp.Wy,
      h_depth: secProp.h,
      yieldVal,
      unit: state.unit,
    });
    const points = E.generateDiagramCurves(sol, 120);

    lastSolution = sol;
    lastSecProp = secProp;

    // 1. Update Top HUD Status Pills
    const badgeStr = document.getElementById('badge-strength');
    badgeStr.textContent = sol.strengthOk
      ? `Strength PASS (${sol.utilizationPct.toFixed(0)}% fy)`
      : `YIELD FAIL (${sol.utilizationPct.toFixed(0)}% fy)`;
    badgeStr.className = `status-pill ${sol.strengthOk ? 'good' : 'warn'}`;

    const badgeSvc = document.getElementById('badge-service');
    const ratioTxt = sol.ratio_max > 9999 ? '∞' : sol.ratio_max;
    badgeSvc.textContent = sol.serviceOk
      ? `Sag L/${ratioTxt} (≤ L/300)`
      : `SAG WARN L/${ratioTxt} (> L/300)`;
    badgeSvc.className = `status-pill ${sol.serviceOk ? 'good' : 'warn'}`;

    const badgeSlender = document.getElementById('badge-slender');
    badgeSlender.classList.toggle('hidden', !sol.deepBeamWarning);

    // 2. Update Sidebar Header & Plain-English Probe Reading
    document.getElementById('sidebar-probe-tag').textContent = `x = ${sol.x.toFixed(2)} ${uL}`;
    const reading = E.describeProbeState(sol);
    document.getElementById('live-reading-location').textContent = reading.locationDesc;
    const chkEl = document.getElementById('live-reading-check');
    chkEl.textContent = reading.checkDesc;
    chkEl.className = `reading-check-line ${!sol.strengthOk ? 'warn' : (!sol.serviceOk ? 'caution' : 'good')}`;

    // 3. Update 6-Tile KPI Grid
    document.getElementById('kpi-R').textContent = `${sol.R_A.toFixed(2)} ${uF}`;
    document.getElementById('kpi-W-total').textContent = `Total ${sol.W_total.toFixed(1)} ${uF}`;

    const vSign = sol.V_x > 0.005 ? '+' : '';
    document.getElementById('kpi-Vx').textContent = `${vSign}${sol.V_x.toFixed(2)} ${uF}`;
    document.getElementById('kpi-Vmax').textContent = `Peak ±${sol.V_max.toFixed(1)} ${uF}`;

    document.getElementById('kpi-Mx').textContent = `${sol.M_x.toFixed(2)} ${uM}`;
    document.getElementById('kpi-Mmax').textContent = `Peak ${sol.M_max.toFixed(1)} ${uM}`;

    const dmaxEl = document.getElementById('kpi-dmax');
    dmaxEl.textContent = `${sol.delta_max.toFixed(2)} ${uD}`;
    dmaxEl.className = `kpi-val ${sol.serviceOk ? '' : 'warn'}`;
    document.getElementById('kpi-ratio').textContent = `L / ${ratioTxt}`;

    const sigEl = document.getElementById('kpi-sigma');
    sigEl.textContent = `${sol.sigma_max.toFixed(1)} ${uS}`;
    sigEl.className = `kpi-val ${sol.strengthOk ? 'good' : 'warn'}`;
    const yldEl = document.getElementById('kpi-yield-check');
    yldEl.textContent = sol.strengthOk
      ? `${sol.utilizationPct.toFixed(0)}% fy · OK`
      : `${sol.utilizationPct.toFixed(0)}% fy · FAIL`;
    yldEl.className = `kpi-sub-mini ${sol.strengthOk ? 'good' : 'warn'}`;

    document.getElementById('kpi-theta').textContent = `${sol.theta_A_deg.toFixed(2)}°`;
    document.getElementById('kpi-dx').textContent = `δ(x) ${sol.delta_x.toFixed(2)} ${uD}`;

    // 4. Update Control Readouts
    document.getElementById('disp-L').textContent = `${sol.L.toFixed(2)} ${uL}`;
    document.getElementById('disp-w').textContent = `${sol.w.toFixed(2)} ${uW}`;
    document.getElementById('disp-x').textContent = `${sol.x.toFixed(2)} ${uL} (${(sol.x_rel * 100).toFixed(0)}% L)`;
    document.getElementById('disp-E').textContent = `${modE.toFixed(0)} ${uE} (fy ${yieldVal})`;
    document.getElementById('disp-I').textContent = `${secProp.Iy.toLocaleString('en-US', { maximumFractionDigits: 1 })} ${uI}`;
    document.getElementById('disp-W').textContent = `${secProp.Wy.toLocaleString('en-US', { maximumFractionDigits: 1 })} ${uWy}`;
    document.getElementById('disp-A').textContent = `${secProp.A.toLocaleString('en-US', { maximumFractionDigits: 1 })} ${uA}`;
    document.getElementById('disp-Lh').textContent = sol.slenderness.toFixed(1);

    // Highlight active probe preset button
    document.querySelectorAll('.preset-btn[data-xfrac]').forEach((b) => {
      const f = parseFloat(b.dataset.xfrac);
      b.classList.toggle('active', Math.abs(sol.x_rel - f) < 0.025);
    });
    document.querySelectorAll('#fbd-callout-list .callout-item').forEach((item) => {
      const f = parseFloat(item.dataset.xfrac);
      item.classList.toggle('selected', Math.abs(sol.x_rel - f) < 0.04);
    });

    // 5. Render All 6 Synchronized SVG Plates
    renderer.render(sol, points, secProp);

    // 6. Update Worked Math tab if visible (or always keep fresh)
    updateLiveSubstitution(sol, secProp);

    // 7. Update shareable URL hash
    updateURLHash();
  }

  /* ------------------------------------------------------------------------
     Step-by-Step Live KaTeX Math (Tab 2)
     ------------------------------------------------------------------------ */
  function updateLiveSubstitution(sol, secProp) {
    const isMetric = sol.unit === 'metric';
    const uL = isMetric ? '\\text{m}' : '\\text{ft}';
    const uF = isMetric ? '\\text{kN}' : '\\text{lbf}';
    const uM = isMetric ? '\\text{kNm}' : '\\text{lbf}\\!\\cdot\\!\\text{ft}';
    const uD = isMetric ? '\\text{mm}' : '\\text{in}';
    const uS = isMetric ? '\\text{MPa}' : '\\text{ksi}';
    const uWy = isMetric ? '\\text{cm}^3' : '\\text{in}^3';
    const uIy = isMetric ? '\\text{cm}^4' : '\\text{in}^4';
    const uE = isMetric ? '\\text{GPa}' : '\\text{ksi}';
    const ratioTxt = sol.ratio_max > 9999 ? '\\infty' : sol.ratio_max;

    const steps = [
      {
        id: 'subst-step1',
        num: 1,
        title: 'Total Load & Support Reactions (Equilibrium)',
        latex: `R_A = R_B = \\frac{w \\cdot L}{2} = \\frac{${sol.w.toFixed(2)} \\cdot ${sol.L.toFixed(2)}}{2} = \\mathbf{${sol.R_A.toFixed(2)}}\\,${uF}`,
        sub: `Total downward weight W = ${sol.W_total.toFixed(2)} ${isMetric ? 'kN' : 'lbf'} splits symmetrically between Pin A and Roller B.`,
      },
      {
        id: 'subst-step2',
        num: 2,
        title: `Internal Shear Force at Probe x = ${sol.x.toFixed(2)} ${isMetric ? 'm' : 'ft'}`,
        latex: `V(x) = w\\left(\\frac{L}{2} - x\\right) = ${sol.w.toFixed(2)}\\left(${(sol.L / 2).toFixed(2)} - ${sol.x.toFixed(2)}\\right) = \\mathbf{${sol.V_x.toFixed(2)}}\\,${uF}`,
        sub: `Linear gradient starting at +${sol.V_max.toFixed(2)} at A, passing through zero at midspan (x = ${(sol.L / 2).toFixed(2)}), and ending at −${sol.V_max.toFixed(2)} at B.`,
      },
      {
        id: 'subst-step3',
        num: 3,
        title: `Bending Moment (Peak Mmax & Local at x = ${sol.x.toFixed(2)} ${isMetric ? 'm' : 'ft'})`,
        latex: `M_{\\max} = \\frac{wL^2}{8} = \\frac{${sol.w.toFixed(2)} \\cdot (${sol.L.toFixed(2)})^2}{8} = \\mathbf{${sol.M_max.toFixed(2)}}\\,${uM}, \\qquad M(x) = \\mathbf{${sol.M_x.toFixed(2)}}\\,${uM}`,
        sub: `Parabolic moment distribution peaking right where shear V(x) crosses zero. Bottom fibers are in tension; top fibers are in compression.`,
      },
      {
        id: 'subst-step4',
        num: 4,
        title: 'Extreme Fiber Bending Stress & Yield Verification (ULS)',
        latex: `\\sigma_{\\max} = \\frac{M_{\\max}}{W_y} = \\frac{${sol.M_max.toFixed(2)}\\,${uM}}{${secProp.Wy.toFixed(1)}\\,${uWy}} = \\mathbf{${sol.sigma_max.toFixed(1)}}\\,${uS} \\quad \\left[${sol.utilizationPct.toFixed(0)}\\%\\text{ of } f_y = ${sol.yieldVal}\\,${uS}\\right]`,
        sub: sol.strengthOk
          ? `PASS: Peak outer-fiber stress stays safely below material yield limit fy.`
          : `FAIL: Peak bending stress exceeds yield strength fy — increase section modulus Wy, choose stronger steel, or reduce load/span.`,
      },
      {
        id: 'subst-step5',
        num: 5,
        title: 'Elastic Deflection & Serviceability Check (SLS L/300)',
        latex: `\\delta_{\\max} = \\frac{5wL^4}{384\\,E\\,I_y} = \\mathbf{${sol.delta_max.toFixed(2)}}\\,${uD} \\;\\left(\\frac{L}{${ratioTxt}}\\right), \\qquad \\delta(x) = \\mathbf{${sol.delta_x.toFixed(2)}}\\,${uD}`,
        sub: `Using E = ${sol.E.toFixed(0)} ${isMetric ? 'GPa' : 'ksi'} and Iy = ${secProp.Iy.toFixed(1)} ${isMetric ? 'cm⁴' : 'in⁴'}. L/300 benchmark is ${sol.deflLimit300.toFixed(2)} ${isMetric ? 'mm' : 'in'} (${sol.serviceOk ? 'PASS' : 'EXCEEDED'}).`,
      },
      {
        id: 'subst-step6',
        num: 6,
        title: 'Support Rotation Angle (End Slope θ)',
        latex: `\\theta_A = \\theta_B = \\frac{wL^3}{24\\,E\\,I_y} = \\mathbf{${sol.theta_A_rad.toFixed(5)}}\\,\\text{rad} = \\mathbf{${sol.theta_A_deg.toFixed(2)}^\\circ}`,
        sub: `Steepest tilt of the elastic curve occurs right at the Pin A and Roller B bearings; midspan slope is exactly 0°.`,
      },
    ];

    steps.forEach((st) => {
      const container = document.getElementById(st.id);
      if (!container) return;
      container.innerHTML = `
        <div class="subst-step-label">
          <span class="step-num">${st.num}</span>
          <span>${st.title}</span>
        </div>
        <div class="subst-step-eq"></div>
        <div class="subst-step-sub">${st.sub}</div>
      `;
      renderLatex(container.querySelector('.subst-step-eq'), st.latex, true);
    });
  }

  /* ------------------------------------------------------------------------
     Tab 3: Concepts & Handbook Notes
     ------------------------------------------------------------------------ */
  function buildConceptsAndHandbook() {
    const grid = document.getElementById('concepts-grid');
    if (grid) {
      grid.innerHTML = E.CONCEPT_CARDS.map(
        (c, idx) => `
        <article class="concept-card">
          <h4>${c.title}</h4>
          <p>${c.body}</p>
          <div class="concept-math" data-latex="${idx}"></div>
          <button class="try-btn" data-try-preset="${c.preset}" data-try-x="${c.xFrac}">${c.actionLabel}</button>
        </article>
      `
      ).join('');

      grid.querySelectorAll('.concept-math').forEach((el) => {
        const card = E.CONCEPT_CARDS[parseInt(el.dataset.latex, 10)];
        if (card) renderLatex(el, card.latex, true);
      });

      grid.querySelectorAll('.try-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          applyScenario(btn.dataset.tryPreset, { xFrac: parseFloat(btn.dataset.tryX) });
          switchTab('plate');
        });
      });
    }

    const bookWrap = document.getElementById('handbook-paragraphs');
    if (bookWrap) {
      bookWrap.innerHTML = E.HANDBOOK_SECTIONS.map(
        (sec) => `
        <div class="book-para">
          <div class="book-para-head">
            <span class="book-para-tag">${sec.tag}</span>
            <button class="book-jump-btn" data-jump-preset="${sec.preset}" data-jump-x="${sec.xFrac}">${sec.jumpLabel} →</button>
          </div>
          <p>${sec.text}</p>
        </div>
      `
      ).join('');

      bookWrap.querySelectorAll('.book-jump-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          applyScenario(btn.dataset.jumpPreset, { xFrac: parseFloat(btn.dataset.jumpX) });
          switchTab('plate');
        });
      });
    }
  }

  /* ------------------------------------------------------------------------
     Guided Tour (matching Interchange Lab)
     ------------------------------------------------------------------------ */
  function bindTourControls() {
    const dotsWrap = document.getElementById('tour-dots');
    dotsWrap.innerHTML = E.TOUR_STOPS.map(
      (_, i) => `<button class="tour-dot" data-dot="${i}" title="Go to stop ${i + 1}"></button>`
    ).join('');
    dotsWrap.querySelectorAll('.tour-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        stopTourAuto();
        goToTourStop(parseInt(dot.dataset.dot, 10));
      });
    });

    document.getElementById('btn-start-tour').addEventListener('click', () => {
      switchTab('plate');
      tourActive = true;
      document.getElementById('tour-card').classList.remove('hidden');
      goToTourStop(0);
    });

    document.getElementById('btn-tour-close').addEventListener('click', closeTour);
    document.getElementById('btn-tour-prev').addEventListener('click', () => {
      stopTourAuto();
      goToTourStop((tourIdx - 1 + E.TOUR_STOPS.length) % E.TOUR_STOPS.length);
    });
    document.getElementById('btn-tour-next').addEventListener('click', () => {
      stopTourAuto();
      if (tourIdx >= E.TOUR_STOPS.length - 1) {
        closeTour();
      } else {
        goToTourStop(tourIdx + 1);
      }
    });
    document.getElementById('btn-tour-auto').addEventListener('click', () => {
      if (tourTimer) {
        stopTourAuto();
      } else {
        document.getElementById('btn-tour-auto').textContent = '⏸ Pause';
        tourTimer = setInterval(() => {
          goToTourStop((tourIdx + 1) % E.TOUR_STOPS.length);
        }, 5500);
      }
    });
  }

  function goToTourStop(idx) {
    tourIdx = idx;
    const stop = E.TOUR_STOPS[idx];
    if (!stop) return;

    document.getElementById('tour-badge').textContent = stop.badge;
    document.getElementById('tour-title').textContent = stop.title;
    document.getElementById('tour-summary').textContent = stop.summary;
    document.getElementById('tour-takeaway').textContent = stop.takeaway;

    document.querySelectorAll('.tour-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });
    document.getElementById('btn-tour-next').textContent =
      idx === E.TOUR_STOPS.length - 1 ? 'Finish ✓' : 'Next →';

    state.showCallouts = !!stop.showCallouts;
    renderer.showCallouts = state.showCallouts;
    document.getElementById('btn-toggle-callouts').classList.toggle('active', state.showCallouts);

    applyScenario(stop.preset, { xFrac: stop.xFrac });

    // Highlight relevant plate
    document.querySelectorAll('.tour-focus').forEach((el) => el.classList.remove('tour-focus'));
    const focusEl = document.getElementById(`card-${stop.focusDiagram}`);
    if (focusEl) {
      focusEl.classList.add('tour-focus');
      if (stop.focusDiagram !== 'section' && stop.focusDiagram !== 'cut') {
        focusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  function stopTourAuto() {
    if (tourTimer) {
      clearInterval(tourTimer);
      tourTimer = null;
    }
    const btn = document.getElementById('btn-tour-auto');
    if (btn) btn.textContent = '▶ Auto';
  }

  function closeTour() {
    tourActive = false;
    stopTourAuto();
    document.getElementById('tour-card').classList.add('hidden');
    document.querySelectorAll('.tour-focus').forEach((el) => el.classList.remove('tour-focus'));
  }

  /* ------------------------------------------------------------------------
     KaTeX Helpers
     ------------------------------------------------------------------------ */
  function renderLatex(el, latex, displayMode) {
    if (!el) return;
    if (typeof window.katex !== 'undefined') {
      try {
        window.katex.render(latex, el, { displayMode: !!displayMode, throwOnError: false });
        return;
      } catch (_) {}
    }
    el.textContent = latex;
  }

  function renderMathIn(rootEl) {
    if (!rootEl || typeof window.renderMathInElement !== 'function') return;
    try {
      window.renderMathInElement(rootEl, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'input', 'select'],
        throwOnError: false,
      });
    } catch (_) {}
  }

  function renderStaticMath() {
    renderMathIn(document.getElementById('plates-scroll'));
    renderMathIn(document.getElementById('math-view'));
    document.querySelectorAll('#concepts-grid .concept-math').forEach((el) => {
      const card = E.CONCEPT_CARDS[parseInt(el.dataset.latex, 10)];
      if (card) renderLatex(el, card.latex, true);
    });
  }

  function ensureKaTeXReady(cb) {
    if (typeof window.katex !== 'undefined' && typeof window.renderMathInElement === 'function') {
      cb();
      return;
    }
    let tries = 0;
    const poll = setInterval(() => {
      tries++;
      if (typeof window.katex !== 'undefined' && typeof window.renderMathInElement === 'function') {
        clearInterval(poll);
        cb();
      } else if (tries > 25) {
        clearInterval(poll);
        cb();
      }
    }, 50);
  }

  /* ------------------------------------------------------------------------
     URL State Persistence & Clipboard Report
     ------------------------------------------------------------------------ */
  function updateURLHash() {
    try {
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
    } catch (_) {}
  }

  function restoreStateFromURL() {
    if (!window.location.hash || window.location.hash.length < 2) return false;
    try {
      const p = new URLSearchParams(window.location.hash.slice(1));
      if (!p.has('L') && !p.has('w')) return false;
      if (p.has('u') && (p.get('u') === 'metric' || p.get('u') === 'imperial')) state.unit = p.get('u');
      if (p.has('L')) state.L = Math.max(0.2, parseFloat(p.get('L')) || state.L);
      if (p.has('w')) state.w = Math.max(0, parseFloat(p.get('w')) || state.w);
      if (p.has('x')) state.x = Math.max(0, Math.min(state.L, parseFloat(p.get('x')) || 0));
      if (p.has('m') && E.MATERIALS[p.get('m')]) state.materialKey = p.get('m');
      if (p.has('sec')) state.sectionType = p.get('sec');
      if (p.has('prof') && E.STANDARD_PROFILES[p.get('prof')]) state.standardProfileKey = p.get('prof');
      state.activeScenario = 'custom';
      updateScenarioHeader();
      return true;
    } catch (_) {
      return false;
    }
  }

  function showToast(msg) {
    const el = document.getElementById('toast-msg');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
  }

  function copyReport() {
    if (!lastSolution || !lastSecProp) return;
    const s = lastSolution;
    const isM = s.unit === 'metric';
    const uL = isM ? 'm' : 'ft';
    const uW = isM ? 'kN/m' : 'lbf/ft';
    const uF = isM ? 'kN' : 'lbf';
    const uM = isM ? 'kNm' : 'lbf·ft';
    const uD = isM ? 'mm' : 'in';
    const uS = isM ? 'MPa' : 'ksi';

    const report = [
      '=======================================================',
      'BeamLab · Simply Supported Beam with UDL (Plate 001)',
      'Reference: StructX 001 · Euler-Bernoulli · Eurocode / AISC',
      '=======================================================',
      `Span Length L:        ${s.L.toFixed(2)} ${uL}`,
      `Uniform Load w:       ${s.w.toFixed(2)} ${uW} (Total W = ${s.W_total.toFixed(2)} ${uF})`,
      `Probe Position x:     ${s.x.toFixed(2)} ${uL} (${(s.x_rel * 100).toFixed(0)}% L)`,
      `Material & Section:   E = ${s.E.toFixed(0)} ${isM ? 'GPa' : 'ksi'}, Iy = ${lastSecProp.Iy.toFixed(1)} ${isM ? 'cm⁴' : 'in⁴'}, Wy = ${lastSecProp.Wy.toFixed(1)} ${isM ? 'cm³' : 'in³'}`,
      '-------------------------------------------------------',
      `Reactions RA = RB:    ${s.R_A.toFixed(2)} ${uF}`,
      `Shear at x V(x):      ${s.V_x.toFixed(2)} ${uF} (Peak ±${s.V_max.toFixed(2)} ${uF})`,
      `Moment at x M(x):     ${s.M_x.toFixed(2)} ${uM} (Peak ${s.M_max.toFixed(2)} ${uM})`,
      `Max Deflection δmax:  ${s.delta_max.toFixed(2)} ${uD} (L/${s.ratio_max}) — ${s.serviceOk ? 'PASS' : 'WARN > L/300'}`,
      `Deflection at x δ(x): ${s.delta_x.toFixed(2)} ${uD}`,
      `Support Rotation θ:   ${s.theta_A_deg.toFixed(2)}° (${s.theta_A_rad.toFixed(5)} rad)`,
      `Max Stress σmax:      ${s.sigma_max.toFixed(1)} ${uS} (${s.utilizationPct.toFixed(0)}% of fy=${s.yieldVal} ${uS}) — ${s.strengthOk ? 'PASS' : 'YIELD FAIL'}`,
      '=======================================================',
      `URL: ${window.location.href}`,
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(report).then(
        () => showToast('Calculation report copied to clipboard'),
        () => showToast('Clipboard blocked — use Print / PDF')
      );
    } else {
      showToast('Clipboard unavailable — use Print / PDF');
    }
  }
})();

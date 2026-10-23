/**
 * app.js - Main Application Controller for Tabellenbuch Metall S. 14 Web App
 * Features deterministic KaTeX rendering with local vendor support
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize state
  const state = {
    theme: 'light',
    vcMode: 'vc', // 'vc' | 'n' | 'd'
    torqueMode: 'm', // 'm' | 'p' | 'n'
    toolMode: 'lathe', // 'lathe' | 'mill'
    quizAnswers: {}
  };

  // Direct KaTeX rendering helper (deterministic, direct DOM injection)
  function renderLatex(el, latex, displayMode = true) {
    if (!el) return;
    if (window.katex) {
      try {
        const clean = String(latex).replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '').trim();
        window.katex.render(clean, el, {
          displayMode,
          throwOnError: false
        });
        return;
      } catch (err) {
        console.warn('KaTeX render warning:', err);
      }
    }
    el.textContent = latex;
  }

  // Auto-render helper for containers with mixed text and math ($...$, $$...$$)
  function triggerMathRender(el) {
    if (!el) return;
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX auto-render error:', err);
      }
    }

    // Also directly render any static formula boxes with data-latex
    const mathBoxes = el.querySelectorAll ? el.querySelectorAll('.formula-math[data-latex]') : [];
    mathBoxes.forEach(box => {
      const math = box.getAttribute('data-latex');
      if (math) {
        renderLatex(box, math, true);
      }
    });
  }

  // Initialize visualizers
  const vcCanvas = new CuttingSpeedCanvas('canvas-vc');
  const linearPlotter = new LinearFunctionPlotter('svg-linear-plot');
  const breakEvenPlotter = new BreakEvenDiagramRenderer('svg-breakeven-plot');
  const motorPlotter = new MotorCharacteristicRenderer('svg-motor-curve');

  // -------------------------------------------------------------------------
  // 1. NAVIGATION & TABS
  // -------------------------------------------------------------------------
  const navTabs = document.querySelectorAll('.tbb-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function switchTab(targetId) {
    navTabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === targetId);
    });
    tabPanes.forEach(pane => {
      const isActive = pane.id === targetId;
      pane.classList.toggle('active', isActive);
      if (isActive) {
        triggerMathRender(pane);
        // Resize canvas / SVG after becoming visible
        if (targetId === 'tab-vc' && vcCanvas) {
          setTimeout(() => vcCanvas.resize(), 50);
        } else if (targetId === 'tab-linear' && linearPlotter) {
          linearPlotter.render();
        } else if (targetId === 'tab-breakeven' && breakEvenPlotter) {
          breakEvenPlotter.render();
        } else if (targetId === 'tab-torque' && motorPlotter) {
          motorPlotter.render();
        }
      }
    });
  }

  navTabs.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Jump links (buttons and book hotspots)
  document.querySelectorAll('.btn-nav-jump').forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.target;
      if (target) {
        switchTab(target);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // -------------------------------------------------------------------------
  // 2. THEME TOGGLE (Ingenieur-Design vs Blueprint-Dunkelmodus)
  // -------------------------------------------------------------------------
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeLabel = document.getElementById('theme-label');

  function setTheme(t) {
    state.theme = t;
    if (t === 'blueprint') {
      document.body.classList.add('theme-blueprint');
      themeIcon.textContent = '☀️';
      themeLabel.textContent = 'Klassik-Modus';
    } else {
      document.body.classList.remove('theme-blueprint');
      themeIcon.textContent = '📐';
      themeLabel.textContent = 'Blueprint-Modus';
    }
    // Rerender plots
    if (linearPlotter) linearPlotter.render();
    if (breakEvenPlotter) breakEvenPlotter.render();
    if (motorPlotter) motorPlotter.render();
  }

  btnThemeToggle.addEventListener('click', () => {
    setTheme(state.theme === 'light' ? 'blueprint' : 'light');
  });

  // -------------------------------------------------------------------------
  // 3. TAB 1: SCHNITTGESCHWINDIGKEIT (vc = π · d · n)
  // -------------------------------------------------------------------------
  const inputVcD = document.getElementById('input-vc-d');
  const sliderVcD = document.getElementById('slider-vc-d');
  const unitVcD = document.getElementById('unit-vc-d');

  const inputVcN = document.getElementById('input-vc-n');
  const sliderVcN = document.getElementById('slider-vc-n');
  const unitVcN = document.getElementById('unit-vc-n');

  const inputVcVc = document.getElementById('input-vc-vc');
  const sliderVcVc = document.getElementById('slider-vc-vc');

  const groupVcD = document.getElementById('group-vc-d');
  const groupVcN = document.getElementById('group-vc-n');
  const groupVcVc = document.getElementById('group-vc-vc');

  const modeVcSolve = document.getElementById('mode-vc-solve');
  const modeNSolve = document.getElementById('mode-n-solve');
  const modeDSolve = document.getElementById('mode-d-solve');

  const vcResultTitle = document.getElementById('vc-result-title');
  const vcResultVal = document.getElementById('vc-result-val');
  const vcResultSub = document.getElementById('vc-result-sub');

  const vcStep1 = document.getElementById('vc-step-1');
  const vcStep2 = document.getElementById('vc-step-2');
  const vcStep3 = document.getElementById('vc-step-3');

  const selectVcMaterial = document.getElementById('vc-material-select');

  // Populate materials
  PhysicsMath.cuttingSpeed.materials.forEach(mat => {
    const opt = document.createElement('option');
    opt.value = mat.id;
    opt.textContent = `${mat.name} (HSS: ~${mat.vcHss} m/min | VHM: ~${mat.vcVhm} m/min)`;
    selectVcMaterial.appendChild(opt);
  });

  selectVcMaterial.addEventListener('change', () => {
    const sel = PhysicsMath.cuttingSpeed.materials.find(m => m.id === selectVcMaterial.value);
    if (sel && sel.id !== 'custom') {
      inputVcVc.value = sel.vcVhm;
      sliderVcVc.value = sel.vcVhm;
      if (state.vcMode === 'n' || state.vcMode === 'd') {
        updateVcCalculations();
      } else {
        const dM = PhysicsMath.cuttingSpeed.toDiameterMeters(parseFloat(inputVcD.value), unitVcD.value);
        if (dM > 0) {
          const targetRpm = Math.round(PhysicsMath.cuttingSpeed.calcRpm(sel.vcVhm, dM));
          inputVcN.value = targetRpm;
          sliderVcN.value = Math.min(2500, Math.max(20, targetRpm));
        }
        updateVcCalculations();
      }
    }
  });

  function setVcSolveMode(mode) {
    state.vcMode = mode;
    modeVcSolve.classList.toggle('btn-primary', mode === 'vc');
    modeVcSolve.classList.toggle('btn-outline', mode !== 'vc');
    modeNSolve.classList.toggle('btn-primary', mode === 'n');
    modeNSolve.classList.toggle('btn-outline', mode !== 'n');
    modeDSolve.classList.toggle('btn-primary', mode === 'd');
    modeDSolve.classList.toggle('btn-outline', mode !== 'd');

    groupVcD.style.display = mode === 'd' ? 'none' : 'block';
    groupVcN.style.display = mode === 'n' ? 'none' : 'block';
    groupVcVc.style.display = mode === 'vc' ? 'none' : 'block';

    updateVcCalculations();
  }

  modeVcSolve.addEventListener('click', () => setVcSolveMode('vc'));
  modeNSolve.addEventListener('click', () => setVcSolveMode('n'));
  modeDSolve.addEventListener('click', () => setVcSolveMode('d'));

  // Sync sliders and inputs
  function bindSync(input, slider, cb) {
    input.addEventListener('input', () => {
      slider.value = input.value;
      cb();
    });
    slider.addEventListener('input', () => {
      input.value = slider.value;
      cb();
    });
  }

  bindSync(inputVcD, sliderVcD, updateVcCalculations);
  bindSync(inputVcN, sliderVcN, updateVcCalculations);
  bindSync(inputVcVc, sliderVcVc, updateVcCalculations);
  unitVcD.addEventListener('change', updateVcCalculations);
  unitVcN.addEventListener('change', updateVcCalculations);

  function updateVcCalculations() {
    const dVal = parseFloat(inputVcD.value) || 1;
    const dUnit = unitVcD.value;
    const nVal = parseFloat(inputVcN.value) || 1;
    const nUnit = unitVcN.value;
    const vcVal = parseFloat(inputVcVc.value) || 1;

    let dMmForCanvas = 200;
    let nRpmForCanvas = 630;
    let vcMPerMinForCanvas = 395.84;

    if (state.vcMode === 'vc') {
      const stepData = PhysicsMath.cuttingSpeed.getStepByStepVc(dVal, dUnit, nVal, nUnit);
      vcResultTitle.textContent = 'Berechnete Schnittgeschwindigkeit:';
      vcResultVal.textContent = `${stepData.numericResult.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m/min`;
      
      const vcMs = stepData.numericResult / 60;
      const vcKmh = (stepData.numericResult * 60) / 1000;
      vcResultSub.textContent = `≈ ${vcMs.toLocaleString('de-DE', { maximumFractionDigits: 2 })} m/s • ${vcKmh.toLocaleString('de-DE', { maximumFractionDigits: 2 })} km/h`;

      renderLatex(vcStep1, stepData.formula, true);
      renderLatex(vcStep2, stepData.conversionStep, true);
      renderLatex(vcStep3, `${stepData.rawSub} = \\mathbf{${stepData.result}}`, true);

      dMmForCanvas = PhysicsMath.cuttingSpeed.toDiameterMeters(dVal, dUnit) * 1000;
      nRpmForCanvas = PhysicsMath.cuttingSpeed.toRpm(nVal, nUnit);
      vcMPerMinForCanvas = stepData.numericResult;

    } else if (state.vcMode === 'n') {
      const stepData = PhysicsMath.cuttingSpeed.getStepByStepN(vcVal, dVal, dUnit);
      vcResultTitle.textContent = 'Berechnete Spindeldrehzahl n:';
      vcResultVal.textContent = `${stepData.numericResult.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} min⁻¹`;
      vcResultSub.textContent = `Wahl der Drehzahlstufe an der Werkzeugmaschine`;

      renderLatex(vcStep1, stepData.formula, true);
      renderLatex(vcStep2, stepData.rawSub, true);
      renderLatex(vcStep3, `\\mathbf{n = ${stepData.result}}`, true);

      dMmForCanvas = PhysicsMath.cuttingSpeed.toDiameterMeters(dVal, dUnit) * 1000;
      nRpmForCanvas = stepData.numericResult;
      vcMPerMinForCanvas = vcVal;

    } else if (state.vcMode === 'd') {
      const nRpm = PhysicsMath.cuttingSpeed.toRpm(nVal, nUnit);
      const stepData = PhysicsMath.cuttingSpeed.getStepByStepD(vcVal, nRpm);
      vcResultTitle.textContent = 'Berechneter Durchmesser d:';
      vcResultVal.textContent = `${stepData.numericResult.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mm`;
      vcResultSub.textContent = `Werkstück- oder Fräser-Nenndurchmesser`;

      renderLatex(vcStep1, stepData.formula, true);
      renderLatex(vcStep2, stepData.rawSub, true);
      renderLatex(vcStep3, `\\mathbf{d = ${stepData.result}}`, true);

      dMmForCanvas = stepData.numericResult;
      nRpmForCanvas = nRpm;
      vcMPerMinForCanvas = vcVal;
    }

    vcCanvas.updateParams(dMmForCanvas, nRpmForCanvas, vcMPerMinForCanvas);
  }

  // Animation lathe/mill buttons
  const btnModeLathe = document.getElementById('btn-mode-lathe');
  const btnModeMill = document.getElementById('btn-mode-mill');
  const btnToggleAnim = document.getElementById('btn-toggle-anim');

  btnModeLathe.addEventListener('click', () => {
    btnModeLathe.classList.add('active');
    btnModeMill.classList.remove('active');
    vcCanvas.setMode('lathe');
  });

  btnModeMill.addEventListener('click', () => {
    btnModeMill.classList.add('active');
    btnModeLathe.classList.remove('active');
    vcCanvas.setMode('mill');
  });

  btnToggleAnim.addEventListener('click', () => {
    const isRunning = vcCanvas.togglePlay();
    btnToggleAnim.textContent = isRunning ? '⏸ Pause' : '▶ Weiter';
  });

  // Load Book Example vc
  document.getElementById('btn-load-vc-example').addEventListener('click', () => {
    setVcSolveMode('vc');
    inputVcD.value = 200;
    sliderVcD.value = 200;
    unitVcD.value = 'mm';
    inputVcN.value = 630;
    sliderVcN.value = 630;
    unitVcN.value = '1/min';
    selectVcMaterial.value = 'custom';
    updateVcCalculations();
  });

  // -------------------------------------------------------------------------
  // 4. TAB 2: ZAHLENWERTGLEICHUNGEN (M = (9550 · P) / n)
  // -------------------------------------------------------------------------
  const inputTorqueP = document.getElementById('input-torque-p');
  const sliderTorqueP = document.getElementById('slider-torque-p');
  const inputTorqueN = document.getElementById('input-torque-n');
  const sliderTorqueN = document.getElementById('slider-torque-n');
  const inputTorqueM = document.getElementById('input-torque-m');
  const sliderTorqueM = document.getElementById('slider-torque-m');

  const groupTorqueP = document.getElementById('group-torque-p');
  const groupTorqueN = document.getElementById('group-torque-n');
  const groupTorqueM = document.getElementById('group-torque-m');

  const modeMSolve = document.getElementById('mode-m-solve');
  const modePSolve = document.getElementById('mode-p-solve');
  const modeTorqueNSolve = document.getElementById('mode-torquen-solve');

  const torqueResultTitle = document.getElementById('torque-result-title');
  const torqueResultVal = document.getElementById('torque-result-val');
  const torqueResultSub = document.getElementById('torque-result-sub');

  const torqueStep1 = document.getElementById('torque-step-1');
  const torqueStep2 = document.getElementById('torque-step-2');

  function setTorqueMode(mode) {
    state.torqueMode = mode;
    modeMSolve.classList.toggle('btn-primary', mode === 'm');
    modeMSolve.classList.toggle('btn-outline', mode !== 'm');
    modePSolve.classList.toggle('btn-primary', mode === 'p');
    modePSolve.classList.toggle('btn-outline', mode !== 'p');
    modeTorqueNSolve.classList.toggle('btn-primary', mode === 'n');
    modeTorqueNSolve.classList.toggle('btn-outline', mode !== 'n');

    groupTorqueM.style.display = mode === 'm' ? 'none' : 'block';
    groupTorqueP.style.display = mode === 'p' ? 'none' : 'block';
    groupTorqueN.style.display = mode === 'n' ? 'none' : 'block';

    updateTorqueCalculations();
  }

  modeMSolve.addEventListener('click', () => setTorqueMode('m'));
  modePSolve.addEventListener('click', () => setTorqueMode('p'));
  modeTorqueNSolve.addEventListener('click', () => setTorqueMode('n'));

  bindSync(inputTorqueP, sliderTorqueP, updateTorqueCalculations);
  bindSync(inputTorqueN, sliderTorqueN, updateTorqueCalculations);
  bindSync(inputTorqueM, sliderTorqueM, updateTorqueCalculations);

  function updateTorqueCalculations() {
    const pVal = parseFloat(inputTorqueP.value) || 0.1;
    const nVal = parseFloat(inputTorqueN.value) || 1;
    const mVal = parseFloat(inputTorqueM.value) || 1;

    let pForPlot = 15;
    let nForPlot = 750;

    if (state.torqueMode === 'm') {
      const step = PhysicsMath.torqueEquation.getStepByStepM(pVal, nVal);
      torqueResultTitle.textContent = 'Berechnetes Drehmoment M:';
      torqueResultVal.textContent = step.result;
      torqueResultSub.textContent = `Exakter Wert (mit 60000 / 2π): ${step.exactResult} • Fehler < 0,01%`;

      renderLatex(torqueStep1, step.formula, true);
      renderLatex(torqueStep2, `${step.rawSub} = \\mathbf{${step.result}}`, true);

      pForPlot = pVal;
      nForPlot = nVal;
    } else if (state.torqueMode === 'p') {
      const step = PhysicsMath.torqueEquation.getStepByStepP(mVal, nVal);
      torqueResultTitle.textContent = 'Berechnete Antriebsleistung P:';
      torqueResultVal.textContent = step.result;
      torqueResultSub.textContent = `Erforderliche Motor-Nennleistung`;

      renderLatex(torqueStep1, step.formula, true);
      renderLatex(torqueStep2, `${step.rawSub} = \\mathbf{${step.result}}`, true);

      pForPlot = step.numericResult;
      nForPlot = nVal;
    } else if (state.torqueMode === 'n') {
      const step = PhysicsMath.torqueEquation.getStepByStepN(pVal, mVal);
      torqueResultTitle.textContent = 'Berechnete Drehzahl n:';
      torqueResultVal.textContent = step.result;
      torqueResultSub.textContent = `Spindeldrehzahl bei Volllast`;

      renderLatex(torqueStep1, step.formula, true);
      renderLatex(torqueStep2, `${step.rawSub} = \\mathbf{${step.result}}`, true);

      pForPlot = pVal;
      nForPlot = step.numericResult;
    }

    motorPlotter.update(pForPlot, nForPlot);
  }

  document.getElementById('btn-load-torque-example').addEventListener('click', () => {
    setTorqueMode('m');
    inputTorqueP.value = 15;
    sliderTorqueP.value = 15;
    inputTorqueN.value = 750;
    sliderTorqueN.value = 750;
    updateTorqueCalculations();
  });

  // -------------------------------------------------------------------------
  // 5. TAB 3: LINEARE FUNKTION (y = m·x + b)
  // -------------------------------------------------------------------------
  const inputLinM = document.getElementById('input-lin-m');
  const sliderLinM = document.getElementById('slider-lin-m');
  const inputLinB = document.getElementById('input-lin-b');
  const sliderLinB = document.getElementById('slider-lin-b');

  const tblYNeg2 = document.getElementById('tbl-y-neg2');
  const tblY0 = document.getElementById('tbl-y-0');
  const tblY2 = document.getElementById('tbl-y-2');
  const tblY3 = document.getElementById('tbl-y-3');

  function updateLinearFunction() {
    const m = parseFloat(inputLinM.value) || 0;
    const b = parseFloat(inputLinB.value) || 0;

    linearPlotter.update(m, b);

    // Update table values for x in [-2, 0, 2, 3]
    const fmt = v => v.toLocaleString('de-DE', { maximumFractionDigits: 2 });
    tblYNeg2.textContent = fmt(PhysicsMath.linearFunction.eval(m, b, -2));
    tblY0.textContent = fmt(PhysicsMath.linearFunction.eval(m, b, 0));
    tblY2.textContent = fmt(PhysicsMath.linearFunction.eval(m, b, 2));
    tblY3.textContent = fmt(PhysicsMath.linearFunction.eval(m, b, 3));
  }

  bindSync(inputLinM, sliderLinM, updateLinearFunction);
  bindSync(inputLinB, sliderLinB, updateLinearFunction);

  document.getElementById('btn-load-linear-example').addEventListener('click', () => {
    inputLinM.value = 0.5;
    sliderLinM.value = 0.5;
    inputLinB.value = 1.0;
    sliderLinB.value = 1.0;
    updateLinearFunction();
  });

  // -------------------------------------------------------------------------
  // 6. TAB 4: KOSTEN & GEWINNSCHWELLE (BREAK-EVEN)
  // -------------------------------------------------------------------------
  const inputBeKf = document.getElementById('input-be-kf');
  const sliderBeKf = document.getElementById('slider-be-kf');
  const inputBeKv = document.getElementById('input-be-kv');
  const sliderBeKv = document.getElementById('slider-be-kv');
  const inputBeE = document.getElementById('input-be-e');
  const sliderBeE = document.getElementById('slider-be-e');
  const inputBeM = document.getElementById('input-be-m');
  const sliderBeM = document.getElementById('slider-be-m');
  const selectBePreset = document.getElementById('be-preset-select');

  const beResMgs = document.getElementById('be-res-mgs');
  const beResTurnover = document.getElementById('be-res-turnover');
  const beStatKg = document.getElementById('be-stat-kg');
  const beStatE = document.getElementById('be-stat-e');
  const beStatProfit = document.getElementById('be-stat-profit');
  const beZoneIndicator = document.getElementById('be-zone-indicator');

  const tblBeKg0 = document.getElementById('tbl-be-kg-0');
  const tblBeKgGs = document.getElementById('tbl-be-kg-gs');
  const tblBeKg6000 = document.getElementById('tbl-be-kg-6000');
  const tblBeKgCurr = document.getElementById('tbl-be-kg-curr');

  const tblBeE0 = document.getElementById('tbl-be-e-0');
  const tblBeEGs = document.getElementById('tbl-be-e-gs');
  const tblBeE6000 = document.getElementById('tbl-be-e-6000');
  const tblBeECurr = document.getElementById('tbl-be-e-curr');

  const tblBeDiff0 = document.getElementById('tbl-be-diff-0');
  const tblBeDiffGs = document.getElementById('tbl-be-diff-gs');
  const tblBeDiff6000 = document.getElementById('tbl-be-diff-6000');
  const tblBeDiffCurr = document.getElementById('tbl-be-diff-curr');

  selectBePreset.addEventListener('change', () => {
    const sel = PhysicsMath.breakEven.presets.find(p => p.id === selectBePreset.value);
    if (sel) {
      inputBeKf.value = sel.Kf;
      sliderBeKf.max = Math.max(500000, sel.Kf * 2);
      sliderBeKf.value = sel.Kf;

      inputBeKv.value = sel.Kv;
      sliderBeKv.max = Math.max(200, sel.Kv * 2);
      sliderBeKv.value = sel.Kv;

      inputBeE.value = sel.e;
      sliderBeE.max = Math.max(300, sel.e * 2);
      sliderBeE.value = sel.e;

      inputBeM.value = sel.currentM;
      sliderBeM.max = Math.max(8000, sel.currentM * 1.5);
      sliderBeM.value = sel.currentM;

      updateBreakEven();
    }
  });

  bindSync(inputBeKf, sliderBeKf, updateBreakEven);
  bindSync(inputBeKv, sliderBeKv, updateBreakEven);
  bindSync(inputBeE, sliderBeE, updateBreakEven);
  bindSync(inputBeM, sliderBeM, updateBreakEven);

  function formatEur(v) {
    return `${Math.round(v).toLocaleString('de-DE')} €`;
  }

  function updateBreakEven() {
    const Kf = parseFloat(inputBeKf.value) || 0;
    const Kv = parseFloat(inputBeKv.value) || 0;
    const e = parseFloat(inputBeE.value) || 0;
    const M = parseFloat(inputBeM.value) || 0;

    const db = PhysicsMath.breakEven.calcContributionMarginPerUnit(Kv, e);
    const mGs = PhysicsMath.breakEven.calcBreakEvenQuantity(Kf, Kv, e);
    const eGs = PhysicsMath.breakEven.calcBreakEvenRevenue(Kf, Kv, e);

    const kgCurr = PhysicsMath.breakEven.calcKg(Kf, Kv, M);
    const eCurr = PhysicsMath.breakEven.calcE(e, M);
    const profitCurr = eCurr - kgCurr;

    if (isFinite(mGs) && mGs > 0) {
      beResMgs.textContent = `${Math.round(mGs).toLocaleString('de-DE')} Stück`;
      beResTurnover.textContent = `Umsatz / Kosten: ${formatEur(eGs)} • Deckungsbeitrag: ${db.toLocaleString('de-DE', { maximumFractionDigits: 2 })} €/Stck`;
    } else {
      beResMgs.textContent = 'Keine Gewinnschwelle erreichbar';
      beResTurnover.textContent = 'Verkaufspreis ist kleiner oder gleich den variablen Kosten!';
    }

    beStatKg.textContent = formatEur(kgCurr);
    beStatE.textContent = formatEur(eCurr);
    beStatProfit.textContent = `${profitCurr >= 0 ? '+' : ''}${formatEur(profitCurr)}`;
    beStatProfit.style.color = profitCurr >= 0 ? '#15803d' : '#dc2626';

    if (profitCurr > 0.01) {
      beZoneIndicator.textContent = 'GEWINNZONE';
      beZoneIndicator.style.background = '#15803d';
    } else if (profitCurr < -0.01) {
      beZoneIndicator.textContent = 'VERLUSTZONE';
      beZoneIndicator.style.background = '#dc2626';
    } else {
      beZoneIndicator.textContent = 'GEWINNSCHWELLE';
      beZoneIndicator.style.background = '#1e293b';
    }

    // Dynamic Wertetabelle (0, mGs, 6000, M)
    tblBeKg0.textContent = formatEur(PhysicsMath.breakEven.calcKg(Kf, Kv, 0));
    tblBeE0.textContent = formatEur(0);
    tblBeDiff0.textContent = `-${formatEur(Kf)} (Verlust)`;

    if (isFinite(mGs)) {
      tblBeKgGs.textContent = formatEur(PhysicsMath.breakEven.calcKg(Kf, Kv, mGs));
      tblBeEGs.textContent = formatEur(PhysicsMath.breakEven.calcE(e, mGs));
      tblBeDiffGs.textContent = '0 € (Schwelle)';
    }

    const kg6000 = PhysicsMath.breakEven.calcKg(Kf, Kv, 6000);
    const e6000 = PhysicsMath.breakEven.calcE(e, 6000);
    const diff6000 = e6000 - kg6000;
    tblBeKg6000.textContent = formatEur(kg6000);
    tblBeE6000.textContent = formatEur(e6000);
    tblBeDiff6000.textContent = `${diff6000 >= 0 ? '+' : ''}${formatEur(diff6000)}`;

    tblBeKgCurr.textContent = formatEur(kgCurr);
    tblBeECurr.textContent = formatEur(eCurr);
    tblBeDiffCurr.textContent = `${profitCurr >= 0 ? '+' : ''}${formatEur(profitCurr)}`;
    tblBeDiffCurr.style.color = profitCurr >= 0 ? '#15803d' : '#dc2626';

    // Rerender SVG plot
    breakEvenPlotter.update(Kf, Kv, e, M);
  }

  document.getElementById('btn-load-be-example').addEventListener('click', () => {
    selectBePreset.value = 'book';
    inputBeKf.value = 200000;
    sliderBeKf.value = 200000;
    inputBeKv.value = 60;
    sliderBeKv.value = 60;
    inputBeE.value = 110;
    sliderBeE.value = 110;
    inputBeM.value = 6000;
    sliderBeM.value = 6000;
    updateBreakEven();
  });

  // Global "Buchwerte laden" in header
  document.getElementById('btn-reset-book').addEventListener('click', () => {
    // 1. vc
    setVcSolveMode('vc');
    inputVcD.value = 200;
    sliderVcD.value = 200;
    unitVcD.value = 'mm';
    inputVcN.value = 630;
    sliderVcN.value = 630;
    unitVcN.value = '1/min';
    updateVcCalculations();

    // 2. Torque
    setTorqueMode('m');
    inputTorqueP.value = 15;
    sliderTorqueP.value = 15;
    inputTorqueN.value = 750;
    sliderTorqueN.value = 750;
    updateTorqueCalculations();

    // 3. Linear
    inputLinM.value = 0.5;
    sliderLinM.value = 0.5;
    inputLinB.value = 1.0;
    sliderLinB.value = 1.0;
    updateLinearFunction();

    // 4. Break even
    inputBeKf.value = 200000;
    sliderBeKf.value = 200000;
    inputBeKv.value = 60;
    sliderBeKv.value = 60;
    inputBeE.value = 110;
    sliderBeE.value = 110;
    inputBeM.value = 6000;
    sliderBeM.value = 6000;
    updateBreakEven();

    triggerMathRender(document.body);
    alert('Alle Module wurden auf die exakten Buchbeispiele aus Tabellenbuch Metall S. 14 zurückgesetzt!');
  });

  // -------------------------------------------------------------------------
  // 7. TAB 5: QUIZ & PRACTICE CONTROLLER
  // -------------------------------------------------------------------------
  const quizContainer = document.getElementById('quiz-container');
  const quizScoreBadge = document.getElementById('quiz-score-badge');

  function renderQuiz() {
    quizContainer.innerHTML = '';
    QuizData.forEach((q) => {
      const card = document.createElement('div');
      card.className = 'quiz-card';
      card.id = `quiz-card-${q.id}`;

      let inputsHtml = '';
      q.inputs.forEach(inp => {
        inputsHtml += `
          <div class="quiz-input-row">
            <label style="font-weight:600; min-width:140px;" for="quiz-input-${inp.id}">${inp.label}:</label>
            <input type="number" class="input-control" id="quiz-input-${inp.id}" style="max-width:180px;" step="any">
            <span class="unit-badge">${inp.unit}</span>
          </div>
        `;
      });

      card.innerHTML = `
        <span class="quiz-category-tag">${q.category}</span>
        <h3 style="margin-bottom:8px; color:var(--text-main);">${q.title}</h3>
        <p class="quiz-question-text">${q.question}</p>
        
        <div class="quiz-inputs-wrap">
          ${inputsHtml}
        </div>

        <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm btn-check-answer" data-qid="${q.id}">Eingabe prüfen</button>
          <button class="btn btn-outline btn-sm btn-toggle-hint" data-qid="${q.id}">💡 Tipp anzeigen</button>
          <button class="btn btn-outline btn-sm btn-toggle-sol" data-qid="${q.id}">📖 Musterlösung</button>
        </div>

        <div class="quiz-hint-box" id="hint-${q.id}" style="display:none; background:var(--bg-card-alt); border-left:4px solid var(--accent-amber); padding:10px 14px; margin-top:12px; font-size:0.88rem;">
          <strong>Tipp:</strong> ${q.hint}
        </div>

        <div class="quiz-sol-box" id="sol-${q.id}" style="display:none; margin-top:12px;">
          ${q.solutionHtml}
        </div>
      `;

      quizContainer.appendChild(card);
    });

    // Wire up buttons
    document.querySelectorAll('.btn-check-answer').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = btn.dataset.qid;
        checkQuestion(qid);
      });
    });

    document.querySelectorAll('.btn-toggle-hint').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = btn.dataset.qid;
        const hintEl = document.getElementById(`hint-${qid}`);
        hintEl.style.display = hintEl.style.display === 'none' ? 'block' : 'none';
        triggerMathRender(hintEl);
      });
    });

    document.querySelectorAll('.btn-toggle-sol').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = btn.dataset.qid;
        const solEl = document.getElementById(`sol-${qid}`);
        solEl.style.display = solEl.style.display === 'none' ? 'block' : 'none';
        triggerMathRender(solEl);
      });
    });

    // Render math on all initial quiz questions
    triggerMathRender(quizContainer);
  }

  function checkQuestion(qid) {
    const q = QuizData.find(item => item.id === qid);
    if (!q) return;

    let allCorrect = true;
    q.inputs.forEach(inp => {
      const inputEl = document.getElementById(`quiz-input-${inp.id}`);
      const val = parseFloat(inputEl.value);
      const isOk = !isNaN(val) && Math.abs(val - inp.target) <= inp.tolerance;
      if (isOk) {
        inputEl.style.borderColor = '#15803d';
        inputEl.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
      } else {
        inputEl.style.borderColor = '#dc2626';
        inputEl.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        allCorrect = false;
      }
    });

    const card = document.getElementById(`quiz-card-${qid}`);
    card.classList.remove('answered-correct', 'answered-wrong');
    if (allCorrect) {
      card.classList.add('answered-correct');
      state.quizAnswers[qid] = true;
    } else {
      card.classList.add('answered-wrong');
      state.quizAnswers[qid] = false;
    }

    updateScore();
  }

  function updateScore() {
    const solvedCount = Object.values(state.quizAnswers).filter(Boolean).length;
    quizScoreBadge.textContent = `Punkte: ${solvedCount} / ${QuizData.length} gelöst`;
    if (solvedCount === QuizData.length) {
      quizScoreBadge.style.color = '#15803d';
      quizScoreBadge.textContent = '🎉 Perfekt! Alle 6 Aufgaben erfolgreich gelöst!';
    }
  }

  renderQuiz();

  // Initial runs of all calculation routines
  updateVcCalculations();
  updateTorqueCalculations();
  updateLinearFunction();
  updateBreakEven();

  // Render all math across the document immediately
  triggerMathRender(document.body);

  // Hash-based deep linking support (#tab-vc, #tab-torque, #tab-linear, #tab-breakeven, #tab-quiz, #tab-book)
  function applyHashTab() {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && document.getElementById(hash)) {
      switchTab(hash);
    }
  }
  window.addEventListener('hashchange', applyHashTab);
  applyHashTab();
});

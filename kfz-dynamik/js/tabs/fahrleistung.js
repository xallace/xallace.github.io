/* Tab Part II – Driving Performance: tractive force & power diagrams (Fig. 7.1), acceleration per gear (Fig. 7.10),
   acceleration run (Fig. 7.11). */
(function (root) {
  'use strict';
  const K = root.KfzDyn, L = K.laengs, g = K.core.G;
  const { el, COL } = root.UI;
  const UI = root.UI;

  const D = L.DEFAULTS;
  const values = { m: D.m, fR: D.fR, cWA: D.cWA, rho: D.rho, r: D.r, iA: D.iA, etaA: D.etaA, p: D.p, shiftTime: D.shiftTime,
    i1: D.gears[0].i, i2: D.gears[1].i, i3: D.gears[2].i, i4: D.gears[3].i };

  const DEFS = [
    { group: 'Vehicle' },
    { key: 'm', label: 'Mass m', unit: 'kg', min: 500, max: 2500, step: 10 },
    { key: 'fR', label: 'Rolling resistance coeff. fR', unit: '–', min: 0.005, max: 0.04, step: 0.001 },
    { key: 'cWA', label: 'Drag area cW·A', unit: 'm²', min: 0.4, max: 1.5, step: 0.01 },
    { key: 'r', label: 'Wheel radius r', unit: 'm', min: 0.22, max: 0.4, step: 0.005 },
    { group: 'Drivetrain' },
    { key: 'i1', label: '1st gear iG1', unit: '–', min: 2, max: 5, step: 0.01, hint: 'λ and η per gear remain as in Fig. 7.10' },
    { key: 'i2', label: '2nd gear iG2', unit: '–', min: 1.2, max: 3, step: 0.01 },
    { key: 'i3', label: '3rd gear iG3', unit: '–', min: 0.9, max: 2, step: 0.01 },
    { key: 'i4', label: '4th gear iG4', unit: '–', min: 0.6, max: 1.4, step: 0.01 },
    { key: 'iA', label: 'Final drive ratio iA', unit: '–', min: 2.5, max: 5.5, step: 0.05 },
    { key: 'etaA', label: 'Final drive efficiency ηA', unit: '–', min: 0.8, max: 1, step: 0.01 },
    { group: 'Road & Driving' },
    { key: 'p', label: 'Road grade p', unit: '%', min: 0, max: 35, step: 0.5, scale: 100 },
    { key: 'shiftTime', label: 'Shift pause', unit: 's', min: 0, max: 1.5, step: 0.05, hint: 'Fig. 7.11 assumes zero shift pauses' },
  ];

  let charts = {}, kpiEl = null, refresh = null, panel = null;

  function params() {
    const { i1, i2, i3, i4, ...rest } = values;
    const ii = [i1, i2, i3, i4];
    return L.withDefaults({ ...rest, gears: D.gears.map((gear, k) => ({ ...gear, i: ii[k] })) });
  }

  function compute() {
    const p = params();
    const ranges = p.gears.map((gear) => L.gearRange(p, gear));
    const vTop = Math.max(...ranges.map((r) => r[1])) * 1.02;
    const gearName = (k) => `Gear ${k + 1}`;

    // Tractive supply per gear and demand across several road grades
    const zSeries = [], pSeries = [], aSeries = [];
    p.gears.forEach((gear, k) => {
      const V = K.core.linspace(ranges[k][0], ranges[k][1], 120);
      const Z = V.map((v) => L.tractive(p, gear, v));
      zSeries.push({ name: gearName(k), color: COL[k], x: V.map((v) => v * 3.6), y: Z.map((z) => z / 1000) });
      pSeries.push({ name: gearName(k), color: COL[k], x: V.map((v) => v * 3.6), y: Z.map((z, i) => z * V[i] / 1000) });
      aSeries.push({ name: gearName(k), color: COL[k], x: V.map((v) => v * 3.6), y: V.map((v) => { const a = L.accelInGear(p, gear, v); return a === null ? NaN : a / g; }) });
    });
    const Vd = K.core.linspace(0, vTop, 120);
    const grades = [...new Set([0, 0.1, 0.2, 0.3, p.p])].sort((a, b) => a - b);
    for (const q of grades) {
      const cur = Math.abs(q - p.p) < 1e-9;
      const style = { color: cur ? '#e2e8f0' : '#64748b', dash: cur ? [] : [5, 4], width: cur ? 1.8 : 1.2 };
      const name = `Demand p = ${Math.round(q * 1000) / 10} %`;
      zSeries.push({ name, ...style, x: Vd.map((v) => v * 3.6), y: Vd.map((v) => L.demand(p, v, q) / 1000) });
      pSeries.push({ name, ...style, x: Vd.map((v) => v * 3.6), y: Vd.map((v) => L.demand(p, v, q) * v / 1000) });
    }

    const vm = L.vmax(p);
    const ann = vm.gear >= 0 ? [{ type: 'vline', x: vm.v * 3.6, color: '#fbbf24', label: `vmax ${Math.round(vm.v * 3.6)} km/h` }] : [];
    charts.z.set(zSeries, ann);
    charts.p.set(pSeries, ann);
    charts.a.set(aSeries, [{ type: 'hline', y: 0, color: '#94a3b8', dash: [] }]);

    // Engine map
    const N = K.core.linspace(p.nMin, p.nMax, 160);
    const pm = L.maxPower(p);
    charts.motor.set([
      { name: 'Torque MM', color: COL[0], x: N, y: N.map((n) => L.engineTorque(p, n)) },
      { name: 'Power PM', color: COL[1], axis: 'right', x: N, y: N.map((n) => L.engineTorque(p, n) * n * 2 * Math.PI / 60 / 1000) },
    ], [{ type: 'vline', x: pm.n, color: COL[1], label: `Pmax ${KFmt(pm.P / 1000, 1)} kW` }]);

    // Standing-start acceleration run
    // up to 95 % of vmax because the asymptotic approach takes very long
    const run = L.accelerationRun(p, vm.v * 0.95, 0.01);
    const at100 = L.accelerationRun(p, 100 / 3.6, 0.01);
    const t1000 = L.timeForDistance(p, 1000);
    const shifts = [];
    for (let i = 1; i < run.gear.length; i++) if (run.gear[i] !== run.gear[i - 1]) shifts.push({ type: 'vline', x: run.t[i], color: '#475569', label: `G${run.gear[i] + 1}`, row: 0 });
    charts.run.set([
      { name: 'v [km/h]', color: COL[0], x: run.t, y: run.v.map((v) => v * 3.6) },
      { name: 'x [m]', color: COL[2], axis: 'right', x: run.t, y: run.x },
    ], shifts.concat(at100.reached ? [{ type: 'point', x: at100.tEnd, y: 100, label: `100 km/h in ${KFmt(at100.tEnd, 1)} s`, fill: '#fbbf24' }] : []));

    const grade = L.gradeability(p);
    UI.kpis(kpiEl, [
      { label: 'Peak engine power', value: pm.P / 1000, unit: 'kW', digits: 1, sub: `at ${Math.round(pm.n)} rpm` },
      { label: 'Top speed', value: vm.v * 3.6, unit: 'km/h', digits: 0, sub: vm.gear >= 0 ? `Gear ${vm.gear + 1}, limited by ${vm.limitedBy}` : 'none' },
      { label: '0–100 km/h', value: at100.reached ? at100.tEnd : '–', unit: 's', digits: 1, sub: at100.reached ? `distance ${Math.round(at100.xEnd)} m` : 'not reached' },
      { label: '1000 m standing start', value: isFinite(t1000) && run.v.length > 1 ? t1000 : '–', unit: 's', digits: 1 },
      { label: 'Gradeability 1st gear', value: grade[0].p * 100, unit: '%', digits: 1, sub: `at ${Math.round(grade[0].v * 3.6)} km/h` },
      { label: 'Max. ẍ/g in 1st gear', value: at100.a1max / g, digits: 3 },
    ]);
  }

  function init(sec) {
    const Lyt = UI.tabLayout(sec, {
      title: 'Part II · Driving Performance',
      intro: 'Tractive force available from the engine across gears versus tractive demand from rolling, grade, and aerodynamic drag. ' +
        'This yields top speed, gradeability, and the acceleration run. Baseline is the 37 kW passenger car ' +
        'from Figs. 7.1/7.10 with a 4-speed manual transmission.',
      src: 'Ch. 5 & 7 · Eqs. (5.29)/(5.30), Eq. (7.1), Figs. 7.1, 7.10, 7.11, p. 153',
    });
    kpiEl = Lyt.kpis;
    Lyt.aside.appendChild(el('h3', '', 'Inputs'));
    const pre = UI.presets(Lyt.aside, [{ name: 'Car Fig. 7.1', title: '880 kg, 37 kW, 4 gears' }], () => {
      Object.assign(values, { m: D.m, fR: D.fR, cWA: D.cWA, r: D.r, iA: D.iA, etaA: D.etaA, p: 0, shiftTime: 0,
        i1: D.gears[0].i, i2: D.gears[1].i, i3: D.gears[2].i, i4: D.gears[3].i });
      panel.refresh(); refresh();
    });
    pre.mark(0);
    refresh = UI.scheduler(compute);
    panel = UI.paramPanel(Lyt.aside, DEFS, values, () => { pre.clear(); refresh(); });
    Lyt.aside.appendChild(el('p', 'note', 'The full-load engine torque curve is digitized from Fig. 7.1c. Rotational inertia factors λ and gear efficiencies ' +
      'per gear come from Fig. 7.10 and are held constant when ratios change.'));

    const cz = UI.card(Lyt.cards, 'Tractive Force Diagram', 'Tractive force at the wheels per gear against demand at various grades (light curve: selected grade). ' +
      'The surplus between supply and demand produces acceleration.');
    charts.z = new KChart(cz, { height: 290, xLabel: 'v [km/h]', yLabel: 'Z [kN]', xShort: 'v', xMin: 0 });
    charts.p = new KChart(UI.card(Lyt.cards, 'Power Diagram', 'Tractive power at the wheels P = Z·v and required driving power.'),
      { height: 290, xLabel: 'v [km/h]', yLabel: 'P [kW]', xShort: 'v', xMin: 0 });
    charts.motor = new KChart(UI.card(Lyt.cards, 'Engine Map (Full Load)', 'Torque digitized from Fig. 7.1c; power computed from torque and speed.'),
      { height: 260, xLabel: 'n [rpm]', yLabel: 'MM [Nm]', y2Label: 'PM [kW]', xShort: 'n' });
    charts.a = new KChart(UI.card(Lyt.cards, 'Normalized Acceleration per Gear', 'ẍ/g = (Z − demand at ẍ = 0)/(λ·G), as in Fig. 7.10.'),
      { height: 260, xLabel: 'v [km/h]', yLabel: 'ẍ/g [–]', xShort: 'v', xMin: 0 });
    charts.run = new KChart(UI.card(Lyt.cards, 'Acceleration from Standstill', 'Launch with peak 1st-gear acceleration, ' +
      'then always selecting the gear giving the highest acceleration (Sec. 7.5.1). Vertical lines: gear shifts.', 'wide'),
    { height: 280, xLabel: 't [s]', yLabel: 'v [km/h]', y2Label: 'x [m]', xShort: 't', xMin: 0 });

    UI.formulas(Lyt.formulas, [
      { tex: String.raw`Z_\mathrm{demand}=G\,(f_R+p)+\lambda\,m\,\ddot x+c_W A\,\frac{\rho}{2}\,v^2`, ref: 'Eqs. (5.29)/(5.30)' },
      { tex: String.raw`Z=\frac{i_G\,i_A\,\eta_G\,\eta_A\,M_M(n)}{r},\qquad n=\frac{v\,i_G\,i_A}{2\pi\,r}`, ref: 'Eq. (7.1)' },
      { tex: String.raw`\frac{\ddot x}{g}=\frac{Z-G\,(f_R+p)-c_W A\,\frac{\rho}{2}v^2}{\lambda\,G}`, ref: 'Fig. 7.10' },
      { tex: String.raw`p_\mathrm{max}=\max_v\frac{Z-G f_R-c_W A\,\frac{\rho}{2}v^2}{G}`, ref: 'Sec. 7.3', note: 'gradeability, as tan of grade angle' },
      { tex: String.raw`t=\int\frac{dv}{\ddot x(v)},\qquad x=\int v\,dt`, ref: 'Sec. 7.5.1', note: 'numerical integration, step 0.01 s' },
    ]);
  }

  root.KTabs = root.KTabs || {};
  root.KTabs.fahrleistung = { init, activate() { compute(); }, deactivate() {} };
})(window);

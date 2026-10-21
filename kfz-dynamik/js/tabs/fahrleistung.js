/* Reiter Teil II – Fahrleistungen: Zugkraft- und Leistungsschaubild (Abb. 7.1), Beschleunigung je Gang (Abb. 7.10),
   Beschleunigungsvorgang (Abb. 7.11). */
(function (root) {
  'use strict';
  const K = root.KfzDyn, L = K.laengs, g = K.core.G;
  const { el, COL } = root.UI;
  const UI = root.UI;

  const D = L.DEFAULTS;
  const values = { m: D.m, fR: D.fR, cWA: D.cWA, rho: D.rho, r: D.r, iA: D.iA, etaA: D.etaA, p: D.p, shiftTime: D.shiftTime,
    i1: D.gears[0].i, i2: D.gears[1].i, i3: D.gears[2].i, i4: D.gears[3].i };

  const DEFS = [
    { group: 'Fahrzeug' },
    { key: 'm', label: 'Masse m', unit: 'kg', min: 500, max: 2500, step: 10 },
    { key: 'fR', label: 'Rollwiderstandsbeiwert fR', unit: '–', min: 0.005, max: 0.04, step: 0.001 },
    { key: 'cWA', label: 'Luftwiderstand cW·A', unit: 'm²', min: 0.4, max: 1.5, step: 0.01 },
    { key: 'r', label: 'Radhalbmesser r', unit: 'm', min: 0.22, max: 0.4, step: 0.005 },
    { group: 'Antriebsstrang' },
    { key: 'i1', label: '1. Gang iG1', unit: '–', min: 2, max: 5, step: 0.01, hint: 'λ und η je Gang bleiben wie in Abb. 7.10' },
    { key: 'i2', label: '2. Gang iG2', unit: '–', min: 1.2, max: 3, step: 0.01 },
    { key: 'i3', label: '3. Gang iG3', unit: '–', min: 0.9, max: 2, step: 0.01 },
    { key: 'i4', label: '4. Gang iG4', unit: '–', min: 0.6, max: 1.4, step: 0.01 },
    { key: 'iA', label: 'Achsübersetzung iA', unit: '–', min: 2.5, max: 5.5, step: 0.05 },
    { key: 'etaA', label: 'Wirkungsgrad Achsgetriebe ηA', unit: '–', min: 0.8, max: 1, step: 0.01 },
    { group: 'Fahrbahn und Fahrweise' },
    { key: 'p', label: 'Steigung p', unit: '%', min: 0, max: 35, step: 0.5, scale: 100 },
    { key: 'shiftTime', label: 'Schaltpause', unit: 's', min: 0, max: 1.5, step: 0.05, hint: 'Abb. 7.11 rechnet ohne Schaltpausen' },
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
    const gearName = (k) => `${k + 1}. Gang`;

    // Zugkraftangebot je Gang und Bedarf für mehrere Steigungen
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
      const name = `Bedarf p = ${Math.round(q * 1000) / 10} %`;
      zSeries.push({ name, ...style, x: Vd.map((v) => v * 3.6), y: Vd.map((v) => L.demand(p, v, q) / 1000) });
      pSeries.push({ name, ...style, x: Vd.map((v) => v * 3.6), y: Vd.map((v) => L.demand(p, v, q) * v / 1000) });
    }

    const vm = L.vmax(p);
    const ann = vm.gear >= 0 ? [{ type: 'vline', x: vm.v * 3.6, color: '#fbbf24', label: `vmax ${Math.round(vm.v * 3.6)} km/h` }] : [];
    charts.z.set(zSeries, ann);
    charts.p.set(pSeries, ann);
    charts.a.set(aSeries, [{ type: 'hline', y: 0, color: '#94a3b8', dash: [] }]);

    // Motorkennlinie
    const N = K.core.linspace(p.nMin, p.nMax, 160);
    const pm = L.maxPower(p);
    charts.motor.set([
      { name: 'Drehmoment MM', color: COL[0], x: N, y: N.map((n) => L.engineTorque(p, n)) },
      { name: 'Leistung PM', color: COL[1], axis: 'right', x: N, y: N.map((n) => L.engineTorque(p, n) * n * 2 * Math.PI / 60 / 1000) },
    ], [{ type: 'vline', x: pm.n, color: COL[1], label: `Pmax ${KFmt(pm.P / 1000, 1)} kW` }]);

    // Beschleunigungsvorgang aus dem Stand
    // bis 95 % von vmax, sonst dauert der Verlauf asymptotisch sehr lange
    const run = L.accelerationRun(p, vm.v * 0.95, 0.01);
    const at100 = L.accelerationRun(p, 100 / 3.6, 0.01);
    const t1000 = L.timeForDistance(p, 1000);
    const shifts = [];
    for (let i = 1; i < run.gear.length; i++) if (run.gear[i] !== run.gear[i - 1]) shifts.push({ type: 'vline', x: run.t[i], color: '#475569', label: `${run.gear[i] + 1}.`, row: 0 });
    charts.run.set([
      { name: 'v [km/h]', color: COL[0], x: run.t, y: run.v.map((v) => v * 3.6) },
      { name: 'x [m]', color: COL[2], axis: 'right', x: run.t, y: run.x },
    ], shifts.concat(at100.reached ? [{ type: 'point', x: at100.tEnd, y: 100, label: `100 km/h nach ${KFmt(at100.tEnd, 1)} s`, fill: '#fbbf24' }] : []));

    const grade = L.gradeability(p);
    UI.kpis(kpiEl, [
      { label: 'Höchstleistung', value: pm.P / 1000, unit: 'kW', digits: 1, sub: `bei ${Math.round(pm.n)} 1/min` },
      { label: 'Höchstgeschwindigkeit', value: vm.v * 3.6, unit: 'km/h', digits: 0, sub: vm.gear >= 0 ? `${vm.gear + 1}. Gang, begrenzt durch ${vm.limitedBy}` : 'keine' },
      { label: '0–100 km/h', value: at100.reached ? at100.tEnd : '–', unit: 's', digits: 1, sub: at100.reached ? `Weg ${Math.round(at100.xEnd)} m` : 'nicht erreicht' },
      { label: '1000 m aus dem Stand', value: isFinite(t1000) && run.v.length > 1 ? t1000 : '–', unit: 's', digits: 1 },
      { label: 'Steigfähigkeit 1. Gang', value: grade[0].p * 100, unit: '%', digits: 1, sub: `bei ${Math.round(grade[0].v * 3.6)} km/h` },
      { label: 'max. ẍ/g im 1. Gang', value: at100.a1max / g, digits: 3 },
    ]);
  }

  function init(sec) {
    const Lyt = UI.tabLayout(sec, {
      title: 'Teil II · Fahrleistungen',
      intro: 'Zugkraftangebot des Motors über die Gänge gegen den Zugkraftbedarf aus Roll-, Steigungs- und Luftwiderstand. ' +
        'Daraus folgen Höchstgeschwindigkeit, Steigfähigkeit und der Beschleunigungsvorgang. Vorgabe ist der 37-kW-Pkw ' +
        'aus Abb. 7.1/7.10 mit Viergang-Getriebe.',
      src: 'Kap. 5 und 7 · Gl. (5.29)/(5.30), Gl. (7.1), Abb. 7.1, 7.10, 7.11, S. 153',
    });
    kpiEl = Lyt.kpis;
    Lyt.aside.appendChild(el('h3', '', 'Eingaben'));
    const pre = UI.presets(Lyt.aside, [{ name: 'Pkw Abb. 7.1', title: '880 kg, 37 kW, 4 Gänge' }], () => {
      Object.assign(values, { m: D.m, fR: D.fR, cWA: D.cWA, r: D.r, iA: D.iA, etaA: D.etaA, p: 0, shiftTime: 0,
        i1: D.gears[0].i, i2: D.gears[1].i, i3: D.gears[2].i, i4: D.gears[3].i });
      panel.refresh(); refresh();
    });
    pre.mark(0);
    refresh = UI.scheduler(compute);
    panel = UI.paramPanel(Lyt.aside, DEFS, values, () => { pre.clear(); refresh(); });
    Lyt.aside.appendChild(el('p', 'note', 'Die Volllastkurve des Motors ist aus Abb. 7.1c abgelesen. Drehmassenzuschläge λ und Getriebewirkungsgrade je Gang ' +
      'stammen aus Abb. 7.10 und ändern sich hier nicht mit der Übersetzung.'));

    const cz = UI.card(Lyt.cards, 'Zugkraftschaubild', 'Zugkraft am Rad je Gang gegen den Bedarf bei verschiedenen Steigungen (hell: eingestellte Steigung). ' +
      'Der Abstand zwischen Angebot und Bedarf geht in Beschleunigung.');
    charts.z = new KChart(cz, { height: 290, xLabel: 'v [km/h]', yLabel: 'Z [kN]', xShort: 'v', xMin: 0 });
    charts.p = new KChart(UI.card(Lyt.cards, 'Leistungsschaubild', 'Leistung am Rad P = Z·v und Leistungsbedarf.'),
      { height: 290, xLabel: 'v [km/h]', yLabel: 'P [kW]', xShort: 'v', xMin: 0 });
    charts.motor = new KChart(UI.card(Lyt.cards, 'Motorkennlinie (Volllast)', 'Drehmoment digitalisiert aus Abb. 7.1c, Leistung daraus berechnet.'),
      { height: 260, xLabel: 'n [1/min]', yLabel: 'MM [Nm]', y2Label: 'PM [kW]', xShort: 'n' });
    charts.a = new KChart(UI.card(Lyt.cards, 'Bezogene Beschleunigung je Gang', 'ẍ/g = (Z − Bedarf bei ẍ = 0)/(λ·G), wie Abb. 7.10.'),
      { height: 260, xLabel: 'v [km/h]', yLabel: 'ẍ/g [–]', xShort: 'v', xMin: 0 });
    charts.run = new KChart(UI.card(Lyt.cards, 'Beschleunigungsvorgang aus dem Stand', 'Anfahren mit der höchsten Beschleunigung des 1. Gangs, ' +
      'dann jeweils der Gang mit der größten Beschleunigung (Abschn. 7.5.1). Senkrechte Linien: Gangwechsel.', 'wide'),
    { height: 280, xLabel: 't [s]', yLabel: 'v [km/h]', y2Label: 'x [m]', xShort: 't', xMin: 0 });

    UI.formulas(Lyt.formulas, [
      { tex: String.raw`Z_\mathrm{Bedarf}=G\,(f_R+p)+\lambda\,m\,\ddot x+c_W A\,\frac{\rho}{2}\,v^2`, ref: 'Gl. (5.29)/(5.30)' },
      { tex: String.raw`Z=\frac{i_G\,i_A\,\eta_G\,\eta_A\,M_M(n)}{r},\qquad n=\frac{v\,i_G\,i_A}{2\pi\,r}`, ref: 'Gl. (7.1)' },
      { tex: String.raw`\frac{\ddot x}{g}=\frac{Z-G\,(f_R+p)-c_W A\,\frac{\rho}{2}v^2}{\lambda\,G}`, ref: 'Abb. 7.10' },
      { tex: String.raw`p_\mathrm{max}=\max_v\frac{Z-G f_R-c_W A\,\frac{\rho}{2}v^2}{G}`, ref: 'Abschn. 7.3', note: 'Steigfähigkeit, als tan des Steigungswinkels' },
      { tex: String.raw`t=\int\frac{dv}{\ddot x(v)},\qquad x=\int v\,dt`, ref: 'Abschn. 7.5.1', note: 'numerisch, Schritt 0,01 s' },
    ]);
  }

  root.KTabs = root.KTabs || {};
  root.KTabs.fahrleistung = { init, activate() { compute(); }, deactivate() {} };
})(window);

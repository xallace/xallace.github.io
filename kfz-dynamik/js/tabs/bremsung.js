/* Tab Part II – Braking: brake force distribution (Fig. 9.13), friction utilization (Fig. 9.9b), stopping distance (Fig. 9.4). */
(function (root) {
  'use strict';
  const K = root.KfzDyn, B = K.bremsung;
  const { el, COL } = root.UI;
  const UI = root.UI;

  // μh = 0.46 matching the example on p. 227 (zmax = 0.4, braking efficiency 0.87)
  const values = Object.assign({}, B.DEFAULTS, { muH: 0.46 });
  delete values.m;

  const DEFS = [
    { group: 'Vehicle' },
    { key: 'lVrel', label: 'CG position lV/l', unit: '–', min: 0.3, max: 0.7, step: 0.01 },
    { key: 'hRel', label: 'CG height h/l', unit: '–', min: 0.1, max: 0.45, step: 0.005 },
    { key: 'phi', label: 'Front brake share φ', unit: '–', min: 0.4, max: 0.95, step: 0.01, hint: 'φ = BV/(BV + BH), fixed distribution' },
    { key: 'muH', label: 'Road friction coeff. μh', unit: '–', min: 0.1, max: 1.2, step: 0.01 },
    { group: 'Stopping Distance' },
    { key: 'vA', label: 'Initial speed vA', unit: 'km/h', min: 10, max: 200, step: 1, scale: 3.6 },
    { key: 'decel', label: 'Full deceleration a', unit: 'm/s²', min: 1, max: 11, step: 0.1 },
    { key: 'tr', label: 'Reaction time tr', unit: 's', min: 0.2, max: 2, step: 0.01 },
    { key: 'ta', label: 'Brake response time ta', unit: 's', min: 0, max: 0.5, step: 0.01 },
    { key: 'ts', label: 'Buildup time ts', unit: 's', min: 0, max: 1, step: 0.01 },
  ];

  let charts = {}, kpiEl = null, refresh = null, panel = null;

  function compute() {
    const p = B.withDefaults(values);
    const lH = 1 - p.lVrel, mu = p.muH;
    const Z = K.core.linspace(0, 1.3, 131);

    // Brake force distribution diagram
    const ideal = Z.map((z) => B.ideal(p, z));
    const lim = B.lockLimits(p, mu);
    const zc = B.criticalZ(p);
    const BHmax = 0.65, BVmax = 1.1;
    const series = [
      { name: 'ideal distribution', color: COL[0], x: ideal.map((o) => o.BV), y: ideal.map((o) => o.BH) },
      { name: `fixed distribution φ = ${KFmt(p.phi, 2)}`, color: COL[1], x: [0, p.phi * 1.3], y: [0, (1 - p.phi) * 1.3] },
    ];
    // Lock boundary lines at μh: front BV = μ(lH + h(BV+BH)), rear BH = μ(lV − h(BV+BH))
    const bh = K.core.linspace(0, BHmax, 30);
    series.push({ name: `Front locks (μh = ${KFmt(mu, 2)})`, color: COL[5], dash: [6, 4], width: 1.5,
      x: bh.map((y) => (mu * lH + mu * p.hRel * y) / (1 - mu * p.hRel)), y: bh });
    const bv = K.core.linspace(0, BVmax, 30);
    series.push({ name: `Rear locks (μh = ${KFmt(mu, 2)})`, color: COL[3], dash: [6, 4], width: 1.5,
      x: bv, y: bv.map((x) => (mu * p.lVrel - mu * p.hRel * x) / (1 + mu * p.hRel)) });
    const ann = [];
    for (const z of [0.2, 0.4, 0.6, 0.8, 1.0]) {
      ann.push({ type: 'segment', x0: z, y0: 0, x1: Math.max(0, z - BHmax), y1: Math.min(z, BHmax), color: 'rgba(148,163,184,0.35)', dash: [2, 4] });
      ann.push({ type: 'text', x: z + 0.01, y: 0.015, label: `z = ${KFmt(z, 1)}`, color: '#64748b' });
    }
    if (isFinite(lim.zmax)) ann.push({ type: 'point', x: p.phi * lim.zmax, y: (1 - p.phi) * lim.zmax, label: `zmax = ${KFmt(lim.zmax, 3)}`, fill: '#fbbf24' });
    if (zc > 0 && zc < 1.3) ann.push({ type: 'point', x: p.phi * zc, y: (1 - p.phi) * zc, label: `zcrit = ${KFmt(zc, 3)}`, fill: COL[0], align: 'right' });
    charts.dist.set(series, ann);

    // Friction utilization vs. z
    const U = Z.map((z) => B.utilization(p, z));
    charts.mu.set([
      { name: 'μV front', color: COL[5], x: Z, y: U.map((u) => u.muV) },
      { name: 'μH rear', color: COL[3], x: Z, y: U.map((u) => u.muH) },
      { name: 'ideal μ = z', color: '#94a3b8', dash: [5, 4], width: 1.2, x: [0, 1.3], y: [0, 1.3] },
    ], [
      { type: 'hline', y: mu, color: '#fbbf24', label: `μh = ${KFmt(mu, 2)}` },
      ...(isFinite(lim.zmax) ? [{ type: 'vline', x: lim.zmax, color: '#fbbf24', label: `zmax = ${KFmt(lim.zmax, 3)}`, row: 1 }] : []),
    ]);

    // Stopping event
    const st = B.stopping(p);
    const S = st.series;
    const t1 = p.tr, t2 = p.tr + p.ta, t3 = p.tr + p.ta + p.ts;
    charts.stop.set([
      { name: 'v [km/h]', color: COL[0], x: S.t, y: S.v.map((v) => v * 3.6) },
      { name: 'Deceleration [m/s²]', color: COL[5], x: S.t, y: S.a.map((a) => -a), dash: [4, 3], width: 1.5 },
      { name: 'Distance x [m]', color: COL[2], axis: 'right', x: S.t, y: S.x },
    ], [
      { type: 'xband', x0: 0, x1: t1, color: 'rgba(56,189,248,0.07)' },
      { type: 'xband', x0: t1, x1: t2, color: 'rgba(245,158,11,0.10)' },
      { type: 'xband', x0: t2, x1: t3, color: 'rgba(244,114,182,0.10)' },
      { type: 'vline', x: t1, color: '#475569', label: 'tr', row: 0 },
      { type: 'vline', x: t2, color: '#475569', label: 'ta', row: 1 },
      { type: 'vline', x: t3, color: '#475569', label: 'ts', row: 2 },
    ]);

    // Stopping distance vs. initial speed for Table 9.1 reaction times
    const VA = K.core.linspace(0, 200 / 3.6, 81);
    charts.sv.set(K.data.reaktion.map((r, i) => ({
      name: `tr = ${KFmt(r.tr[0], 2)} s (${r.name})`, color: COL[i], x: VA.map((v) => v * 3.6),
      y: VA.map((v) => B.stopping({ ...p, vA: v, tr: r.tr[0] }).s),
    })).concat([{ name: 'current setting', color: '#e2e8f0', width: 1.5, dash: [5, 4], x: VA.map((v) => v * 3.6), y: VA.map((v) => B.stopping({ ...p, vA: v }).s) }]),
    [{ type: 'point', x: p.vA * 3.6, y: st.s, label: `${KFmt(st.s, 1)} m`, fill: '#fbbf24' }]);

    UI.kpis(kpiEl, [
      { label: 'Stopping distance', value: st.s, unit: 'm', digits: 1, sub: `incl. reaction + response ${KFmt(st.parts.s1, 1)} m` },
      { label: 'Stopping time', value: st.t, unit: 's', digits: 2 },
      { label: 'Braking dist. (from response)', value: st.sBrake, unit: 'm', digits: 1 },
      { label: 'zcrit (μV = μH)', value: zc, digits: 3, sub: zc > 0 ? 'below this, front locks first' : 'rear always locks first', state: zc > 0 ? '' : 'bad' },
      Math.abs(lim.zV - lim.zH) < 1e-3
        ? { label: `zmax at μh = ${KFmt(mu, 2)}`, value: lim.zmax, digits: 3, sub: 'both axles lock simultaneously', state: 'ok' }
        : { label: `zmax at μh = ${KFmt(mu, 2)}`, value: lim.zmax, digits: 3, sub: `locks first: ${lim.first}`, state: lim.first === 'front axle' ? 'ok' : 'warn' },
      { label: 'Braking efficiency zmax/μh', value: lim.guete, digits: 3, state: lim.guete > 0.9 ? 'ok' : lim.guete > 0.75 ? 'warn' : 'bad' },
    ]);
  }

  function init(sec) {
    const Lyt = UI.tabLayout(sec, {
      title: 'Part II · Braking',
      intro: 'During braking, dynamic load transfers to the front axle. A fixed brake force distribution therefore matches the ideal ' +
        'curve at only one deceleration; above it, the rear axle locks first and the vehicle becomes unstable. Baseline is the ' +
        'vehicle from Fig. 9.12 with φ = 0.76, plus stopping distance per Eq. (9.17).',
      src: 'Ch. 9 · Eqs. (9.17)–(9.19), (9.40), (9.44)–(9.46), (9.56), Figs. 9.4, 9.9, 9.13, Table 9.1, pp. 217/227',
    });
    kpiEl = Lyt.kpis;
    Lyt.aside.appendChild(el('h3', '', 'Inputs'));
    const pre = UI.presets(Lyt.aside, K.data.reaktion.map((r) => ({ name: `tr ${KFmt(r.tr[0], 2)} s`, title: `Table 9.1: ${r.name} (2 %: ${KFmt(r.tr[1], 2)} s, 98 %: ${KFmt(r.tr[2], 2)} s)`, r })),
      (pt) => { values.tr = pt.r.tr[0]; panel.refresh(); refresh(); });
    pre.mark(0);
    refresh = UI.scheduler(compute);
    panel = UI.paramPanel(Lyt.aside, DEFS, values, (key) => { if (key === 'tr') pre.clear(); refresh(); });
    Lyt.aside.appendChild(el('p', 'note', 'z = normalized deceleration ẍ/g. <b>Braking efficiency</b> zmax/μh: fraction of available friction utilized without wheel lock. ' +
      'Stopping time uses Eq. (9.19a); the example on p. 218 prints 4.4 s, while the example inputs yield 4.6 s.'));

    charts.dist = new KChart(UI.card(Lyt.cards, 'Brake Force Distribution', 'Like Fig. 9.13. The fixed distribution (line) intersects the ideal curve at zcrit. ' +
      'Wherever it first reaches a lock limit lies zmax.'),
    { height: 320, xLabel: 'BV/G', yLabel: 'BH/G', xShort: 'BV/G', yShort: 'BH/G', xMin: 0, xMax: 1.1, yMin: 0, yMax: 0.65, hover: 'nearest' });
    charts.mu = new KChart(UI.card(Lyt.cards, 'Friction Utilization', 'Like Fig. 9.9b: required friction per axle vs. deceleration. ' +
      'Where μH exceeds μV, the rear axle locks first.'),
    { height: 320, xLabel: 'Deceleration z', yLabel: 'μ [–]', xShort: 'z', xMin: 0, xMax: 1.3, yMin: 0, yMax: 1.5 });
    charts.stop = new KChart(UI.card(Lyt.cards, 'Stopping Event', 'Like Fig. 9.4: reaction (blue), response (amber), buildup (pink), then full deceleration.'),
      { height: 280, xLabel: 't [s]', yLabel: 'v [km/h] · a [m/s²]', y2Label: 'x [m]', xShort: 't', xMin: 0 });
    charts.sv = new KChart(UI.card(Lyt.cards, 'Stopping Distance vs. Initial Speed', 'Mean reaction times from Table 9.1; remaining parameters as set.'),
      { height: 280, xLabel: 'vA [km/h]', yLabel: 's [m]', xShort: 'vA', xMin: 0 });

    UI.formulas(Lyt.formulas, [
      { tex: String.raw`\frac{F_{zV}}{G}=\frac{l_H}{l}+\frac{h}{l}\,z,\qquad \frac{F_{zH}}{G}=\frac{l_V}{l}-\frac{h}{l}\,z`, ref: 'Eqs. (9.44)/(9.45)' },
      { tex: String.raw`\mu_V=\frac{\varphi\,z}{F_{zV}/G},\qquad \mu_H=\frac{(1-\varphi)\,z}{F_{zH}/G}`, ref: 'Eq. (9.46)' },
      { tex: String.raw`\frac{B_{V\,id}}{G}=z\left(\frac{l_H}{l}+\frac{h}{l}z\right),\qquad \frac{B_{H\,id}}{G}=z\left(\frac{l_V}{l}-\frac{h}{l}z\right)`, ref: 'Eq. (9.56)' },
      { tex: String.raw`z_{\max,V}=\frac{\mu_h\,l_H/l}{\varphi-\mu_h\,h/l},\qquad z_{\max,H}=\frac{\mu_h\,l_V/l}{1-\varphi+\mu_h\,h/l},\qquad \text{Efficiency}=\frac{z_{\max}}{\mu_h}`, ref: 'Eq. (9.40)', note: 'from (9.46) with μV or μH = μh' },
      { tex: String.raw`s=v_A\left(t_r+t_a+\frac{t_s}{2}\right)+\frac{v_A^2}{2a}-\frac{a\,t_s^2}{24}`, ref: 'Eq. (9.17), p. 217' },
      { tex: String.raw`t=t_r+t_a+\frac{t_s}{2}+\frac{v_A}{a}`, ref: 'Eq. (9.19a)' },
    ]);
  }

  root.KTabs = root.KTabs || {};
  root.KTabs.bremsung = { init, activate() { compute(); }, deactivate() {} };
})(window);

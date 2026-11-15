/* Tab Part I – Tires: 3D view per Fig. 2.1, characteristic maps per Fig. 2.44, friction diagram, aligning torque. */
(function (root) {
  'use strict';
  const K = root.KfzDyn, R = K.reifen, DEG = K.core.DEG;
  const { el, COL } = root.UI;
  const UI = root.UI;

  const values = Object.assign({}, R.DEFAULTS, { Sx: -0.08, alpha: 4 * DEG, gamma: 0, delta: 15 * DEG });

  const DEFS = [
    { group: 'Operating Point' },
    { key: 'Sx', label: 'Longitudinal slip Sx', unit: '%', min: -100, max: 100, step: 1, scale: 100, hint: 'negative: braking, positive: driving (Table 2.3)' },
    { key: 'alpha', label: 'Slip angle α', unit: '°', min: -15, max: 15, step: 0.1, scale: 1 / DEG },
    { key: 'gamma', label: 'Camber angle γ', unit: '°', min: -8, max: 8, step: 0.1, scale: 1 / DEG },
    { key: 'Fz', label: 'Wheel load Fz', unit: 'kN', min: 1, max: 8, step: 0.1, scale: 1e-3 },
    { key: 'v', label: 'Travel speed ẋR', unit: 'km/h', min: 5, max: 200, step: 1, scale: 3.6 },
    { key: 'delta', label: 'Heading angle ψ + δ (view only)', unit: '°', min: -60, max: 60, step: 1, scale: 1 / DEG },
    { group: 'Tire (HSRI Parameters)' },
    { key: 'cx', label: 'Longitudinal stiffness cx', unit: 'kN', min: 10, max: 120, step: 1, scale: 1e-3 },
    { key: 'ca1', label: 'cα1', unit: '1/rad', min: 5, max: 40, step: 0.1, hint: 'cα = (cα1 − cα2·Fz/Fz,nom)·Fz' },
    { key: 'ca2', label: 'cα2', unit: '1/rad', min: 0, max: 25, step: 0.1 },
    { key: 'mu01', label: 'Friction coeff. μ01', unit: '–', min: 0.1, max: 1.6, step: 0.01 },
    { key: 'kR', label: 'Friction decay kR', unit: '–', min: 0, max: 0.8, step: 0.01 },
    { key: 'a', label: 'Sliding speed factor a', unit: 's/m', min: 0, max: 0.3, step: 0.005 },
    { key: 'cgRel', label: 'Camber stiffness cγ/cα', unit: '–', min: 0, max: 0.3, step: 0.01, hint: 'Assumed; the textbook gives no value for this tire' },
    { group: 'Geometry' },
    { key: 'R0', label: 'Dyn. rolling radius R0', unit: 'm', min: 0.2, max: 0.45, step: 0.005 },
    { key: 'c1', label: 'Vertical stiffness c1', unit: 'kN/m', min: 80, max: 400, step: 5, scale: 1e-3 },
  ];

  const POINTS = [
    { name: 'Free rolling', p: { Sx: 0, alpha: 0, gamma: 0 } },
    { name: 'Braking 10 %', p: { Sx: -0.1, alpha: 0, gamma: 0 } },
    { name: 'Driving 10 %', p: { Sx: 0.1, alpha: 0, gamma: 0 } },
    { name: 'Cornering α = 4°', p: { Sx: 0, alpha: 4 * DEG, gamma: 0 } },
    { name: 'Braking in turn', p: { Sx: -0.08, alpha: 4 * DEG, gamma: 0 } },
    { name: 'Locked wheel', p: { Sx: -1, alpha: 4 * DEG, gamma: 0 } },
    { name: 'Camber 3°', p: { Sx: 0, alpha: 0, gamma: 3 * DEG } },
  ];

  let view = null, panel = null, charts = {}, kpiEl = null, active = false, refresh = null;

  function tyre() { const { Sx, alpha, gamma, delta, ...p } = values; return p; }

  function compute() {
    const p = tyre();
    const op = R.forces(p, values.Sx, values.alpha, values.gamma);
    const alphas = [0, 2, 4, 8, 12];
    const slips = [0, 0.05, 0.1, 0.2, 0.5];
    const vsS = R.curvesVsSlip(p, alphas, 160);
    const vsA = R.curvesVsAlpha(p, slips, 160, 15);
    const sA = Math.abs(values.Sx) * 100, aA = Math.abs(values.alpha) / DEG;

    charts.fx.set(vsS.map((c, i) => ({ name: `α = ${c.alphaDeg}°`, color: COL[i], x: c.S.map((s) => s * 100), y: c.Fx.map((f) => f / 1000) }))
      .concat([{ name: 'Measured α = 0 (Fig. 2.44b)', color: '#e2e8f0', line: false, points: true, hollow: true, r: 3.5,
        x: K.data.reifenMessung.FxVsSlip.map((q) => q[0] * 100), y: K.data.reifenMessung.FxVsSlip.map((q) => q[1] / 1000) }]),
    [{ type: 'point', x: sA, y: Math.abs(op.Fx) / 1000, label: 'Operating point', fill: '#fbbf24' }]);

    charts.fy.set(vsA.map((c, i) => ({ name: `Sx = ${Math.round(c.Sx * 100)} %`, color: COL[i], x: c.A, y: c.Fy.map((f) => f / 1000) }))
      .concat([{ name: 'Measured Sx = 0 (Fig. 2.44a)', color: '#e2e8f0', line: false, points: true, hollow: true, r: 3.5,
        x: K.data.reifenMessung.FyVsAlpha.map((q) => q[0]), y: K.data.reifenMessung.FyVsAlpha.map((q) => q[1] / 1000) }]),
    [{ type: 'point', x: aA, y: Math.abs(op.Fy) / 1000, label: 'Operating point', fill: '#fbbf24' }]);

    // Friction diagram: curves of constant slip angle, Sx swept from braking to driving
    const S = K.core.linspace(-0.99, 0.99, 199);
    const kamm = [1, 2, 4, 8, 12].map((ad, i) => {
      const r = S.map((s) => R.forces(p, s, ad * DEG, values.gamma));
      return { name: `α = ${ad}°`, color: COL[i], x: r.map((o) => o.Fx / 1000), y: r.map((o) => o.Fy / 1000) };
    });
    const rMax = op.mu0 * p.Fz / 1000;
    const circ = K.core.linspace(0, Math.PI, 90);
    kamm.push({ name: 'μ0·Fz', color: '#94a3b8', dash: [5, 4], width: 1.3, noHover: true,
      x: circ.map((t) => rMax * Math.cos(t)), y: circ.map((t) => rMax * Math.sin(t)) });
    charts.kamm.setOptions({ xMin: -1.15 * rMax, xMax: 1.15 * rMax, yMin: Math.min(-0.1 * rMax, op.Fy / 1000 - 0.1 * rMax), yMax: 1.15 * rMax });
    charts.kamm.set(kamm, [{ type: 'point', x: op.Fx / 1000, y: op.Fy / 1000, label: 'Operating point', fill: '#fbbf24' }]);

    // Mz depends on the sign of Fx (term −Fx·nx), so plot braking or driving curves matching the operating point
    const sgn = values.Sx < 0 ? -1 : 1;
    const vsAmz = R.curvesVsAlpha(p, slips.slice(0, 4).map((s) => s * sgn), 160, 15);
    charts.mz.set(vsAmz.map((c, i) => ({ name: `Sx = ${Math.round(c.Sx * 100)} %`, color: COL[i], x: c.A, y: c.Mz })),
      [{ type: 'point', x: aA, y: op.Mz * Math.sign(values.alpha || 1), label: 'Operating point', fill: '#fbbf24' }]);

    const used = Math.hypot(op.Fx, op.Fy) / op.Fz;
    UI.kpis(kpiEl, [
      { label: 'Longitudinal force Fx', value: op.Fx / 1000, unit: 'kN', digits: 2 },
      { label: 'Lateral force Fy', value: op.Fy / 1000, unit: 'kN', digits: 2 },
      { label: 'Aligning torque Mz', value: op.Mz, unit: 'Nm', digits: 0 },
      { label: 'Friction util. √(Fx²+Fy²)/Fz', value: used, digits: 3, sub: `Friction coeff. μ = ${KFmt(op.mu, 3)}` },
      { label: 's̄R', value: op.sR, digits: 3, sub: op.regime, state: op.sR <= 0.5 ? 'ok' : op.sR < 1.5 ? 'warn' : 'bad' },
      { label: 'Cornering stiffness cα', value: op.ca / 1000, unit: 'kN/rad', digits: 1 },
      { label: 'Pneumatic trail ny', value: op.ny * 1000, unit: 'mm', digits: 1 },
      { label: 'Contact patch length 2 lL', value: 2 * op.lL * 1000, unit: 'mm', digits: 0 },
      { label: 'Sliding speed vg', value: op.vg, unit: 'm/s', digits: 2 },
    ]);

    view.update({ Sx: values.Sx, alpha: values.alpha, gamma: values.gamma, delta: values.delta,
      Fx: op.Fx, Fy: op.Fy, Fz: op.Fz, Mz: op.Mz, v: values.v, R0: values.R0, lL: op.lL });
  }

  function init(sec) {
    const L = UI.tabLayout(sec, {
      title: 'Part I · Tires',
      intro: 'Wheel forces and aligning torque according to the extended HSRI tire model (Table 2.3). Adjust slip, slip angle, and camber ' +
        'and observe the force directions in the 3D view based on Fig. 2.1. The plots compare the model with digitized measurements ' +
        'from Fig. 2.44 (205/60 R 15 tire, Fz = 4 kN, dry).',
      src: 'Ch. 2 · Fig. 2.1 (p. 10), Eqs. (2.35)/(2.37), Fig. 2.44 (p. 48), Table 2.3 (p. 51)',
    });
    kpiEl = L.kpis;
    L.aside.appendChild(el('h3', '', 'Inputs'));
    const pre = UI.presets(L.aside, POINTS, (pt) => { Object.assign(values, pt.p); panel.refresh(); refresh(); });
    pre.mark(4);
    refresh = UI.scheduler(compute);
    panel = UI.paramPanel(L.aside, DEFS, values, () => { pre.clear(); refresh(); });
    L.aside.appendChild(el('p', 'note', '<b>Sign convention:</b> Sx &lt; 0 braking. Positive α rotates v toward the −j* side, ' +
      'so lateral force points toward +j*. Positive camber tilts the wheel toward the −j* side, and camber thrust points in that direction.'));

    const vp = UI.card(L.cards, 'Wheel and Road (per Fig. 2.1)', 'The wheel remains stationary while the road moves beneath it in slow motion at −v. ' +
      'During braking the wheel spins slower than pure rolling; under a slip angle the grid runs obliquely relative to the wheel. ' +
      'Yellow: resultant horizontal force. Violet: aligning torque Mz about k*.', 'wide');
    const tools = el('span', 'card-tools');
    vp.previousSibling.appendChild(tools);
    UI.seg(tools, [['rad', 'Forces on wheel (2.1b)'], ['fahrbahn', 'on road (2.1c)']], 'rad', (m) => view.setMode(m));
    const box = el('div', 'viewport');
    vp.appendChild(box);
    view = root.KReifen3D.create(box);

    charts.fx = new KChart(UI.card(L.cards, 'Longitudinal Force vs. Slip', 'Magnitudes; braking and driving behave identically in the model. ' +
      'The model (lines) peaks below the measured data (see Verification tab).'),
    { height: 280, xLabel: 'Longitudinal slip |Sx| [%]', yLabel: 'Fx [kN]', xShort: 'Sx', yShort: 'Fx', xMin: 0, xMax: 100 });
    charts.fy = new KChart(UI.card(L.cards, 'Lateral Force vs. Slip Angle', 'Transmittable lateral force decreases as longitudinal slip increases.'),
      { height: 280, xLabel: 'Slip angle α [°]', yLabel: 'Fy [kN]', xShort: 'α', yShort: 'Fy', xMin: 0, xMax: 15 });
    charts.kamm = new KChart(UI.card(L.cards, 'Friction Diagram (Kamm Circle)', 'Each curve holds α fixed while Sx sweeps from −99 % (braking, left) to +99 % (driving). ' +
      'Dashed: Kamm friction circle μ0·Fz; sliding reduces μ below this bound.'),
    { height: 300, aspect: 0.62, xLabel: 'Longitudinal force Fx [kN]', yLabel: 'Lateral force Fy [kN]', hover: 'nearest', xShort: 'Fx', yShort: 'Fy', pad: 0 });
    charts.mz = new KChart(UI.card(L.cards, 'Aligning Torque vs. Slip Angle', 'Mz = Fy·ny − Fx·nx. Pneumatic trail ny collapses ' +
      'once the contact patch begins sliding, causing Mz to drop after its peak.'),
    { height: 280, xLabel: 'Slip angle α [°]', yLabel: 'Mz [Nm]', xShort: 'α', yShort: 'Mz', xMin: 0, xMax: 15 });

    UI.formulas(L.formulas, [
      { tex: String.raw`\bar s_R=\frac{\sqrt{(c_x S_x)^2+(c_\alpha\tan\alpha)^2}}{\mu F_z\,(1-S_x)}`, ref: 'Table 2.3', note: '≤ 0.5 adhesion, > 0.5 partial sliding' },
      { tex: String.raw`F_x=\frac{c_x S_x}{1-S_x}\,f,\qquad F_y=\frac{c_\alpha\tan\alpha}{1-S_x}\,f,\qquad f=\begin{cases}1 & \bar s_R\le 0.5\\[2pt] \dfrac{\bar s_R-0.25}{\bar s_R^{\,2}} & \bar s_R>0.5\end{cases}`,
        ref: 'Table 2.3', note: 'uses 1/(1 − Sx) in the adhesion zone as in partial sliding for continuity' },
      { tex: String.raw`\mu=\mu_0\left[1-k_R\tanh\,(a\,v_g)^2\right],\qquad \mu_0=\mu_{01}+\mu_{02}F_z,\qquad v_g=\dot x_R\sqrt{S_x^2+\tan^2\alpha}`, ref: 'Table 2.3' },
      { tex: String.raw`S_x=1-\frac{\dot x_R}{R_0\dot\varphi_R}\ \text{(drive)},\qquad S_x=1-\frac{R_0\dot\varphi_R}{\dot x_R}\ \text{(braking)}`, ref: 'Eqs. (2.18a, b)' },
      { tex: String.raw`c_\alpha=\left(c_{\alpha1}-c_{\alpha2}\,\frac{F_z}{F_{z\,\mathrm{nom}}}\right)F_z`, ref: 'Eq. (2.35), p. 41' },
      { tex: String.raw`F_y=c_\alpha\,\alpha-c_\gamma\,\gamma`, ref: 'Eq. (2.37), p. 43', note: 'modeled as equivalent slip angle, assuming cγ = 0.1·cα' },
      { tex: String.raw`M_z=F_y n_y-F_x n_x,\qquad n_y=\frac{l_L}{3}\left[1+2\bar s_R(0.5-\bar s_R)\right],\qquad n_x=\frac43\,l_L\tan\alpha+\frac{F_y}{c_y}`, ref: 'Table 2.3', note: 'adhesion zone; partial sliding see Table 2.3' },
      { tex: String.raw`l_L=\sqrt{2R_0 s_1},\qquad s_1=F_z/c_1,\qquad c_y\approx c_1/2`, ref: 'Table 2.3, Eq. (2.25)' },
    ]);
  }

  root.KTabs = root.KTabs || {};
  root.KTabs.reifen = {
    init,
    activate() { active = true; view.start(); compute(); },
    deactivate() { active = false; view.stop(); },
  };
})(window);

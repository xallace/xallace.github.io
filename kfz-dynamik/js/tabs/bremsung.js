/* Reiter Teil II – Bremsung: Bremskraftverteilung (Abb. 9.13), Kraftschlussbeanspruchung (Abb. 9.9b), Anhalteweg (Abb. 9.4). */
(function (root) {
  'use strict';
  const K = root.KfzDyn, B = K.bremsung;
  const { el, COL } = root.UI;
  const UI = root.UI;

  // μh = 0,46 wie das Beispiel auf S. 227 (zmax = 0,4, Gütegrad 0,87)
  const values = Object.assign({}, B.DEFAULTS, { muH: 0.46 });
  delete values.m;

  const DEFS = [
    { group: 'Fahrzeug' },
    { key: 'lVrel', label: 'Schwerpunktlage lV/l', unit: '–', min: 0.3, max: 0.7, step: 0.01 },
    { key: 'hRel', label: 'Schwerpunkthöhe h/l', unit: '–', min: 0.1, max: 0.45, step: 0.005 },
    { key: 'phi', label: 'Bremskraftanteil vorn φ', unit: '–', min: 0.4, max: 0.95, step: 0.01, hint: 'φ = BV/(BV + BH), feste Verteilung' },
    { key: 'muH', label: 'Haftbeiwert Fahrbahn μh', unit: '–', min: 0.1, max: 1.2, step: 0.01 },
    { group: 'Anhalteweg' },
    { key: 'vA', label: 'Anfangsgeschwindigkeit vA', unit: 'km/h', min: 10, max: 200, step: 1, scale: 3.6 },
    { key: 'decel', label: 'Vollverzögerung a', unit: 'm/s²', min: 1, max: 11, step: 0.1 },
    { key: 'tr', label: 'Reaktionsdauer tr', unit: 's', min: 0.2, max: 2, step: 0.01 },
    { key: 'ta', label: 'Ansprechdauer ta', unit: 's', min: 0, max: 0.5, step: 0.01 },
    { key: 'ts', label: 'Schwelldauer ts', unit: 's', min: 0, max: 1, step: 0.01 },
  ];

  let charts = {}, kpiEl = null, refresh = null, panel = null;

  function compute() {
    const p = B.withDefaults(values);
    const lH = 1 - p.lVrel, mu = p.muH;
    const Z = K.core.linspace(0, 1.3, 131);

    // Bremskraftverteilungsdiagramm
    const ideal = Z.map((z) => B.ideal(p, z));
    const lim = B.lockLimits(p, mu);
    const zc = B.criticalZ(p);
    const BHmax = 0.65, BVmax = 1.1;
    const series = [
      { name: 'ideale Verteilung', color: COL[0], x: ideal.map((o) => o.BV), y: ideal.map((o) => o.BH) },
      { name: `feste Verteilung φ = ${KFmt(p.phi, 2)}`, color: COL[1], x: [0, p.phi * 1.3], y: [0, (1 - p.phi) * 1.3] },
    ];
    // Grenzgeraden für Blockieren bei μh: vorn BV = μ(lH + h(BV+BH)), hinten BH = μ(lV − h(BV+BH))
    const bh = K.core.linspace(0, BHmax, 30);
    series.push({ name: `VA blockiert (μh = ${KFmt(mu, 2)})`, color: COL[5], dash: [6, 4], width: 1.5,
      x: bh.map((y) => (mu * lH + mu * p.hRel * y) / (1 - mu * p.hRel)), y: bh });
    const bv = K.core.linspace(0, BVmax, 30);
    series.push({ name: `HA blockiert (μh = ${KFmt(mu, 2)})`, color: COL[3], dash: [6, 4], width: 1.5,
      x: bv, y: bv.map((x) => (mu * p.lVrel - mu * p.hRel * x) / (1 + mu * p.hRel)) });
    const ann = [];
    for (const z of [0.2, 0.4, 0.6, 0.8, 1.0]) {
      ann.push({ type: 'segment', x0: z, y0: 0, x1: Math.max(0, z - BHmax), y1: Math.min(z, BHmax), color: 'rgba(148,163,184,0.35)', dash: [2, 4] });
      ann.push({ type: 'text', x: z + 0.01, y: 0.015, label: `z = ${KFmt(z, 1)}`, color: '#64748b' });
    }
    if (isFinite(lim.zmax)) ann.push({ type: 'point', x: p.phi * lim.zmax, y: (1 - p.phi) * lim.zmax, label: `zmax = ${KFmt(lim.zmax, 3)}`, fill: '#fbbf24' });
    if (zc > 0 && zc < 1.3) ann.push({ type: 'point', x: p.phi * zc, y: (1 - p.phi) * zc, label: `zkrit = ${KFmt(zc, 3)}`, fill: COL[0], align: 'right' });
    charts.dist.set(series, ann);

    // Kraftschlussbeanspruchung über z
    const U = Z.map((z) => B.utilization(p, z));
    charts.mu.set([
      { name: 'μV vorn', color: COL[5], x: Z, y: U.map((u) => u.muV) },
      { name: 'μH hinten', color: COL[3], x: Z, y: U.map((u) => u.muH) },
      { name: 'ideal μ = z', color: '#94a3b8', dash: [5, 4], width: 1.2, x: [0, 1.3], y: [0, 1.3] },
    ], [
      { type: 'hline', y: mu, color: '#fbbf24', label: `μh = ${KFmt(mu, 2)}` },
      ...(isFinite(lim.zmax) ? [{ type: 'vline', x: lim.zmax, color: '#fbbf24', label: `zmax = ${KFmt(lim.zmax, 3)}`, row: 1 }] : []),
    ]);

    // Anhaltevorgang
    const st = B.stopping(p);
    const S = st.series;
    const t1 = p.tr, t2 = p.tr + p.ta, t3 = p.tr + p.ta + p.ts;
    charts.stop.set([
      { name: 'v [km/h]', color: COL[0], x: S.t, y: S.v.map((v) => v * 3.6) },
      { name: 'Verzögerung [m/s²]', color: COL[5], x: S.t, y: S.a.map((a) => -a), dash: [4, 3], width: 1.5 },
      { name: 'Weg x [m]', color: COL[2], axis: 'right', x: S.t, y: S.x },
    ], [
      { type: 'xband', x0: 0, x1: t1, color: 'rgba(56,189,248,0.07)' },
      { type: 'xband', x0: t1, x1: t2, color: 'rgba(245,158,11,0.10)' },
      { type: 'xband', x0: t2, x1: t3, color: 'rgba(244,114,182,0.10)' },
      { type: 'vline', x: t1, color: '#475569', label: 'tr', row: 0 },
      { type: 'vline', x: t2, color: '#475569', label: 'ta', row: 1 },
      { type: 'vline', x: t3, color: '#475569', label: 'ts', row: 2 },
    ]);

    // Anhalteweg über Anfangsgeschwindigkeit für die Reaktionsdauern aus Tab. 9.1
    const VA = K.core.linspace(0, 200 / 3.6, 81);
    charts.sv.set(K.data.reaktion.map((r, i) => ({
      name: `tr = ${KFmt(r.tr[0], 2)} s (${r.name})`, color: COL[i], x: VA.map((v) => v * 3.6),
      y: VA.map((v) => B.stopping({ ...p, vA: v, tr: r.tr[0] }).s),
    })).concat([{ name: 'eingestellt', color: '#e2e8f0', width: 1.5, dash: [5, 4], x: VA.map((v) => v * 3.6), y: VA.map((v) => B.stopping({ ...p, vA: v }).s) }]),
    [{ type: 'point', x: p.vA * 3.6, y: st.s, label: `${KFmt(st.s, 1)} m`, fill: '#fbbf24' }]);

    UI.kpis(kpiEl, [
      { label: 'Anhalteweg', value: st.s, unit: 'm', digits: 1, sub: `davon Reaktion + Ansprechen ${KFmt(st.parts.s1, 1)} m` },
      { label: 'Anhaltedauer', value: st.t, unit: 's', digits: 2 },
      { label: 'Bremsweg ab Ansprechen', value: st.sBrake, unit: 'm', digits: 1 },
      { label: 'zkrit (μV = μH)', value: zc, digits: 3, sub: zc > 0 ? 'darunter blockiert zuerst vorn' : 'blockiert immer zuerst hinten', state: zc > 0 ? '' : 'bad' },
      Math.abs(lim.zV - lim.zH) < 1e-3
        ? { label: `zmax bei μh = ${KFmt(mu, 2)}`, value: lim.zmax, digits: 3, sub: 'beide Achsen blockieren gleichzeitig', state: 'ok' }
        : { label: `zmax bei μh = ${KFmt(mu, 2)}`, value: lim.zmax, digits: 3, sub: `zuerst blockiert: ${lim.first}`, state: lim.first === 'Vorderachse' ? 'ok' : 'warn' },
      { label: 'Gütegrad zmax/μh', value: lim.guete, digits: 3, state: lim.guete > 0.9 ? 'ok' : lim.guete > 0.75 ? 'warn' : 'bad' },
    ]);
  }

  function init(sec) {
    const Lyt = UI.tabLayout(sec, {
      title: 'Teil II · Bremsung',
      intro: 'Bei der Bremsung verlagert sich Last nach vorn. Eine feste Bremskraftverteilung passt deshalb nur bei einer ' +
        'Abbremsung zur idealen; darüber blockiert die Hinterachse zuerst und das Fahrzeug wird instabil. Vorgabe ist das ' +
        'Fahrzeug aus Abb. 9.12 mit φ = 0,76, dazu der Anhalteweg nach Gl. (9.17).',
      src: 'Kap. 9 · Gl. (9.17)–(9.19), (9.40), (9.44)–(9.46), (9.56), Abb. 9.4, 9.9, 9.13, Tab. 9.1, S. 217/227',
    });
    kpiEl = Lyt.kpis;
    Lyt.aside.appendChild(el('h3', '', 'Eingaben'));
    const pre = UI.presets(Lyt.aside, K.data.reaktion.map((r) => ({ name: `tr ${KFmt(r.tr[0], 2)} s`, title: `Tab. 9.1: ${r.name} (2 %: ${KFmt(r.tr[1], 2)} s, 98 %: ${KFmt(r.tr[2], 2)} s)`, r })),
      (pt) => { values.tr = pt.r.tr[0]; panel.refresh(); refresh(); });
    pre.mark(0);
    refresh = UI.scheduler(compute);
    panel = UI.paramPanel(Lyt.aside, DEFS, values, (key) => { if (key === 'tr') pre.clear(); refresh(); });
    Lyt.aside.appendChild(el('p', 'note', 'z = Abbremsung ẍ/g. <b>Gütegrad</b> zmax/μh: Anteil des Haftbeiwerts, der ohne Blockieren genutzt wird. ' +
      'Die Anhaltedauer rechnet nach Gl. (9.19a); das Beispiel auf S. 218 druckt 4,4 s, mit den Zahlen des Beispiels ergeben sich 4,6 s.'));

    charts.dist = new KChart(UI.card(Lyt.cards, 'Bremskraftverteilung', 'Wie Abb. 9.13. Die feste Verteilung (Gerade) schneidet die ideale bei zkrit. ' +
      'Wo sie zuerst eine Blockiergrenze erreicht, liegt zmax.'),
    { height: 320, xLabel: 'BV/G', yLabel: 'BH/G', xShort: 'BV/G', yShort: 'BH/G', xMin: 0, xMax: 1.1, yMin: 0, yMax: 0.65, hover: 'nearest' });
    charts.mu = new KChart(UI.card(Lyt.cards, 'Kraftschlussbeanspruchung', 'Wie Abb. 9.9b: benötigter Kraftschluss je Achse über der Abbremsung. ' +
      'Liegt μH über μV, blockiert die Hinterachse zuerst.'),
    { height: 320, xLabel: 'Abbremsung z', yLabel: 'μ [–]', xShort: 'z', xMin: 0, xMax: 1.3, yMin: 0, yMax: 1.5 });
    charts.stop = new KChart(UI.card(Lyt.cards, 'Anhaltevorgang', 'Wie Abb. 9.4: Reaktion (blau), Ansprechen (gelb), Schwellen (rosa), dann volle Verzögerung.'),
      { height: 280, xLabel: 't [s]', yLabel: 'v [km/h] · a [m/s²]', y2Label: 'x [m]', xShort: 't', xMin: 0 });
    charts.sv = new KChart(UI.card(Lyt.cards, 'Anhalteweg über Anfangsgeschwindigkeit', 'Mittlere Reaktionsdauern aus Tab. 9.1, übrige Werte wie eingestellt.'),
      { height: 280, xLabel: 'vA [km/h]', yLabel: 's [m]', xShort: 'vA', xMin: 0 });

    UI.formulas(Lyt.formulas, [
      { tex: String.raw`\frac{F_{zV}}{G}=\frac{l_H}{l}+\frac{h}{l}\,z,\qquad \frac{F_{zH}}{G}=\frac{l_V}{l}-\frac{h}{l}\,z`, ref: 'Gl. (9.44)/(9.45)' },
      { tex: String.raw`\mu_V=\frac{\varphi\,z}{F_{zV}/G},\qquad \mu_H=\frac{(1-\varphi)\,z}{F_{zH}/G}`, ref: 'Gl. (9.46)' },
      { tex: String.raw`\frac{B_{V\,id}}{G}=z\left(\frac{l_H}{l}+\frac{h}{l}z\right),\qquad \frac{B_{H\,id}}{G}=z\left(\frac{l_V}{l}-\frac{h}{l}z\right)`, ref: 'Gl. (9.56)' },
      { tex: String.raw`z_{\max,V}=\frac{\mu_h\,l_H/l}{\varphi-\mu_h\,h/l},\qquad z_{\max,H}=\frac{\mu_h\,l_V/l}{1-\varphi+\mu_h\,h/l},\qquad \text{Gütegrad}=\frac{z_{\max}}{\mu_h}`, ref: 'Gl. (9.40)', note: 'aus (9.46) mit μV bzw. μH = μh' },
      { tex: String.raw`s=v_A\left(t_r+t_a+\frac{t_s}{2}\right)+\frac{v_A^2}{2a}-\frac{a\,t_s^2}{24}`, ref: 'Gl. (9.17), S. 217' },
      { tex: String.raw`t=t_r+t_a+\frac{t_s}{2}+\frac{v_A}{a}`, ref: 'Gl. (9.19a)' },
    ]);
  }

  root.KTabs = root.KTabs || {};
  root.KTabs.bremsung = { init, activate() { compute(); }, deactivate() {} };
})(window);

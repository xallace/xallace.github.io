/* Reiter Teil IV – Fahrverhalten mit dem linearen Einspurmodell: Kreisfahrt (Tab. 21.2/21.3), Stabilität und Eigenwerte
   (22.4)–(22.6), Zeitverläufe nach Lenkeingaben mit Draufsicht, Frequenzgang (Tab. 22.1). Vorlagen aus Tab. 21.7. */
(function (root) {
  'use strict';
  const K = root.KfzDyn, E = K.einspur, DEG = K.core.DEG;
  const { el, COL } = root.UI;
  const UI = root.UI;

  const values = Object.assign({}, E.DEFAULTS, { kind: 'rampe', amp: 35 * DEG, rate: 200 * DEG, freq: 0.5 });

  const DEFS = [
    { group: 'Fahrzeug' },
    { key: 'm', label: 'Masse m', unit: 'kg', min: 500, max: 2500, step: 10 },
    { key: 'l', label: 'Radstand l', unit: 'm', min: 2, max: 3.5, step: 0.01 },
    { key: 'lVrel', label: 'Schwerpunktlage lV/l', unit: '–', min: 0.3, max: 0.7, step: 0.01 },
    { key: 'iRel', label: 'Trägheitsradius i/l', unit: '–', min: 0.3, max: 0.6, step: 0.01, hint: 'Jz = m·i²' },
    { group: 'Reifen und Lenkung' },
    { key: 'caV', label: 'Schräglaufsteifigkeit vorn cαV', unit: 'kN/rad', min: 10, max: 150, step: 1, scale: 1e-3, hint: 'beide Reifen der Achse' },
    { key: 'caH', label: 'Schräglaufsteifigkeit hinten cαH', unit: 'kN/rad', min: 10, max: 150, step: 1, scale: 1e-3 },
    { key: 'nV', label: 'Gesamtnachlauf nV', unit: 'mm', min: 0, max: 120, step: 1, scale: 1000 },
    { key: 'CL', label: 'Lenkungssteifigkeit CL', unit: 'kNm/rad', min: 1, max: 60, step: 0.5, scale: 1e-3 },
    { key: 'iL', label: 'Lenkübersetzung iL', unit: '–', min: 10, max: 25, step: 0.1 },
    { group: 'Fahrt und Lenkeingabe' },
    { key: 'v', label: 'Geschwindigkeit v', unit: 'km/h', min: 10, max: 220, step: 1, scale: 3.6 },
    { key: 'kind', label: 'Lenkeingabe', type: 'select', options: [['rampe', 'Lenkwinkelrampe'], ['sprung', 'Lenkwinkelsprung'], ['sinus', 'Sinuslenken'], ['spurwechsel', 'Einzelsinus (Spurwechsel)']] },
    { key: 'amp', label: 'Lenkradwinkel δL', unit: '°', min: 1, max: 180, step: 0.5, scale: 1 / DEG },
    { key: 'rate', label: 'Lenkgeschwindigkeit (Rampe)', unit: '°/s', min: 20, max: 1000, step: 10, scale: 1 / DEG },
    { key: 'freq', label: 'Frequenz (Sinus)', unit: 'Hz', min: 0.1, max: 2, step: 0.05 },
  ];

  let charts = {}, kpiEl = null, refresh = null, panel = null, anim = null;
  const T0 = 0.5;   // Beginn der Lenkeingabe

  function vehicle() { const { kind, amp, rate, freq, ...p } = values; return p; }

  function compute() {
    const p = vehicle();
    const d = E.derived(p);
    const vTop = Math.max(60, Math.min(80, isFinite(d.vkrit) ? d.vkrit * 1.15 : 80));
    const V = K.core.linspace(0.5, vTop, 240);
    const cap = (x) => (isFinite(x) && Math.abs(x) < 3 ? x : NaN);

    // Kreisfahrtwerte über v (Tab. 21.3), oberhalb vkrit gibt es keine stationäre Kreisfahrt
    const G = V.map((v) => (isFinite(d.vkrit) && v >= d.vkrit ? { yawRate: NaN, beta: NaN } : E.gains(p, v)));
    const annV = [{ type: 'vline', x: p.v * 3.6, color: '#fbbf24', label: 'v' }];
    if (isFinite(d.vch)) annV.push({ type: 'vline', x: d.vch * 3.6, color: '#64748b', label: 'vch', row: 1 });
    if (isFinite(d.vkrit)) annV.push({ type: 'vline', x: d.vkrit * 3.6, color: '#f87171', label: 'vkrit', row: 1 });
    charts.gain.set([
      { name: 'ψ̇/δL [1/s]', color: COL[0], x: V.map((v) => v * 3.6), y: G.map((q) => cap(q.yawRate)) },
      { name: 'neutral (vch → ∞)', color: '#64748b', dash: [5, 4], width: 1.2, x: V.map((v) => v * 3.6), y: V.map((v) => cap(v / (p.iL * p.l))) },
      { name: 'β/δL [–]', color: COL[2], axis: 'right', x: V.map((v) => v * 3.6), y: G.map((q) => cap(q.beta)) },
    ], annV);

    // Lenkradwinkel über Querbeschleunigung auf festem Radius
    const AY = K.core.linspace(0, 8, 41);
    const circ = [];
    [40, 100].forEach((rho, k) => {
      circ.push({ name: `ρ = ${rho} m`, color: COL[k], x: AY, y: AY.map((ay) => E.steadyCircle(p, rho, ay).dL / DEG) });
      circ.push({ name: `neutral ρ = ${rho} m`, color: COL[k], dash: [5, 4], width: 1.2, noLegend: true, x: [0, 8], y: [p.iL * p.l / rho / DEG, p.iL * p.l / rho / DEG] });
    });
    charts.circle.set(circ);

    // Eigenfrequenz und Dämpfung über v; erst ab 5 m/s, darunter wächst νf wie 1/v und staucht die Achse
    const VE = K.core.linspace(5, vTop, 240);
    const EV = VE.map((v) => E.eigen(p, v));
    charts.eig.set([
      { name: 'νf/2π [Hz] ungedämpft', color: COL[0], x: VE.map((v) => v * 3.6), y: EV.map((e) => e.fUndamped) },
      { name: 'Dämpfungsmaß D', color: COL[1], axis: 'right', x: VE.map((v) => v * 3.6), y: EV.map((e) => (e.D < 3 ? e.D : NaN)) },
    ], annV);

    // Zeitverläufe
    const dur = values.kind === 'sinus' ? T0 + Math.max(3, 3 / values.freq) : values.kind === 'spurwechsel' ? T0 + 1 / values.freq + 3 : 4;
    const input = E.steerInput(values.kind, { amplitude: values.amp, rate: values.rate, freq: values.freq, t0: T0 });
    const sim = E.simulate(p, input, dur, 0.002);
    charts.time.setOptions({ xMax: dur });
    charts.time.set([
      { name: 'ψ̇ [°/s]', color: COL[0], x: sim.t, y: sim.yawRate.map((r) => r / DEG) },
      { name: 'ÿ [m/s²]', color: COL[1], x: sim.t, y: sim.latAcc },
      { name: 'β [°]', color: COL[2], x: sim.t, y: sim.beta.map((b) => b / DEG) },
      { name: 'δL [°]', color: '#94a3b8', axis: 'right', dash: [5, 4], width: 1.3, x: sim.t, y: sim.dL.map((u) => u / DEG) },
    ]);
    anim.load(sim, p);

    // Frequenzgang
    const fr = E.frequencyResponse(p, 0.05, 5, 240);
    charts.freq.set([
      { name: '|ψ̇/δL| [1/s]', color: COL[0], x: fr.f, y: fr.yawMag },
      { name: '|ÿ/δL| / 10 [m/s²]', color: COL[1], x: fr.f, y: fr.latMag.map((m) => m / 10) },
      { name: 'Phase ψ̇ [°]', color: COL[0], axis: 'right', dash: [5, 4], width: 1.3, x: fr.f, y: fr.yawPh },
      { name: 'Phase ÿ [°]', color: COL[1], axis: 'right', dash: [5, 4], width: 1.3, x: fr.f, y: fr.latPh },
    ]);

    // Kennwerte
    const e = E.eigen(p, p.v), gv = E.gains(p, p.v);
    const step = values.kind === 'rampe' || values.kind === 'sprung';
    const t50 = values.kind === 'rampe' ? T0 + values.amp / values.rate / 2 : T0;
    const m = step ? E.responseMetrics(sim, t50) : null;
    const ayMax = Math.max(...sim.latAcc.map(Math.abs));
    UI.kpis(kpiEl, [
      { label: 'Steifigkeitsquotient SQ', value: d.SQ, digits: 3, sub: d.SQ < 1 ? 'untersteuernd' : d.SQ > 1 ? 'übersteuernd' : 'neutral', state: d.SQ < 1 ? 'ok' : 'bad' },
      isFinite(d.vch) ? { label: 'charakteristische Geschw. vch', value: d.vch * 3.6, unit: 'km/h', digits: 0, sub: `${KFmt(d.vch, 1)} m/s` }
        : { label: 'kritische Geschw. vkrit', value: isFinite(d.vkrit) ? d.vkrit * 3.6 : '∞', unit: 'km/h', digits: 0, state: 'bad', sub: isFinite(d.vkrit) ? `${KFmt(d.vkrit, 1)} m/s` : 'neutral' },
      { label: 'Eigenlenkgradient', value: d.EGrad / DEG, unit: '°/(m/s²)', digits: 2, sub: 'Lenkradwinkel je m/s² Querbeschl.' },
      { label: 'ψ̇/δL stationär', value: gv.yawRate, unit: '1/s', digits: 3, sub: `bei ${Math.round(p.v * 3.6)} km/h` },
      { label: 'Gier-Eigenfrequenz νf/2π', value: e.stable ? e.fUndamped : '–', unit: 'Hz', digits: 2, sub: e.stable ? `D = ${KFmt(e.D, 3)}` : 'instabil', state: e.stable ? '' : 'bad' },
      step ? { label: 'Überschwingweite ψ̇', value: m.overshoot * 100, unit: '%', digits: 1, sub: `Tψ̇max = ${KFmt(m.tPeakFrom50, 2)} s ab 50 % δL` }
        : { label: 'max. Querbeschleunigung', value: ayMax, unit: 'm/s²', digits: 2 },
    ]);
  }

  /* Draufsicht: Fahrzeug fährt die berechnete Bahn ab, die Kamera folgt */
  function makeAnim(canvas) {
    let sim = null, p = null, t0 = 0, raf = 0, running = false, speed = 1;
    const ctx = canvas.getContext('2d');

    function rect(cx, cy, ang, lx, ly, fill, stroke) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
      ctx.fillStyle = fill; ctx.fillRect(-lx / 2, -ly / 2, lx, ly);
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.strokeRect(-lx / 2, -ly / 2, lx, ly); }
      ctx.restore();
    }

    function draw(t) {
      const W = canvas.clientWidth, H = canvas.clientHeight, dpr = root.devicePixelRatio || 1;
      if (canvas.width !== Math.round(W * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!sim) return;
      const i = Math.min(sim.t.length - 1, Math.max(0, Math.round(t / 0.01)));
      const Xc = sim.X[i], Yc = sim.Y[i], psi = sim.psi[i];
      const s = W / 46;                         // Pixel je Meter
      const cx = W * 0.35, cy = H * 0.62;
      const sx = (X) => cx + (X - Xc) * s, sy = (Y) => cy - (Y - Yc) * s;
      // Raster alle 5 m
      ctx.strokeStyle = 'rgba(148,163,184,0.08)'; ctx.lineWidth = 1;
      const g0x = Math.floor((Xc - cx / s) / 5) * 5, g0y = Math.floor((Yc - (H - cy) / s) / 5) * 5;
      for (let X = g0x; sx(X) < W; X += 5) { ctx.beginPath(); ctx.moveTo(sx(X), 0); ctx.lineTo(sx(X), H); ctx.stroke(); }
      for (let Y = g0y; sy(Y) > 0; Y += 5) { ctx.beginPath(); ctx.moveTo(0, sy(Y)); ctx.lineTo(W, sy(Y)); ctx.stroke(); }
      // Bahn: gefahren und noch zu fahren
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(56,189,248,0.25)'; ctx.beginPath();
      for (let k = i; k < sim.X.length; k += 2) (k === i ? ctx.moveTo : ctx.lineTo).call(ctx, sx(sim.X[k]), sy(sim.Y[k]));
      ctx.stroke();
      ctx.strokeStyle = COL[0]; ctx.beginPath();
      for (let k = 0; k <= i; k += 2) (k ? ctx.lineTo : ctx.moveTo).call(ctx, sx(sim.X[k]), sy(sim.Y[k]));
      ctx.stroke();
      // Fahrzeug: Aufbau, Räder, Geschwindigkeitspfeil
      const lV = p.lVrel * p.l, lH = p.l - lV, b = 1.5;
      const ang = -psi;
      const P = (fx, fy) => [sx(Xc + fx * Math.cos(psi) - fy * Math.sin(psi)), sy(Yc + fx * Math.sin(psi) + fy * Math.cos(psi))];
      const [bx, by] = P((lV - lH) / 2, 0);
      rect(bx, by, ang, (p.l + 1.6) * s, 1.8 * s, 'rgba(56,189,248,0.16)', COL[0]);
      const dW = sim.dL[i] / p.iL;
      for (const [fx, steer] of [[lV, dW], [-lH, 0]]) {
        for (const fy of [b / 2, -b / 2]) { const [wx, wy] = P(fx, fy); rect(wx, wy, ang - steer, 0.62 * s, 0.22 * s, '#cbd5e1'); }
      }
      const [gx, gy] = P(0, 0);
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(gx, gy, 3, 0, Math.PI * 2); ctx.fill();
      const cAng = psi + sim.beta[i], L = 3.2 * s;
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + L * Math.cos(cAng), gy - L * Math.sin(cAng)); ctx.stroke();
      // Text
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px ' + getComputedStyle(document.body).fontFamily;
      ctx.fillText(`t = ${sim.t[i].toFixed(2)} s   δL = ${(sim.dL[i] / DEG).toFixed(1)}°   ψ̇ = ${(sim.yawRate[i] / DEG).toFixed(1)} °/s   ÿ = ${sim.latAcc[i].toFixed(2)} m/s²   β = ${(sim.beta[i] / DEG).toFixed(2)}°`, 10, 16);
      ctx.fillText(`αV = ${(sim.aV[i] / DEG).toFixed(2)}°   αH = ${(sim.aH[i] / DEG).toFixed(2)}°   Raster 5 m, Radeinschlag maßstäblich (δL/iL)`, 10, 32);
      // Zeitmarke
      const ann = (charts.time.annotations || []).filter((a) => a.tag !== 'cursor');
      ann.push({ type: 'vline', x: sim.t[i], color: '#fbbf24', dash: [], tag: 'cursor' });
      charts.time.annotations = ann;
      charts.time.draw();
    }

    function loop(now) {
      if (!running) return;
      if (!t0) t0 = now;
      const dur = sim ? sim.t[sim.t.length - 1] : 1;
      const t = ((now - t0) / 1000 * speed) % (dur + 1);   // 1 s Pause am Ende
      draw(Math.min(t, dur));
      raf = requestAnimationFrame(loop);
    }

    return {
      load(s, pp) { sim = s; p = pp; t0 = 0; if (!running) draw(0); },
      start() { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(loop); },
      stop() { running = false; cancelAnimationFrame(raf); },
      setSpeed(s) { speed = s; t0 = 0; },
    };
  }

  function init(sec) {
    const L = UI.tabLayout(sec, {
      title: 'Teil IV · Fahrverhalten (Einspurmodell)',
      intro: 'Lineares Einspurmodell mit elastischer Lenkung: stationäre Kreisfahrt, Stabilitätsgrenze, Eigenfrequenz und Dämpfung ' +
        'der Gierbewegung sowie die Antwort auf Lenkeingaben. Gilt für kleine Schräglaufwinkel, etwa bis 4 m/s² Querbeschleunigung. ' +
        'Vorgaben sind die acht Fahrzeuge aus Tab. 21.7; die Rampe mit 200 °/s auf ÿ = 4 m/s² entspricht Tab. 22.4.',
      src: 'Kap. 20–22 · Gl. (20.25)–(20.27), Tab. 21.2, 21.3, 21.7, Gl. (22.4)–(22.6), Tab. 22.1, 22.4',
    });
    kpiEl = L.kpis;
    L.aside.appendChild(el('h3', '', 'Eingaben'));
    L.aside.appendChild(el('p', 'note', 'Fahrzeuge aus Tab. 21.7'));
    const pre = UI.presets(L.aside, K.data.einspurFahrzeuge, (pt) => { Object.assign(values, pt.p); panel.refresh(); refresh(); });
    pre.mark(0);
    refresh = UI.scheduler(compute);
    const vehicleKeys = new Set(['m', 'l', 'lVrel', 'iRel', 'caV', 'caH', 'nV', 'CL', 'iL']);
    panel = UI.paramPanel(L.aside, DEFS, values, (key) => { if (vehicleKeys.has(key)) pre.clear(); refresh(); });
    L.aside.appendChild(el('p', 'note', 'Die Lenkungselastizität geht über die effektive Schräglaufsteifigkeit c′αV nach Gl. (20.27) ein. ' +
      'Für Fahrzeug 2 und 7 weichen Tψ̇max und Überschwingen um bis zu 15 % von Tab. 22.4 ab (siehe Prüfung).'));

    const ca = UI.card(L.cards, 'Fahrmanöver in der Draufsicht', 'Bahn des Schwerpunkts aus Gl. (20.16). Gelb: Geschwindigkeitsvektor, ' +
      'der Winkel zur Fahrzeuglängsachse ist der Schwimmwinkel β. Unten die Zeitverläufe, rechte Achse Lenkradwinkel.', 'wide');
    const tools = el('span', 'card-tools');
    ca.previousSibling.appendChild(tools);
    UI.seg(tools, [[1, 'Echtzeit'], [0.25, 'Zeitlupe ¼']], 1, (s) => anim.setSpeed(s));
    const cv = el('canvas', 'anim');
    cv.style.height = '260px';
    ca.appendChild(cv);
    anim = makeAnim(cv);
    const tb = el('div', '');
    ca.appendChild(tb);
    charts.time = new KChart(tb, { height: 230, xLabel: 't [s]', yLabel: 'ψ̇ [°/s] · ÿ [m/s²] · β [°]', y2Label: 'δL [°]', xShort: 't', xMin: 0 });

    charts.gain = new KChart(UI.card(L.cards, 'Kreisfahrtwerte über der Geschwindigkeit', 'Giergeschwindigkeits-Verstärkung nach Tab. 21.3. ' +
      'Untersteuernde Fahrzeuge haben ihr Maximum bei vch, übersteuernde werden bei vkrit instabil.'),
    { height: 280, xLabel: 'v [km/h]', yLabel: 'ψ̇/δL [1/s]', y2Label: 'β/δL [–]', xShort: 'v', xMin: 0 });
    charts.circle = new KChart(UI.card(L.cards, 'Lenkradwinkel bei stationärer Kreisfahrt', 'Auf festem Radius ρ. Die Steigung ist der Eigenlenkgradient; ' +
      'gestrichelt der Ackermann-Lenkwinkel iL·l/ρ.'),
    { height: 280, xLabel: 'Querbeschleunigung ÿ [m/s²]', yLabel: 'δL [°]', xShort: 'ÿ', xMin: 0, xMax: 8 });
    charts.eig = new KChart(UI.card(L.cards, 'Gier-Eigenfrequenz und Dämpfung', 'Aus der charakteristischen Gleichung (22.4)–(22.6). ' +
      'Mit steigender Geschwindigkeit sinken Eigenfrequenz und Dämpfung.'),
    { height: 280, xLabel: 'v [km/h]', yLabel: 'νf/2π [Hz]', y2Label: 'D [–]', xShort: 'v', xMin: 0 });
    charts.freq = new KChart(UI.card(L.cards, 'Frequenzgang bei der eingestellten Geschwindigkeit', 'Amplitude und Phase von Giergeschwindigkeit und Querbeschleunigung bezogen auf δL (Tab. 22.1).'),
      { height: 280, xLog: true, xLabel: 'Lenkfrequenz f [Hz]', yLabel: 'Amplitude', y2Label: 'Phase [°]', xShort: 'f' });

    UI.formulas(L.formulas, [
      { tex: String.raw`m v(\dot\beta+\dot\psi)=-(c'_{\alpha V}+c_{\alpha H})\,\beta+(c_{\alpha H}l_H-c'_{\alpha V}l_V)\,\frac{\dot\psi}{v}+c'_{\alpha V}\,\frac{\delta_L}{i_L}`, ref: 'Gl. (20.25)' },
      { tex: String.raw`J_z\ddot\psi=(c_{\alpha H}l_H-c'_{\alpha V}l_V)\,\beta-(c'_{\alpha V}l_V^2+c_{\alpha H}l_H^2)\,\frac{\dot\psi}{v}+c'_{\alpha V}l_V\,\frac{\delta_L}{i_L}`, ref: 'Gl. (20.26)' },
      { tex: String.raw`c'_{\alpha V}=\frac{c_{\alpha V}}{1+c_{\alpha V}\,n_V/C_L}`, ref: 'Gl. (20.27)', note: 'Lenkungselastizität' },
      { tex: String.raw`v_{ch}^2=\frac{c'_{\alpha V}\,c_{\alpha H}\,l^2}{m\,(c_{\alpha H}l_H-c'_{\alpha V}l_V)},\qquad SQ=\frac{c'_{\alpha V}/F_{zV}}{c_{\alpha H}/F_{zH}}`, ref: 'Tab. 21.2 (2a), (4c)', note: 'Nenner < 0: übersteuernd, vkrit² = −vch²' },
      { tex: String.raw`\frac{\dot\psi}{\delta_L}=\frac{v}{i_L\,l\,(1+v^2/v_{ch}^2)}`, ref: 'Tab. 21.3 (1)' },
      { tex: String.raw`\delta_L=\frac{i_L\,l}{\rho}+\frac{m\,i_L\,(c_{\alpha H}l_H-c'_{\alpha V}l_V)}{c'_{\alpha V}c_{\alpha H}\,l}\,\ddot y`, ref: 'Tab. 21.2 (1a)' },
      { tex: String.raw`\nu_f^2=\frac{c'_{\alpha V}c_{\alpha H}l^2+m v^2(c_{\alpha H}l_H-c'_{\alpha V}l_V)}{J_z\,m\,v^2},\qquad 2\sigma_f=\frac{m\,(c'_{\alpha V}l_V^2+c_{\alpha H}l_H^2)+J_z\,(c'_{\alpha V}+c_{\alpha H})}{J_z\,m\,v},\qquad D=\frac{\sigma_f}{\nu_f}`, ref: 'Gl. (22.4)–(22.6)' },
    ]);
  }

  root.KTabs = root.KTabs || {};
  root.KTabs.fahrverhalten = {
    init,
    activate() { compute(); anim.start(); },
    deactivate() { anim.stop(); },
  };
})(window);

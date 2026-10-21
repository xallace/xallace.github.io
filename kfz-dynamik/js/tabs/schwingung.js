/* Reiter Teil III – Schwingungen: Viertelfahrzeug mit Sitz-Mensch (Abb. 13.1), Vergrößerungsfunktionen (Abb. 13.2),
   bewertete Spektren, Konfliktschaubild (Abb. 13.12b), Zeitsimulation auf Zufallsstraße als Animation. */
(function (root) {
  'use strict';
  const K = root.KfzDyn, S = K.schwingung, g = K.core.G;
  const { el, COL } = root.UI;
  const UI = root.UI;

  const values = Object.assign({}, S.DEFAULTS);
  delete values.Fzstat;   // folgt aus den Massen, wie in Tab. 13.1

  const DEFS = [
    { group: 'Massen (je Rad)' },
    { key: 'm1', label: 'Radmasse m1', unit: 'kg', min: 10, max: 90, step: 1 },
    { key: 'm2', label: 'Aufbaumasse m2', unit: 'kg', min: 100, max: 500, step: 1 },
    { key: 'm3', label: 'Sitz-Mensch m3', unit: 'kg', min: 0, max: 120, step: 1, hint: '0: Zweimassensystem ohne Insassen' },
    { group: 'Federn und Dämpfer' },
    { key: 'c1', label: 'Reifen c1', unit: 'kN/m', min: 60, max: 300, step: 1, scale: 1e-3 },
    { key: 'c2', label: 'Aufbaufeder c2', unit: 'kN/m', min: 3, max: 60, step: 0.1, scale: 1e-3 },
    { key: 'k2', label: 'Aufbaudämpfer k2', unit: 'kNs/m', min: 0.1, max: 4, step: 0.01, scale: 1e-3 },
    { key: 'c3', label: 'Sitzfeder c3', unit: 'kN/m', min: 2, max: 40, step: 0.1, scale: 1e-3 },
    { key: 'k3', label: 'Sitzdämpfer k3', unit: 'kNs/m', min: 0.05, max: 1.5, step: 0.01, scale: 1e-3 },
    { group: 'Straße' },
    { key: 'PhiOmega0', label: 'Unebenheitsmaß Φh(Ω0)', unit: 'cm³', min: 0.5, max: 300, step: 0.1, scale: 1e6, log: true },
    { key: 'w', label: 'Welligkeit w', unit: '–', min: 1.5, max: 3, step: 0.05 },
    { key: 'v', label: 'Fahrgeschwindigkeit v', unit: 'km/h', min: 10, max: 200, step: 1, scale: 3.6 },
    { group: 'Bewertung' },
    { key: 'bSet', label: 'Bewertungskurven', type: 'select', options: [['13.2', 'Abb. 13.2 f/k'], ['12.7', 'Abb. 12.7']] },
  ];

  let charts = {}, kpiEl = null, refresh = null, refreshSlow = null, panel = null, mode = 'acc';
  let anim = null, active = false;

  function params() { return { ...values, Fzstat: (values.m1 + values.m2 + values.m3) * g }; }

  function setFreq(p) {
    const fc = S.frequencyCurves(p, 700);
    const sets = {
      acc: { y: 'Betrag [1/s²]', s: [['|z̈2/ĥ| Aufbau', fc.acc2], ...(p.m3 > 0 ? [['|z̈3/ĥ| Sitz-Mensch', fc.acc3]] : [])] },
      force: { y: 'Betrag [kN/m]', s: [['|F̂z/ĥ| Radlast', fc.force.map((v) => v / 1000)]] },
      travel: { y: 'Betrag [–]', s: [['|Δẑ21/ĥ| Radfederweg', fc.dz21], ...(p.m3 > 0 ? [['|Δẑ32/ĥ| Sitzfederweg', fc.dz32]] : [])] },
    }[mode];
    const ch = S.characteristics(p);
    charts.freq.setOptions({ yLabel: sets.y });
    charts.freq.set(sets.s.map(([n, y], i) => ({ name: n, color: COL[i], x: fc.f, y })), [
      { type: 'vline', x: ch.f2, color: '#64748b', label: 'ν2/2π', row: 0 },
      { type: 'vline', x: ch.f1, color: '#64748b', label: 'ν1/2π', row: 0 },
    ]);
  }

  function compute() {
    const p = params();
    const r = S.evaluate(p, 4000);
    setFreq(p);

    // bewertete Spektren je Hz (Fläche = K²)
    const sp = r.spectra, f = sp.w.map((w) => w / (2 * Math.PI));
    const perHz = (arr) => arr.map((v) => v * 2 * Math.PI);
    const step = 4;
    const thin = (arr) => arr.filter((_, i) => i % step === 0);
    charts.spec.set([
      ...(p.m3 > 0 ? [{ name: 'Sitz', color: COL[0], x: thin(f), y: thin(perHz(sp.kSitz)) }] : []),
      { name: 'Fuß', color: COL[1], x: thin(f), y: thin(perHz(sp.kFuss)) },
      { name: 'Hand', color: COL[2], x: thin(f), y: thin(perHz(sp.kHand)) },
    ]);

    const ch = r.char;
    UI.kpis(kpiEl, [
      { label: 'Aufbaueigenfrequenz ν2/2π', value: ch.f2, unit: 'Hz', digits: 2, sub: `D2 = ${KFmt(ch.D2, 3)}` },
      { label: 'Radeigenfrequenz ν1/2π', value: ch.f1, unit: 'Hz', digits: 1, sub: `D1 = ${KFmt(ch.D1, 3)}` },
      { label: 'Sitzeigenfrequenz ν3/2π', value: p.m3 > 0 ? ch.f3 : '–', unit: 'Hz', digits: 2, sub: p.m3 > 0 ? `D3 = ${KFmt(ch.D3, 3)}` : 'ohne Insassen' },
      { label: 'Radlastschwankung σF/Fzstat', value: r.sigmaFrel, digits: 3, sub: `σF = ${Math.round(r.sigmaF)} N`, state: r.sigmaFrel < 0.15 ? 'ok' : r.sigmaFrel < 0.3 ? 'warn' : 'bad' },
      { label: 'σ Aufbaubeschleunigung', value: r.sigmaAcc2, unit: 'm/s²', digits: 2 },
      { label: 'K Sitz', value: p.m3 > 0 ? r.Ksitz : '–', digits: 1 },
      { label: 'K Fuß · K Hand', value: `${KFmt(r.Kfuss, 1)} · ${KFmt(r.Khand, 1)}` },
      { label: 'K ges', value: r.Kges, digits: 1, sub: 'Gl. (12.35a)' },
      { label: 'σ Radfederweg Δz21', value: r.sigmaDz21 * 1000, unit: 'mm', digits: 1 },
      { label: 'σ Sitzfederweg Δz32', value: p.m3 > 0 ? r.sigmaDz32 * 1000 : '–', unit: 'mm', digits: 2 },
    ]);
    state.cur = { x: r.sigmaFrel, y: r.Kges };
    refreshSlow();
  }

  const state = { cur: null };

  // teure Teile: Konfliktschaubild und Zeitsimulation
  function computeSlow() {
    const p = params();
    const conf = S.conflict(p);
    charts.conf.set(conf.map((c, i) => ({
      name: `ν2/2π = ${KFmt(c.f2, 1)} Hz`, color: COL[i], points: true, r: 2.5,
      x: c.pts.map((q) => q.x), y: c.pts.map((q) => q.y), labels: c.pts.map((q) => `D2 = ${KFmt(q.D2, 2)}`),
    })), state.cur ? [{ type: 'point', x: state.cur.x, y: state.cur.y, label: 'eingestellt', fill: '#fbbf24' }] : []);

    const sim = S.simulate(p, 8, 0.002, 7);
    charts.time.set([
      { name: 'Straße h', color: '#94a3b8', x: sim.t, y: sim.h.map((v) => v * 1000), width: 1.3 },
      { name: 'Aufbau z2', color: COL[0], x: sim.t, y: sim.z2.map((v) => v * 1000) },
      ...(p.m3 > 0 ? [{ name: 'Sitz-Mensch z3', color: COL[3], x: sim.t, y: sim.z3.map((v) => v * 1000), width: 1.5 }] : []),
      { name: 'Rad z1', color: COL[1], x: sim.t, y: sim.z1.map((v) => v * 1000), width: 1.2 },
    ]);
    anim.load(sim, p);
  }

  /* Animation des Viertelfahrzeugs: Straße läuft durch, Höhen überhöht */
  function makeAnim(canvas) {
    let sim = null, p = null, t0 = 0, raf = 0, running = false, speed = 1, peak = 1e-3, frame = 0;
    const ctx = canvas.getContext('2d');

    function spring(x, yTop, yBot, w, n = 7) {
      ctx.beginPath(); ctx.moveTo(x, yTop);
      const L = yBot - yTop, seg = L / (n + 1);
      ctx.lineTo(x, yTop + seg / 2);
      for (let i = 0; i < n; i++) ctx.lineTo(x + (i % 2 ? -w : w), yTop + seg / 2 + seg * (i + 0.5));
      ctx.lineTo(x, yBot - seg / 2); ctx.lineTo(x, yBot); ctx.stroke();
    }
    function damper(x, yTop, yBot, w) {
      const mid = (yTop + yBot) / 2;
      ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, mid - 4);
      ctx.moveTo(x - w * 0.7, mid - 4); ctx.lineTo(x + w * 0.7, mid - 4);
      ctx.moveTo(x, yBot); ctx.lineTo(x, mid - 10);
      ctx.stroke();
      ctx.strokeRect(x - w, mid - 12, 2 * w, 22);
    }

    function draw(t) {
      const W = canvas.clientWidth, H = canvas.clientHeight;
      const dpr = root.devicePixelRatio || 1;
      if (canvas.width !== Math.round(W * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!sim) return;
      const i = Math.min(sim.t.length - 1, Math.round(t / 0.01));
      const xNow = p.v * sim.t[i];
      const span = 8, pxm = W / span;                       // horizontal Meter → Pixel
      const Sv = Math.min(4000, 34 / peak);                  // vertikal überhöht
      const base = H - 46, xc = W * 0.36;
      const road = sim.road;
      // Straße
      ctx.fillStyle = '#111827'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let px = 0; px <= W; px += 3) ctx.lineTo(px, base - road(xNow + (px - xc) / pxm) * Sv);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      for (let px = 0; px <= W; px += 3) { const y = base - road(xNow + (px - xc) / pxm) * Sv; px ? ctx.lineTo(px, y) : ctx.moveTo(px, y); }
      ctx.stroke();
      // Lagen der Massen (Ruhelage + überhöhte Auslenkung)
      const R = 26;
      const yW = base - R - sim.z1[i] * Sv;
      const yB = base - 128 - sim.z2[i] * Sv;
      const yS = base - 196 - sim.z3[i] * Sv;
      const yRoad = base - sim.h[i] * Sv;
      // Reifenfeder c1 als Kontakt
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.2;
      spring(xc, yW + 6, yRoad, 6, 3);
      // Rad
      ctx.fillStyle = '#1f2937'; ctx.strokeStyle = COL[1]; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(xc, yW, R - 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = COL[1]; ctx.font = '600 11px ' + getComputedStyle(document.body).fontFamily;
      ctx.fillText('m1', xc - 8, yW + 4);
      // Aufbaufeder und -dämpfer
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
      spring(xc - 22, yB + 18, yW - 4, 8);
      damper(xc + 22, yB + 18, yW - 4, 7);
      // Aufbau
      ctx.fillStyle = 'rgba(56,189,248,0.18)'; ctx.strokeStyle = COL[0]; ctx.lineWidth = 2;
      ctx.fillRect(xc - 70, yB - 18, 140, 36); ctx.strokeRect(xc - 70, yB - 18, 140, 36);
      ctx.fillStyle = COL[0]; ctx.fillText('m2 Aufbau', xc - 30, yB + 4);
      if (p.m3 > 0) {
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.3;
        spring(xc - 12, yS + 12, yB - 18, 6, 5);
        damper(xc + 14, yS + 12, yB - 18, 5);
        ctx.fillStyle = 'rgba(244,114,182,0.2)'; ctx.strokeStyle = COL[3]; ctx.lineWidth = 2;
        ctx.fillRect(xc - 30, yS - 12, 60, 24); ctx.strokeRect(xc - 30, yS - 12, 60, 24);
        ctx.beginPath(); ctx.arc(xc, yS - 26, 10, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = COL[3]; ctx.fillText('m3', xc - 8, yS + 4);
      }
      // Beschriftung
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'right';
      const ex = Sv / pxm;
      ctx.fillText(`t = ${sim.t[i].toFixed(2)} s · v = ${Math.round(p.v * 3.6)} km/h`, W - 10, 16);
      ctx.fillText(`Höhen ${ex >= 1.5 ? Math.round(ex) + '-fach überhöht' : 'maßstäblich'}`, W - 10, 32);
      ctx.fillText(`dyn. Radlast ${Math.round(sim.Fdyn[i])} N`, W - 10, 48);
      ctx.textAlign = 'left';
      // Zeitmarke im Diagramm, nicht in jedem Bild
      if (++frame % 3 === 0 || !running) cursor(sim.t[i]);
    }

    function cursor(t) {
      const ann = charts.time.annotations.filter((a) => a.tag !== 'cursor');
      ann.push({ type: 'vline', x: t, color: '#fbbf24', dash: [], tag: 'cursor', fit: false });
      charts.time.annotations = ann;
      charts.time.draw();
    }

    function loop(now) {
      if (!running) return;
      if (!t0) t0 = now;
      const dur = sim ? sim.t[sim.t.length - 1] : 1;
      const t = ((now - t0) / 1000 * speed) % dur;
      draw(t);
      raf = requestAnimationFrame(loop);
    }

    return {
      load(s, pp) {
        sim = s; p = pp; t0 = 0;
        peak = Math.max(1e-3, ...s.h.map(Math.abs));
        if (!running) draw(0);
      },
      start() { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(loop); },
      stop() { running = false; cancelAnimationFrame(raf); },
      setSpeed(s) { speed = s; t0 = 0; },
    };
  }

  function init(sec) {
    const L = UI.tabLayout(sec, {
      title: 'Teil III · Schwingungen',
      intro: 'Viertelfahrzeug aus Rad, Aufbau und Sitz-Mensch auf einer Straße mit zufälligen Unebenheiten. ' +
        'Daraus folgen Fahrsicherheit (Radlastschwankung) und Fahrkomfort (Bewertete Schwingstärke K). ' +
        'Vorgabe ist Beispielfahrzeug 1 aus Tab. 13.1 auf einer Straße mit Φh(Ω0) = 4 cm³, w = 2 bei 72 km/h.',
      src: 'Kap. 11–13 · Gl. (11.92), (12.35a), (13.1)–(13.3), (13.12)–(13.14), Abb. 13.2, 13.12, Tab. 11.5, 12.1, 13.1',
    });
    kpiEl = L.kpis;
    L.aside.appendChild(el('h3', '', 'Eingaben'));
    L.aside.appendChild(el('p', 'note', 'Fahrzeuge aus Tab. 13.1'));
    const preV = UI.presets(L.aside, K.data.schwingungFahrzeuge, (pt) => {
      const { Fzstat, ...rest } = pt.p;
      Object.assign(values, rest); panel.refresh(); refresh();
    });
    preV.mark(0);
    L.aside.appendChild(el('p', 'note', 'Straßenklassen (Tab. 11.5, ISO 8608)'));
    const preR = UI.presets(L.aside, K.data.strassenklassen, (pt) => { values.PhiOmega0 = pt.PhiOmega0; values.w = 2; panel.refresh(); refresh(); });
    preR.mark(1);
    refresh = UI.scheduler(compute);
    refreshSlow = UI.debounce(computeSlow, 220);
    panel = UI.paramPanel(L.aside, DEFS, values, (key) => {
      if (['PhiOmega0', 'w'].includes(key)) preR.clear(); else if (key !== 'v' && key !== 'bSet') preV.clear();
      refresh();
    });
    L.aside.appendChild(el('p', 'note', 'Die statische Radlast folgt aus den Massen. Die Bewertungsfunktionen B(f) sind aus den Diagrammen abgelesen; ' +
      'Abb. 12.7 und Abb. 13.2 unterscheiden sich unter 2 Hz deutlich. Für die Hand gibt es nur Abb. 12.7d.'));

    const ca = UI.card(L.cards, 'Viertelfahrzeug auf Zufallsstraße', 'Zeitsimulation (Runge-Kutta, 2 ms) auf einem Profil, das aus dem Unebenheitsspektrum erzeugt ist. ' +
      'Unten die Wege in mm, die gelbe Linie läuft mit der Animation.', 'wide');
    const tools = el('span', 'card-tools');
    ca.previousSibling.appendChild(tools);
    UI.seg(tools, [[1, 'Echtzeit'], [0.25, 'Zeitlupe ¼']], 1, (s) => anim.setSpeed(s));
    const cv = el('canvas', 'anim');
    cv.style.height = '290px';
    ca.appendChild(cv);
    anim = makeAnim(cv);
    const tbox = el('div', '');
    ca.appendChild(tbox);
    charts.time = new KChart(tbox, { height: 200, xLabel: 't [s]', yLabel: 'z [mm]', xShort: 't', xMin: 0, xMax: 8 });

    const cf = UI.card(L.cards, 'Vergrößerungsfunktionen', 'Antwort auf eine harmonische Unebenheit der Amplitude ĥ, wie Abb. 13.2. ' +
      'Senkrechte Linien: ungedämpfte Eigenfrequenzen von Aufbau und Rad.');
    const ft = el('span', 'card-tools');
    cf.previousSibling.appendChild(ft);
    UI.seg(ft, [['acc', 'Beschleunigung'], ['force', 'Radlast'], ['travel', 'Federwege']], 'acc', (m) => { mode = m; setFreq(params()); });
    charts.freq = new KChart(cf, { height: 280, xLabel: 'Erregerfrequenz f [Hz]', yLabel: 'Betrag', xShort: 'f', xMin: 0 });

    charts.spec = new KChart(UI.card(L.cards, 'Bewertete Spektren', 'Integrand von Gl. (13.13)/(13.14) je Hz; die Fläche unter einer Kurve ist K². ' +
      'Man sieht, welche Frequenzen den Komfort bestimmen.'),
    { height: 280, xLabel: 'f [Hz]', yLabel: 'K² je Hz [s]', xShort: 'f', xMin: 0, xMax: 25 });
    charts.conf = new KChart(UI.card(L.cards, 'Konfliktschaubild', 'Wie Abb. 13.12b: je Kurve eine Aufbaueigenfrequenz, entlang der Kurve steigt die Dämpfung D2 ' +
      'von 0,05 bis 0,7. Links unten wäre ideal; wer den Komfort verbessert, verliert meist Fahrsicherheit.', 'wide'),
    { height: 320, xLabel: 'σF/Fzstat (Fahrsicherheit)', yLabel: 'K ges (Komfort)', hover: 'nearest', xShort: 'σF/Fzstat', yShort: 'Kges', xMin: 0 });

    UI.formulas(L.formulas, [
      { tex: String.raw`m_1\ddot z_1=c_1(h-z_1)+c_2(z_2-z_1)+k_2(\dot z_2-\dot z_1)`, ref: 'Gl. (13.1)' },
      { tex: String.raw`m_2\ddot z_2=-c_2(z_2-z_1)-k_2(\dot z_2-\dot z_1)+c_3(z_3-z_2)+k_3(\dot z_3-\dot z_2)`, ref: 'Gl. (13.2)' },
      { tex: String.raw`m_3\ddot z_3=-c_3(z_3-z_2)-k_3(\dot z_3-\dot z_2)`, ref: 'Gl. (13.3)' },
      { tex: String.raw`\Phi_h(\Omega)=\Phi_h(\Omega_0)\left(\frac{\Omega}{\Omega_0}\right)^{-w},\qquad \Omega=\frac{\omega}{v},\qquad \Phi_h(\omega)=\frac{\Phi_h(\Omega)}{v}`, ref: 'Gl. (11.92)', note: 'Ω0 = 1 m⁻¹' },
      { tex: String.raw`\sigma_x^2=\int_0^\infty\left|\frac{\hat x}{\hat h}(\omega)\right|^2\Phi_h(\omega)\,d\omega`, ref: 'Gl. (13.12)', note: 'für Radlast, Beschleunigungen, Federwege' },
      { tex: String.raw`K_i^2=\int_0^\infty\left[G_\mathrm{stoch}\,B_i(f)\left|\frac{\hat{\ddot z}}{\hat h}(\omega)\right|\right]^2\Phi_h(\omega)\,d\omega,\qquad G_\mathrm{stoch}=1{,}26`, ref: 'Gl. (13.13)/(13.14), Tab. 12.1', note: 'Sitz mit z̈3, Hand und Fuß mit z̈2' },
      { tex: String.raw`K_\mathrm{ges}=\sqrt{(1{,}1\,K_\mathrm{Sitz})^2+(0{,}75\,K_\mathrm{Hand})^2+(1{,}3\,K_\mathrm{Fu\ss})^2}`, ref: 'Gl. (12.35a), Tab. 12.1' },
      { tex: String.raw`\frac{\nu_2}{2\pi}=\frac{1}{2\pi}\sqrt{\frac{c_2}{m_2}},\qquad D_2=\frac{k_2}{2\sqrt{c_2 m_2}},\qquad \frac{\nu_1}{2\pi}=\frac{1}{2\pi}\sqrt{\frac{c_1+c_2}{m_1}}`, ref: 'Gl. (13.4)–(13.10)' },
    ]);
  }

  root.KTabs = root.KTabs || {};
  root.KTabs.schwingung = {
    init,
    activate() { active = true; compute(); anim.start(); },
    deactivate() { active = false; anim.stop(); },
  };
})(window);

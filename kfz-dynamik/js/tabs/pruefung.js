/* Verification & Sources tab: comparison of simulation kernels with textbook values (same list as tests/verify.js),
   assumptions, book discrepancies found, digitized curves, licenses. */
(function (root) {
  'use strict';
  const K = root.KfzDyn;
  const { el } = root.UI;
  let tableHost = null, summaryEl = null, done = false;

  const fmt = (v) => (typeof v === 'number' ? KFmt(v, Math.abs(v) >= 100 ? 1 : 3) : v);

  function runChecks() {
    const rows = K.pruefung.run();
    let ok = 0, fail = 0, info = 0;
    const t = el('table', 'checks');
    t.innerHTML = '<thead><tr><th>Status</th><th>Quantity</th><th style="text-align:right">Model</th><th style="text-align:right">Book</th>' +
      '<th style="text-align:right">Dev.</th><th style="text-align:right">Tol.</th><th>Source</th></tr></thead>';
    const tb = el('tbody');
    for (const r of rows) {
      const tr = el('tr');
      if (r.kind === 'sect') { tr.className = 'sect'; tr.innerHTML = `<td colspan="7">${r.label}</td>`; tb.appendChild(tr); continue; }
      const dev = (r.got - r.want) / Math.abs(r.want) * 100;
      const st = r.kind === 'info' ? 'INFO' : r.ok ? 'OK' : 'FAIL';
      tr.className = r.kind === 'info' ? 'info' : r.ok ? 'ok' : 'fail';
      if (r.kind === 'info') info++; else if (r.ok) ok++; else fail++;
      tr.innerHTML = `<td class="st">${st}</td><td>${r.label}</td><td class="num">${fmt(r.got)}</td><td class="num">${fmt(r.want)}</td>` +
        `<td class="num">${dev >= 0 ? '+' : ''}${KFmt(dev, 1)} %</td><td class="num">${r.kind === 'info' ? '–' : '± ' + KFmt(r.tol * 100, 1) + ' %'}</td><td>${r.ref}</td>`;
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    tableHost.innerHTML = '';
    tableHost.appendChild(t);
    root.UI.kpis(summaryEl, [
      { label: 'passed', value: ok, digits: 0, state: 'ok' },
      { label: 'failed', value: fail, digits: 0, state: fail ? 'bad' : 'ok' },
      { label: 'known deviations', value: info, digits: 0, state: 'warn' },
    ]);
  }

  function init(sec) {
    sec.innerHTML = '';
    const head = el('div', 'tab-head');
    head.appendChild(el('h2', '', 'Verification & Sources'));
    head.appendChild(el('p', '', 'Every module is checked against textbook numerical examples. “OK” means within the tolerance implied ' +
      'by plot-reading precision of the reference. “INFO” flags known deviations with explanations. The exact same suite runs ' +
      'outside the browser via <code>node tests/verify.js</code>.'));
    sec.appendChild(head);
    const main = el('div', 'main');
    sec.appendChild(main);
    summaryEl = el('div', 'kpis');
    main.appendChild(summaryEl);
    const card = el('section', 'card');
    card.appendChild(el('h3', 'card-title', 'Comparison with Textbook'));
    tableHost = el('div', 'table-wrap', '<p class="note">Computing…</p>');
    card.appendChild(tableHost);
    main.appendChild(card);

    const prose = el('section', 'card');
    prose.innerHTML = `<div class="prose">
      <h4>Discrepancies in the Textbook</h4>
      <ul>
        <li><b>Stopping time, p. 218:</b> printed value is 4.4 s. Eq. (9.19a) with the example numbers (tr = 0.64 s, ta = 0.05 s,
          ts = 0.17 s, vA = 22.2 m/s, a = 5.8 m/s²) gives 4.6 s. The stopping distance 59.7 m matches.</li>
        <li><b>Table 2.3, adhesion zone:</b> Fx = cx·Sx is the linearized form; at the transition s̄R = 0.5 the force then jumps by a
          factor of 1/(1 − Sx). This app applies the same 1/(1 − Sx) factor in the adhesion zone as in partial sliding so the curve stays continuous.</li>
        <li><b>Table 2.3, nx in partial sliding:</b> Fy/cy appears inside the parentheses multiplied by lL·tan α, which yields inconsistent
          units. This app places Fy/cy outside the parentheses, matching the adhesion zone.</li>
        <li><b>Figs. 13.2 i/k/l:</b> multiplying the magnification curve by the weighting curve yields roughly 5.6 at the 1.3 Hz peak, whereas
          the resulting spectrum diagram shows 4. Hence K foot differs (model 7.6, book 5.9), and with it Ktotal.</li>
        <li><b>Fig. 12.7 vs. Fig. 13.2:</b> the weighting curves in the two chapters differ by 30–50 % below 2 Hz.
          The Chapter 13 numerical examples match Fig. 13.2; using Fig. 12.7 increases K seat and K foot by 24 % and 51 %, respectively.</li>
      </ul>
      <h4>Assumptions Not Stated in the Textbook</h4>
      <ul>
        <li>Tires: μ01 = 1.17, kR = 0.32, and a = 0.09 s/m are fitted to the measured curves of Fig. 2.44. The book does not state the
          test speed; 60 km/h is assumed. The shape of cα(Fz) follows Fig. 2.37, scaled to 50 kN/rad at 4 kN.
          Camber stiffness cγ = 0.1·cα is estimated. The model reaches a peak Fx of about 4.15 kN instead of the measured 4.83 kN.</li>
        <li>Braking: φ = 0.76 is inferred from the numbers on p. 227 (μV = μH = 0.8 at z = 0.8).</li>
        <li>Driving performance: launch uses constant peak 1st-gear acceleration with zero shift pauses, as in Fig. 7.11.
          For 0–100 km/h distance the book states “approx. 280 m” (from Fig. 7.11e), while the model reaches 311 m at the same elapsed time.</li>
        <li>Vibrations: static wheel load follows from the masses. The animated road profile is a sum of 200
          cosine waves with random phases whose amplitudes follow the PSD Eq. (11.92).</li>
        <li>Single-track model: for Vehicles 2 and 7, Tψ̇max and overshoot deviate by up to 15 % from Table 22.4 even though
          steady-state cornering values, natural frequency, and damping agree. The cause remains unresolved.</li>
      </ul>
      <h4>Digitized Curves from Textbook Plots</h4>
      <ul>
        <li>Full-load torque curve of the 37 kW engine from Fig. 7.1c</li>
        <li>Weighting curves B(f) for seat and foot from Fig. 13.2 f/k, and for seat, foot, and hand from Fig. 12.7 b–d</li>
        <li>Measured points Fx(Sx) and Fy(α) from Fig. 2.44</li>
      </ul>
      <h4>Source &amp; Licenses</h4>
      <ul>
        <li>M. Mitschke, H. Wallentowitz: <i>Dynamik der Kraftfahrzeuge</i>, 5th ed., Springer Vieweg, Wiesbaden 2014.
          The app implements the equations; textbook prose and figures are not reproduced.</li>
        <li>three.js r128 (MIT License), KaTeX 0.16.8 (MIT License), both bundled locally under <code>vendor/</code>.</li>
      </ul>
    </div>`;
    main.appendChild(prose);
  }

  root.KTabs = root.KTabs || {};
  root.KTabs.pruefung = {
    init,
    activate() {
      if (done) return;
      done = true;
      setTimeout(() => {
        try { runChecks(); } catch (e) { tableHost.innerHTML = `<p class="note">Error: ${e.message}</p>`; console.error(e); }
      }, 30);
    },
    deactivate() {},
  };
})(window);

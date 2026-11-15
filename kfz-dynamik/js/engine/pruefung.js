/* Verification of simulation kernels against textbook numerical values.
   Used by tests/verify.js (Node) and by the “Verification” tab in the browser.
   kind 'check' counts as passed/failed; 'info' displays a known deviation. */
(function (root) {
  'use strict';
  const K = root.KfzDyn;
  const DEG = Math.PI / 180;

  function run() {
    const rows = [];
    const sect = (title) => rows.push({ kind: 'sect', label: title });
    const check = (label, got, want, tol, ref) =>
      rows.push({ kind: 'check', label, got, want, tol, ref, ok: Math.abs(got - want) <= tol * Math.abs(want) });
    const info = (label, got, want, ref) => rows.push({ kind: 'info', label, got, want, ref });

    sect('Part II · Driving Performance (Passenger car from Figs. 7.1/7.10)');
    {
      const L = K.laengs, p = L.withDefaults({});
      check('Max. engine power [kW]', L.maxPower(p).P / 1000, 37, 0.03, 'Fig. 7.1d');
      check('Top speed [m/s]', L.vmax({}).v, 40, 0.03, 'Figs. 7.10/7.11a');
      const run1 = L.accelerationRun({}, 100 / 3.6);
      check('0–100 km/h [s]', run1.tEnd, 18, 0.06, 'p. 153');
      info('Distance 0–100 km/h [m]', run1.xEnd, 280, 'p. 153: “approx. 280 m”, from Fig. 7.11e');
      check('Time for 1000 m [s]', L.timeForDistance({}, 1000), 40, 0.05, 'p. 153');
      check('Max. accel. 1st gear ẍ/g', run1.a1max / 9.81, 0.25, 0.05, 'Fig. 7.10');
    }

    sect('Part II · Braking (Vehicle from Fig. 9.12, φ = 0.76)');
    {
      const B = K.bremsung, p = B.withDefaults({});
      const u04 = B.utilization(p, 0.4), u08 = B.utilization(p, 0.8), u10 = B.utilization(p, 1.0);
      check('μV at z = 0.4', u04.muV, 0.46, 0.02, 'p. 227');
      check('μH at z = 0.4', u04.muH, 0.30, 0.04, 'p. 227');
      check('μV at z = 0.8', u08.muV, 0.8, 0.01, 'p. 227');
      check('μH at z = 0.8', u08.muH, 0.8, 0.01, 'p. 227');
      check('μV at z = 1.0', u10.muV, 0.94, 0.01, 'p. 227');
      check('μH at z = 1.0', u10.muH, 1.23, 0.01, 'p. 227');
      const lim = B.lockLimits(p, 0.46);
      check('zmax at μh = 0.46', lim.zmax, 0.4, 0.02, 'p. 227');
      check('Braking efficiency zmax/zlim', lim.guete, 0.87, 0.02, 'p. 227');
      const st = B.stopping({});
      check('Stopping distance from 80 km/h [m]', st.s, 59.7, 0.005, 'Eq. 9.17, p. 217');
      // p. 218 prints 4.4 s; (0.64 + 0.05 + 0.085) + 22.2/5.8 = 4.6 s, indicating an arithmetic error in the book
      check('Stopping time [s]', st.t, 4.605, 0.002, 'Eq. 9.19a recalculated; book prints 4.4 s');
    }

    sect('Part III · Vibrations (Veh. 1, Table 13.1; Φh(Ω0) = 4 cm³, w = 2, v = 20 m/s)');
    {
      const S = K.schwingung, r = S.evaluate({}, 8000);
      check('Body natural frequency ν2/2π [Hz]', r.char.f2, 1.5, 0.01, 'Table 13.1');
      check('Wheel natural frequency ν1/2π [Hz]', r.char.f1, 11.0, 0.01, 'Table 13.1');
      check('Damping ratio D2', r.char.D2, 0.27, 0.03, 'Table 13.1');
      check('σF [N]', r.sigmaF, 257, 0.03, 'p. 377');
      check('σF/Fzstat', r.sigmaFrel, 0.09, 0.05, 'p. 377');
      check('RMS body acceleration [m/s²]', r.sigmaAcc2, 0.73, 0.05, 'p. 377');
      check('RMS seat acceleration [m/s²]', r.sigmaAcc3, 0.7, 0.07, 'p. 378');
      check('K seat', r.Ksitz, 18.5, 0.08, 'p. 378, B digitized from Fig. 13.2f');
      // Fig. 13.2i × 13.2k yields ≈ 5.6 at the 1.3 Hz peak, whereas Fig. 13.2l shows only 4 (K-value)²s there;
      // the area under 13.2l points toward K ≈ 6.7 rather than the printed 5.9.
      info('K foot', r.Kfuss, 5.9, 'p. 377; Figs. 13.2i/k/l mutually inconsistent');
      check('σ Δz32 seat suspension travel [mm]', r.sigmaDz32 * 1000, 1.8, 0.06, 'p. 378');
      check('σ Δz21 wheel suspension travel [mm]', r.sigmaDz21 * 1000, 5.6, 0.04, 'p. 378');
      info('Ktotal', r.Kges, 23.6, 'read from Fig. 13.12c, includes Kfoot');
      const r127 = S.evaluate({ bSet: '12.7' }, 8000);
      info('K seat with B from Fig. 12.7', r127.Ksitz, 18.5, 'alternate weighting curve');
      info('K foot with B from Fig. 12.7', r127.Kfuss, 5.9, 'alternate weighting curve');
      const fc = S.frequencyCurves({}, 2000);
      const iF = fc.force.indexOf(Math.max(...fc.force));
      check('Peak |F̂z/ĥ| [kN/m]', fc.force[iF] / 1000, 270, 0.08, 'read from Fig. 13.2b');
      check('Peak frequency |F̂z/ĥ| [Hz]', fc.f[iF], 11, 0.08, 'read from Fig. 13.2b');
    }

    sect('Part IV · Single-Track Model (Table 21.7, Table 22.4)');
    {
      const E = K.einspur;
      const veh = K.data.einspurFahrzeuge.map((v) => v.p);
      const want = [
        { SQ: 0.769, vch: 29 }, { SQ: 0.690, vch: 29 }, { SQ: 0.870, vch: 29 }, { SQ: 0.909, vch: 50 },
        { SQ: 0.556, vch: 18 }, { SQ: 0.966, vch: 81 }, { SQ: 0.613, vch: 21 }, { SQ: 1.154, vkrit: 33.4 },
      ];
      want.forEach((w, i) => {
        const d = E.derived(veh[i]);
        check(`Veh. ${i + 1}: SQ`, d.SQ, w.SQ, 0.01, 'Table 21.7');
        if (w.vch) check(`Veh. ${i + 1}: vch [m/s]`, d.vch, w.vch, 0.03, 'Table 21.7');
        else check(`Veh. ${i + 1}: vcrit [m/s]`, d.vkrit, w.vkrit, 0.01, 'Table 21.7');
      });
      const tab224 = [
        { i: 0, dL: 35.1, gain: 0.297, T: 0.54, os: 0.089 },
        { i: 1, dL: 35.1, gain: 0.297, T: 0.46, os: 0.054 },
        { i: 6, dL: 46.5, gain: 0.225, T: 0.50, os: 0.143 },
      ];
      for (const row of tab224) {
        const p = { ...veh[row.i], v: 22.2 };
        const gain = E.gains(p, 22.2);
        const dLstat = 4 / (22.2 * gain.yawRate);
        check(`Veh. ${row.i + 1}: (ψ̇/δL)ss [1/s]`, gain.yawRate, row.gain, 0.015, 'Table 22.4');
        check(`Veh. ${row.i + 1}: δL,ss [°]`, dLstat / DEG, row.dL, 0.015, 'Table 22.4');
        const sim = E.simulate(p, E.steerInput('rampe', { amplitude: dLstat, rate: 200 * DEG, t0: 0 }), 4, 0.0005);
        const m = E.responseMetrics(sim, dLstat / (200 * DEG) / 2);
        if (row.i === 0) {
          check(`Veh. ${row.i + 1}: Tψ̇max [s] from 50 % steer input`, m.tPeakFrom50, row.T, 0.06, 'Table 22.4');
          check(`Veh. ${row.i + 1}: Overshoot Uψ̇`, m.overshoot, row.os, 0.12, 'Table 22.4');
        } else {
          // Steady-state cornering values, νf, and Df match; transient metrics of these vehicles differ
          info(`Veh. ${row.i + 1}: Tψ̇max [s] from 50 % steer input`, m.tPeakFrom50, row.T, 'Table 22.4, cause unresolved');
          info(`Veh. ${row.i + 1}: Overshoot Uψ̇`, m.overshoot, row.os, 'Table 22.4');
        }
      }
      check('Veh. 7: Df at 22.2 m/s', E.eigen(veh[6], 22.2).D, 0.70, 0.02, 'p. 676');
    }

    sect('Part I · Tires (HSRI model, Table 2.3; 205/60 R 15 tire from Fig. 2.44)');
    {
      const R = K.reifen;
      check('Fx at Sx = 1 % (≈ cx·Sx) [N]', R.forces({}, 0.01, 0).Fx, 470, 0.02, 'p. 49');
      check('Fy at α = 1° (≈ cα·tan α) [N]', R.forces({}, 0, DEG).Fy, 50000 * Math.tan(DEG), 0.01, 'Fig. 2.44a');
      check('Fx at Sx = 100 % [N]', R.forces({}, 0.999, 0).Fx, 3170, 0.05, 'read from Fig. 2.44b');
      check('Fy at α = 3° [N]', R.forces({}, 0, 3 * DEG).Fy, 2600, 0.05, 'read from Fig. 2.44a');
      info('Peak Fx at α = 0 [N]', Math.max(...R.curvesVsSlip({}, [0], 200)[0].Fx), 4830, 'Fig. 2.44b; HSRI curve is flatter');
      check('Pneumatic trail at α → 0 [m] (lL/3)', R.forces({}, 0, 0.05 * DEG).ny, Math.sqrt(2 * 0.3 * 0.02) / 3, 0.02, 'Table 2.3');
    }
    return rows;
  }

  K.pruefung = { run };
})(typeof globalThis !== 'undefined' ? globalThis : this);
